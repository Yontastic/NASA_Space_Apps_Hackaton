/* =========================================================================
 * TerraAnalog - Textured 3D orthographic globe (Earth / Moon / Mars)
 * 100% uniform planetary illumination (no dark night hemisphere) with
 * Google Earth-style atmospheric glow, inertia rotation & crisp imagery:
 *   Earth: Esri World Imagery + NASA Blue Marble (2048x1024 equirectangular)
 *   Moon : NASA Trek LRO WAC global mosaic (2048x1024)
 *   Mars : NASA Trek Viking MDIM 2.1 color mosaic (2048x1024)
 * ========================================================================= */
window.TA = window.TA || {};

TA.globe = (function () {
  const D2R = Math.PI / 180;
  const TREK = {
    moon: "https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm",
    mars: "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm"
  };
  const ESRI_TILE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";
  const FALLBACK = {
    earth: "https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/earthmap1k.jpg",
    moon: "https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/moonmap1k.jpg",
    mars: "https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/marsmap1k.jpg"
  };
  const PRIMARY_EARTH = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
  const TEX_W = 2048, TEX_H = 1024;
  const GLOW = { earth: "58,158,255", moon: "210,215,225", mars: "255,140,80" };

  const g = {
    canvas: null, ctx: null, pinsEl: null, buf: null, bufCtx: null,
    body: "earth", textures: {}, loading: {}, status: {}, // status: loading | ready | failed
    lon0: -60, lat0: 20, scale: 1, active: false, dirty: true,
    anim: null, drag: null, vx: 0, vy: 0,
    pins: [], pinEls: {}, polys: [], terminator: false,
    stars: [],
    onPinClick: null, onZoom: null, onStatus: null
  };

  function initStars() {
    let s = 4219;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    g.stars = Array.from({ length: 140 }, () => ({
      u: rnd(), v: rnd(), r: 0.5 + rnd() * 1.3, a: 0.25 + rnd() * 0.65
    }));
  }
  initStars();

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
    return x.getImageData(0, 0, TEX_W, TEX_H);
  }

  async function fetchEarthTexture() {
    // Load NASA Blue Marble first for full pole-to-pole coverage, then composite Esri World Imagery z=3
    let baseImg = null;
    try { baseImg = await loadImage(PRIMARY_EARTH); } catch (_) { baseImg = await loadImage(FALLBACK.earth); }

    try {
      const Z = 3, N = 1 << Z; // 8x8 Web Mercator tiles (2048x2048)
      const jobs = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        jobs.push(loadImage(`${ESRI_TILE}/${Z}/${r}/${c}`).then(im => ({ im, r, c })));
      }
      const tiles = await Promise.all(jobs);
      const merc = document.createElement("canvas"); merc.width = merc.height = N * 256;
      const mctx = merc.getContext("2d");
      tiles.forEach(t => mctx.drawImage(t.im, t.c * 256, t.r * 256, 256, 256));

      return toTexture(x => {
        if (baseImg) x.drawImage(baseImg, 0, 0, TEX_W, TEX_H);
        // Reproject Web Mercator (EPSG:3857) strip-by-strip to Equirectangular (EPSG:4326)
        const maxLat = 84;
        for (let py = 0; py < TEX_H; py++) {
          const lat = 90 - ((py + 0.5) / TEX_H) * 180;
          if (Math.abs(lat) > maxLat) continue;
          const rad = lat * D2R;
          const vMerc = (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) * 0.5;
          const sy = Math.max(0, Math.min(merc.height - 1, vMerc * merc.height));
          x.drawImage(merc, 0, sy, merc.width, 1, 0, py, TEX_W, 1);
        }
      });
    } catch (_) {
      return toTexture(x => x.drawImage(baseImg, 0, 0, TEX_W, TEX_H));
    }
  }

  async function fetchTexture(body) {
    try {
      if (body === "earth") return await fetchEarthTexture();
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

  function radius() { return Math.min(g.canvas.width, g.canvas.height) * 0.41 * g.scale; }

  // Orthographic projection centred on (lon0, lat0)
  function project(lat, lon) {
    const R = radius(), cx = g.canvas.width / 2, cy = g.canvas.height / 2;
    const p = lat * D2R, l = (lon - g.lon0) * D2R, p0 = g.lat0 * D2R;
    const x = Math.cos(p) * Math.sin(l);
    const y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l);
    const z = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
    return { x: cx + x * R, y: cy - y * R, z: z, visible: z > 0.02 };
  }

  function drawSphere() {
    const ctx = g.ctx, W = g.canvas.width, H = g.canvas.height, cx = W / 2, cy = H / 2, R = radius();
    ctx.clearRect(0, 0, W, H);

    // Subtle deep-space background stars outside the sphere
    g.stars.forEach(s => {
      const sx = s.u * W, sy = s.v * H;
      const dx = sx - cx, dy = sy - cy;
      if (dx * dx + dy * dy < R * R * 1.04) return;
      ctx.fillStyle = `rgba(220,235,255,${s.a.toFixed(2)})`;
      ctx.beginPath(); ctx.arc(sx, sy, s.r, 0, Math.PI * 2); ctx.fill();
    });

    // Outer Google-Earth-style atmospheric halo
    const glow = GLOW[g.body];
    const halo = ctx.createRadialGradient(cx, cy, R * 0.94, cx, cy, R * 1.22);
    halo.addColorStop(0, `rgba(${glow},0.42)`);
    halo.addColorStop(0.45, `rgba(${glow},0.16)`);
    halo.addColorStop(1, `rgba(${glow},0)`);
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2); ctx.fill();

    const tex = g.textures[g.body];
    if (!tex) {
      // Texture still loading (or failed): bright shaded sphere with graticule
      const grad = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.25, R * 0.1, cx, cy, R);
      grad.addColorStop(0, "#3b5d80"); grad.addColorStop(1, "#14273d");
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) { ctx.beginPath(); let first = true;
        for (let lon = -180; lon <= 180; lon += 6) { const p = project(lat, lon); if (!p.visible) { first = true; continue; } first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); first = false; } ctx.stroke(); }
      for (let lon = -180; lon < 180; lon += 30) { ctx.beginPath(); let first = true;
        for (let lat = -88; lat <= 88; lat += 4) { const p = project(lat, lon); if (!p.visible) { first = true; continue; } first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); first = false; } ctx.stroke(); }
      ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = "12px Inter, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(g.status[g.body] === "failed" ? "Imagery unavailable (network)" : "Loading high-res planetary imagery...", cx, cy + R + 28);
      return;
    }

    // Per-pixel inverse orthographic sampling with 100% UNIFORM LIGHTING (no day/night shadow)
    const moving = !!(g.drag || g.anim || Math.abs(g.vx) > 0.02 || Math.abs(g.vy) > 0.02);
    const maxB = moving ? 620 : 840;
    const B = Math.max(300, Math.min(maxB, Math.round(R * 2)));
    if (!g.buf || g.buf.width !== B) {
      g.buf = document.createElement("canvas"); g.buf.width = g.buf.height = B;
      g.bufCtx = g.buf.getContext("2d");
    }
    const img = g.bufCtx.createImageData(B, B), out = img.data, src = tex.data;
    const p0 = g.lat0 * D2R, sinP0 = Math.sin(p0), cosP0 = Math.cos(p0), half = B / 2;
    const boost = g.body === "earth" ? 1.12 : 1.06; // subtle crisp brightness boost

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
        // 100% uniform illumination across the entire sphere with gentle 3D depth at the outer limb
        const shade = (0.91 + 0.09 * z) * boost;
        out[oi]     = Math.min(255, src[si]     * shade);
        out[oi + 1] = Math.min(255, src[si + 1] * shade);
        out[oi + 2] = Math.min(255, src[si + 2] * shade);
        out[oi + 3] = 255;
      }
    }
    g.bufCtx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(g.buf, cx - R, cy - R, R * 2, R * 2);

    // Subtle inner atmospheric fresnel rim (Google Earth feel)
    const innerRim = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R);
    innerRim.addColorStop(0, `rgba(${glow},0)`);
    innerRim.addColorStop(0.75, `rgba(${glow},0.06)`);
    innerRim.addColorStop(1, `rgba(${glow},0.32)`);
    ctx.fillStyle = innerRim; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    // Crisp outer rim stroke
    ctx.strokeStyle = `rgba(${glow},0.55)`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
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
        g.lon0 = norm(g.anim.lon0 + g.anim.dLon * e);
        g.lat0 = g.anim.lat0 + g.anim.dLat * e;
        if (g.anim.s0 != null && g.anim.dS != null) {
          g.scale = g.anim.s0 + g.anim.dS * e;
          if (g.onZoom) g.onZoom(g.scale);
        }
        if (t >= 1) g.anim = null;
        g.dirty = true;
      } else if (!g.drag && (Math.abs(g.vx) > 0.008 || Math.abs(g.vy) > 0.008)) {
        // Smooth inertia rotation after drag release
        g.lon0 = norm(g.lon0 - g.vx);
        g.lat0 = clamp(g.lat0 + g.vy, -85, 85);
        g.vx *= 0.92;
        g.vy *= 0.92;
        if (Math.abs(g.vx) <= 0.008 && Math.abs(g.vy) <= 0.008) { g.vx = 0; g.vy = 0; }
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
      canvas.addEventListener("pointerdown", e => {
        g.drag = { x: e.clientX, y: e.clientY };
        g.vx = 0; g.vy = 0; g.anim = null;
        canvas.classList.add("cursor-grabbing");
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener("pointermove", e => {
        if (!g.drag) return;
        const k = 0.28 / g.scale, dx = e.clientX - g.drag.x, dy = e.clientY - g.drag.y;
        g.drag = { x: e.clientX, y: e.clientY };
        g.vx = dx * k * 0.75;
        g.vy = dy * k * 0.75;
        g.lon0 = norm(g.lon0 - dx * k);
        g.lat0 = clamp(g.lat0 + dy * k, -85, 85);
        g.dirty = true;
      });
      const end = () => {
        if (g.drag) { g.drag = null; g.dirty = true; canvas.classList.remove("cursor-grabbing"); }
      };
      canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
      canvas.addEventListener("wheel", e => { e.preventDefault(); api.zoom(e.deltaY < 0 ? 0.15 : -0.15); }, { passive: false });
      api.resize(); requestAnimationFrame(frame);
    },
    resize() {
      if (!g.canvas) return;
      g.canvas.width = window.innerWidth; g.canvas.height = window.innerHeight;
      g.dirty = true;
    },
    setActive(on) { g.active = on; g.dirty = true; if (on) ensureTexture(g.body); g.pinsEl.style.display = on ? "block" : "none"; },
    setBody(body) { if (g.body !== body) { g.body = body; g.dirty = true; } ensureTexture(body); },
    setTerminator() { g.terminator = false; g.dirty = true; }, // uniform lighting always enabled
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
      g.vx = 0; g.vy = 0;
      const dLon = norm(lon - g.lon0);
      const s0 = g.scale, s1 = scale != null ? clamp(scale, 0.65, 3) : g.scale;
      g.anim = { t0: performance.now(), dur: 1050, lon0: g.lon0, lat0: g.lat0, dLon, dLat: clamp(lat, -80, 80) - g.lat0, s0, dS: s1 - s0 };
      g.dirty = true;
    },
    resetView() {
      api.flyTo(18, -25, 1.0);
    },
    zoom(delta) {
      g.scale = clamp(g.scale + delta, 0.65, 3); g.dirty = true;
      if (g.onZoom) g.onZoom(g.scale);
    },
    get scale() { return g.scale; },
    project
  };
  return api;
})();
