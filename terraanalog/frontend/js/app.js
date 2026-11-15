/* =========================================================================
 * TerraAnalog - Application controller
 * Maps (Leaflet Earth + Leaflet planetary + 3D globe), reactive scoring,
 * layers, hazards, rover simulation and state-driven mission checklist.
 * ========================================================================= */
const appState = {
  sites: TA.sites.map(s => Object.assign({}, s)),
  selectedId: null, cardClosed: false,
  body: "moon", target: "shackleton",
  basemap: "satellite",            // satellite | topo | planet
  projection: "2d",                // 2d | 3d
  layers: { markers: true, hazards: true, slope: false, dem: false, sun: true },
  mineralFilter: null,
  evals: {},
  mission: { targetChosen: false, hazardReviewed: {}, simVerified: {}, lastSim: {} },
  leftOpen: true, rightOpen: true, nextId: 1000
};

let earthMap = null, planetMap = null, earthTiles = {}, planetTiles = {}, planetShownBody = null;
let markerGroup = null, hazardGroup = null, slopeGroup = null, demLayer = null, planetMarkerGroup = null;
let sim = null, refreshQueued = false, toastTimer = null;

const COLORS = { viable: "#30D158", caution: "#FFD60A", hazard: "#FF453A" };
const WRAPS = [-360, 0, 360];
const $ = id => document.getElementById(id);

/* ---------------------------------------------------------------- helpers */
function invalidateEvals() { appState.evals = {}; }
function E(site) { return appState.evals[site.id] || (appState.evals[site.id] = TA.engine.evaluate(site, appState.target)); }
function selectedSite() { return appState.sites.find(s => s.id === appState.selectedId) || null; }
function bodyName(b) { return b === "moon" ? "Moon" : "Mars"; }
function esc(t) { return String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function showToast(msg) {
  const t = $("terraToast"); $("terraToastMsg").textContent = msg;
  t.classList.remove("opacity-0", "-translate-y-4");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add("opacity-0", "-translate-y-4"), 2600);
}
function scheduleRefresh() { if (refreshQueued) return; refreshQueued = true; requestAnimationFrame(() => { refreshQueued = false; refresh(); }); }
function statusClass(status) { return status === "viable" ? "text-terraGreen" : status === "caution" ? "text-[#FFD60A]" : "text-terraRed"; }
function visibleSites() {
  const q = $("searchInput").value.toLowerCase().trim(), mf = appState.mineralFilter;
  return appState.sites.filter(s => {
    if (mf && !s.minerals.some(m => mf.keywords.some(k => m.toLowerCase().includes(k)))) return false;
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.country.toLowerCase().includes(q) || s.envLabel.toLowerCase().includes(q) || s.minerals.some(m => m.toLowerCase().includes(q));
  });
}
function rankedSites() {
  return visibleSites().sort((a, b) => {
    const ea = E(a), eb = E(b);
    if (ea.passed !== eb.passed) return ea.passed ? -1 : 1;
    return eb.score - ea.score;
  });
}

/* ------------------------------------------------------------------ maps */
function initEarthMap() {
  earthMap = L.map("leafletMap", { center: [20, 0], zoom: 2, minZoom: 2, maxZoom: 18, zoomControl: false, worldCopyJump: true, attributionControl: true });
  earthTiles.satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics" });
  earthTiles.topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { maxZoom: 17, attribution: "Map &copy; OpenTopoMap (CC-BY-SA), SRTM, OSM contributors" });
  demLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, maxNativeZoom: 14, opacity: 0.55, attribution: "Hillshade &copy; Esri" });
  slopeGroup = L.layerGroup().addTo(earthMap);
  hazardGroup = L.layerGroup().addTo(earthMap);
  markerGroup = L.layerGroup().addTo(earthMap);
  earthMap.on("zoomend", updateZoomBadge);
}

function ensurePlanetMap() {
  if (planetMap) return;
  planetMap = L.map("planetMap", { crs: L.CRS.EPSG4326, center: [0, 0], zoom: 2, minZoom: 1, maxZoom: 11, zoomControl: false, worldCopyJump: true, attributionControl: true });
  // NASA Trek WMTS (geographic grid): matrix level = Leaflet zoom - 1
  const trek = (path, nativeMax, attr) => L.tileLayer(`https://trek.nasa.gov/tiles/${path}/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`, { zoomOffset: -1, minZoom: 1, maxNativeZoom: nativeMax, maxZoom: 11, attribution: attr });
  planetTiles.moon = trek("Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02", 9, "Imagery: NASA / LRO WAC / ASU via NASA Trek");
  planetTiles.mars = trek("Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m", 8, "Imagery: NASA / USGS Viking MDIM 2.1 via NASA Trek");
  planetMarkerGroup = L.layerGroup().addTo(planetMap);
  planetMap.on("zoomend", updateZoomBadge);
}

// Single place that decides which surface (Earth map / planetary map / 3D globe) is visible
function applyView() {
  const is3d = appState.projection === "3d", planet = appState.basemap === "planet";
  $("leafletMap").classList.toggle("hidden", is3d || planet);
  $("planetMap").classList.toggle("hidden", is3d || !planet);
  $("satelliteCanvas").classList.toggle("hidden", !is3d);

  if (!is3d && !planet) {
    Object.keys(earthTiles).forEach(k => { const on = k === appState.basemap; if (on && !earthMap.hasLayer(earthTiles[k])) earthTiles[k].addTo(earthMap); if (!on && earthMap.hasLayer(earthTiles[k])) earthMap.removeLayer(earthTiles[k]); });
    earthMap.invalidateSize();
  }
  if (!is3d && planet) {
    ensurePlanetMap(); planetMap.invalidateSize();
    ["moon", "mars"].forEach(b => { if (b !== appState.body && planetMap.hasLayer(planetTiles[b])) planetMap.removeLayer(planetTiles[b]); });
    if (!planetMap.hasLayer(planetTiles[appState.body])) planetTiles[appState.body].addTo(planetMap);
    if (planetShownBody !== appState.body) {
      const t = TA.targets[appState.target]; planetMap.setView([t.lat, t.lon], Math.min(t.zoom, 4)); planetShownBody = appState.body;
    }
  }
  if (is3d) {
    TA.globe.resize(); TA.globe.setBody(planet ? appState.body : "earth"); TA.globe.setTerminator(appState.layers.sun); TA.globe.setActive(true);
  } else { TA.globe.setActive(false); }
  syncToolbar(); applyLayers(); refresh(); updateZoomBadge();
}

function syncToolbar() {
  const set = (id, on, mode) => { const el = $(id); if (!el) return; const base = "touch-target min-h-[32px] px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition "; el.className = mode === "tab" ? "touch-target min-h-[30px] rounded-lg font-semibold transition " + (on ? "tab-on" : "tab-off") : base + (on ? "seg-on" : "seg-off"); };
  set("btnBaseSat", appState.basemap === "satellite"); set("btnBaseTopo", appState.basemap === "topo"); set("btnBasePlanet", appState.basemap === "planet");
  set("btnProj2D", appState.projection === "2d"); set("btnProj3D", appState.projection === "3d");
  set("lyrSat", appState.basemap === "satellite", "tab"); set("lyrTopo", appState.basemap === "topo", "tab"); set("lyrPlanet", appState.basemap === "planet", "tab");
  $("btnBasePlanet").textContent = `${bodyName(appState.body)} Surface`;
  $("lyrPlanet").textContent = bodyName(appState.body);
  const moon = appState.body === "moon";
  $("btnBodyMoon").className = "touch-target min-h-[32px] px-3 rounded-lg text-xs font-semibold transition " + (moon ? "seg-on" : "seg-off");
  $("btnBodyMars").className = "touch-target min-h-[32px] px-3 rounded-lg text-xs font-semibold transition " + (!moon ? "seg-on" : "seg-off");
}

