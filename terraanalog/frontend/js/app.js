/**
 * TerraAnalog - Main Frontend Application Orchestrator (Enhanced v2.0)
 * Manages Leaflet GIS map, fallback canvas world map, multi-criteria filtering,
 * interactive category pills, drawer collapse, and AR simulator telemetry.
 */

class TerraAnalogApp {
  constructor() {
    this.currentBody = "Mars";
    this.currentTarget = null;
    this.selectedCandidate = null;
    this.activeCategory = "ALL";
    this.evaluationResults = [];
    this.map = null;
    this.markers = {};
    this.activeBboxLayer = null;
    this.arSimulator = null;
    this.globe = null;
    this.isGlobeView = false;
    this.currentTutStep = 1;
    this.spotlightFilterText = "";
    this.checklistState = {};
    this.comparisonList = [];
    
    // Basemap layers
    this.currentBasemap = "dark";
    this.tileLayers = {};

    this.init();
  }

  init() {
    this.populateTargetSelector();
    this.populateEventRegionSelector();
    this.initMap();
    this.initGlobe();
    this.initEventListeners();
    this.initArSimulator();
    this.initTutorialController();
    this.initDocsTabs();
    this.initChecklistController();
    this.runAnalysis();
    this.renderEventsTable();
  }

  populateTargetSelector() {
    const sel = document.getElementById("target-profile-select");
    if (!sel) return;
    sel.innerHTML = "";

    const availableTargets = TERRA_DATA.targets.filter(t => t.body === this.currentBody);
    availableTargets.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${t.name} (${t.env})`;
      sel.appendChild(opt);
    });

    this.currentTarget = availableTargets[0] || null;
    this.updateTargetSummary();
  }

  populateEventRegionSelector() {
    const sel = document.getElementById("evt-region-select");
    if (!sel) return;
    sel.innerHTML = "";
    TERRA_DATA.candidates.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.country})`;
      sel.appendChild(opt);
    });
  }

  updateTargetSummary() {
    if (!this.currentTarget) return;
    const badge = document.getElementById("target-context-badge");
    if (badge) badge.textContent = this.currentTarget.context;
  }

  initMap() {
    // Check for dedicated map canvas container or fallback to viewport
    const mapTarget = document.getElementById("leaflet-map-canvas") || document.getElementById("map-viewport");
    if (!mapTarget) return;

    if (typeof L === "undefined") {
      console.warn("Leaflet library not loaded (offline or CDN blocked). Activating Enhanced Vector Canvas Fallback World Map.");
      this.initCanvasFallbackMap();
      return;
    }

    try {
      // Initialize Leaflet Map centered on world view (Center: [20.0, 0.0], Zoom: 2, Bounds: Global)
      this.map = L.map(mapTarget, {
        center: [20.0, 0.0],
        zoom: 2,
        minZoom: 1.5,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: true
      });

      L.control.zoom({ position: "bottomright" }).addTo(this.map);

      // Multi-Provider Open Cartography Tile Layers (Section 4.3 & 4.4)
      // 1. Dark Matter Tile Layer (CartoDB)
      this.tileLayers.dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> & NASA ESDIS',
        subdomains: 'abcd',
        maxZoom: 19
      });

      // 2. High-Resolution Satellite Tile Layer (Esri World Imagery)
      this.tileLayers.satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USGS, AeroGRID, IGN, NASA',
        maxZoom: 18
      });

      // 3. OpenStreetMap Universal Global Map
      this.tileLayers.osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      });

      // 4. Topographic / Shaded Relief (Esri World Topo)
      this.tileLayers.topo = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: '&copy; Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN',
        maxZoom: 18
      });

      // Add default basemap
      this.tileLayers.dark.addTo(this.map);
      this.currentBasemap = "dark";

      // Scientific Overlay Layers Container (Section 4.4)
      this.scientificLayers = {
        volcanic: L.layerGroup().addTo(this.map),
        crater: L.layerGroup().addTo(this.map),
        minerals: L.layerGroup().addTo(this.map),
        slope_hazard: L.layerGroup().addTo(this.map),
        roughness: L.layerGroup().addTo(this.map),
        dem: L.layerGroup(),
        wdpa: L.layerGroup().addTo(this.map),
        ramsar: L.layerGroup().addTo(this.map),
        gravity: L.layerGroup().addTo(this.map),
        magnetism: L.layerGroup().addTo(this.map),
        thermal: L.layerGroup().addTo(this.map)
      };

      this.populateScientificOverlays();

      // Track cursor coordinates in HUD
      this.map.on("mousemove", (e) => {
        const latEl = document.getElementById("hud-lat");
        const lonEl = document.getElementById("hud-lon");
        if (latEl && lonEl) {
          latEl.textContent = e.latlng.lat.toFixed(3);
          lonEl.textContent = e.latlng.lng.toFixed(3);
        }
      });

      // Crucial: Invalidate size after layout rendering and resize
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 100);
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 400);

      window.addEventListener("resize", () => {
        if (this.map) this.map.invalidateSize();
      });

    } catch (err) {
      console.warn("Error initializing Leaflet map, falling back to Canvas Map:", err);
      this.initCanvasFallbackMap();
    }
  }

  switchBasemap(type) {
    if (!this.map || !this.tileLayers) return;
    Object.values(this.tileLayers).forEach(layer => {
      if (this.map.hasLayer(layer)) this.map.removeLayer(layer);
    });

    if (this.tileLayers[type]) {
      this.tileLayers[type].addTo(this.map);
      this.currentBasemap = type;
      console.log(`Switched basemap to: ${type}`);
    }
  }

  toggleBasemap() {
    if (!this.map || !this.tileLayers) return;
    if (this.currentBasemap === "dark") {
      this.switchBasemap("satellite");
    } else if (this.currentBasemap === "satellite") {
      this.switchBasemap("osm");
    } else if (this.currentBasemap === "osm") {
      this.switchBasemap("topo");
    } else {
      this.switchBasemap("dark");
    }
  }

  toggleScientificLayer(layerKey, enabled) {
    if (!this.map || !this.scientificLayers || !this.scientificLayers[layerKey]) return;
    const layer = this.scientificLayers[layerKey];
    if (enabled && !this.map.hasLayer(layer)) {
      layer.addTo(this.map);
    } else if (!enabled && this.map.hasLayer(layer)) {
      this.map.removeLayer(layer);
    }
  }

  populateScientificOverlays() {
    if (!this.map || typeof L === "undefined") return;

    TERRA_DATA.candidates.forEach(c => {
      // 1. Environmental: WDPA Protected Area Exclusion Polygons (SDG 15)
      if (c.env && c.env.overlaps_wdpa && c.bbox) {
        const [minLon, minLat, maxLon, maxLat] = c.bbox;
        const wdpaPoly = L.rectangle([[minLat, minLon], [maxLat, maxLon]], {
          color: c.env.risk_level === 'RESTRICTED_REVIEW' ? '#f43f5e' : '#f59e0b',
          weight: 1.5,
          dashArray: '4, 4',
          fillColor: c.env.risk_level === 'RESTRICTED_REVIEW' ? '#f43f5e' : '#f59e0b',
          fillOpacity: 0.12
        }).bindTooltip(`<b>WDPA Protected:</b> ${c.env.pa_name || c.name}<br><i>IUCN: ${c.env.iucn || 'Unclassified'}</i>`, { sticky: true });
        this.scientificLayers.wdpa.addLayer(wdpaPoly);
      }

      // 2. Topographic: Slope Hazard (> 15°)
      if (c.measurements && c.measurements.slope_mean > 10) {
        const slopeCircle = L.circle([c.lat, c.lon], {
          radius: 45000,
          color: '#fbbf24',
          weight: 1,
          fillColor: '#fbbf24',
          fillOpacity: 0.08
        }).bindTooltip(`<b>Slope Gradient:</b> ${c.measurements.slope_mean}° (Topographic Hazard)`, { sticky: true });
        this.scientificLayers.slope_hazard.addLayer(slopeCircle);
      }

      // 3. Geophysical: Bouguer Gravity Anomaly Overlay
      if (c.measurements && typeof c.measurements.gravity_anomaly === 'number') {
        const gravColor = c.measurements.gravity_anomaly > 0 ? '#38bdf8' : '#a855f7';
        const gravCircle = L.circle([c.lat, c.lon], {
          radius: 35000,
          color: gravColor,
          weight: 1,
          dashArray: '3, 3',
          fillColor: gravColor,
          fillOpacity: 0.05
        }).bindTooltip(`<b>Bouguer Gravity:</b> ${c.measurements.gravity_anomaly} mGal`, { sticky: true });
        this.scientificLayers.gravity.addLayer(gravCircle);
      }
    });
  }

  zoomToWorld() {
    if (this.map) {
      this.map.flyTo([20.0, 0.0], 2, { duration: 1.2 });
    }
  }

  fitAllCandidates() {
    if (!this.map) return;
    const latlngs = TERRA_DATA.candidates.map(c => [c.lat, c.lon]);
    if (latlngs.length > 0) {
      this.map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50], maxZoom: 6 });
    }
  }

  /* Canvas Fallback World Map (Offline Mode) */
  initCanvasFallbackMap() {
    const canvas = document.getElementById("fallback-map-canvas");
    if (!canvas) return;
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");

    const renderCanvas = () => {
      const width = canvas.width = canvas.parentElement.clientWidth || 800;
      const height = canvas.height = canvas.parentElement.clientHeight || 500;

      // Dark space background
      ctx.fillStyle = "#040810";
      ctx.fillRect(0, 0, width, height);

      // Lat/Lon Grid lines
      ctx.strokeStyle = "rgba(34, 50, 73, 0.4)";
      ctx.lineWidth = 1;

      // Meridians
      for (let lon = -180; lon <= 180; lon += 30) {
        const x = ((lon + 180) / 360) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      // Parallels
      for (let lat = -90; lat <= 90; lat += 30) {
        const y = ((90 - lat) / 180) * height;
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Simplified continent shapes
      ctx.fillStyle = "rgba(20, 31, 48, 0.85)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
      ctx.lineWidth = 1;

      const continents = [
        // North America
        [[-165, 65], [-140, 70], [-95, 75], [-60, 60], [-80, 25], [-105, 20], [-120, 35], [-165, 60]],
        // South America
        [[-80, 10], [-50, -5], [-35, -10], [-55, -40], [-70, -55], [-75, -20], [-80, 10]],
        // Eurasia
        [[-10, 35], [20, 40], [40, 60], [100, 70], [170, 65], [140, 35], [105, 20], [75, 10], [50, 25], [30, 30], [-10, 35]],
        // Africa
        [[-15, 30], [30, 30], [50, 12], [40, -10], [30, -35], [15, -34], [10, 5], [-15, 15], [-15, 30]],
        // Australia
        [[115, -20], [145, -15], [150, -35], [130, -35], [115, -30], [115, -20]]
      ];

      continents.forEach(cont => {
        ctx.beginPath();
        cont.forEach(([lon, lat], idx) => {
          const x = ((lon + 180) / 360) * width;
          const y = ((90 - lat) / 180) * height;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // Plot candidate points
      TERRA_DATA.candidates.forEach(c => {
        const x = ((c.lon + 180) / 360) * width;
        const y = ((90 - c.lat) / 180) * height;

        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px sans-serif";
        ctx.fillText(c.name, x + 8, y + 3);
      });
    };

    renderCanvas();
    window.addEventListener("resize", renderCanvas);

    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const width = canvas.width;
      const height = canvas.height;

      TERRA_DATA.candidates.forEach(c => {
        const x = ((c.lon + 180) / 360) * width;
        const y = ((90 - c.lat) / 180) * height;
        const dist = Math.hypot(clickX - x, clickY - y);
        if (dist < 10) {
          this.selectCandidate(c.id);
        }
      });
    });
  }

  renderAppleMatchRing(score, size = 42) {
    const radius = size * 0.38;
    const circumference = 2 * Math.PI * radius;
    const clampedScore = Math.max(0, Math.min(100, score || 0));
    const offset = circumference - (circumference * clampedScore) / 100;
    let ringColor = "#ff453a"; // Apple System Red
    if (clampedScore >= 85) ringColor = "#34c759";      // Apple System Green
    else if (clampedScore >= 70) ringColor = "#0a84ff"; // Apple System Blue
    else if (clampedScore >= 50) ringColor = "#ff9f0a"; // Apple System Orange

    return `
      <div class="apple-match-ring-wrapper" style="width: ${size}px; height: ${size}px;" title="Physical Similarity Score: ${clampedScore}%">
        <svg class="apple-match-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle class="apple-match-ring-bg" cx="${size / 2}" cy="${size / 2}" r="${radius}" />
          <circle class="apple-match-ring-fill" cx="${size / 2}" cy="${size / 2}" r="${radius}"
            style="stroke-dasharray: ${circumference.toFixed(1)}; stroke-dashoffset: ${offset.toFixed(1)}; stroke: ${ringColor}; stroke-width: ${Math.max(3, size * 0.09)}px;" />
        </svg>
        <span class="apple-match-ring-text" style="font-size: ${Math.round(size * 0.25)}px;">${Math.round(clampedScore)}%</span>
      </div>
    `;
  }

  runAnalysis() {
    if (!this.currentTarget) return;

    // Run scientific matching for all candidates
    this.evaluationResults = TERRA_DATA.candidates.map(candidate => {
      return SCIENTIFIC_ENGINE.evaluateCandidate(candidate, this.currentTarget);
    });

    // 1. Filter by Preset Filter Bar (Apple Segmented Capsule)
    let displayResults = [...this.evaluationResults];
    if (this.activeCategory === "HIGH_MATCH") {
      displayResults = displayResults.filter(r => r.physicalSimilarity >= 70.0);
    } else if (this.activeCategory === "ECO_SAFE") {
      displayResults = displayResults.filter(r => r.environmentalRisk !== "RESTRICTED_REVIEW");
    } else if (this.activeCategory !== "ALL") {
      displayResults = displayResults.filter(r => r.regionType.toLowerCase() === this.activeCategory.toLowerCase());
    }

    // 2. Filter by Apple Spotlight Search Input (if active)
    if (this.spotlightFilterText && this.spotlightFilterText.trim()) {
      const q = this.spotlightFilterText.trim().toLowerCase();
      displayResults = displayResults.filter(r => 
        r.candidateName.toLowerCase().includes(q) || 
        r.country.toLowerCase().includes(q) ||
        r.regionType.toLowerCase().includes(q)
      );
    }

    // 3. Filter by Physical Sliders (Left Drawer)
    const sliderSlope = document.getElementById("slider-filter-slope");
    if (sliderSlope) {
      const maxSlope = parseFloat(sliderSlope.value);
      displayResults = displayResults.filter(r => {
        const cand = TERRA_DATA.candidates.find(c => c.id === r.candidateId);
        return cand && (cand.measurements.slope_mean || 0) <= maxSlope;
      });
    }

    const sliderCoverage = document.getElementById("slider-filter-coverage");
    if (sliderCoverage) {
      const minCoverage = parseFloat(sliderCoverage.value);
      displayResults = displayResults.filter(r => r.dataCoverage >= minCoverage);
    }

    const selRegionType = document.getElementById("filter-region-type");
    if (selRegionType && selRegionType.value !== "ALL") {
      displayResults = displayResults.filter(r => r.regionType.toLowerCase() === selRegionType.value.toLowerCase());
    }

    // Sort by physical similarity descending
    displayResults.sort((a, b) => b.physicalSimilarity - a.physicalSimilarity);

    this.renderCandidateRanking(displayResults);
    this.updateMapMarkers(displayResults);

    // Update sites count in HUD
    const hudCount = document.getElementById("hud-sites-count");
    if (hudCount) hudCount.textContent = `${displayResults.length} / ${TERRA_DATA.candidates.length}`;

    // Select top candidate if none selected
    if (!this.selectedCandidate && displayResults.length > 0) {
      this.selectCandidate(displayResults[0].candidateId);
    } else if (this.selectedCandidate) {
      this.selectCandidate(this.selectedCandidate.id);
    }
  }

  updateMapMarkers(filteredResults) {
    if (!this.map || typeof L === "undefined") return;

    const resultsToDisplay = filteredResults || this.evaluationResults;

    // Remove existing markers
    Object.values(this.markers).forEach(m => this.map.removeLayer(m));
    this.markers = {};

    resultsToDisplay.forEach(res => {
      const score = res.physicalSimilarity;
      let markerColor = "#f43f5e"; // Low
      if (score >= 85) markerColor = "#10b981";      // High (Emerald)
      else if (score >= 70) markerColor = "#38bdf8"; // Moderate (Cyan)
      else if (score >= 50) markerColor = "#f59e0b"; // Partial (Amber)

      const markerHtml = `
        <div style="
          width: 30px; height: 30px; border-radius: 50%;
          background: ${markerColor}; border: 2px solid #ffffff;
          box-shadow: 0 0 14px ${markerColor};
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono, monospace); font-size: 11px; font-weight: 800; color: #080c14;
          cursor: pointer; transition: transform 0.2s ease;
        ">${Math.round(score)}</div>
      `;

      const icon = L.divIcon({
        className: 'custom-analog-marker',
        html: markerHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([res.lat, res.lon], { icon }).addTo(this.map);

      marker.bindPopup(`
        <div style="font-family: var(--font-sans, sans-serif); min-width: 200px; color: #111;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700;">${res.candidateName}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #555;">${res.country} &bull; ${res.regionType} &bull; ${res.elevation}m</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: 800; font-size: 13px; color: ${markerColor};">${res.physicalSimilarity}% Match</span>
            <span style="font-size: 11px; color: #666;">Coverage: ${res.dataCoverage}%</span>
          </div>
          <button onclick="window.terraApp.selectCandidate('${res.candidateId}')" style="
            width: 100%; background: #0284c7; color: white; border: none; padding: 6px;
            border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer;
          ">Inspect Scientific Data</button>
        </div>
      `);

      marker.on("click", () => {
        this.selectCandidate(res.candidateId);
      });

      this.markers[res.candidateId] = marker;
    });
  }

  renderCandidateRanking(displayList) {
    const listEl = document.getElementById("ranking-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    const results = displayList || this.evaluationResults;

    if (results.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-dim); font-size: 0.8rem;">
          <div style="font-size: 1.5rem; margin-bottom: 6px;">🔍</div>
          No se encontraron análogos con los filtros seleccionados.
        </div>
      `;
      return;
    }

    results.forEach((res, idx) => {
      const card = document.createElement("div");
      card.className = `candidate-card ${this.selectedCandidate && this.selectedCandidate.id === res.candidateId ? 'active' : ''}`;
      card.onclick = () => this.selectCandidate(res.candidateId);

      let ecoClass = "eco-low";
      if (res.environmentalRisk === "RESTRICTED_REVIEW") ecoClass = "eco-restricted";
      else if (res.environmentalRisk === "HIGH_ALERT") ecoClass = "eco-high";
      else if (res.environmentalRisk === "MEDIUM_ALERT") ecoClass = "eco-medium";

      card.innerHTML = `
        <div class="card-header" style="align-items: center; gap: 8px;">
          <div style="flex: 1; min-width: 0;">
            <div class="card-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              #${idx + 1} ${res.candidateName}
            </div>
            <div class="card-meta">${res.country} &bull; ${res.regionType} &bull; ${res.elevation}m</div>
          </div>
          ${this.renderAppleMatchRing(res.physicalSimilarity, 40)}
        </div>
        <div style="display: flex; gap: 0.4rem; align-items: center; font-size: 0.70rem; margin-top: 6px;">
          <span style="color: var(--text-dim);">Data Coverage: ${res.dataCoverage}%</span>
          ${res.isProvisional ? '<span class="provisional-badge" style="font-size: 0.65rem;">Provisional</span>' : ''}
          <span style="margin-left: auto;" class="eco-pill ${ecoClass}">${res.environmentalRisk}</span>
          <button class="apple-locate-btn" onclick="event.stopPropagation(); window.terraApp.locateCandidateOnMap('${res.candidateId}')" title="Centrar y enfocar en el mapa/globo">
            🔍 Locate
          </button>
        </div>
      `;

      listEl.appendChild(card);
    });
  }

  selectCandidate(candidateId) {
    const candidate = TERRA_DATA.candidates.find(c => c.id === candidateId);
    if (!candidate) return;
    this.selectedCandidate = candidate;

    // Highlight in ranking list
    document.querySelectorAll(".candidate-card").forEach(el => el.classList.remove("active"));
    const cards = document.querySelectorAll(".candidate-card");
    this.evaluationResults.forEach((r, idx) => {
      if (r.candidateId === candidateId && cards[idx]) {
        cards[idx].classList.add("active");
        cards[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    // Pan map to candidate and draw bounding box
    if (this.map && typeof L !== "undefined") {
      this.map.flyTo([candidate.lat, candidate.lon], 6, { duration: 1.2 });
      if (this.markers[candidateId]) {
        this.markers[candidateId].openPopup();
      }

      // Draw bounding box polygon
      if (this.activeBboxLayer) {
        this.map.removeLayer(this.activeBboxLayer);
      }
      if (candidate.bbox && candidate.bbox.length === 4) {
        const [minLon, minLat, maxLon, maxLat] = candidate.bbox;
        const bounds = [[minLat, minLon], [maxLat, maxLon]];
        this.activeBboxLayer = L.rectangle(bounds, {
          color: "#38bdf8",
          weight: 2,
          fillColor: "#0284c7",
          fillOpacity: 0.15,
          dashArray: "4, 4"
        }).addTo(this.map);
      }
    }

    // Render candidate inspector details
    this.renderInspector();

    // Update AR simulator candidate
    if (this.arSimulator) {
      this.arSimulator.setCandidate(candidate);
    }
  }

  renderInspector() {
    if (!this.selectedCandidate || !this.currentTarget) return;
    const res = this.evaluationResults.find(r => r.candidateId === this.selectedCandidate.id);
    if (!res) return;

    // Toggle empty state vs content
    const emptyState = document.getElementById("inspector-empty-state");
    const contentEl = document.getElementById("inspector-content");
    if (emptyState) emptyState.style.display = "none";
    if (contentEl) contentEl.style.display = "flex";

    // Apple Match Ring in header
    const ringContainer = document.getElementById("inspector-ring-container");
    if (ringContainer) ringContainer.innerHTML = this.renderAppleMatchRing(res.physicalSimilarity, 54);

    // Candidate Header & Badges
    const titleEl = document.getElementById("inspector-title");
    const metaEl = document.getElementById("inspector-meta");
    const descEl = document.getElementById("inspector-desc");
    const simScoreEl = document.getElementById("inspector-sim-score");
    const covScoreEl = document.getElementById("inspector-cov-score");
    const feasScoreEl = document.getElementById("inspector-feas-score");
    const classBadgeEl = document.getElementById("inspector-classification");

    if (titleEl) titleEl.textContent = res.candidateName;
    if (metaEl) metaEl.textContent = `${res.country} | ${res.regionType} | ${res.elevation}m | ${this.selectedCandidate.area_km2} km²`;
    if (descEl) descEl.textContent = this.selectedCandidate.desc;
    if (simScoreEl) simScoreEl.textContent = `${res.physicalSimilarity}%`;
    if (covScoreEl) covScoreEl.textContent = `${res.dataCoverage}%`;
    if (feasScoreEl) feasScoreEl.textContent = `${res.operationalFeasibility}%`;
    if (classBadgeEl) {
      classBadgeEl.textContent = res.classification;
      classBadgeEl.className = res.isProvisional ? "provisional-badge" : "brand-badge";
    }

    // Dimensional Scores Progress Bars (Apple-style)
    const dimContainer = document.getElementById("dimensions-container");
    if (dimContainer) {
      const dimColors = { geology: "#0a84ff", topography: "#30d158", geophysics: "#bf5af2", thermal: "#ff9f0a" };
      const dimLabels = { geology: "Geología", topography: "Topografía", geophysics: "Geofísica", thermal: "Termal" };
      dimContainer.innerHTML = Object.entries(res.dimensionScores).map(([dim, score]) => `
        <div style="display: flex; flex-direction: column; gap: 3px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.72rem;">
            <span style="color: var(--text-muted); font-weight: 500; text-transform: uppercase;">${dimLabels[dim] || dim}</span>
            <span style="font-family: var(--font-mono); font-weight: 700; color: ${dimColors[dim] || '#38bdf8'};">${score}%</span>
          </div>
          <div style="height: 6px; background: var(--bg-input); border-radius: 3px; overflow: hidden;">
            <div style="width: ${score}%; height: 100%; background: ${dimColors[dim] || '#38bdf8'}; border-radius: 3px; transition: width 0.5s ease;"></div>
          </div>
        </div>
      `).join("");
    }

    // Variable Breakdown Table
    const tbody = document.getElementById("breakdown-table-body");
    if (tbody) {
      tbody.innerHTML = res.breakdown.map(item => {
        const isEval = item.status === "EVALUATED";
        const simColor = isEval ? (item.similarity > 75 ? '#34c759' : (item.similarity > 40 ? '#ff9f0a' : '#ff453a')) : '#ff453a';
        return `
          <tr style="border-bottom: 1px solid rgba(34,50,73,0.3);">
            <td style="padding: 4px 2px;">
              <div style="font-weight: 600; color: #fff; font-size: 0.73rem;">${item.name}</div>
              <div style="font-size: 0.62rem; color: var(--text-dim); text-transform: uppercase;">${item.category}</div>
            </td>
            <td style="text-align: right; padding: 4px 2px; font-family: var(--font-mono); color: #38bdf8; font-size: 0.73rem;">${item.earthVal !== undefined && item.earthVal !== null ? item.earthVal : 'N/A'}</td>
            <td style="text-align: right; padding: 4px 2px; font-family: var(--font-mono); color: #f59e0b; font-size: 0.73rem;">${item.targetVal !== undefined && item.targetVal !== null ? item.targetVal : 'N/A'}</td>
            <td style="text-align: right; padding: 4px 2px; font-family: var(--font-mono); font-size: 0.73rem;">${isEval && item.delta !== undefined ? item.delta.toFixed(2) : '-'}</td>
            <td style="text-align: right; padding: 4px 2px; font-family: var(--font-mono); font-weight: 700; color: ${simColor}; font-size: 0.73rem;">
              ${isEval ? `${item.similarity}%` : '<span style="font-size: 0.62rem; color: #ff453a;">SIN DATOS</span>'}
            </td>
          </tr>
        `;
      }).join("");
    }

    // Environmental Assessment Card (SDG 13, 14, 15)
    const env = this.selectedCandidate.env;
    const envContainer = document.getElementById("inspector-env-card");
    if (envContainer && env) {
      let riskBorder = "#34c759";
      if (env.risk_level === "RESTRICTED_REVIEW") riskBorder = "#ff453a";
      else if (env.risk_level === "HIGH_ALERT") riskBorder = "#ff6961";
      else if (env.risk_level === "MEDIUM_ALERT") riskBorder = "#ff9f0a";

      envContainer.innerHTML = `
        <div style="border-left: 3px solid ${riskBorder}; padding-left: 10px; display: flex; flex-direction: column; gap: 5px; background: rgba(0,0,0,0.15); border-radius: 0 8px 8px 0; padding: 10px 10px 10px 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.78rem; font-weight: 700; color: ${riskBorder};">${env.risk_level}</span>
            <span style="font-size: 0.68rem; color: var(--text-dim);">Protected Planet (WDPA)</span>
          </div>
          <div style="font-size: 0.76rem; color: #fff;"><strong>Área Protegida:</strong> ${env.pa_name} (IUCN: ${env.iucn})</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);"><strong>ODS 13 (Acción Climática):</strong> ${env.sdg13}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);"><strong>ODS 14 (Vida Submarina):</strong> ${env.sdg14}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);"><strong>ODS 15 (Vida Terrestre):</strong> ${env.sdg15}</div>
          <div style="margin-top: 4px; padding: 6px; background: rgba(0,0,0,0.25); border-radius: 6px; font-size: 0.72rem; color: #38bdf8;">
            <strong>Recomendación Ética:</strong> ${env.recommendation}
          </div>
        </div>
      `;
    } else if (envContainer) {
      envContainer.innerHTML = '<div style="font-size: 0.75rem; color: var(--text-dim); text-align: center; padding: 8px;">Sin datos ambientales disponibles (NO_DATA)</div>';
    }
  }


    toggleLeftDrawer() {
    const drawer = document.getElementById("left-drawer");
    if (drawer) {
      drawer.classList.toggle("collapsed");
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 260);
    }
  }

  toggleRightDrawer() {
    const drawer = document.getElementById("right-drawer");
    if (drawer) {
      drawer.classList.toggle("collapsed");
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 260);
    }
  }

  exportCurrentCandidateGeoJSON() {
    if (!this.selectedCandidate) {
      alert("Please select a candidate region first.");
      return;
    }
    const res = this.evaluationResults.find(r => r.candidateId === this.selectedCandidate.id);
    const geojson = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [this.selectedCandidate.lon, this.selectedCandidate.lat]
      },
      properties: {
        id: this.selectedCandidate.id,
        name: this.selectedCandidate.name,
        country: this.selectedCandidate.country,
        region_type: this.selectedCandidate.region_type,
        elevation_m: this.selectedCandidate.elevation,
        area_km2: this.selectedCandidate.area_km2,
        target_profile: this.currentTarget ? this.currentTarget.name : "N/A",
        target_body: this.currentBody,
        physical_similarity_pct: res ? res.physicalSimilarity : null,
        data_coverage_pct: res ? res.dataCoverage : null,
        operational_feasibility_pct: res ? res.operationalFeasibility : null,
        classification: res ? res.classification : null,
        environmental_risk: this.selectedCandidate.env ? this.selectedCandidate.env.risk_level : "NO_DATA",
        measurements: this.selectedCandidate.measurements,
        exported_at: new Date().toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `terraanalog_${this.selectedCandidate.id}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  initEventListeners() {
    // Body switch (Moon / Mars)
    const moonBtn = document.getElementById("btn-body-moon");
    const marsBtn = document.getElementById("btn-body-mars");

    if (moonBtn && marsBtn) {
      moonBtn.onclick = () => {
        this.currentBody = "Moon";
        moonBtn.classList.add("active");
        marsBtn.classList.remove("active");
        this.populateTargetSelector();
        this.runAnalysis();
      };

      marsBtn.onclick = () => {
        this.currentBody = "Mars";
        marsBtn.classList.add("active");
        moonBtn.classList.remove("active");
        this.populateTargetSelector();
        this.runAnalysis();
      };
    }

    // Target select change
    const targetSelect = document.getElementById("target-profile-select");
    if (targetSelect) {
      targetSelect.onchange = (e) => {
        this.currentTarget = TERRA_DATA.targets.find(t => t.id === e.target.value);
        this.updateTargetSummary();
        this.runAnalysis();
      };
    }

    // Tab buttons in Left Drawer
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.onclick = () => {
        const tabTarget = btn.getAttribute("data-tab");
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");

        btn.classList.add("active");
        const activeContent = document.getElementById(`tab-${tabTarget}`);
        if (activeContent) activeContent.style.display = "flex";
      };
    });

    // Map Category Filter Pills
    document.querySelectorAll(".cat-pill").forEach(pill => {
      pill.onclick = () => {
        document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.activeCategory = pill.getAttribute("data-cat");
        this.runAnalysis();
      };
    });

    // Drawer Toggles
    const btnToggleLeft = document.getElementById("btn-toggle-left");
    const btnCloseLeft = document.getElementById("btn-close-left-drawer");
    if (btnToggleLeft) btnToggleLeft.onclick = () => this.toggleLeftDrawer();
    if (btnCloseLeft) btnCloseLeft.onclick = () => this.toggleLeftDrawer();

    const btnToggleRight = document.getElementById("btn-toggle-right");
    const btnCloseRight = document.getElementById("btn-close-right-drawer");
    if (btnToggleRight) btnToggleRight.onclick = () => this.toggleRightDrawer();
    if (btnCloseRight) btnCloseRight.onclick = () => this.toggleRightDrawer();

    // Map Quick Action Buttons
    const btnWorldView = document.getElementById("btn-world-view");
    if (btnWorldView) btnWorldView.onclick = () => this.zoomToWorld();

    const btnFitAll = document.getElementById("btn-fit-all");
    if (btnFitAll) btnFitAll.onclick = () => this.fitAllCandidates();

    const btnToggleBasemap = document.getElementById("btn-toggle-basemap");
    if (btnToggleBasemap) btnToggleBasemap.onclick = () => this.toggleBasemap();

    const btnExportGeoJSON = document.getElementById("btn-export-geojson");
    if (btnExportGeoJSON) btnExportGeoJSON.onclick = () => this.exportCurrentCandidateGeoJSON();

    // Reverse AI Search Input
    const reverseInput = document.getElementById("reverse-search-input");
    const reverseBtn = document.getElementById("btn-reverse-search");
    if (reverseInput && reverseBtn) {
      const handleReverseSearch = () => {
        const text = reverseInput.value.trim();
        if (!text) return;
        this.runReverseSearch(text);
      };

      reverseBtn.onclick = handleReverseSearch;
      reverseInput.onkeypress = (e) => { if (e.key === "Enter") handleReverseSearch(); };
    }

    // Quick Reverse Search Example Buttons
    document.querySelectorAll(".example-query-pill").forEach(pill => {
      pill.onclick = () => {
        const query = pill.getAttribute("data-query");
        if (reverseInput) {
          reverseInput.value = query;
          this.runReverseSearch(query);
        }
      };
    });

    // Apple Spotlight Search Input (Punto 4: Lupa de Localizacion)
    const spotlightInput = document.getElementById("spotlight-search-input");
    if (spotlightInput) {
      spotlightInput.addEventListener("input", (e) => {
        this.spotlightFilterText = e.target.value;
        this.runAnalysis();
      });
    }

    // Physical Drawer Sliders & Selects
    const sliderSlope = document.getElementById("slider-filter-slope");
    if (sliderSlope) {
      sliderSlope.addEventListener("input", () => this.runAnalysis());
    }
    const sliderCoverage = document.getElementById("slider-filter-coverage");
    if (sliderCoverage) {
      sliderCoverage.addEventListener("input", () => this.runAnalysis());
    }
    const filterRegion = document.getElementById("filter-region-type");
    if (filterRegion) {
      filterRegion.addEventListener("change", () => this.runAnalysis());
    }

    // Modals
    this.initModalTriggers();
  }

  runReverseSearch(text) {
    const criteria = SCIENTIFIC_ENGINE.parseReverseQuery(text);
    const parsedCard = document.getElementById("reverse-parsed-card");
    const resultsContainer = document.getElementById("reverse-results-container");

    if (parsedCard) {
      parsedCard.style.display = "block";
      parsedCard.innerHTML = `
        <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-cyan); font-weight: 600; margin-bottom: 4px;">
          Detected Semantic Criteria:
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
          ${criteria.matchedTokens.map(t => `<span class="brand-badge">${t}</span>`).join("")}
        </div>
      `;
    }

    const ranked = SCIENTIFIC_ENGINE.rankCandidatesByReverseQuery(criteria, TERRA_DATA.candidates);
    if (resultsContainer) {
      resultsContainer.innerHTML = ranked.map((item, idx) => `
        <div class="candidate-card" onclick="window.terraApp.selectCandidate('${item.candidate.id}')">
          <div class="card-header">
            <div>
              <div class="card-title">#${idx + 1} ${item.candidate.name}</div>
              <div class="card-meta">${item.candidate.country} &bull; ${item.candidate.region_type}</div>
            </div>
            <div class="score-badge score-moderate">${item.relevance}% Match</div>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.4;">
            ${item.reasons.slice(0, 2).map(r => `&bull; ${r}`).join("<br>")}
          </div>
        </div>
      `).join("");
    }
  }

  initGlobe() {
    const canvas = document.getElementById("globe-canvas");
    if (!canvas || typeof OblateSpheroidGlobe === "undefined") return;

    this.globe = new OblateSpheroidGlobe("globe-canvas", this);

    // Globe Toggle Button
    const btnToggleGlobe = document.getElementById("btn-toggle-globe");
    if (btnToggleGlobe) {
      btnToggleGlobe.onclick = () => this.toggleGlobeView();
    }

    // Globe Celestial Body Selector
    const selGlobeBody = document.getElementById("globe-body-select");
    if (selGlobeBody) {
      selGlobeBody.onchange = (e) => {
        if (this.globe) {
          const bodyVal = e.target.value;
          this.globe.setBody(bodyVal);
          if (bodyVal === "Earth" && this.selectedCandidate) {
            this.globe.focusOnSite(this.selectedCandidate.lat, this.selectedCandidate.lon);
          } else if (this.currentTarget && bodyVal !== "Earth") {
            this.globe.focusOnSite(this.currentTarget.lat, this.currentTarget.lon);
          }
        }
      };
    }
  }

  toggleGlobeView() {
    const globeWrapper = document.getElementById("globe-canvas-wrapper");
    const btnToggle = document.getElementById("btn-toggle-globe");
    const hud2d = document.getElementById("map-hud-overlay-2d");
    const fallbackCanvas = document.getElementById("fallback-map-canvas");
    const leafletElements = document.querySelectorAll("#map-viewport > .leaflet-pane, #map-viewport > .leaflet-control-container");
    if (!globeWrapper) return;

    this.isGlobeView = !this.isGlobeView;

    if (this.isGlobeView) {
      globeWrapper.style.display = "block";
      globeWrapper.style.zIndex = "440";
      if (hud2d) hud2d.style.display = "none";
      if (fallbackCanvas) fallbackCanvas.style.display = "none";
      leafletElements.forEach(el => el.style.display = "none");

      if (this.globe) {
        // Default to Earth so all 20 terrestrial analog candidates are immediately visible and interactive
        const selGlobeBody = document.getElementById("globe-body-select");
        const bodyToSet = selGlobeBody ? selGlobeBody.value : "Earth";
        this.globe.setBody(bodyToSet);

        if (this.selectedCandidate && bodyToSet === "Earth") {
          this.globe.focusOnSite(this.selectedCandidate.lat, this.selectedCandidate.lon);
        } else if (this.currentTarget && bodyToSet !== "Earth") {
          this.globe.focusOnSite(this.currentTarget.lat, this.currentTarget.lon);
        }

        this.globe.startAnimation();
        this.globe.render();
      }
      if (btnToggle) {
        btnToggle.innerHTML = "🗺️ Mapa 2D";
        btnToggle.style.background = "rgba(6, 182, 212, 0.35)";
        btnToggle.classList.add("active");
      }
    } else {
      globeWrapper.style.display = "none";
      if (hud2d) hud2d.style.display = "";
      if (fallbackCanvas && !this.map) fallbackCanvas.style.display = "block";
      leafletElements.forEach(el => el.style.display = "");

      if (this.globe) this.globe.stopAnimation();
      if (this.map) this.map.invalidateSize();
      if (btnToggle) {
        btnToggle.innerHTML = "🌐 3D Oblato";
        btnToggle.style.background = "";
        btnToggle.classList.remove("active");
      }
    }
  }

  initTutorialController() {
    const stepTitles = {
      1: "Paso 1: Misión y Filosofía Científica",
      2: "Paso 2: Selección de Objetivos Lunares y Marcianos",
      3: "Paso 3: Algoritmo de Similitud Gaussiana",
      4: "Paso 4: Evaluación Ética y Ambiental (ODS 13, 14, 15)",
      5: "Paso 5: Simulador AR y Terramecánica",
      6: "Paso 6: Búsqueda Inversa con IA y Exportación"
    };

    const updateStep = (step) => {
      this.currentTutStep = Math.max(1, Math.min(6, step));

      // Hide all step cards, show current
      for (let i = 1; i <= 6; i++) {
        const card = document.getElementById(`tut-step-${i}`);
        if (card) card.classList.toggle("active", i === this.currentTutStep);
      }

      // Update dots
      document.querySelectorAll(".tutorial-step-indicator .step-dot").forEach(dot => {
        const dStep = parseInt(dot.getAttribute("data-step"), 10);
        dot.classList.toggle("active", dStep === this.currentTutStep);
      });

      // Update title and step numbers
      const titleEl = document.getElementById("tutorial-step-title");
      if (titleEl) titleEl.textContent = stepTitles[this.currentTutStep] || `Paso ${this.currentTutStep}`;

      const numEl = document.getElementById("tut-step-num");
      if (numEl) numEl.textContent = this.currentTutStep;

      // Update Prev / Next buttons
      const btnPrev = document.getElementById("btn-tut-prev");
      if (btnPrev) btnPrev.style.visibility = (this.currentTutStep === 1) ? "hidden" : "visible";

      const btnNext = document.getElementById("btn-tut-next");
      if (btnNext) {
        btnNext.textContent = (this.currentTutStep === 6) ? "Finalizar ✓" : "Siguiente ▶";
      }
    };

    const btnPrev = document.getElementById("btn-tut-prev");
    if (btnPrev) {
      btnPrev.onclick = () => updateStep(this.currentTutStep - 1);
    }

    const btnNext = document.getElementById("btn-tut-next");
    if (btnNext) {
      btnNext.onclick = () => {
        if (this.currentTutStep >= 6) {
          const modal = document.getElementById("modal-tutorial");
          if (modal) modal.classList.remove("open");
        } else {
          updateStep(this.currentTutStep + 1);
        }
      };
    }

    // Direct click on step dots
    document.querySelectorAll(".tutorial-step-indicator .step-dot").forEach(dot => {
      dot.onclick = () => {
        const s = parseInt(dot.getAttribute("data-step"), 10);
        if (s) updateStep(s);
      };
    });
  }

  initDocsTabs() {
    document.querySelectorAll(".doc-tab-btn").forEach(btn => {
      btn.onclick = () => {
        const target = btn.getAttribute("data-doctab");
        document.querySelectorAll(".doc-tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".doc-tab-pane").forEach(p => p.classList.remove("active"));

        btn.classList.add("active");
        const activePane = document.getElementById(`pane-${target}`);
        if (activePane) activePane.classList.add("active");
      };
    });
  }

  setSimBody(bodyKey) {
    if (this.arSimulator) {
      this.arSimulator.setBody(bodyKey);
    }
    const map = { Moon: "sim-body-moon", Mars: "sim-body-mars", Earth: "sim-body-earth" };
    Object.entries(map).forEach(([b, id]) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("active", b === bodyKey);
    });
  }

  setSimViewMode(mode) {
    if (this.arSimulator) {
      this.arSimulator.setViewMode(mode);
    }
    const map = {
      SHADED: "sim-mode-shaded",
      THERMAL_IR: "sim-mode-flir",
      SLOPE_HAZARD: "sim-mode-hazard",
      WIREFRAME: "sim-mode-wire"
    };
    Object.entries(map).forEach(([m, id]) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("active", m === mode);
    });
  }

  triggerDrill() {
    if (!this.arSimulator) return;
    this.arSimulator.drillActive = !this.arSimulator.drillActive;
    alert(this.arSimulator.drillActive 
      ? "⚡ Core Drill Activated! Drilling 1.5m regolith core for in-situ mineral extraction..."
      : "⚡ Core Drill Retracted. Sample secured in sealed carousel.");
  }

  triggerRadarScan() {
    if (!this.arSimulator) return;
    this.arSimulator.radarActive = !this.arSimulator.radarActive;
    alert(this.arSimulator.radarActive 
      ? "📡 Ground Penetrating Radar (GPR) active: Transmitting 500 MHz chirps. Subsurface dielectric permittivity mapped to -5m depth."
      : "📡 Ground Penetrating Radar deactivated.");
  }

  initModalTriggers() {
    // AR Simulator Modal
    const btnAr = document.getElementById("btn-open-ar");
    const modalAr = document.getElementById("modal-ar-sim");
    if (btnAr && modalAr) {
      btnAr.onclick = () => {
        modalAr.classList.add("open");
        setTimeout(() => { if (this.arSimulator) this.arSimulator.render(); }, 150);
      };
    }

    // Tutorial Modal
    const btnTutorial = document.getElementById("btn-open-tutorial");
    const modalTutorial = document.getElementById("modal-tutorial");
    if (btnTutorial && modalTutorial) {
      btnTutorial.onclick = () => {
        modalTutorial.classList.add("open");
      };
    }

    // Docs & Architecture Modal
    const btnDocs = document.getElementById("btn-open-docs");
    const modalDocs = document.getElementById("modal-docs");
    if (btnDocs && modalDocs) {
      btnDocs.onclick = () => {
        modalDocs.classList.add("open");
      };
    }

    // Step Rover button in AR modal
    const btnStepRover = document.getElementById("btn-step-rover");
    if (btnStepRover) {
      btnStepRover.onclick = () => {
        if (this.arSimulator) this.arSimulator.stepRover();
      };
    }

    // Event Logger Modal
    const btnEvents = document.getElementById("btn-open-events");
    const modalEvents = document.getElementById("modal-event-logger");
    if (btnEvents && modalEvents) {
      btnEvents.onclick = () => {
        modalEvents.classList.add("open");
      };
    }

    // New Event Submission
    const btnSubmitEvent = document.getElementById("btn-submit-event");
    if (btnSubmitEvent) {
      btnSubmitEvent.onclick = () => {
        this.submitNewEvent();
      };
    }

    // Compare Modal
    const btnCompare = document.getElementById("btn-open-compare");
    const modalCompare = document.getElementById("modal-compare");
    if (btnCompare && modalCompare) {
      btnCompare.onclick = () => {
        this.renderCompareModal();
        modalCompare.classList.add("open");
      };
    }

        // Multi-Disciplinary Map Layers Modal (Section 4.4)
    const btnLayers = document.getElementById("btn-open-layers");
    const modalLayers = document.getElementById("modal-layers");
    if (btnLayers && modalLayers) {
      btnLayers.onclick = () => {
        modalLayers.classList.add("open");
      };
      const closeBtn = modalLayers.querySelector(".close-btn");
      if (closeBtn) closeBtn.onclick = () => modalLayers.classList.remove("open");
      modalLayers.onclick = (e) => {
        if (e.target === modalLayers) modalLayers.classList.remove("open");
      };
    }

    // Checklist Modal (Punto 6: Apple Workflow Checklist)
    const btnChecklist = document.getElementById("btn-open-checklist");
    const modalChecklist = document.getElementById("modal-checklist");
    if (btnChecklist && modalChecklist) {
      btnChecklist.onclick = () => {
        this.renderChecklist();
        modalChecklist.classList.add("open");
      };
    }

    // Close buttons on all modals
    document.querySelectorAll(".modal-overlay .close-btn, .modal-overlay .btn-close").forEach(btn => {
      btn.onclick = (e) => {
        const overlay = e.target.closest(".modal-overlay");
        if (overlay) overlay.classList.remove("open");
      };
    });

    // Apple Sheet/Modal Backdrop Click to dismiss
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.remove("open");
        }
      });
    });

    // Escape key to dismiss any open sheet/modal
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay.open").forEach(m => m.classList.remove("open"));
        const pop = document.querySelector(".apple-popover");
        if (pop) pop.remove();
      }
    });
  }

  initArSimulator() {
    this.arSimulator = new ArSimulator("ar-canvas");
  }

  renderEventsTable() {
    const tableBody = document.getElementById("events-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = TERRA_DATA.events.map(e => `
      <tr>
        <td><strong style="color: #fff;">${e.region_name}</strong></td>
        <td><span class="brand-badge">${e.event_type}</span></td>
        <td><span class="eco-pill ${e.severity === 'CRITICAL' ? 'eco-restricted' : (e.severity === 'HIGH' ? 'eco-high' : 'eco-medium')}">${e.severity}</span></td>
        <td style="font-size: 0.74rem;">${e.description}</td>
        <td style="font-size: 0.74rem; color: #38bdf8;">${e.mitigation}</td>
        <td><span class="score-badge score-high" style="font-size: 0.68rem;">${e.status}</span></td>
      </tr>
    `).join("");
  }

  submitNewEvent() {
    const regionSelect = document.getElementById("evt-region-select");
    const typeSelect = document.getElementById("evt-type-select");
    const severitySelect = document.getElementById("evt-severity-select");
    const descInput = document.getElementById("evt-desc-input");
    const mitigationInput = document.getElementById("evt-mitigation-input");

    if (!descInput || !descInput.value.trim()) {
      alert("Please provide a description of the environmental event.");
      return;
    }

    const regId = regionSelect ? regionSelect.value : "reg_pinacate";
    const cand = TERRA_DATA.candidates.find(c => c.id === regId);

    const newEvt = {
      id: `evt_${Date.now()}`,
      region_id: regId,
      region_name: cand ? cand.name : "Candidate Region",
      event_type: typeSelect ? typeSelect.value : "PREVENTIVE_ALERT",
      severity: severitySelect ? severitySelect.value : "MEDIUM",
      status: "REGISTERED",
      description: descInput.value.trim(),
      activity: "Field Simulation Hardware Testing",
      impact_type: "Regolith compaction & biological crust disturbance",
      reviewer: "Field Planetary Protection Officer",
      observed_at: new Date().toISOString(),
      mitigation: mitigationInput ? mitigationInput.value.trim() : "Standard exclusion perimeter set."
    };

    TERRA_DATA.events.unshift(newEvt);
    this.renderEventsTable();
    descInput.value = "";
    if (mitigationInput) mitigationInput.value = "";

    const modal = document.getElementById("modal-event-logger");
    if (modal) modal.classList.remove("open");
    alert("Environmental Event successfully registered in persistent damage log!");
  }

  renderCompareModal() {
    const container = document.getElementById("compare-container");
    if (!container) return;

    // Pick top 3 candidates to compare
    const topCandidates = this.evaluationResults.slice(0, 3);
    if (topCandidates.length === 0) return;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(${topCandidates.length}, 1fr); gap: 1rem;">
        ${topCandidates.map(c => `
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem;">
            <div style="font-size: 1.05rem; font-weight: 700; color: #fff; margin-bottom: 4px;">${c.candidateName}</div>
            <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 8px;">${c.country} &bull; ${c.regionType}</div>
            <div style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-mono); color: var(--accent-cyan); margin-bottom: 8px;">
              ${c.physicalSimilarity}% Match
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Coverage: <strong>${c.dataCoverage}%</strong></div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px;">Feasibility: <strong>${c.operationalFeasibility}%</strong></div>
            
            <div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px;">Key Variables:</div>
            <div style="font-size: 0.75rem; display: flex; flex-direction: column; gap: 4px;">
              ${c.breakdown.slice(0, 6).map(b => `
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding: 2px 0;">
                  <span style="color: var(--text-muted);">${b.name}</span>
                  <span style="font-family: var(--font-mono); color: #fff;">${b.earthVal !== undefined ? b.earthVal : 'N/A'}</span>
                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  /* ============================================================
     APPLE HIG: LOCATE CANDIDATE ON MAP / GLOBE (Punto 4: Lupa)
     ============================================================ */
  locateCandidateOnMap(candidateId) {
    const candidate = TERRA_DATA.candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    this.selectCandidate(candidateId);

    if (this.isGlobeView && this.globe) {
      const selGlobeBody = document.getElementById("globe-body-select");
      if (selGlobeBody && selGlobeBody.value !== "Earth") {
        selGlobeBody.value = "Earth";
        this.globe.setBody("Earth");
      }
      this.globe.focusOnSite(candidate.lat, candidate.lon);
    } else if (this.map && typeof L !== "undefined") {
      this.map.flyTo([candidate.lat, candidate.lon], 7, { duration: 1.4 });
      if (this.markers[candidateId]) {
        this.markers[candidateId].openPopup();
      }

      // Add temporary radar pulse beacon animation around marker
      if (this.locatePingLayer) {
        this.map.removeLayer(this.locatePingLayer);
      }
      const pingIcon = L.divIcon({
        className: 'apple-ping-beacon',
        html: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.locatePingLayer = L.marker([candidate.lat, candidate.lon], { icon: pingIcon }).addTo(this.map);
      setTimeout(() => {
        if (this.locatePingLayer && this.map) {
          this.map.removeLayer(this.locatePingLayer);
          this.locatePingLayer = null;
        }
      }, 4500);
    }
  }

  /* ============================================================
     APPLE HIG: INFO POPOVER (Punto 5: Botón de Información ⓘ)
     ============================================================ */
  showInfoPopover(type, event) {
    const existing = document.querySelector(".apple-popover");
    if (existing) existing.remove();

    const info = {
      similarity: {
        title: "Gaussian Physical Similarity",
        formula: "s_i = exp(-0.5 · (d_i / τ_i)²)",
        desc: "Cada variable se compara de forma transparente contra el objetivo planetario con tolerancia instrumental (τ). Desviaciones pequeñas no castigan el puntaje drásticamente.",
        rule: "Regla científica: El score físico NUNCA se promedia con viabilidad ni con riesgo ambiental."
      },
      coverage: {
        title: "Data Coverage Index",
        formula: "Cobertura = Σ(w_i · q_i) / Σ(w_total) × 100",
        desc: "Porcentaje de variables requeridas que poseen mediciones satelitales/in-situ reales y calibradas.",
        rule: "If sensor data coverage is below 60%, the candidate is automatically assigned PROVISIONAL status."
      },
      feasibility: {
        title: "Viabilidad Operativa",
        formula: "Score = 85 - Penalizaciones(Pendiente, Rugosidad)",
        desc: "Evaluates surface slope and terrain roughness for rover traverse and field equipment safety.",
        rule: "Pendiente > 20° resta 30 pts; > 12° resta 15 pts; rugosidad > 0.4 resta 20 pts."
      },
      environment: {
        title: "Evaluación Ambiental y ODS",
        formula: "Cruce espacial con WDPA / UNEP-WCMC (ODS 13, 14, 15)",
        desc: "Intersección ética con la Base Mundial de Áreas Protegidas y hábitats críticos.",
        rule: "High physical similarity does NOT grant field authorization. Protected areas require RESTRICTED_REVIEW."
      }
    };

    const item = info[type] || { title: "Información Contextual", formula: "", desc: "Detalle científico del parámetro.", rule: "" };

    const popover = document.createElement("div");
    popover.className = "apple-popover";
    popover.innerHTML = `
      <h5>
        <span>ⓘ</span> ${item.title}
      </h5>
      ${item.formula ? `<div class="apple-popover-formula">${item.formula}</div>` : ""}
      <p style="margin: 4px 0 6px 0; color: #cbd5e1; font-size: 0.74rem; line-height: 1.45;">${item.desc}</p>
      ${item.rule ? `<div style="font-size: 0.68rem; color: #38bdf8; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;"><strong>Nota:</strong> ${item.rule}</div>` : ""}
    `;

    document.body.appendChild(popover);

    const rect = event.target.getBoundingClientRect();
    const popWidth = 300;
    let left = rect.left + (rect.width / 2) - (popWidth / 2);
    if (left + popWidth > window.innerWidth - 12) left = window.innerWidth - popWidth - 12;
    if (left < 12) left = 12;

    popover.style.position = "fixed";
    popover.style.top = `${rect.bottom + 8}px`;
    popover.style.left = `${left}px`;
    popover.style.zIndex = "2000";

    const dismissHandler = (e) => {
      if (!popover.contains(e.target) && e.target !== event.target) {
        popover.remove();
        document.removeEventListener("click", dismissHandler);
      }
    };
    setTimeout(() => document.addEventListener("click", dismissHandler), 40);
  }


  /* ============================================================
     APPLE HIG: CHECKLIST CONTROLLER (Punto 6: Listado de Optimización)
     ============================================================ */
  initChecklistController() {
    // Define checklist items
    this.checklistItems = [
      { id: "chk_target", title: "Seleccionar Objetivo Planetario", desc: "Elegir perfil de Luna o Marte para la comparación." },
      { id: "chk_filters", title: "Configure Scientific Filters", desc: "Tune maximum slope, minimum data coverage and planetary environment types." },
      { id: "chk_analysis", title: "Execute Similarity Engine", desc: "Compute multi-objective τ-weighted Gaussian decay matrix for all candidate sites." },
      { id: "chk_inspect", title: "Inspect Top 3 Analog Candidates", desc: "Review multi-dimensional physical variable breakdown and sensor coverage." },
      { id: "chk_env", title: "Verificar Evaluación Ambiental", desc: "Confirmar estatus ODS 13, 14, 15 y WDPA antes de recomendar." },
      { id: "chk_compare", title: "Side-by-Side Comparison", desc: "Perform multi-candidate benchmark across all physical and topographic dimensions." },
      { id: "chk_export", title: "Export OGC GeoJSON Dossier", desc: "Download validated analog site with full scientific provenance and coordinate reference." }
    ];

    // Load saved state from localStorage
    try {
      const saved = localStorage.getItem("terraanalog_checklist");
      this.checklistState = saved ? JSON.parse(saved) : {};
    } catch (e) {
      this.checklistState = {};
    }

    this.renderChecklist();

    // Wire up checklist buttons
    const btnReset = document.getElementById("btn-reset-checklist");
    if (btnReset) {
      btnReset.onclick = () => {
        this.checklistState = {};
        localStorage.removeItem("terraanalog_checklist");
        this.renderChecklist();
      };
    }

    const btnCompleteAll = document.getElementById("btn-complete-all-checklist");
    if (btnCompleteAll) {
      btnCompleteAll.onclick = () => {
        this.checklistItems.forEach(item => { this.checklistState[item.id] = true; });
        localStorage.setItem("terraanalog_checklist", JSON.stringify(this.checklistState));
        this.renderChecklist();
      };
    }
  }

  toggleChecklistItem(itemId) {
    this.checklistState[itemId] = !this.checklistState[itemId];
    localStorage.setItem("terraanalog_checklist", JSON.stringify(this.checklistState));
    this.renderChecklist();
  }

  renderChecklist() {
    const container = document.getElementById("checklist-items-container");
    if (!container || !this.checklistItems) return;

    const completedCount = this.checklistItems.filter(i => this.checklistState[i.id]).length;
    const total = this.checklistItems.length;
    const pct = Math.round((completedCount / total) * 100);

    // Update progress
    const progressText = document.getElementById("checklist-progress-text");
    if (progressText) progressText.textContent = `${completedCount} / ${total} completed (${pct}%)`;

    const progressBar = document.getElementById("checklist-progress-bar");
    if (progressBar) progressBar.style.width = `${pct}%`;

    container.innerHTML = this.checklistItems.map((item, idx) => {
      const done = this.checklistState[item.id];
      return `
        <div class="apple-checklist-item ${done ? 'completed' : ''}" onclick="window.terraApp.toggleChecklistItem('${item.id}')">
          <div class="apple-checklist-checkbox">${done ? '✓' : (idx + 1)}</div>
          <div>
            <div class="apple-checklist-title">${item.title}</div>
            <div class="apple-checklist-desc">${item.desc}</div>
          </div>
        </div>
      `;
    }).join("");
  }
}

// Global bootstrap on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.terraApp = new TerraAnalogApp();
});
