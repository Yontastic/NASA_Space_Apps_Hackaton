/* =========================================================================
 * TerraAnalog - Rover traverse simulation (side-view canvas with dynamic biomes)
 * Terrain geometry, traction, thermal cycle, power budget and visual biome
 * (sky, background silhouettes, surface features & soil strata) are generated
 * from the selected site's real parameters.
 * ========================================================================= */
window.TA = window.TA || {};

const BIOME_THEMES = {
  arid_desert: {
    label: "Hyper-Arid Regolith Desert",
    skyDay: ["#2a1510", "#7c3b24", "#d98a5c"],
    skyNight: ["#090507", "#1e1116", "#381f24"],
    sunCol: "rgba(255,215,155,0.92)",
    ridgeDay: ["rgba(110,50,32,0.55)", "rgba(82,35,22,0.78)"],
    ridgeNight: ["rgba(35,18,16,0.7)", "rgba(24,12,11,0.85)"],
    groundDay: ["#c2643f", "#8a3e24", "#4d2012"],
    groundNight: ["#4a2518", "#2d160e", "#170b07"],
    strokeCol: "rgba(255,200,160,0.45)",
    rockDay: "#6e2f1b", rockNight: "#2b130b",
    featureType: "strata", ridgeStyle: "mesa"
  },
  volcanic_basalt: {
    label: "Volcanic Basalt & Lava Plains",
    skyDay: ["#111824", "#2b394a", "#667582"],
    skyNight: ["#05070b", "#121620", "#261c22"],
    sunCol: "rgba(255,228,185,0.88)",
    ridgeDay: ["rgba(42,46,54,0.65)", "rgba(26,28,34,0.88)"],
    ridgeNight: ["rgba(18,18,24,0.8)", "rgba(12,12,16,0.92)"],
    groundDay: ["#484a52", "#2b2d33", "#15161a"],
    groundNight: ["#25262b", "#16171b", "#0b0c0e"],
    strokeCol: "rgba(180,195,215,0.38)",
    rockDay: "#1f2026", rockNight: "#101114",
    featureType: "lava", ridgeStyle: "cones"
  },
  polar_ice: {
    label: "Polar Ice & Permafrost Tundra",
    skyDay: ["#0b2545", "#2b6cb0", "#90cdf4"],
    skyNight: ["#020814", "#081c38", "#15365c"],
    sunCol: "rgba(240,250,255,0.95)",
    ridgeDay: ["rgba(165,205,235,0.55)", "rgba(120,168,208,0.8)"],
    ridgeNight: ["rgba(38,65,98,0.7)", "rgba(24,44,70,0.88)"],
    groundDay: ["#e6f4ff", "#a8cee8", "#5c87ad"],
    groundNight: ["#486888", "#2b435c", "#162638"],
    strokeCol: "rgba(255,255,255,0.8)",
    rockDay: "#6f95b5", rockNight: "#273c52",
    featureType: "ice_veins", ridgeStyle: "glacier"
  },
  gypsum_wetland: {
    label: "Gypsum Wetland & Thermal Basin",
    skyDay: ["#0c3559", "#2874a6", "#85c1e9"],
    skyNight: ["#040d1a", "#0d2238", "#1a3c5a"],
    sunCol: "rgba(255,246,210,0.95)",
    ridgeDay: ["rgba(125,115,105,0.52)", "rgba(95,86,76,0.75)"],
    ridgeNight: ["rgba(32,36,44,0.72)", "rgba(22,25,32,0.88)"],
    groundDay: ["#ede6d6", "#cfc4ae", "#8f836d"],
    groundNight: ["#5e594f", "#3d3932", "#24211d"],
    strokeCol: "rgba(255,255,255,0.65)",
    rockDay: "#9c907a", rockNight: "#3a352c",
    featureType: "thermal_pools", ridgeStyle: "dunes"
  },
  salt_flat: {
    label: "Evaporite Salt Flat (Salar)",
    skyDay: ["#092bc2", "#2d6cdf", "#9ec5ff"],
    skyNight: ["#03071e", "#0b1942", "#1c3166"],
    sunCol: "rgba(255,250,230,0.96)",
    ridgeDay: ["rgba(140,120,115,0.48)", "rgba(105,85,78,0.72)"],
    ridgeNight: ["rgba(30,28,38,0.7)", "rgba(20,18,26,0.88)"],
    groundDay: ["#f2efe9", "#d6cfc2", "#968d7e"],
    groundNight: ["#635f58", "#403d38", "#211f1c"],
    strokeCol: "rgba(255,255,255,0.75)",
    rockDay: "#a69c8e", rockNight: "#3d3934",
    featureType: "salt_polygons", ridgeStyle: "mesa"
  },
  alpine_rock: {
    label: "Shocked Breccia & Crater Highlands",
    skyDay: ["#0d1f38", "#2d4c73", "#7fa0c4"],
    skyNight: ["#04070f", "#0e1829", "#1d2d44"],
    sunCol: "rgba(255,238,200,0.9)",
    ridgeDay: ["rgba(88,80,72,0.6)", "rgba(58,52,46,0.84)"],
    ridgeNight: ["rgba(26,24,28,0.76)", "rgba(16,15,18,0.9)"],
    groundDay: ["#968877", "#695d4f", "#383129"],
    groundNight: ["#3d3730", "#26221d", "#14120f"],
    strokeCol: "rgba(230,215,195,0.42)",
    rockDay: "#4f453a", rockNight: "#1f1b16",
    featureType: "crags", ridgeStyle: "crags"
  }
};

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

  // ---- Terrain & biome generation ------------------------------------------
  setSite(site, target) {
    this.site = site; this.target = target;
    this.biomeKey = (site && site.biome && BIOME_THEMES[site.biome]) ? site.biome : this._inferBiome(site);
    this.theme = BIOME_THEMES[this.biomeKey] || BIOME_THEMES.arid_desert;
    this.biomeLabel = (site && site.biomeLabel) ? site.biomeLabel : this.theme.label;

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

    // Decorative rocks & biome-specific surface accents
    this.rocks = []; this.features = [];
    let x = 8;
    while (x < this.L) {
      x += (55 / (0.3 + r * 1.6)) * (0.5 + rnd());
      this.rocks.push({ x, s: 0.15 + rnd() * r * 0.5, k: rnd() });
    }
    let fx = 14;
    while (fx < this.L) {
      fx += 18 + rnd() * 26;
      this.features.push({ x: fx, w: 1.4 + rnd() * 2.8, h: 0.3 + rnd() * 0.7, k: rnd() });
    }

    this.traction = TA.engine.traction(site);
    this.mu = 0.15 + 0.6 * this.traction;
    this.stars = Array.from({ length: 45 }, () => ({ x: rnd() * this.W, y: rnd() * this.H * 0.55, r: rnd() * 1.2 + 0.3 }));
    this.reset();
  }

  _inferBiome(s) {
    if (!s) return "arid_desert";
    if (s.env === "Polar" || s.lithology === "polar_ice") return "polar_ice";
    if (s.liquidWater && s.env === "Salar") return "gypsum_wetland";
    if (s.env === "Salar") return "salt_flat";
    if (s.env === "Volcanic" || s.env === "Lava_Tube") return "volcanic_basalt";
    if (s.env === "Crater") return "alpine_rock";
    return "arid_desert";
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

  // ---- Biome background silhouettes & surface details ---------------------
  _drawBackgroundRidges(c, W, viewH, camX, th, night) {
    const cols = night ? th.ridgeNight : th.ridgeDay;
    const style = th.ridgeStyle;
    [0, 1].forEach(layer => {
      const par = layer === 0 ? 0.9 : 2.1;
      const baseH = viewH * (layer === 0 ? 0.43 : 0.53);
      const amp = layer === 0 ? 28 : 18;
      c.beginPath(); c.moveTo(0, viewH);
      for (let px = 0; px <= W; px += 8) {
        const u = (px + camX * par) * 0.012 + layer * 2.1;
        let dy = 0;
        if (style === "cones") {
          // Volcanic cones and shield ridges
          const wave = Math.sin(u * 0.7) * 0.6 + Math.sin(u * 1.9) * 0.4;
          dy = Math.pow(Math.abs(wave), 0.75) * amp * (wave > 0 ? 1.3 : 0.4);
        } else if (style === "glacier") {
          // Sharp jagged glacial peaks & seracs
          dy = (Math.abs(((u * 0.45) % 2) - 1) * 1.2 - 0.3) * amp + Math.sin(u * 2.3) * 6;
        } else if (style === "mesa") {
          // Flat-topped desert mesas & cordillera plateaus
          const w = Math.sin(u * 0.65) + 0.35 * Math.sin(u * 1.8);
          dy = Math.max(-0.5, Math.min(0.65, w * 1.2)) * amp;
        } else if (style === "dunes") {
          // Smooth undulating gypsum dune crests & basin rim
          dy = (Math.sin(u * 0.8) * 0.7 + Math.cos(u * 1.5) * 0.3) * amp * 0.85;
        } else {
          // Impact crater scarps & crags
          dy = (Math.sin(u * 0.9) * 0.6 + Math.abs(Math.cos(u * 2.2)) * 0.5) * amp;
        }
        c.lineTo(px, baseH - dy);
      }
      c.lineTo(W, viewH); c.closePath();
      c.fillStyle = cols[layer]; c.fill();
    });
  }

  _drawBiomeSurfaceFeatures(c, W, viewH, sx, sy, th, night) {
    const PX = this.PX, fType = th.featureType;
    this.features.forEach(f => {
      const px = sx(f.x);
      if (px < -60 || px > W + 60) return;
      const py = sy(this._heightAt(f.x));

      if (fType === "thermal_pools") {
        // Turquoise thermal pozas (Cuatro Cienegas) + gypsum scrub tufts
        if (f.k < 0.55) {
          const rw = f.w * PX * 1.3, rh = Math.max(3.5, f.h * 5.5);
          const pg = c.createRadialGradient(px, py + 4, 1, px, py + 4, rw);
          pg.addColorStop(0, night ? "rgba(40,180,195,0.65)" : "rgba(38,218,225,0.88)");
          pg.addColorStop(0.75, night ? "rgba(16,95,125,0.55)" : "rgba(18,135,175,0.75)");
          pg.addColorStop(1, "rgba(220,210,190,0.2)");
          c.fillStyle = pg;
          c.beginPath(); c.ellipse(px, py + 4.5, rw, rh, 0, 0, Math.PI * 2); c.fill();
          c.strokeStyle = "rgba(255,250,235,0.6)"; c.lineWidth = 1; c.stroke();
        } else {
          // Halophytic desert scrub tuft
          c.strokeStyle = night ? "#394d38" : "#617d53"; c.lineWidth = 1.4;
          for (let b = -2; b <= 2; b++) {
            c.beginPath(); c.moveTo(px, py);
            c.lineTo(px + b * 3.2, py - 5 - (f.k * 4)); c.stroke();
          }
        }
      } else if (fType === "lava") {
        // Glowing basaltic fissure / fumarole vent or vesicular ridge
        if (f.k < 0.45) {
          c.strokeStyle = night ? "rgba(255,95,35,0.75)" : "rgba(255,115,40,0.55)";
          c.lineWidth = 1.8;
          c.beginPath(); c.moveTo(px - 10, py + 5); c.lineTo(px, py + 2); c.lineTo(px + 9, py + 7); c.stroke();
        }
      } else if (fType === "ice_veins") {
        // Specular blue permafrost ice-wedge polygons & snow patches
        c.fillStyle = night ? "rgba(140,200,255,0.28)" : "rgba(255,255,255,0.65)";
        c.beginPath(); c.ellipse(px, py + 3, f.w * PX * 0.9, 2.5, 0, 0, Math.PI * 2); c.fill();
      } else if (fType === "salt_polygons") {
        // Polygonal halite pressure-ridge lines (Salar de Uyuni / Badwater / Dallol)
        c.strokeStyle = night ? "rgba(220,215,200,0.28)" : "rgba(255,255,255,0.68)";
        c.lineWidth = 1.3;
        c.beginPath();
        c.moveTo(px - 14, py + 4); c.lineTo(px - 4, py + 1.5); c.lineTo(px + 8, py + 4); c.lineTo(px + 15, py + 2);
        c.stroke();
      } else if (fType === "strata") {
        // Oxidized regolith strata & iron-rich desert crust lines
        c.strokeStyle = night ? "rgba(180,90,55,0.22)" : "rgba(245,165,115,0.35)";
        c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(px - 12, py + 6); c.lineTo(px + 12, py + 5); c.stroke();
      }
    });
  }

  // ---- Rendering ----------------------------------------------------------
  draw() {
    if (!this.site) return;
    const c = this.ctx, W = this.W, H = this.H, PX = this.PX, night = this._night();
    const th = this.theme || BIOME_THEMES.arid_desert;
    const strip = 46, viewH = H - strip;

    // 1. Dynamic biome sky gradient
    const skyCols = night ? th.skyNight : th.skyDay;
    const sky = c.createLinearGradient(0, 0, 0, viewH);
    sky.addColorStop(0, skyCols[0]); sky.addColorStop(0.55, skyCols[1]); sky.addColorStop(1, skyCols[2]);
    c.fillStyle = sky; c.fillRect(0, 0, W, viewH);

    if (night) {
      c.fillStyle = "rgba(255,255,255,0.8)";
      this.stars.forEach(s => { c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.283); c.fill(); });
    } else {
      const sunX = W * 0.82, sunY = 44;
      const halo = c.createRadialGradient(sunX, sunY, 4, sunX, sunY, 42);
      halo.addColorStop(0, th.sunCol); halo.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = halo; c.beginPath(); c.arc(sunX, sunY, 42, 0, 6.283); c.fill();
      c.fillStyle = th.sunCol; c.beginPath(); c.arc(sunX, sunY, 13, 0, 6.283); c.fill();
    }

    // Camera follows rover
    this.camY += (this._heightAt(this.x) - this.camY) * 0.08;
    const camX = this.x - (W * 0.3) / PX;
    const sx = x => (x - camX) * PX, sy = h => viewH * 0.62 - (h - this.camY) * PX;

    // 2. Parallax biome background silhouettes
    this._drawBackgroundRidges(c, W, viewH, camX, th, night);

    // 3. Foreground biome terrain fill
    c.beginPath(); c.moveTo(0, viewH);
    for (let px = 0; px <= W; px += 3) c.lineTo(px, sy(this._heightAt(camX + px / PX)));
    c.lineTo(W, viewH); c.closePath();
    const gCols = night ? th.groundNight : th.groundDay;
    const tg = c.createLinearGradient(0, viewH * 0.38, 0, viewH);
    tg.addColorStop(0, gCols[0]); tg.addColorStop(0.45, gCols[1]); tg.addColorStop(1, gCols[2]);
    c.fillStyle = tg; c.fill();
    c.strokeStyle = th.strokeCol; c.lineWidth = 1.6; c.stroke();

    // 4. Biome-specific surface details (thermal pools, salt polygons, ice veins, lava fissures, scrub)
    this._drawBiomeSurfaceFeatures(c, W, viewH, sx, sy, th, night);

    // 5. Rocks & boulders styled to biome
    c.fillStyle = night ? th.rockNight : th.rockDay;
    this.rocks.forEach(r => {
      const px = sx(r.x); if (px < -20 || px > W + 20) return;
      const py = sy(this._heightAt(r.x));
      c.beginPath();
      c.ellipse(px, py, r.s * PX * 1.4, r.s * PX, 0, Math.PI, 0);
      c.fill();
    });

    // 6. Rover (chassis rotated by terrain pitch)
    const rx = sx(this.x), ry = sy(this._heightAt(this.x));
    c.save(); c.translate(rx, ry); c.rotate(-this.pitch * Math.PI / 180);
    const wr = 5.5;
    c.fillStyle = "#1b1b1f"; [-17, 0, 17].forEach(wx => { c.beginPath(); c.arc(wx, -wr, wr, 0, 6.283); c.fill(); c.strokeStyle = "#8e8e93"; c.lineWidth = 1.2; c.stroke(); });
    c.fillStyle = "#e5e5ea"; c.fillRect(-21, -wr - 19, 42, 11);                 // chassis
    c.fillStyle = "#0A84FF"; c.fillRect(-21, -wr - 19, 42, 3);                  // accent stripe
    c.fillStyle = "#2c2c2e"; c.fillRect(-18, -wr - 30, 14, 3);                  // solar panel
    c.fillRect(8, -wr - 28, 2, 9); c.fillStyle = "#64D2FF"; c.fillRect(6, -wr - 31, 6, 4); // mast camera
    c.restore();

    // 7. Corner Biome Label Badge
    const badgeTxt = `Biome: ${this.biomeLabel}`;
    c.font = "600 11px Inter, sans-serif";
    const bw = c.measureText(badgeTxt).width + 24;
    c.fillStyle = "rgba(15,17,23,0.78)";
    c.strokeStyle = "rgba(255,255,255,0.18)";
    c.lineWidth = 1;
    c.beginPath();
    if (c.roundRect) c.roundRect(10, 10, bw, 24, 8); else c.rect(10, 10, bw, 24);
    c.fill(); c.stroke();
    c.fillStyle = "#5AA9FF";
    c.beginPath(); c.arc(20, 22, 3.5, 0, 6.283); c.fill();
    c.fillStyle = "#F5F5F7"; c.textAlign = "left";
    c.fillText(badgeTxt, 28, 26);

    // 8. Progress strip with full elevation profile
    c.fillStyle = "rgba(0,0,0,0.68)"; c.fillRect(0, viewH, W, strip);
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