function setBasemap(b) { appState.basemap = b; applyView(); showToast(b === "planet" ? `${bodyName(appState.body)} imagery: NASA Trek` : b === "topo" ? "Topographic basemap (OpenTopoMap)" : "Satellite basemap (Esri World Imagery)"); }
function setProjection(p) { appState.projection = p; applyView(); showToast(p === "3d" ? "3D globe with real planetary imagery" : "2D map view"); }

function updateZoomBadge() {
  let txt = "Z 2";
  if (appState.projection === "3d") txt = `${Math.round(TA.globe.scale * 100)}%`;
  else if (appState.basemap === "planet" && planetMap) txt = `Z ${planetMap.getZoom()}`;
  else if (earthMap) txt = `Z ${earthMap.getZoom()}`;
  $("zoomBadge").textContent = txt;
}
function zoomMap(d) {
  if (appState.projection === "3d") { TA.globe.zoom(d * 0.25); updateZoomBadge(); return; }
  const m = appState.basemap === "planet" ? planetMap : earthMap; if (!m) return;
  d > 0 ? m.zoomIn() : m.zoomOut();
}

/* --------------------------------------------------------------- markers */
function pinHtml(color, label, selected, extra) {
  const size = selected ? 36 : 28;
  return { size, html: `<div class="pin-wrap ${selected ? "pin-selected" : ""} ${extra || ""}" style="width:${size}px;height:${size}px"><span class="pin-ring" style="background:${color}"></span><span class="pin-core" style="background:${color}">${label}</span></div>` };
}

function hazardPopup(site, hz) {
  const col = hz.severity === "high" ? "#FF453A" : "#FF9F0A";
  return `<div style="min-width:220px;max-width:260px"><div class="hz-title" style="color:${col}">${esc(hz.title)}</div>
    <div style="font-size:11px;color:#fff;margin-top:2px;font-weight:600">${esc(site.name)}</div>
    <div style="font-size:11px;color:rgba(255,255,255,.75);margin-top:4px;line-height:1.4">${esc(hz.text)}</div>
    <div class="hz-note">Severity: ${hz.severity === "high" ? "critical" : "moderate"}. Indicative footprint derived from site attributes (not an official boundary).</div></div>`;
}

function renderEarthLayers() {
  markerGroup.clearLayers(); hazardGroup.clearLayers(); slopeGroup.clearLayers();
  const sites = visibleSites(), L_ = appState.layers;
  sites.forEach(site => {
    const ev = E(site), selected = site.id === appState.selectedId;
    WRAPS.forEach(off => {
      if (L_.slope) {
        const c = site.slope < 8 ? "#30D158" : site.slope < 15 ? "#FF9F0A" : "#FF453A";
        [150000, 95000, 50000].forEach(r => L.circle([site.lat, site.lon + off], { radius: r, stroke: false, fillColor: c, fillOpacity: 0.11, interactive: false }).addTo(slopeGroup));
      }
      if (L_.hazards) {
        ev.hazards.forEach(hz => {
          const pts = TA.engine.polygon(site, hz).map(p => [p[0], p[1] + off]);
          const col = hz.severity === "high" ? "#FF453A" : "#FF9F0A";
          const poly = L.polygon(pts, { color: col, weight: 1.5, fillColor: col, fillOpacity: 0.24 }).bindPopup(hazardPopup(site, hz));
          poly.on("popupopen", () => { appState.mission.hazardReviewed[site.id] = true; updateMission(); });
          poly.addTo(hazardGroup);
        });
      }
      if (L_.markers) {
        const p = pinHtml(COLORS[ev.status], ev.score + "%", selected);
        const icon = L.divIcon({ html: p.html, className: "analog-pin", iconSize: [p.size, p.size], iconAnchor: [p.size / 2, p.size / 2] });
        const m = L.marker([site.lat, site.lon + off], { icon, zIndexOffset: selected ? 1000 : 0, title: `${site.name} - ${ev.score}%` });
        const popHtml = `<div style="min-width:210px"><div style="font-size:10px;font-weight:700;color:#5AA9FF;text-transform:uppercase">${esc(site.envLabel)} &bull; ${esc(site.country)}</div>
          <div style="font-size:13px;font-weight:700;color:#fff;margin-top:2px">${esc(site.name)}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.75);margin:4px 0">Similarity: <b style="color:${COLORS[ev.status]}">${ev.score}%</b> &bull; Slope ${site.slope.toFixed(1)}&deg; &bull; Traction ${ev.traction.toFixed(2)}</div>
          <button onclick="openSimulationModal()" style="width:100%;margin-top:4px;padding:5px 8px;border-radius:8px;background:#0A84FF;color:#fff;font-size:11px;font-weight:600;border:none;cursor:pointer">Open Dossier 3D</button></div>`;
        m.bindPopup(popHtml);
        m.on("click", () => selectSite(site.id, { fly: false }));
        if (off === 0) site._primaryMarker = m;
        m.addTo(markerGroup);
      }
    });
  });
}

function bestAnalogFor(key) {
  let best = null, bestScore = -1;
  appState.sites.forEach(s => { const e = TA.engine.evaluate(s, key); if (e.score > bestScore) { bestScore = e.score; best = s; } });
  return { site: best, score: bestScore };
}

function renderPlanetLayers() {
  if (!planetMarkerGroup) return;
  planetMarkerGroup.clearLayers();
  Object.keys(TA.targets).filter(k => TA.targets[k].body === appState.body).forEach(k => {
    const t = TA.targets[k], sel = k === appState.target, best = bestAnalogFor(k);
    const p = pinHtml("#0A84FF", best.score + "%", sel, "target-pin");
    WRAPS.forEach(off => {
      const m = L.marker([t.lat, t.lon + off], { icon: L.divIcon({ html: p.html, className: "analog-pin", iconSize: [p.size, p.size], iconAnchor: [p.size / 2, p.size / 2] }), zIndexOffset: sel ? 1000 : 0 });
      m.bindTooltip(`<b>${esc(t.name)}</b><br>Best Earth analog: ${esc(best.site.name)} (${best.score}%)`, { direction: "right", offset: [14, 0], className: "target-tip" });
      m.on("click", () => selectTarget(k, true));
      m.addTo(planetMarkerGroup);
    });
  });
}

