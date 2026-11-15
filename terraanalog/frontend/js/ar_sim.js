/* =========================================================================
 * TerraAnalog - Rover traverse simulation (side-view canvas)
 * The terrain, traction, thermal cycle and power budget are generated from the
 * selected site's real parameters (slope, roughness, humidity, thermal swing).
 * ========================================================================= */
window.TA = window.TA || {};

TA.RoverSim = class RoverSim {
  constructor(canvas, hooks) {
    this.cv = canvas; this.ctx = canvas.getContext("2d");
    this.hooks = hooks || {};
    this.W = canvas.width; this.H = canvas.height;
    this.L = 600;            // traverse length (m)
    this.dx = 0.5;           // terrain sample spacing (m)
    this.PX = 16;            // pixels per metre
    this.speedMult = 25;     // simulated seconds per real second
    this.running = false; this.raf = null; this.last = 0;
    this.site = null;
    this.sol = 900;          // seconds per day/night cycle
  }

  // ---- Terrain generation ---------------------------------------------------
  setSite(site, target) {
    this.site = site; this.target = target;
    const r = site.roughness, rnd = this._rng(site.id * 7919 + 13);
    const trendA = site.slope * 1.25;
    const oct = [{ c: 7, l: 34 }, { c: 5, l: 13 }, { c: 4, l: 5 }].map(o => ({ c: o.c * r, l: o.l, p: rnd() * 6.283 }));
    const trendPhase = rnd() * 6.283, N = Math.round(this.L / this.dx) + 1;
    this.h = new Float32Array(N); this.ang = new Float32Array(N);
    let h = 0;
    for (let i = 0; i < N; i++) {
      const x = i * this.dx;
      let a = trendA * Math.sin(6.283 * x / 260 + trendPhase);
      oct.forEach(o => { a += o.c * Math.sin(6.283 * x / o.l + o.p); });
      this.ang[i] = a; this.h[i] = h; h += Math.tan(a * Math.PI / 180) * this.dx;
    }
    // decorative rocks, density follows roughness
    this.rocks = []; let x = 8;
    while (x < this.L) { x += (55 / (0.3 + r * 1.6)) * (0.5 + rnd()); this.rocks.push({ x, s: 0.15 + rnd() * r * 0.5 }); }
    this.traction = TA.engine.traction(site);
    this.mu = 0.15 + 0.6 * this.traction;
    this.stars = Array.from({ length: 40 }, () => ({ x: rnd() * this.W, y: rnd() * this.H * 0.55, r: rnd() * 1.2 + 0.3 }));
    this.reset();
  }

  _rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  _heightAt(x) { const f = clamp(x / this.dx, 0, this.h.length - 2), i = Math.floor(f), t = f - i; return this.h[i] * (1 - t) + this.h[i + 1] * t; }
  _pitchAt(x) { return Math.atan2(this._heightAt(x + 1.0) - this._heightAt(x - 1.0), 2.0) * 180 / Math.PI; }

  // ---- Control ------------------------------------------------------------
  reset() {
    this.pause();
    this.t = 0; this.x = 2; this.v = 0; this.battery = 100; this.slip = 0; this.pitch = 0;
    this.stuck = 0; this.maxTilt = 0; this.done = false; this.result = null; this.camY = this._heightAt(this.x);
    this._emit(); this.draw();
  }
  start() {
    if (!this.site) return;
    if (this.done) this.reset();
    if (this.running) return;
    this.running = true; this.last = performance.now();
    const loop = now => {
      if (!this.running) return;
      const dt = Math.min(0.1, (now - this.last) / 1000) * this.speedMult; this.last = now;
      for (let k = 0, steps = Math.ceil(dt / 0.5); k < steps && !this.done; k++) this._step(dt / steps);
      this._emit(); this.draw();
      if (this.done) { this.running = false; if (this.hooks.onFinish) this.hooks.onFinish(this.result); return; }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  pause() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = null; }
  setSpeed(m) { this.speedMult = m; }

  // ---- Physics ------------------------------------------------------------
  _step(dt) {
    const s = this.site;
    this.t += dt;
    this.pitch = this._pitchAt(this.x);
    this.maxTilt = Math.max(this.maxTilt, Math.abs(this.pitch));
    const tanUp = Math.tan(Math.max(0, this.pitch) * Math.PI / 180), tanDown = Math.tan(Math.max(0, -this.pitch) * Math.PI / 180);
    this.slip = clamp(Math.max(tanUp / this.mu, 0.5 * tanDown / this.mu), 0, 1.3);
    const rock = this.rocks.some(r => Math.abs(r.x - this.x) < 2.5) ? 0.75 : 1;
    const vmax = 0.9;
    if (this.slip >= 1) { this.stuck += dt; this.v = 0.02; } else { this.stuck = Math.max(0, this.stuck - dt); this.v = vmax * rock * (1 - 0.85 * this.slip * this.slip); }
    this.x += this.v * dt;
    const heater = 0.02 * (s.thermalAmplitude / 28) * (this._night() ? 1.6 : 0.6);
    this.battery -= dt * (0.045 + 0.05 * this.slip + heater);

    if (Math.abs(this.pitch) > 32) return this._finish(false, `Rollover risk: terrain tilt ${Math.abs(this.pitch).toFixed(0)}\u00B0 exceeds the 32\u00B0 rover limit.`);
    if (this.stuck > 45) return this._finish(false, `Rover immobilised: slope demand exceeds wheel traction (mu = ${this.mu.toFixed(2)}).`);
    if (this.battery <= 0) { this.battery = 0; return this._finish(false, `Battery depleted at ${Math.round(this.x)} m of ${this.L} m (low traction slowed the traverse).`); }
    if (this.x >= this.L) { this.x = this.L; return this._finish(true, `Traverse completed: ${this.L} m in ${this._fmtTime(this.t)}, ${this.battery.toFixed(0)}% battery left, max tilt ${this.maxTilt.toFixed(0)}\u00B0.`); }
  }
  _finish(ok, reason) { this.done = true; this.result = { ok, reason, siteId: this.site.id, distance: this.x, time: this.t, battery: this.battery, maxTilt: this.maxTilt }; }
  _phase() { return (this.t / this.sol) * 2 * Math.PI; }
  _night() { return Math.sin(this._phase()) < -0.15; }
  _fmtTime(sec) { const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return `${m}m ${String(s).padStart(2, "0")}s`; }

  _emit() {
    if (!this.hooks.onTelemetry || !this.site) return;
    const s = this.site, temp = 15 - s.elevation * 0.0065 + (s.thermalAmplitude / 2) * Math.sin(this._phase());
    this.hooks.onTelemetry({
      distance: this.x, length: this.L, speed: this.v, tilt: this.pitch, slip: this.slip * 100, battery: this.battery,
      temp, night: this._night(), time: this._fmtTime(this.t), mu: this.mu, traction: this.traction, running: this.running
    });
  }

  // ---- Rendering ----------------------------------------------------------
  draw() {
    if (!this.site) return;
    const c = this.ctx, W = this.W, H = this.H, PX = this.PX, night = this._night();
    const strip = 46, viewH = H - strip;
    // sky
    const sky = c.createLinearGradient(0, 0, 0, viewH);
    if (night) { sky.addColorStop(0, "#02040a"); sky.addColorStop(1, "#0c1a33"); } else { sky.addColorStop(0, "#0a2a5e"); sky.addColorStop(1, "#4d8fd6"); }
    c.fillStyle = sky; c.fillRect(0, 0, W, viewH);
    if (night) { c.fillStyle = "rgba(255,255,255,0.8)"; this.stars.forEach(s => { c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.283); c.fill(); }); }
    else { const sx = W * 0.8, sy = 46; c.fillStyle = "rgba(255,240,200,0.95)"; c.beginPath(); c.arc(sx, sy, 14, 0, 6.283); c.fill(); }

    // camera follows rover
    this.camY += (this._heightAt(this.x) - this.camY) * 0.08;
    const camX = this.x - (W * 0.3) / PX;
    const sx = x => (x - camX) * PX, sy = h => viewH * 0.62 - (h - this.camY) * PX;

    // terrain fill
    c.beginPath(); c.moveTo(0, viewH);
    for (let px = 0; px <= W; px += 3) c.lineTo(px, sy(this._heightAt(camX + px / PX)));
    c.lineTo(W, viewH); c.closePath();
    const tg = c.createLinearGradient(0, viewH * 0.4, 0, viewH);
    tg.addColorStop(0, night ? "#3a2f29" : "#8a6a52"); tg.addColorStop(1, night ? "#17120f" : "#4a372b");
    c.fillStyle = tg; c.fill();
    c.strokeStyle = "rgba(255,255,255,0.25)"; c.lineWidth = 1.5; c.stroke();

    // rocks
    c.fillStyle = night ? "#2a2522" : "#5d4a3b";
    this.rocks.forEach(r => {
      const px = sx(r.x); if (px < -20 || px > W + 20) return;
      const py = sy(this._heightAt(r.x)); c.beginPath(); c.ellipse(px, py, r.s * PX * 1.4, r.s * PX, 0, Math.PI, 0); c.fill();
    });

    // rover (body rotated by terrain pitch)
    const rx = sx(this.x), ry = sy(this._heightAt(this.x));
    c.save(); c.translate(rx, ry); c.rotate(-this.pitch * Math.PI / 180);
    const wr = 5.5;
    c.fillStyle = "#1b1b1f"; [-17, 0, 17].forEach(wx => { c.beginPath(); c.arc(wx, -wr, wr, 0, 6.283); c.fill(); c.strokeStyle = "#8e8e93"; c.lineWidth = 1.2; c.stroke(); });
    c.fillStyle = "#e5e5ea"; c.fillRect(-21, -wr - 19, 42, 11);                 // chassis
    c.fillStyle = "#0A84FF"; c.fillRect(-21, -wr - 19, 42, 3);                 // accent stripe
    c.fillStyle = "#2c2c2e"; c.fillRect(-18, -wr - 30, 14, 3);                 // solar panel
    c.fillRect(8, -wr - 28, 2, 9); c.fillStyle = "#64D2FF"; c.fillRect(6, -wr - 31, 6, 4); // mast camera
    c.restore();

    // progress strip with full elevation profile
    c.fillStyle = "rgba(0,0,0,0.65)"; c.fillRect(0, viewH, W, strip);
    let hmin = Infinity, hmax = -Infinity; for (let i = 0; i < this.h.length; i++) { hmin = Math.min(hmin, this.h[i]); hmax = Math.max(hmax, this.h[i]); }
    const span = Math.max(1, hmax - hmin), pad = 8;
    c.beginPath();
    for (let i = 0; i < this.h.length; i += 4) {
      const px = 10 + (i / (this.h.length - 1)) * (W - 20), py = viewH + strip - pad - ((this.h[i] - hmin) / span) * (strip - 2 * pad);
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.strokeStyle = "#0A84FF"; c.lineWidth = 1.6; c.stroke();
    const cx = 10 + (this.x / this.L) * (W - 20);
    c.strokeStyle = "#ffffff"; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, viewH + 4); c.lineTo(cx, viewH + strip - 4); c.stroke();
    c.fillStyle = "rgba(255,255,255,0.6)"; c.font = "10px Inter, sans-serif"; c.textAlign = "left";
    c.fillText(`Elevation profile  |  ${Math.round(hmin)} to ${Math.round(hmax)} m relative`, 12, viewH + 12);
    c.textAlign = "right"; c.fillText(`${Math.round(this.x)} / ${this.L} m`, W - 12, viewH + 12);
  }
};
