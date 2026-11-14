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
    this.initEventListeners();
    this.initArSimulator();
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
    const mapContainer = document.getElementById("map-viewport");
    if (!mapContainer) return;

    if (typeof L === "undefined") {
      console.warn("Leaflet library not loaded (offline or CDN blocked). Activating Vector Canvas Fallback World Map.");
      this.initCanvasFallbackMap();
      return;
    }

    try {
      // Initialize Leaflet Map centered on world view
      this.map = L.map("map-viewport", {
        center: [20.0, 0.0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 14,
        zoomControl: false,
        attributionControl: true
      });

      L.control.zoom({ position: "bottomright" }).addTo(this.map);

      // 1. Dark Matter Tile Layer (Default)
      this.tileLayers.dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> & NASA ESDIS',
        subdomains: 'abcd',
        maxZoom: 19
      });

      // 2. High-Resolution Satellite Tile Layer
      this.tileLayers.satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics, NASA',
        maxZoom: 18
      });

      this.tileLayers.dark.addTo(this.map);

      // Track mouse coordinates in HUD
      this.map.on("mousemove", (e) => {
        const latEl = document.getElementById("hud-lat");
        const lonEl = document.getElementById("hud-lon");
        if (latEl && lonEl) {
          latEl.textContent = e.latlng.lat.toFixed(3);
          lonEl.textContent = e.latlng.lng.toFixed(3);
        }
      });

      // Invalidate size on window resize
      window.addEventListener("resize", () => {
        if (this.map) this.map.invalidateSize();
      });

    } catch (err) {
      console.warn("Error initializing Leaflet map, falling back to Canvas Map:", err);
      this.initCanvasFallbackMap();
    }
  }

  toggleBasemap() {
    if (!this.map || !this.tileLayers.dark || !this.tileLayers.satellite) return;
    if (this.currentBasemap === "dark") {
      this.map.removeLayer(this.tileLayers.dark);
      this.tileLayers.satellite.addTo(this.map);
      this.currentBasemap = "satellite";
    } else {
      this.map.removeLayer(this.tileLayers.satellite);
      this.tileLayers.dark.addTo(this.map);
      this.currentBasemap = "dark";
    }
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

  runAnalysis() {
    if (!this.currentTarget) return;

    // Run scientific matching for all candidates
    this.evaluationResults = TERRA_DATA.candidates.map(candidate => {
      return SCIENTIFIC_ENGINE.evaluateCandidate(candidate, this.currentTarget);
    });

    // Filter by active category if not ALL
    let displayResults = [...this.evaluationResults];
    if (this.activeCategory !== "ALL") {
      displayResults = displayResults.filter(r => r.regionType.toLowerCase() === this.activeCategory.toLowerCase());
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

    results.forEach((res, idx) => {
      const card = document.createElement("div");
      card.className = `candidate-card ${this.selectedCandidate && this.selectedCandidate.id === res.candidateId ? 'active' : ''}`;
      card.onclick = () => this.selectCandidate(res.candidateId);

      let scoreClass = "score-low";
      let barColor = "#f43f5e";
      if (res.physicalSimilarity >= 85) { scoreClass = "score-high"; barColor = "#10b981"; }
      else if (res.physicalSimilarity >= 70) { scoreClass = "score-moderate"; barColor = "#38bdf8"; }
      else if (res.physicalSimilarity >= 50) { scoreClass = "score-partial"; barColor = "#f59e0b"; }

      let ecoClass = "eco-low";
      if (res.environmentalRisk === "RESTRICTED_REVIEW") ecoClass = "eco-restricted";
      else if (res.environmentalRisk === "HIGH_ALERT") ecoClass = "eco-high";
      else if (res.environmentalRisk === "MEDIUM_ALERT") ecoClass = "eco-medium";

      card.innerHTML = `
        <div class="card-header">
          <div>
            <div class="card-title">#${idx + 1} ${res.candidateName}</div>
            <div class="card-meta">${res.country} &bull; ${res.regionType} &bull; ${res.elevation}m elev.</div>
          </div>
          <div class="score-badge ${scoreClass}">
            ${res.physicalSimilarity}%
          </div>
        </div>
        <div class="card-mini-bar-bg">
          <div class="card-mini-bar-fill" style="width: ${res.physicalSimilarity}%; background: ${barColor};"></div>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center; font-size: 0.72rem; margin-top: 3px;">
          <span style="color: var(--text-dim);">Coverage: ${res.dataCoverage}%</span>
          ${res.isProvisional ? '<span class="provisional-badge">Provisional</span>' : ''}
          <span style="margin-left: auto;" class="eco-pill ${ecoClass}">${res.environmentalRisk}</span>
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

    // Candidate Header & Badges
    const titleEl = document.getElementById("inspector-title");
    const metaEl = document.getElementById("inspector-meta");
    const descEl = document.getElementById("inspector-desc");
    const simScoreEl = document.getElementById("inspector-sim-score");
    const covScoreEl = document.getElementById("inspector-cov-score");
    const feasScoreEl = document.getElementById("inspector-feas-score");
    const classBadgeEl = document.getElementById("inspector-classification");

    if (titleEl) titleEl.textContent = res.candidateName;
    if (metaEl) metaEl.textContent = `${res.country} | Type: ${res.regionType} | Elevation: ${res.elevation}m | Area: ${this.selectedCandidate.area_km2} km²`;
    if (descEl) descEl.textContent = this.selectedCandidate.desc;
    if (simScoreEl) simScoreEl.textContent = `${res.physicalSimilarity}%`;
    if (covScoreEl) covScoreEl.textContent = `${res.dataCoverage}%`;
    if (feasScoreEl) feasScoreEl.textContent = `${res.operationalFeasibility}%`;
    if (classBadgeEl) {
      classBadgeEl.textContent = res.classification;
      classBadgeEl.className = res.isProvisional ? "provisional-badge" : "brand-badge";
    }

    // Dimensional Scores Progress Bars
    const dimContainer = document.getElementById("dimensions-container");
    if (dimContainer) {
      dimContainer.innerHTML = Object.entries(res.dimensionScores).map(([dim, score]) => `
        <div style="display: flex; flex-direction: column; gap: 3px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.73rem; text-transform: uppercase;">
            <span style="color: var(--text-muted); font-weight: 500;">${dim}</span>
            <span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan);">${score}%</span>
          </div>
          <div style="height: 6px; background: var(--bg-input); border-radius: 3px; overflow: hidden;">
            <div style="width: ${score}%; height: 100%; background: linear-gradient(90deg, #0284c7, #38bdf8);"></div>
          </div>
        </div>
      `).join("");
    }

    // Variable Breakdown Table
    const tbody = document.getElementById("breakdown-table-body");
    if (tbody) {
      tbody.innerHTML = res.breakdown.map(item => {
        const isEval = item.status === "EVALUATED";
        return `
          <tr>
            <td>
              <div style="font-weight: 600; color: #fff;">${item.name}</div>
              <div style="font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase;">${item.category}</div>
            </td>
            <td class="val-num" style="color: #38bdf8;">${item.earthVal !== undefined ? item.earthVal : 'N/A'}</td>
            <td class="val-num" style="color: #f59e0b;">${item.targetVal !== undefined ? item.targetVal : 'N/A'}</td>
            <td class="val-num">${isEval && item.delta !== undefined ? item.delta.toFixed(2) : '-'}</td>
            <td class="val-num" style="font-weight: 700; color: ${isEval ? (item.similarity > 75 ? '#34d399' : '#fbbf24') : '#f43f5e'};">
              ${isEval ? `${item.similarity}%` : '<span style="font-size: 0.68rem; color: #f43f5e;">NO DATA</span>'}
            </td>
          </tr>
        `;
      }).join("");
    }

    // Environmental Assessment Card (SDG 13, 14, 15)
    const env = this.selectedCandidate.env;
    const envContainer = document.getElementById("inspector-env-card");
    if (envContainer && env) {
      let riskBorder = "#10b981";
      if (env.risk_level === "RESTRICTED_REVIEW") riskBorder = "#f43f5e";
      else if (env.risk_level === "HIGH_ALERT") riskBorder = "#fb7185";
      else if (env.risk_level === "MEDIUM_ALERT") riskBorder = "#f59e0b";

      envContainer.innerHTML = `
        <div style="border-left: 3px solid ${riskBorder}; padding-left: 10px; display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; font-weight: 700; color: ${riskBorder};">${env.risk_level}</span>
            <span style="font-size: 0.7rem; color: var(--text-dim);">Protected Planet (WDPA)</span>
          </div>
          <div style="font-size: 0.8rem; color: #fff;"><strong>Protected Area:</strong> ${env.pa_name} (IUCN: ${env.iucn})</div>
          <div style="font-size: 0.74rem; color: var(--text-muted);"><strong>SDG 13 (Climate Action):</strong> ${env.sdg13}</div>
          <div style="font-size: 0.74rem; color: var(--text-muted);"><strong>SDG 14 (Life Below Water):</strong> ${env.sdg14}</div>
          <div style="font-size: 0.74rem; color: var(--text-muted);"><strong>SDG 15 (Life on Land):</strong> ${env.sdg15}</div>
          <div style="margin-top: 4px; padding: 6px; background: rgba(0,0,0,0.3); border-radius: 4px; font-size: 0.74rem; color: #38bdf8;">
            <strong>Ethical Recommendation:</strong> ${env.recommendation}
          </div>
        </div>
      `;
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

  initModalTriggers() {
    // AR Simulator Modal
    const btnAr = document.getElementById("btn-open-ar");
    const modalAr = document.getElementById("modal-ar-simulator");
    if (btnAr && modalAr) {
      btnAr.onclick = () => {
        modalAr.classList.add("open");
        setTimeout(() => { if (this.arSimulator) this.arSimulator.render(); }, 150);
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

    // Close buttons on all modals
    document.querySelectorAll(".modal-overlay .close-btn, .modal-overlay .btn-close").forEach(btn => {
      btn.onclick = (e) => {
        const overlay = e.target.closest(".modal-overlay");
        if (overlay) overlay.classList.remove("open");
      };
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
}

// Global bootstrap on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.terraApp = new TerraAnalogApp();
});