function renderGlobeLayers() {
  const planet = appState.basemap === "planet", pins = [], polys = [];
  if (planet) {
    Object.keys(TA.targets).filter(k => TA.targets[k].body === appState.body).forEach(k => {
      const t = TA.targets[k], best = bestAnalogFor(k);
      pins.push({ id: "t:" + k, lat: t.lat, lon: t.lon, color: "#0A84FF", label: best.score + "%", selected: k === appState.target, title: `${t.name} - best Earth analog ${best.site.name} (${best.score}%)` });
    });
  } else {
    visibleSites().forEach(site => {
      const ev = E(site);
      if (appState.layers.markers) pins.push({ id: "s:" + site.id, lat: site.lat, lon: site.lon, color: COLORS[ev.status], label: ev.score + "%", selected: site.id === appState.selectedId, title: `${site.name} - ${ev.score}%` });
      if (appState.layers.slope) {
        const sc = site.slope < 8 ? "48,209,88" : site.slope < 15 ? "255,159,10" : "255,69,58";
        polys.push({ pts: TA.engine.polygon(site, { kind: "slope_heat", radiusKm: 130, offset: [0, 0] }), fill: `rgba(${sc},0.22)`, stroke: `rgba(${sc},0.45)` });
      }
      if (appState.layers.hazards) ev.hazards.forEach(hz => {
        const high = hz.severity === "high";
        polys.push({ pts: TA.engine.polygon(site, hz), fill: high ? "rgba(255,69,58,0.30)" : "rgba(255,159,10,0.30)", stroke: high ? "#FF453A" : "#FF9F0A" });
      });
    });
  }
  TA.globe.setPins(pins); TA.globe.setPolys(polys);
}

function applyLayers() {
  if (!earthMap) return;
  if (appState.layers.dem && appState.basemap !== "planet") { if (!earthMap.hasLayer(demLayer)) demLayer.addTo(earthMap); } else if (earthMap.hasLayer(demLayer)) earthMap.removeLayer(demLayer);
  TA.globe.setTerminator(appState.layers.sun);
}
function onLayerToggle() {
  const L_ = appState.layers;
  L_.markers = $("lyr_markers").checked; L_.hazards = $("lyr_hazards").checked; L_.slope = $("lyr_slope").checked; L_.dem = $("lyr_dem").checked; L_.sun = $("lyr_sun").checked;
  if (L_.dem && appState.basemap === "planet") showToast("Elevation shading applies to the Earth map");
  applyLayers(); scheduleRefresh();
}

/* ------------------------------------------------------------- selection */
function nearestLon(map, lon) { const c = map.getCenter().lng; return lon + 360 * Math.round((c - lon) / 360); }

function selectSite(id, opts) {
  const site = appState.sites.find(s => s.id === id); if (!site) return;
  appState.selectedId = id; appState.cardClosed = false;
  if (opts && opts.fly) {
    focusOnSite(site);
    if (appState.projection === "2d" && appState.basemap !== "planet" && site._primaryMarker) {
      setTimeout(() => { if (site._primaryMarker) site._primaryMarker.openPopup(); }, 450);
    }
  }
  refresh();
}
function focusOnSite(site) {
  if (appState.basemap === "planet") { appState.basemap = "satellite"; applyView(); showToast("Switched to Earth imagery to show the analog site"); }
  if (appState.projection === "3d") TA.globe.flyTo(site.lat, site.lon, Math.max(TA.globe.scale, 1.4));
  else { earthMap.invalidateSize(); earthMap.flyTo([site.lat, nearestLon(earthMap, site.lon)], Math.max(earthMap.getZoom(), 6), { duration: 1.3 }); }
}
function onPinClick(pid) {
  if (pid.startsWith("t:")) selectTarget(pid.slice(2), true);
  else selectSite(parseInt(pid.slice(2), 10), { fly: true });
}

function buildTargetSelect() {
  const sel = $("targetSelect");
  sel.innerHTML = Object.keys(TA.targets).filter(k => TA.targets[k].body === appState.body)
    .map(k => `<option value="${k}" class="bg-[#1C1C1E] text-white">${esc(TA.targets[k].label)}</option>`).join("");
  sel.value = appState.target;
}
function setCelestialBody(body) {
  const first = Object.keys(TA.targets).find(k => TA.targets[k].body === body);
  appState.body = body; selectTarget(first, true);
}
function onTargetSelect(key) { selectTarget(key, true); }
function selectTarget(key, user) {
  const t = TA.targets[key]; if (!t) return;
  appState.target = key; appState.body = t.body; invalidateEvals();
  if (user) appState.mission.targetChosen = true;
  appState.basemap = "planet"; buildTargetSelect(); planetShownBody = planetShownBody === t.body ? planetShownBody : null;
  applyView();
  // fly to and highlight the target
  if (appState.projection === "3d") TA.globe.flyTo(t.lat, t.lon, 1.6);
  else { planetMap.invalidateSize(); planetMap.flyTo([t.lat, nearestLon(planetMap, t.lon)], t.zoom, { duration: 1.4 }); }
  showToast(`Target: ${t.name}`);
}

