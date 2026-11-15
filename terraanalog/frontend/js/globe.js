/* =========================================================================
 * TerraAnalog - Textured 3D orthographic globe (Earth / Moon / Mars)
 * Real imagery is sampled per pixel from an equirectangular texture:
 *   Earth: NASA Blue Marble          Moon: NASA Trek LRO WAC mosaic
 *   Mars : NASA Trek Viking MDIM 2.1 (jsDelivr planet maps are the fallback)
 * ========================================================================= */
window.TA = window.TA || {};

TA.globe = (function () {
  const D2R = Math.PI / 180;
  const TREK = {
    moon: "https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm",
    mars: "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm"
  };
  const FALLBACK = {
    earth: "https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/earthmap1k.jpg",
    moon: "https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/moonmap1k.jpg",
    mars: "https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/marsmap1k.jpg"
  };
  const PRIMARY_EARTH = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
  const TEX_W = 2048, TEX_H = 1024;
  const GLOW = { earth: "10,132,255", moon: "200,200,210", mars: "255,140,80" };

  const g = {
    canvas: null, ctx: null, pinsEl: null, buf: null, bufCtx: null,
    body: "earth", textures: {}, loading: {}, status: {}, // status: loading | ready | failed
    lon0: -60, lat0: 20, scale: 1, active: false, dirty: true,
    anim: null, drag: null, pins: [], pinEls: {}, polys: [], terminator: true,
    onPinClick: null, onZoom: null, onStatus: null
  };

  function loadImage(src) {
    return new Promise((res, rej) => {
      const im = new Image(); im.crossOrigin = "anonymous";
      im.onload = () => res(im); im.onerror = () => rej(new Error("load failed: " + src));
      im.src = src;
    });
  }

  function toTexture(drawFn) {
    const c = document.createElement("canvas"); c.width = TEX_W; c.height = TEX_H;
    const x = c.getContext("2d", { willReadFrequently: true });
    drawFn(x);
    return x.getImageData(0, 0, TEX_W, TEX_H);   // throws if the canvas is tainted
  }

  async function fetchTexture(body) {
    try {
      if (body === "earth") {
        const im = await loadImage(PRIMARY_EARTH);
        return toTexture(x => x.drawImage(im, 0, 0, TEX_W, TEX_H));
      }
      // Compose a 2048x1024 equirectangular texture from the 8x4 NASA Trek tile matrix at level 2
      const jobs = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
        jobs.push(loadImage(`${TREK[body]}/2/${r}/${c}.jpg`).then(im => ({ im, r, c })));
      }
      const tiles = await Promise.all(jobs);
      return toTexture(x => tiles.forEach(t => x.drawImage(t.im, t.c * 256, t.r * 256, 256, 256)));
    } catch (err) {
      console.warn("Primary globe texture failed, using fallback:", err.message);
      const im = await loadImage(FALLBACK[body]);
      return toTexture(x => x.drawImage(im, 0, 0, TEX_W, TEX_H));
    }
  }

  function ensureTexture(body) {
    if (g.textures[body] || g.loading[body]) return;
    g.status[body] = "loading";
    g.loading[body] = fetchTexture(body).then(t => {
      g.textures[body] = t; g.status[body] = "ready"; g.dirty = true;
      if (g.onStatus) g.onStatus(body, "ready");
    }).catch(err => {
      console.error("Globe texture unavailable for " + body, err);
      g.status[body] = "failed"; g.dirty = true;
      if (g.onStatus) g.onStatus(body, "failed");
    });
  }

  function radius() { return Math.min(g.canvas.width, g.canvas.height) * 0.40 * g.scale; }

  // Orthographic projection centred on (lon0, lat0)
  function project(lat, lon) {
    const R = radius(), cx = g.canvas.width / 2, cy = g.canvas.height / 2;
    const p = lat * D2R, l = (lon - g.lon0) * D2R, p0 = g.lat0 * D2R;
    const x = Math.cos(p) * Math.sin(l);
    const y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l);
    const z = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
    return { x: cx + x * R, y: cy - y * R, z: z, visible: z > 0.02 };
  }

  function sunVector() {
    // subsolar point from UTC time (Earth) or a fixed phase (Moon / Mars)
    const now = new Date();
    const lon = g.body === "earth" ? -((now.getUTCHours() + now.getUTCMinutes() / 60) - 12) * 15 : 40;
    const day = (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(now.getUTCFullYear(), 0, 0)) / 864e5;
    const lat = g.body === "earth" ? 23.44 * Math.sin(2 * Math.PI * (day - 80) / 365) : 0;
    const p = lat * D2R, l = (lon - g.lon0) * D2R, p0 = g.lat0 * D2R;
    return {
      x: Math.cos(p) * Math.sin(l),
      y: Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l),
      z: Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l)
    };
  }

  function drawSphere() {
    const ctx = g.ctx, cx = g.canvas.width / 2, cy = g.canvas.height / 2, R = radius();
    ctx.clearRect(0, 0, g.canvas.width, g.canvas.height);

    // atmospheric halo
    const glow = GLOW[g.body];
    const halo = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.18);
    halo.addColorStop(0, `rgba(${glow},0.35)`); halo.addColorStop(1, `rgba(${glow},0)`);
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2); ctx.fill();

    const tex = g.textures[g.body];
    if (!tex) {
      // texture still loading (or failed): neutral shaded sphere with graticule so the globe is never solid black
      const grad = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
      grad.addColorStop(0, "#35506b"); grad.addColorStop(1, "#0b1622");
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) { ctx.beginPath(); let first = true;
        for (let lon = -180; lon <= 180; lon += 6) { const p = project(lat, lon); if (!p.visible) { first = true; continue; } first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); first = false; } ctx.stroke(); }
      for (let lon = -180; lon < 180; lon += 30) { ctx.beginPath(); let first = true;
        for (let lat = -88; lat <= 88; lat += 4) { const p = project(lat, lon); if (!p.visible) { first = true; continue; } first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); first = false; } ctx.stroke(); }
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "12px Inter, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(g.status[g.body] === "failed" ? "Imagery unavailable (network)" : "Loading planetary imagery...", cx, cy + R + 28);
      return;
    }

    // per-pixel inverse orthographic sampling of the equirectangular texture
    const B = Math.max(260, Math.min(720, Math.round(R * 2)));
    if (!g.buf || g.buf.width !== B) {
      g.buf = document.createElement("canvas"); g.buf.width = g.buf.height = B;
      g.bufCtx = g.buf.getContext("2d");
    }
    const img = g.bufCtx.createImageData(B, B), out = img.data, src = tex.data;
    const p0 = g.lat0 * D2R, sinP0 = Math.sin(p0), cosP0 = Math.cos(p0), half = B / 2;
    const sun = sunVector();
    for (let py = 0; py < B; py++) {
      const y = (half - py - 0.5) / half;
      for (let px = 0; px < B; px++) {
        const x = (px + 0.5 - half) / half, rho2 = x * x + y * y;
        if (rho2 >= 1) continue;
        const z = Math.sqrt(1 - rho2);
        const lat = Math.asin(clamp(z * sinP0 + y * cosP0, -1, 1));
        let lon = g.lon0 * D2R + Math.atan2(x, z * cosP0 - y * sinP0);
        let u = (lon / (2 * Math.PI) + 0.5) % 1; if (u < 0) u += 1;
        const v = 0.5 - lat / Math.PI;
        const tx = Math.min(TEX_W - 1, (u * TEX_W) | 0), ty = Math.min(TEX_H - 1, Math.max(0, (v * TEX_H) | 0));
        const si = (ty * TEX_W + tx) * 4, oi = (py * B + px) * 4;
        let shade = 0.72 + 0.28 * z;                                   // limb darkening
        if (g.terminator) { const d = x * sun.x + y * sun.y + z * sun.z; shade *= 0.16 + 0.84 * clamp((d + 0.08) / 0.5, 0, 1); }
        out[oi] = src[si] * shade; out[oi + 1] = src[si + 1] * shade; out[oi + 2] = src[si + 2] * shade; out[oi + 3] = 255;
      }
    }
    g.bufCtx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(g.buf, cx - R, cy - R, R * 2, R * 2);
    // rim
    ctx.strokeStyle = `rgba(${glow},0.45)`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  }

  function drawPolys() {
    const ctx = g.ctx;
    g.polys.forEach(po => {
      const proj = po.pts.map(p => project(p[0], p[1]));
      if (!proj.every(p => p.visible)) return;
      ctx.beginPath(); proj.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
      ctx.fillStyle = po.fill; ctx.fill(); ctx.strokeStyle = po.stroke; ctx.lineWidth = 1.5; ctx.stroke();
    });
  }

  function updatePins() {
    g.pins.forEach(pin => {
      const el = g.pinEls[pin.id]; if (!el) return;
      const p = project(pin.lat, pin.lon);
      if (!p.visible) { el.style.display = "none"; return; }
      el.style.display = "flex";
      el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -50%)`;
    });
  }

  function frame(ts) {
    if (g.active && g.canvas) {
      if (g.anim) {
        const t = clamp((ts - g.anim.t0) / g.anim.dur, 0, 1), e = 1 - Math.pow(1 - t, 3);
        g.lon0 = g.anim.lon0 + g.anim.dLon * e; g.lat0 = g.anim.lat0 + g.anim.dLat * e;
        if (t >= 1) g.anim = null;
        g.dirty = true;
      }
      if (g.dirty) {
        g.dirty = false;
        drawSphere(); drawPolys(); updatePins();
      }
    }
    requestAnimationFrame(frame);
  }

  function norm(l) { l = ((l + 180) % 360 + 360) % 360 - 180; return l; }

  const api = {
    get active() { return g.active; },
    get body() { return g.body; },
    get status() { return g.status; },
    init(canvas, pinsEl, hooks) {
      g.canvas = canvas; g.ctx = canvas.getContext("2d"); g.pinsEl = pinsEl;
      Object.assign(g, hooks || {});
      canvas.addEventListener("pointerdown", e => { g.drag = { x: e.clientX, y: e.clientY }; g.anim = null; canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener("pointermove", e => {
        if (!g.drag) return;
        const k = 0.30 / g.scale, dx = e.clientX - g.drag.x, dy = e.clientY - g.drag.y;
        g.drag = { x: e.clientX, y: e.clientY };
        g.lon0 = norm(g.lon0 - dx * k); g.lat0 = clamp(g.lat0 + dy * k, -85, 85); g.dirty = true;
      });
      const end = () => { g.drag = null; };
      canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
      canvas.addEventListener("wheel", e => { e.preventDefault(); api.zoom(e.deltaY < 0 ? 0.15 : -0.15); }, { passive: false });
      api.resize(); requestAnimationFrame(frame);
    },
    resize() {
      if (!g.canvas) return;
      // 1 canvas px = 1 CSS px so the DOM pin overlay lines up exactly with the sphere
      g.canvas.width = window.innerWidth; g.canvas.height = window.innerHeight;
      g.dirty = true;
    },
    setActive(on) { g.active = on; g.dirty = true; if (on) ensureTexture(g.body); g.pinsEl.style.display = on ? "block" : "none"; },
    setBody(body) { if (g.body !== body) { g.body = body; g.dirty = true; } ensureTexture(body); },
    setTerminator(on) { g.terminator = on; g.dirty = true; },
    setPolys(polys) { g.polys = polys; g.dirty = true; },
    // pins: [{id, lat, lon, color, label, selected, title}]
    setPins(pins) {
      g.pins = pins;
      const keep = {};
      pins.forEach(pin => {
        keep[pin.id] = true;
        let el = g.pinEls[pin.id];
        if (!el) {
          el = document.createElement("div");
          el.className = "globe-pin"; el.addEventListener("click", () => g.onPinClick && g.onPinClick(el.dataset.id));
          g.pinsEl.appendChild(el); g.pinEls[pin.id] = el;
        }
        el.dataset.id = pin.id; el.title = pin.title || "";
        const size = pin.selected ? 36 : 28;
        el.style.width = el.style.height = size + "px";
        el.style.zIndex = pin.selected ? 5 : 1;
        el.innerHTML = `<span class="pin-ring" style="background:${pin.color}"></span><span class="pin-core" style="background:${pin.color}">${pin.label}</span>`;
      });
      Object.keys(g.pinEls).forEach(id => { if (!keep[id]) { g.pinEls[id].remove(); delete g.pinEls[id]; } });
      g.dirty = true;
    },
    flyTo(lat, lon, scale) {
      const dLon = norm(lon - g.lon0);
      g.anim = { t0: performance.now(), dur: 1100, lon0: g.lon0, lat0: g.lat0, dLon, dLat: clamp(lat, -80, 80) - g.lat0 };
      if (scale) g.scale = scale;
      g.dirty = true;
    },
    zoom(delta) {
      g.scale = clamp(g.scale + delta, 0.6, 3); g.dirty = true;
      if (g.onZoom) g.onZoom(g.scale);
    },
    get scale() { return g.scale; },
    project
  };
  return api;
})();