/* ------------------------------------------------------------ list & card */
function renderResults() {
  const list = $("resultsList"), empty = $("emptyState"), ranked = rankedSites();
  $("resultsCount").textContent = `${ranked.length} sites`; $("resultsCountBadge").textContent = ranked.length;
  const t = TA.targets[appState.target];
  $("targetBaselineLabel").textContent = `Baseline: ${t.name} (${bodyName(t.body)})`;
  if (!ranked.length) { list.innerHTML = ""; empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");
  list.innerHTML = ranked.map((site, i) => {
    const ev = E(site), sel = site.id === appState.selectedId;
    const cardClass = sel ? "terra-card-selected" : (!ev.passed ? "terra-card terra-card-discarded" : "terra-card");
    const col = statusClass(ev.status);
    let pill;
    if (ev.status === "viable") pill = `<div class="px-2 py-1 rounded-lg bg-terraGreen/15 border border-terraGreen/30 text-terraGreen text-[10px] font-medium">High viability - passes all active filters</div>`;
    else if (ev.status === "hazard") pill = `<div class="px-2 py-1 rounded-lg bg-terraRed/15 border border-terraRed/30 text-terraRed text-[10px] font-medium leading-tight"><strong>${esc(site.alertLabel)}:</strong> ${esc(ev.hazards.length ? ev.hazards[0].title : "protected area")}${ev.reasons.length ? " | " + esc(ev.reasons[0]) : ""}</div>`;
    else pill = `<div class="px-2 py-1 rounded-lg bg-[#FFD60A]/15 border border-[#FFD60A]/30 text-[#FFD60A] text-[10px] font-medium leading-tight"><strong>Caution:</strong> ${esc(ev.reasons[0] || (site.alertType === "medium" ? "managed reserve - " + site.alertLabel : "similarity below 75%"))}</div>`;
    return `<div onclick="selectSite(${site.id}, {fly:true})" class="p-3.5 rounded-2xl cursor-pointer border transition ${cardClass}">
      <div class="flex items-start justify-between gap-2 mb-1.5">
        <div class="min-w-0"><span class="text-[9px] font-bold tracking-wider uppercase text-terraCyan">#${i + 1} &bull; ${esc(site.envLabel)}</span>
          <h3 class="text-sm font-semibold text-white leading-tight mt-0.5">${esc(site.name)}</h3>
          <p class="text-[11px] text-white/50">${esc(site.country)} &bull; Elevation ${site.elevation} m</p></div>
        <div class="text-right flex-shrink-0"><span class="text-lg font-black chip ${col} block">${ev.score}%</span><span class="text-[9px] font-medium text-white/40 block">Similarity</span></div>
      </div>
      <div class="my-2">${pill}</div>
      <div class="grid grid-cols-5 gap-1 text-[10px] bg-white/[0.03] p-1.5 rounded-xl text-center mb-2">
        <div><span class="text-white/40 block">NDVI</span><strong class="chip">${site.ndvi.toFixed(2)}</strong></div>
        <div><span class="text-white/40 block">Slope</span><strong class="chip">${site.slope.toFixed(1)}&deg;</strong></div>
        <div><span class="text-white/40 block">Rough.</span><strong class="chip">${site.roughness.toFixed(2)}</strong></div>
        <div><span class="text-white/40 block">Humid.</span><strong class="chip">${site.relativeHumidity.toFixed(0)}%</strong></div>
        <div><span class="text-white/40 block">Traction</span><strong class="chip">${ev.traction.toFixed(2)}</strong></div>
      </div>
      <p class="text-[11px] text-white/70 line-clamp-2 leading-relaxed mb-2">${esc(site.desc)}</p>
      <div class="flex items-center justify-between text-xs pt-1 border-t border-white/5">
        <button onclick="event.stopPropagation(); selectSite(${site.id}, {fly:true}); openSimulationModal();" class="text-terraCyan hover:underline text-[11px] font-semibold">Open dossier &rsaquo;</button>
        <span class="text-[10px] text-white/40">${ev.hazards.length} mapped hazard${ev.hazards.length === 1 ? "" : "s"}</span>
      </div></div>`;
  }).join("");
}

function renderSelCard() {
  const site = selectedSite(), card = $("selCard");
  if (!site || appState.cardClosed) { card.classList.add("hidden"); return; }
  const ev = E(site), rank = rankedSites().findIndex(s => s.id === site.id) + 1;
  card.classList.remove("hidden");
  $("selRank").textContent = `ANALOG #${rank || "-"} - ${site.envLabel}`;
  $("selTitle").textContent = site.name; $("selMeta").textContent = `${site.country} - ${site.elevation} m`;
  const sc = $("selScore"); sc.textContent = ev.score + "%"; sc.className = `text-sm font-bold chip ${statusClass(ev.status)}`;
  $("selSlope").textContent = `${site.slope.toFixed(1)}\u00B0 / ${site.roughness.toFixed(2)}`; $("selTrac").textContent = ev.traction.toFixed(2);
  const st = $("selStatus"), map = {
    viable: ["bg-terraGreen/15 text-terraGreen border-terraGreen/30", "High analog viability"],
    caution: ["bg-[#FFD60A]/15 text-[#FFD60A] border-[#FFD60A]/30", ev.reasons[0] ? "Caution: " + ev.reasons[0] : "Caution / moderate risk"],
    hazard: ["bg-terraRed/15 text-terraRed border-terraRed/30", `Protected area / high hazard: ${site.alertLabel}`]
  };
  st.className = `mb-2.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border ${map[ev.status][0]}`; st.textContent = map[ev.status][1];
}
function closeSelCard() { appState.cardClosed = true; $("selCard").classList.add("hidden"); }

/* ------------------------------------------------- filters, funnel, weights */
const WEIGHT_LABELS = { slope: "Slope", roughness: "Roughness", thermal: "Thermal swing", elevation: "Elevation", traction: "Traction", humidity: "Humidity" };

function buildWeights() {
  $("weightsBox").innerHTML = Object.keys(WEIGHT_LABELS).map(k => `
    <div><div class="flex justify-between text-[11px] mb-1"><span class="text-white/70">${WEIGHT_LABELS[k]}</span><span id="wv_${k}" class="chip text-terraCyan">-</span></div>
    <input id="w_${k}" type="range" min="0" max="100" value="${TA.state.weights[k]}" oninput="onWeightChange()" class="terra-slider"></div>`).join("");
  updateWeightLabels();
}
function updateWeightLabels() {
  const w = TA.state.weights, sum = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  Object.keys(w).forEach(k => { const el = $("wv_" + k); if (el) el.textContent = `${Math.round(w[k] / sum * 100)}%`; });
}
function onWeightChange() {
  Object.keys(WEIGHT_LABELS).forEach(k => { TA.state.weights[k] = parseFloat($("w_" + k).value); });
  updateWeightLabels(); invalidateEvals(); scheduleRefresh();
}
function resetWeights() {
  Object.assign(TA.state.weights, TA.defaults().weights);
  Object.keys(WEIGHT_LABELS).forEach(k => { $("w_" + k).value = TA.state.weights[k]; });
  updateWeightLabels(); invalidateEvals(); refresh(); showToast("Scoring weights reset");
}

function readFilterControls() {
  const th = TA.state.thresholds;
  th.maxNdvi = parseFloat($("f_ndvi").value); th.excludeWater = $("f_water").checked; th.lithologyType = $("f_lith").value;
  th.maxSlope = parseFloat($("f_slope").value); th.minRoughness = parseFloat($("f_rough").value); th.minThermalAmp = parseFloat($("f_therm").value);
  th.maxHumidity = parseFloat($("f_hum").value); th.maxElevation = parseFloat($("f_elev").value); th.minTraction = parseFloat($("f_trac").value);
  th.checkEthics = $("f_ethics").checked;
}
function writeFilterControls() {
  const th = TA.state.thresholds;
  $("f_ndvi").value = th.maxNdvi; $("f_water").checked = th.excludeWater; $("f_lith").value = th.lithologyType; $("f_slope").value = th.maxSlope;
  $("f_rough").value = th.minRoughness; $("f_therm").value = th.minThermalAmp; $("f_hum").value = th.maxHumidity; $("f_elev").value = th.maxElevation;
  $("f_trac").value = th.minTraction; $("f_ethics").checked = th.checkEthics; updateFilterLabels();
}
function updateFilterLabels() {
  const th = TA.state.thresholds;
  $("v_ndvi").innerHTML = `&le; ${th.maxNdvi.toFixed(2)}`; $("v_slope").innerHTML = `&le; ${th.maxSlope.toFixed(0)}&deg;`; $("v_rough").innerHTML = `&ge; ${th.minRoughness.toFixed(2)}`;
  $("v_therm").innerHTML = `&ge; ${th.minThermalAmp.toFixed(0)}&deg;C`; $("v_hum").innerHTML = `&le; ${th.maxHumidity.toFixed(0)}%`;
  $("v_elev").innerHTML = `&le; ${th.maxElevation.toFixed(0)} m`; $("v_trac").innerHTML = `&ge; ${th.minTraction.toFixed(2)}`;
}
function onFilterChange() { readFilterControls(); updateFilterLabels(); invalidateEvals(); scheduleRefresh(); }
function applyNasaPreset() {
  const d = TA.defaults().thresholds, th = TA.state.thresholds; Object.assign(th, d, { checkEthics: th.checkEthics });
  writeFilterControls(); invalidateEvals(); refresh(); showToast("NASA fast-discard thresholds applied");
}
function resetAllFilters() {
  Object.assign(TA.state.thresholds, { maxNdvi: 0.5, excludeWater: false, lithologyType: "all", maxSlope: 45, minRoughness: 0.05, minThermalAmp: 5, maxHumidity: 90, maxElevation: 5000, minTraction: 0 });
  $("searchInput").value = ""; appState.mineralFilter = null; updateMineralChip();
  writeFilterControls(); invalidateEvals(); refresh(); showToast("All filters opened");
}
function onSearch() { $("clearSearchBtn").classList.toggle("hidden", !$("searchInput").value); scheduleRefresh(); }
function clearSearch() { $("searchInput").value = ""; onSearch(); }

function renderFunnel() {
  const th = TA.state.thresholds, c = TA.engine.funnel(appState.sites, appState.target), pct = n => Math.round(n / Math.max(1, c.total) * 100);
  const stages = [
    { n: c.s1, name: "Biology & water", crit: `NDVI \u2264 ${th.maxNdvi.toFixed(2)}${th.excludeWater ? " and no surface liquid water" : ""}.` },
    { n: c.s2, name: "Lithology & mineralogy", crit: th.lithologyType === "all" ? "All lithologies accepted." : `Only: ${TA.lithologyLabels[th.lithologyType]}.` },
    { n: c.s3, name: "Topography & mobility", crit: `Slope \u2264 ${th.maxSlope.toFixed(0)}\u00B0, roughness \u2265 ${th.minRoughness.toFixed(2)}, elevation \u2264 ${th.maxElevation} m, traction \u2265 ${th.minTraction.toFixed(2)}.` },
    { n: c.s4, name: "Climate", crit: `Humidity \u2264 ${th.maxHumidity.toFixed(0)}% and thermal swing \u2265 ${th.minThermalAmp.toFixed(0)}\u00B0C.` }
  ];
  $("funnelStages").innerHTML = stages.map((s, i) => `<div class="bg-white/[0.04] rounded-2xl p-3 border border-white/10 space-y-2">
    <div class="flex items-center justify-between"><span class="text-xs font-semibold text-white flex items-center gap-1.5"><span class="w-5 h-5 rounded-full bg-terraBlue/20 text-terraCyan flex items-center justify-center text-[10px] font-bold">${i + 1}</span>${s.name}</span>
    <span class="chip text-xs font-bold text-terraCyan">${s.n} of ${c.total}</span></div>
    <p class="text-[10px] text-white/50 leading-tight">${s.crit}</p>
    <div class="w-full h-1.5 rounded-full bg-white/10 overflow-hidden"><div class="h-full bg-terraBlue rounded-full transition-all duration-300" style="width:${pct(s.n)}%"></div></div></div>`).join("");
  $("funnelFinalCount").textContent = `${c.s4} sites`;
}

function renderSpectral() {
  $("spectralList").innerHTML = TA.spectral.map(sig => {
    const m = TA.engine.spectralMatch(sig, appState.sites, appState.target), active = appState.mineralFilter && appState.mineralFilter.id === sig.id;
    return `<button onclick="applySpectralFilter('${sig.id}')" class="w-full touch-target px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs font-medium text-white transition ${active ? "bg-terraBlue/20 border-terraBlue/60" : "bg-white/5 hover:bg-white/10 border-white/10"}">
      <span class="text-left">${sig.label}<span class="block text-[10px] text-white/45 font-normal">${m.count} matching site${m.count === 1 ? "" : "s"}</span></span>
      <span class="chip text-terraCyan font-semibold">${m.count ? m.best + "% match" : "none"}</span></button>`;
  }).join("");
}
function applySpectralFilter(id) {
  const sig = TA.spectral.find(s => s.id === id);
  appState.mineralFilter = (appState.mineralFilter && appState.mineralFilter.id === id) ? null : sig;
  updateMineralChip(); refresh();
  showToast(appState.mineralFilter ? `Spectral filter: ${sig.label}` : "Spectral filter cleared");
}
function updateMineralChip() {
  const chip = $("mineralChip"); if (!chip) return;
  chip.classList.toggle("hidden", !appState.mineralFilter);
  if (appState.mineralFilter) $("mineralChipText").textContent = appState.mineralFilter.label;
}
function clearMineralFilter() { appState.mineralFilter = null; updateMineralChip(); refresh(); }

function setInspectorTab(tab) {
  ["filters", "funnel", "ai", "layers"].forEach(t => {
    const btn = $("tab" + { filters: "Filters", funnel: "Funnel", ai: "Ai", layers: "Layers" }[t]);
    btn.className = "touch-target min-h-[30px] rounded-lg font-semibold transition " + (t === tab ? "tab-on" : "tab-off");
    $("view" + { filters: "Filters", funnel: "Funnel", ai: "Ai", layers: "Layers" }[t]).classList.toggle("hidden", t !== tab);
  });
}

/* ------------------------------------------------------------- central refresh */
function refresh() {
  if (!earthMap && appState.projection !== "3d") return;
  renderResults(); renderSelCard(); renderFunnel(); renderSpectral();
  if (appState.projection === "2d") {
    if (appState.basemap === "planet") renderPlanetLayers(); else renderEarthLayers();
  } else renderGlobeLayers();
  updateMission(); updateDossierLive();
}

/* --------------------------------------------------------------- dossier & sim */
function openSimulationModal() {
  let site = selectedSite();
  if (!site) {
    const top = rankedSites()[0]; if (!top) { showToast("No analog available with the current filters"); return; }
    selectSite(top.id, { fly: false }); site = top; showToast("Showing the top-ranked analog");
  }
  $("simulationModal").classList.remove("hidden");
  appState.mission.hazardReviewed[site.id] = true;
  fillDossier(site);
  if (!sim) sim = new TA.RoverSim($("simCanvas"), { onTelemetry: simTelemetry, onFinish: simFinished });
  sim.setSite(site, TA.targets[appState.target]); sim.speedMult = parseFloat($("simSpeed").value);
  $("simRunBtn").textContent = "Run traverse"; resetSimBanner(); updateMission();
}
function closeSimulationModal() { if (sim) sim.pause(); $("simulationModal").classList.add("hidden"); updateMission(); }

function benchRow(label, siteVal, tgtVal, ok) {
  return `<div class="flex items-center justify-between gap-2"><span class="flex items-center gap-1.5 text-white/70"><span class="w-1.5 h-1.5 rounded-full" style="background:${ok ? "#30D158" : "#FF453A"}"></span>${label}</span><span class="chip text-white">${siteVal}<span class="text-white/40"> vs ${tgtVal}</span></span></div>`;
}
function fillDossier(site) {
  const ev = E(site), th = TA.state.thresholds, t = TA.targets[appState.target];
  $("simModalTitle").textContent = `Geophysical Dossier - ${site.name}`;
  $("simModalSubtitle").textContent = `Benchmark against ${t.name} (${bodyName(t.body)}) | ${site.country}`;
  const sc = $("ds_score"); sc.textContent = ev.score + "%"; sc.className = `font-bold chip mt-0.5 block ${statusClass(ev.status)}`;
  $("simStatNdvi").textContent = site.ndvi.toFixed(2); $("ds_elev").textContent = `${site.elevation} m`;
  $("simStatSlopeRough").textContent = `${site.slope.toFixed(1)}\u00B0 / ${site.roughness.toFixed(2)}`;
  $("simStatThermal").textContent = `${site.thermalAmplitude.toFixed(0)}\u00B0C`; $("simStatHumidity").textContent = `${site.relativeHumidity.toFixed(0)}%`;
  $("dossierBench").innerHTML =
    benchRow("Slope", `${site.slope.toFixed(1)}\u00B0`, `${t.targetSlope}\u00B0 (max ${th.maxSlope}\u00B0)`, site.slope <= th.maxSlope) +
    benchRow("Roughness", site.roughness.toFixed(2), `${t.targetRough} (min ${th.minRoughness})`, site.roughness >= th.minRoughness) +
    benchRow("Traction index", ev.traction.toFixed(2), `min ${th.minTraction.toFixed(2)}`, ev.traction >= th.minTraction) +
    benchRow("Thermal swing", `${site.thermalAmplitude}\u00B0C`, `min ${th.minThermalAmp}\u00B0C`, site.thermalAmplitude >= th.minThermalAmp) +
    benchRow("Humidity", `${site.relativeHumidity}%`, `max ${th.maxHumidity}%`, site.relativeHumidity <= th.maxHumidity) +
    benchRow("Elevation", `${site.elevation} m`, `max ${th.maxElevation} m`, site.elevation <= th.maxElevation);
  $("dossierHazards").innerHTML = ev.hazards.length ? ev.hazards.map(h => `<div class="p-2 rounded-lg border ${h.severity === "high" ? "bg-terraRed/10 border-terraRed/30" : "bg-terraAmber/10 border-terraAmber/30"}"><strong class="${h.severity === "high" ? "text-terraRed" : "text-terraAmber"}">${esc(h.title)}</strong><span class="text-white/65 block leading-snug mt-0.5">${esc(h.text)}</span></div>`).join("")
    : `<div class="p-2 rounded-lg border bg-terraGreen/10 border-terraGreen/30 text-terraGreen">No mapped hazards for this site.</div>`;
  $("simModalEthical").textContent = site.alertType === "high"
    ? `Active alert (${site.alertLabel}): ${site.protectedName || "protected or biologically sensitive zone"}. Non-invasion protocols and permits are mandatory under SDG 15.`
    : site.alertType === "medium" ? `Managed reserve (${site.alertLabel}): low-impact operations with restricted corridors.`
    : `Low impact (${site.alertLabel}): open terrain without strict reserve restrictions.`;
}
function updateDossierLive() {
  const site = selectedSite(); if (!site || $("simulationModal").classList.contains("hidden")) return;
  fillDossier(site);
}

function simTelemetry(t) {
  $("t_dist").textContent = `${Math.round(t.distance)} m`; $("t_speed").textContent = `${t.speed.toFixed(2)} m/s`; $("t_tilt").textContent = `${t.tilt.toFixed(0)}\u00B0`;
  $("t_slip").textContent = `${Math.min(130, t.slip).toFixed(0)}%`; $("t_batt").textContent = `${t.battery.toFixed(0)}%`;
  $("t_temp").textContent = `${t.temp.toFixed(0)}\u00B0C ${t.night ? "night" : "day"}`; $("t_time").textContent = t.time; $("t_mu").textContent = t.mu.toFixed(2);
}
function resetSimBanner() { const b = $("simResult"); b.className = "text-[11px] font-medium px-3 py-2 rounded-xl border bg-white/5 border-white/10 text-white/60"; b.textContent = "Press \"Run traverse\" to drive the rover across a 600 m course generated from this site's slope, roughness, humidity and thermal data."; }
function simToggleRun() {
  if (!sim) return;
  if (sim.running) { sim.pause(); $("simRunBtn").textContent = "Resume"; return; }
  if (sim.done) { sim.reset(); resetSimBanner(); }
  sim.start(); $("simRunBtn").textContent = "Pause";
}
function simReset() { if (!sim) return; sim.reset(); resetSimBanner(); $("simRunBtn").textContent = "Run traverse"; }
function simSetSpeed(v) { if (sim) sim.setSpeed(parseFloat(v)); }
function simFinished(r) {
  const b = $("simResult"); $("simRunBtn").textContent = "Run again";
  appState.mission.lastSim[r.siteId] = r;
  if (r.ok) {
    appState.mission.simVerified[r.siteId] = true;
    b.className = "text-[11px] font-medium px-3 py-2 rounded-xl border bg-terraGreen/15 border-terraGreen/30 text-terraGreen"; b.textContent = "Traverse verified. " + r.reason;
    showToast("Rover traverse verified for this site");
  } else {
    delete appState.mission.simVerified[r.siteId];
    b.className = "text-[11px] font-medium px-3 py-2 rounded-xl border bg-terraRed/15 border-terraRed/30 text-terraRed"; b.textContent = "Traverse failed. " + r.reason;
    showToast("Rover traverse failed - see Dossier");
  }
  updateMission();
}

/* ---------------------------------------------------------------- mission */
function computeMission() {
  const m = appState.mission, site = selectedSite(), ev = site ? E(site) : null, t = TA.targets[appState.target];
  const steps = [];
  steps.push({ done: m.targetChosen, state: m.targetChosen ? "done" : "todo", detail: m.targetChosen ? `Target: ${t.name} (${bodyName(t.body)})` : "No target chosen yet - pick a Moon or Mars target in the header.", action: ["Choose target", "focusTarget()"] });
  let matchDone = false, matchState = "todo", matchDetail = "Select an analog site from the map or the results list.";
  if (site) {
    matchDone = ev.score > 75 && ev.passed;
    matchState = matchDone ? "done" : "warn";
    matchDetail = matchDone ? `${site.name}: ${ev.score}% and passes all filters.` : ev.score <= 75 ? `${site.name}: ${ev.score}% (needs more than 75%).` : `${site.name}: ${ev.score}% but fails a filter - ${ev.reasons[0]}.`;
  }
  steps.push({ done: matchDone, state: matchState, detail: matchDetail, action: ["View results", "showResults()"] });
  let hzDone = false, hzState = "todo", hzDetail = "Select a site, then open its Dossier or click one of its hazard polygons.";
  if (site) {
    const reviewed = !!m.hazardReviewed[site.id], blocker = ev.hazards.find(h => h.severity === "high");
    if (!reviewed) hzDetail = `Review hazards for ${site.name}: open the Dossier or click a hazard polygon.`;
    else if (blocker) { hzState = "warn"; hzDetail = `Reviewed - blocked by: ${blocker.title}.`; }
    else { hzDone = true; hzState = "done"; hzDetail = `Reviewed - no critical restriction for ${site.name}.`; }
  }
  steps.push({ done: hzDone, state: hzState, detail: hzDetail, action: ["Open dossier", "openSimulationModal()"] });
  const simOk = !!(site && m.simVerified[site.id]), last = site && m.lastSim[site.id];
  steps.push({ done: simOk, state: simOk ? "done" : (last && !last.ok ? "warn" : "todo"), detail: !site ? "Select a site to run the rover simulation." : simOk ? `Traverse completed on ${site.name}.` : last && !last.ok ? `Last run failed: ${last.reason}` : "Run the rover simulation in the Dossier and complete the traverse.", action: ["Open dossier", "openSimulationModal()"] });
  const ready = steps.every(s => s.done);
  steps.push({ done: ready, state: ready ? "done" : "todo", detail: ready ? "All checks passed - dossier can be exported." : "Complete steps 1-4 to unlock the export.", action: null });
  steps.forEach((s, i) => { s.title = TA.missionSteps[i].title; });
  return { steps, ready };
}
function updateMission() {
  const { steps, ready } = computeMission(), n = steps.filter(s => s.done).length;
  $("missionBadge").textContent = `${n}/5`;
  $("missionBadge").className = "chip text-[10px] px-1.5 py-0.5 rounded-full " + (n === 5 ? "bg-terraGreen/25 text-terraGreen" : "bg-white/10 text-white/80");
  $("exportDossierBtn").disabled = !ready;
  if (!$("checklistModal").classList.contains("hidden")) renderChecklist(steps, n);
}
function renderChecklist(steps, n) {
  if (!steps) { const c = computeMission(); steps = c.steps; n = steps.filter(s => s.done).length; }
  $("checklistProgressText").textContent = `${n} of 5 complete`; $("checklistProgressBar").style.width = `${n * 20}%`;
  const icon = s => s.state === "done" ? `<div class="w-6 h-6 rounded-full bg-terraBlue flex items-center justify-center flex-shrink-0"><svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg></div>`
    : s.state === "warn" ? `<div class="w-6 h-6 rounded-full bg-terraAmber/20 border border-terraAmber/50 text-terraAmber flex items-center justify-center flex-shrink-0 text-xs font-bold">!</div>`
    : `<div class="w-6 h-6 rounded-full border border-white/25 flex-shrink-0"></div>`;
  $("checklistItemsContainer").innerHTML = steps.map((s, i) => `<div class="p-3 rounded-2xl border ${s.state === "done" ? "bg-terraBlue/10 border-terraBlue/30" : "bg-white/5 border-white/10"} flex items-start gap-3">
    ${icon(s)}<div class="min-w-0 flex-1"><div class="text-xs font-semibold ${s.done ? "text-white" : "text-white/90"}">${i + 1}. ${s.title}</div>
    <div class="text-[11px] mt-0.5 ${s.state === "warn" ? "text-terraAmber" : "text-white/55"} leading-snug">${esc(s.detail)}</div></div>
    ${s.action && !s.done ? `<button onclick="${s.action[1]}" class="touch-target min-h-[28px] px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] font-semibold text-white flex-shrink-0 transition">${s.action[0]}</button>` : ""}</div>`).join("");
}
function openChecklistModal() { $("checklistModal").classList.remove("hidden"); updateMission(); }
function closeChecklistModal() { $("checklistModal").classList.add("hidden"); }
function focusTarget() { closeChecklistModal(); $("targetSelect").focus(); showToast("Pick a target from the header selector"); }
function showResults() { closeChecklistModal(); if (!appState.rightOpen) toggleRightSidebar(); showToast("Select a site in the results list"); }

function exportDossier() {
  const { ready, steps } = computeMission(), site = selectedSite();
  if (!ready || !site) { showToast("Complete mission steps 1-4 to unlock the export"); openChecklistModal(); return; }
  const ev = E(site), t = TA.targets[appState.target], last = appState.mission.lastSim[site.id];
  const dossier = {
    generator: "TerraAnalog", generatedAt: new Date().toISOString(),
    target: { key: appState.target, name: t.name, body: t.body, lat: t.lat, lon: t.lon },
    analog: Object.assign({}, site), similarityPct: ev.score, passedFilters: ev.passed, status: ev.status, tractionIndex: +ev.traction.toFixed(3),
    hazards: ev.hazards.map(h => ({ title: h.title, severity: h.severity, text: h.text })),
    roverSimulation: last ? { verified: last.ok, distance_m: Math.round(last.distance), battery_pct: +last.battery.toFixed(1), max_tilt_deg: +last.maxTilt.toFixed(1), summary: last.reason } : null,
    thresholds: Object.assign({}, TA.state.thresholds), weights: Object.assign({}, TA.state.weights),
    checklist: steps.map(s => ({ step: s.title, done: s.done, detail: s.detail }))
  };
  downloadFile(JSON.stringify(dossier, null, 2), `terraanalog_dossier_${site.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.json`, "application/json");
  showToast("Dossier exported");
}
function downloadFile(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], { type })), a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function exportGeoJSON() {
  const t = TA.targets[appState.target];
  const gj = { type: "FeatureCollection", metadata: { engine: "TerraAnalog", generatedAt: new Date().toISOString(), target: appState.target, body: t.body, candidateCount: appState.sites.length },
    features: appState.sites.map(s => { const e = E(s); return { type: "Feature", geometry: { type: "Point", coordinates: [s.lon, s.lat, s.elevation] },
      properties: { id: s.id, name: s.name, country: s.country, environment: s.env, slope_mean_deg: s.slope, surface_roughness: s.roughness, ndvi: s.ndvi, liquid_water_present: s.liquidWater, thermal_amplitude_degC: s.thermalAmplitude, relative_humidity_pct: s.relativeHumidity, lithology_type: s.lithology, minerals: s.minerals, similarity_pct: e.score, traction_index: +e.traction.toFixed(3), status: e.status, passed_filters: e.passed, discard_reasons: e.reasons, hazards: e.hazards.map(h => h.title) } }; }) };
  downloadFile(JSON.stringify(gj, null, 2), `terraanalog_${appState.target}_candidates.geojson`, "application/geo+json");
  showToast("GeoJSON exported");
}

/* ------------------------------------------------------------ data sources */
function openDataModal() { $("dataModal").classList.remove("hidden"); renderDataScope(); setDataTab("scope"); updateIngestSummary(); }
function closeDataModal() { $("dataModal").classList.add("hidden"); }
function updateIngestSummary() { $("ingestSummaryStats").textContent = `Active catalog: ${appState.sites.length} analog sites in memory`; }
function renderDataScope() {
  $("dsScopeList").innerHTML = TA.dataSources.map(g => `<div><div class="text-[10px] font-bold uppercase tracking-wider text-terraCyan mb-1.5">${g.group}</div><div class="space-y-1.5">` +
    g.items.map(it => `<div class="bg-white/5 border border-white/10 rounded-xl p-2.5"><div class="flex items-center justify-between gap-2"><span class="font-semibold text-white">${esc(it.name)}</span>
      <span class="chip text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${it.mode === "live" ? "bg-terraGreen/15 text-terraGreen" : "bg-white/10 text-white/70"}">${it.mode === "live" ? "LIVE" : "EMBEDDED"}</span></div>
      <div class="text-[10px] text-white/50 mt-0.5">${esc(it.provider)} &bull; ${esc(it.scope)}</div><div class="text-[11px] text-white/70 mt-0.5">Used for: ${esc(it.use)}</div></div>`).join("") + `</div></div>`).join("");
}
function setDataTab(tab) {
  const map = { scope: "Scope", packs: "Packs", file: "File", paste: "Paste" };
  Object.keys(map).forEach(k => {
    $("dsTab" + map[k]).className = "touch-target min-h-[32px] rounded-lg font-semibold transition " + (k === tab ? "tab-on" : "tab-off");
    $("dsView" + map[k]).classList.toggle("hidden", k !== tab);
  });
  $("dsTemplate").classList.toggle("hidden", tab !== "file" && tab !== "paste");
}
function normalizeSite(r) {
  const num = (v, d) => { const n = parseFloat(v); return isFinite(n) ? n : d; };
  const lat = num(r.lat ?? r.latitude, NaN), lon = num(r.lon ?? r.longitude, NaN);
  if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const minerals = Array.isArray(r.minerals) ? r.minerals : String(r.minerals || "Basalt|Olivine").split("|").map(m => m.trim()).filter(Boolean);
  return { id: appState.nextId++, name: r.name || `Imported site ${appState.nextId}`, country: r.country || "Unknown", env: r.env || "Volcanic", envLabel: r.envLabel || r.envlabel || "Imported analog",
    lat, lon, elevation: num(r.elevation, 1000), slope: num(r.slope, 6), roughness: num(r.roughness, 0.5), ndvi: num(r.ndvi, 0.04),
    liquidWater: r.liquidWater === true || String(r.liquid_water || r.liquidwater || r.liquidWater).toLowerCase() === "true",
    thermalAmplitude: num(r.thermalAmplitude ?? r.thermal_amplitude ?? r.thermalamplitude ?? r.thermal, 20), relativeHumidity: num(r.relativeHumidity ?? r.relative_humidity ?? r.relativehumidity ?? r.humidity, 20),
    lithology: r.lithology || "basalt_volcanic", minerals: minerals.length ? minerals : ["Basalt"], coverage: 100, alertType: ["high", "medium", "low"].includes(r.alertType) ? r.alertType : "low", alertLabel: r.alertLabel || "Imported", protectedName: r.protectedName || "", desc: r.desc || r.description || "Site imported through the Data Sources panel." };
}
function addSites(list) {
  let added = 0;
  list.forEach(r => { const s = normalizeSite(r); if (s && !appState.sites.some(x => Math.abs(x.lat - s.lat) < 0.05 && Math.abs(x.lon - s.lon) < 0.05)) { appState.sites.push(s); added++; } });
  invalidateEvals(); refresh(); updateIngestSummary(); return added;
}
function ingestPresetCatalog(id) {
  const list = TA.presets[id]; if (!list) return;
  let added = 0;
  list.forEach(r => { if (!appState.sites.some(s => s.id === r.id || (Math.abs(s.lat - r.lat) < 0.05 && Math.abs(s.lon - r.lon) < 0.05))) { appState.sites.push(Object.assign({}, r)); added++; } });
  invalidateEvals(); refresh(); updateIngestSummary(); showToast(added ? `Catalog loaded: +${added} sites` : "Catalog already loaded");
}
function parseCsv(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("The CSV needs a header and at least one data row.");
  const d = lines[0].includes(";") ? ";" : ",", head = lines[0].split(d).map(h => h.trim().toLowerCase().replace(/"/g, ""));
  return lines.slice(1).map(l => { const c = l.split(d).map(x => x.trim().replace(/"/g, "")), o = {}; head.forEach((h, i) => { o[h] = c[i]; }); return o; });
}
function ingestText(text, filename) {
  const t = text.trim(); let rows;
  if (t.startsWith("[") || t.startsWith("{")) {
    const p = JSON.parse(t);
    if (p.features) rows = p.features.map(f => Object.assign({}, f.properties || {}, { lon: f.geometry && f.geometry.coordinates[0], lat: f.geometry && f.geometry.coordinates[1] }));
    else rows = Array.isArray(p) ? p : [p];
  } else rows = parseCsv(t);
  const n = addSites(rows);
  showToast(`${filename || "Text"} processed: +${n} sites` + (n < rows.length ? ` (${rows.length - n} skipped: invalid or duplicate)` : ""));
  return n;
}
function handleFileSelect(e) { if (e.target.files[0]) processUploadedFile(e.target.files[0]); }
function handleDragOver(e) { e.preventDefault(); $("dropZone").classList.add("border-terraBlue"); }
function handleDragLeave(e) { e.preventDefault(); $("dropZone").classList.remove("border-terraBlue"); }
function handleFileDrop(e) { e.preventDefault(); handleDragLeave(e); if (e.dataTransfer.files.length) processUploadedFile(e.dataTransfer.files[0]); }
function processUploadedFile(file) {
  const r = new FileReader();
  r.onload = ev => { try { const n = ingestText(ev.target.result, file.name); $("fileUploadStatus").classList.remove("hidden"); $("fileUploadStatusText").textContent = `${n} sites added from ${file.name}`; } catch (err) { showToast("Could not process file: " + err.message); } };
  r.readAsText(file);
}
function loadSamplePaste() {
  $("pasteInput").value = `name,country,lat,lon,elevation,slope,roughness,ndvi,liquid_water,thermal_amplitude,relative_humidity,lithology,minerals
"Mauna Kea Ridge","USA",19.9,-155.5,4100,6.2,0.74,0.03,false,18,15,"basalt_volcanic","Basalt|Olivine"
"Lonar Rim","India",20.0,76.5,560,9.5,0.65,0.05,false,22,25,"impact_crater","Maskelynite|Basalt"`;
}
function processPastedData() {
  const t = $("pasteInput").value.trim(); if (!t) { showToast("Paste CSV text or a JSON array first"); return; }
  try { ingestText(t, "Pasted text"); closeDataModal(); } catch (err) { showToast("Could not process text: " + err.message); }
}
function downloadCsvTemplate() {
  downloadFile(`name,country,lat,lon,elevation,slope,roughness,ndvi,liquid_water,thermal_amplitude,relative_humidity,lithology,minerals,desc
"Example Atacama","Chile",-24.08,-69.95,1200,4.2,0.58,0.02,false,28,8,"evaporite_salar","Halite|Perchlorates","Hyper-arid Mars analog."
"Example Timanfaya","Spain",29.02,-13.73,320,6.2,0.88,0.04,false,14,42,"basalt_volcanic","Basalt|Olivine","Volcanic malpais analog."`, "terraanalog_template.csv", "text/csv");
  showToast("CSV template downloaded");
}

/* ----------------------------------------------------------------- UI chrome */
function openGuideModal() { $("guideModal").classList.remove("hidden"); }
function closeGuideModal() { $("guideModal").classList.add("hidden"); }
function toggleLeftSidebar() { appState.leftOpen = !appState.leftOpen; $("leftSidebar").style.transform = appState.leftOpen ? "translateX(0)" : "translateX(-115%)"; }
function toggleRightSidebar() { appState.rightOpen = !appState.rightOpen; $("rightSidebar").style.transform = appState.rightOpen ? "translateX(0)" : "translateX(115%)"; $("expandRightBtn").classList.toggle("hidden", appState.rightOpen); }

/* --------------------------------------------------------------------- init */
window.addEventListener("resize", () => { TA.globe.resize(); if (earthMap) earthMap.invalidateSize(); if (planetMap) planetMap.invalidateSize(); });
window.addEventListener("keydown", e => { if (e.key === "Escape") { closeSimulationModal(); closeChecklistModal(); closeGuideModal(); closeDataModal(); } });

window.addEventListener("load", () => {
  $("f_lith").innerHTML = Object.keys(TA.lithologyLabels).map(k => `<option value="${k}" class="bg-[#1C1C1E]">${TA.lithologyLabels[k]}</option>`).join("");
  buildWeights(); buildTargetSelect(); writeFilterControls(); setInspectorTab("filters"); setDataTab("scope");
  if (typeof L === "undefined") { showToast("Map library failed to load; using the 3D globe only"); appState.projection = "3d"; }
  else initEarthMap();
  TA.globe.init($("satelliteCanvas"), $("pinsLayer"), {
    onPinClick, onZoom: updateZoomBadge,
    onStatus: (body, st) => showToast(st === "ready" ? `3D globe imagery loaded: ${body === "earth" ? "Earth" : bodyName(body)}` : "Globe imagery unavailable (check network)")
  });
  if (window.innerWidth < 900) { toggleLeftSidebar(); toggleRightSidebar(); }
  applyView();
});
