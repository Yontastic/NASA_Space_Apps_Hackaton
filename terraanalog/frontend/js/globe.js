/**
 * TerraAnalog - 3D Oblate Spheroid (Esferoide Oblato) Planetary Engine
 * 
 * Mathematical Model:
 * Ellipsoid of revolution flattened at the poles due to centrifugal rotation:
 * b = a * (1 - f)
 * where:
 *   a = Equatorial radius (semi-major axis)
 *   b = Polar radius (semi-minor axis)
 *   f = Flattening factor = (a - b) / a
 *   e = First eccentricity = sqrt(2f - f^2)
 * 
 * Parametric mapping from Geodetic Coordinates (lat phi, lon lambda) to 3D Cartesian:
 *   X = a * cos(phi) * sin(lambda)
 *   Y = -a * (1 - f * exaggeration) * sin(phi)
 *   Z = a * cos(phi) * cos(lambda)
 */

class OblateSpheroidGlobe {
  constructor(canvasId, appInstance) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.app = appInstance;

    // Camera and interaction state
    this.yaw = 0.4;          // Radians (longitude rotation)
    this.pitch = 0.35;       // Radians (latitude tilt)
    this.zoom = 1.0;
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.autoRotate = true;
    this.autoRotateSpeed = 0.002;
    this.exaggeration = 10.0; // Visual flattening exaggeration factor (default 10x for visual clarity)

    // Current celestial body definitions
    this.bodies = {
      Earth: {
        name: "Earth (WGS84)",
        a: 6378.137,     // km
        b: 6356.752,     // km
        f: 1 / 298.257223563, // ~0.0033528
        colorAtmosphere: "rgba(56, 189, 248, 0.25)",
        colorBody: "#0d2038",
        colorGrid: "rgba(56, 189, 248, 0.35)",
        colorLand: "rgba(34, 75, 50, 0.75)",
        strokeLand: "rgba(74, 222, 128, 0.5)"
      },
      Mars: {
        name: "Mars (IAU 2000)",
        a: 3396.2,       // km
        b: 3376.2,       // km
        f: 0.0058889,    // Mars flattening
        colorAtmosphere: "rgba(244, 63, 94, 0.25)",
        colorBody: "#2a120c",
        colorGrid: "rgba(251, 146, 60, 0.35)",
        colorLand: "rgba(124, 45, 18, 0.75)",
        strokeLand: "rgba(251, 146, 60, 0.5)"
      },
      Moon: {
        name: "Moon (IAU 2000)",
        a: 1738.1,       // km
        b: 1736.0,       // km
        f: 0.0012082,    // Moon flattening (nearly spherical)
        colorAtmosphere: "rgba(148, 163, 184, 0.15)",
        colorBody: "#1a1e24",
        colorGrid: "rgba(148, 163, 184, 0.35)",
        colorLand: "rgba(71, 85, 105, 0.75)",
        strokeLand: "rgba(203, 213, 225, 0.5)"
      }
    };

    this.currentBodyKey = "Earth";
    this.animId = null;

    // Simplified polygon data for Earth continents (lat, lon)
    this.continents = [
      // North America
      [[65, -165], [70, -140], [75, -95], [60, -60], [25, -80], [20, -105], [35, -120], [60, -165], [65, -165]],
      // South America
      [[10, -80], [-5, -50], [-10, -35], [-40, -55], [-55, -70], [-20, -75], [10, -80]],
      // Eurasia
      [[35, -10], [40, 20], [60, 40], [70, 100], [65, 170], [35, 140], [20, 105], [10, 75], [25, 50], [30, 30], [35, -10]],
      // Africa
      [[30, -15], [30, 30], [12, 50], [-10, 40], [-35, 30], [-34, 15], [5, 10], [15, -15], [30, -15]],
      // Australia
      [[-20, 115], [-15, 145], [-35, 150], [-35, 130], [-30, 115], [-20, 115]],
      // Antarctica
      [[-70, -180], [-65, -90], [-68, 0], [-65, 90], [-70, 180]]
    ];

    this.initEvents();
  }

  setBody(bodyKey) {
    if (this.bodies[bodyKey]) {
      this.currentBodyKey = bodyKey;
      this.updateHUD();
      this.render();
    }
  }

  setExaggeration(val) {
    this.exaggeration = parseFloat(val);
    this.updateHUD();
    this.render();
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;

      this.yaw += dx * 0.006;
      this.pitch += dy * 0.006;

      // Clamp pitch to avoid gimbal flipping
      const maxPitch = Math.PI / 2 - 0.05;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

      this.prevMouse = { x: e.clientX, y: e.clientY };
      this.render();
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.zoom = Math.max(0.5, Math.min(3.5, this.zoom * zoomFactor));
      this.render();
    }, { passive: false });

    // Click on candidate site marker
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      this.handleClick(clickX, clickY);
    });
  }

  startAnimation() {
    const loop = () => {
      if (this.autoRotate) {
        this.yaw += this.autoRotateSpeed;
      }
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    if (!this.animId) {
      this.animId = requestAnimationFrame(loop);
    }
  }

  stopAnimation() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  /**
   * Transforms Geodetic (lat, lon) to 3D Cartesian coordinates on the Oblate Spheroid.
   * Then projects to 2D Screen space with 3D camera rotation and perspective.
   */
  projectOblate(latDeg, lonDeg, radiusBase, width, height) {
    const latRad = (latDeg * Math.PI) / 180;
    const lonRad = (lonDeg * Math.PI) / 180;

    const body = this.bodies[this.currentBodyKey];
    const effectiveFlattening = Math.min(0.25, body.f * this.exaggeration);
    const bScale = 1 - effectiveFlattening;

    // 1. Cartesian Coordinates on Oblate Spheroid
    // Equatorial radius = radiusBase, Polar radius = radiusBase * bScale
    const x0 = radiusBase * Math.cos(latRad) * Math.sin(lonRad);
    const y0 = -radiusBase * bScale * Math.sin(latRad);
    const z0 = radiusBase * Math.cos(latRad) * Math.cos(lonRad);

    // 2. Camera Rotation: Yaw (longitude) then Pitch (latitude tilt)
    // Yaw around Y axis
    const x1 = x0 * Math.cos(this.yaw) + z0 * Math.sin(this.yaw);
    const y1 = y0;
    const z1 = -x0 * Math.sin(this.yaw) + z0 * Math.cos(this.yaw);

    // Pitch around X axis
    const x2 = x1;
    const y2 = y1 * Math.cos(this.pitch) - z1 * Math.sin(this.pitch);
    const z2 = y1 * Math.sin(this.pitch) + z1 * Math.cos(this.pitch);

    // 3. Perspective Projection
    const camDist = radiusBase * 4.0;
    const fovScale = camDist / (camDist + z2);

    const screenX = (width / 2) + x2 * fovScale * this.zoom;
    const screenY = (height / 2) + y2 * fovScale * this.zoom;

    return {
      x: screenX,
      y: screenY,
      z: z2,          // Positive = facing camera, Negative = behind globe
      visible: z2 > 0,
      scale: fovScale * this.zoom
    };
  }

  render() {
    if (!this.canvas || !this.ctx) return;
    const width = this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    const height = this.canvas.height = this.canvas.parentElement.clientHeight || 500;
    const ctx = this.ctx;

    const body = this.bodies[this.currentBodyKey];
    const radius = Math.min(width, height) * 0.36;
    const effectiveFlattening = Math.min(0.25, body.f * this.exaggeration);
    const bScale = 1 - effectiveFlattening;

    // Clear background (Deep Space)
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, width, height);

    // Background Stars
    this.renderStars(ctx, width, height);

    // Atmospheric Glow Halo behind ellipsoid
    const glowGrad = ctx.createRadialGradient(
      width / 2, height / 2, radius * 0.7 * this.zoom,
      width / 2, height / 2, radius * 1.35 * this.zoom
    );
    glowGrad.addColorStop(0, body.colorAtmosphere);
    glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius * 1.35 * this.zoom, 0, Math.PI * 2);
    ctx.fill();

    // 1. Render Base Oblate Spheroid (Ellipsoid Shading)
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(this.pitch * 0.15); // Subtle axial tilt alignment

    const bodyGrad = ctx.createRadialGradient(
      -radius * 0.3 * this.zoom, -radius * 0.3 * this.zoom, radius * 0.1 * this.zoom,
      0, 0, radius * this.zoom
    );
    bodyGrad.addColorStop(0, "#1e3a5f");
    bodyGrad.addColorStop(0.5, body.colorBody);
    bodyGrad.addColorStop(1, "#020408");

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = body.strokeLand;
    ctx.lineWidth = 1.5;

    // Draw main oblate silhouette (scaled ellipse)
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * this.zoom, radius * bScale * this.zoom, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. Render Graticule: Parallels (Latitudes)
    const latSteps = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];
    latSteps.forEach(lat => {
      ctx.beginPath();
      let firstPoint = true;
      const isEquator = lat === 0;
      const isTropic = Math.abs(lat) === 23.5;

      ctx.strokeStyle = isEquator ? "rgba(56, 189, 248, 0.85)" : 
                       (isTropic ? "rgba(251, 146, 60, 0.6)" : body.colorGrid);
      ctx.lineWidth = isEquator ? 1.8 : 0.9;
      if (isTropic) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);

      for (let lon = -180; lon <= 180; lon += 5) {
        const p = this.projectOblate(lat, lon, radius, width, height);
        if (p.visible) {
          if (firstPoint) { ctx.moveTo(p.x, p.y); firstPoint = false; }
          else { ctx.lineTo(p.x, p.y); }
        } else {
          firstPoint = true;
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 3. Render Graticule: Meridians (Longitudes)
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath();
      let firstPoint = true;
      const isPrime = lon === 0;

      ctx.strokeStyle = isPrime ? "rgba(234, 179, 8, 0.8)" : body.colorGrid;
      ctx.lineWidth = isPrime ? 1.6 : 0.8;

      for (let lat = -90; lat <= 90; lat += 4) {
        const p = this.projectOblate(lat, lon, radius, width, height);
        if (p.visible) {
          if (firstPoint) { ctx.moveTo(p.x, p.y); firstPoint = false; }
          else { ctx.lineTo(p.x, p.y); }
        } else {
          firstPoint = true;
        }
      }
      ctx.stroke();
    }

    // 4. Render Continents on Oblate Spheroid (if Earth)
    if (this.currentBodyKey === "Earth") {
      this.continents.forEach(cont => {
        ctx.beginPath();
        let anyVisible = false;
        let started = false;

        cont.forEach(([lat, lon]) => {
          const p = this.projectOblate(lat, lon, radius, width, height);
          if (p.visible) {
            anyVisible = true;
            if (!started) { ctx.moveTo(p.x, p.y); started = true; }
            else { ctx.lineTo(p.x, p.y); }
          }
        });

        if (anyVisible) {
          ctx.strokeStyle = body.strokeLand;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.fillStyle = body.colorLand;
          ctx.fill();
        }
      });
    }

    // 5. Render Candidate Analog Sites in 3D
    this.renderedSites = [];
    const candidates = (typeof TERRA_DATA !== "undefined" && TERRA_DATA.candidates) ? TERRA_DATA.candidates : [];

    candidates.forEach(c => {
      const p = this.projectOblate(c.lat, c.lon, radius, width, height);
      if (p.visible) {
        const isSelected = this.app && this.app.selectedCandidate && this.app.selectedCandidate.id === c.id;

        // Save screen coords for click detection
        this.renderedSites.push({
          candidate: c,
          x: p.x,
          y: p.y,
          radius: isSelected ? 9 : 6
        });

        // Altitude beacon pin
        const pHigh = this.projectOblate(c.lat, c.lon, radius * 1.08, width, height);
        ctx.strokeStyle = isSelected ? "#38bdf8" : "rgba(56, 189, 248, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(pHigh.x, pHigh.y);
        ctx.stroke();

        // Pulsing head circle
        ctx.fillStyle = isSelected ? "#38bdf8" : "#fbbf24";
        ctx.beginPath();
        ctx.arc(pHigh.x, pHigh.y, isSelected ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Site Name Label
        ctx.fillStyle = isSelected ? "#ffffff" : "#cbd5e1";
        ctx.font = isSelected ? "bold 11px sans-serif" : "10px sans-serif";
        ctx.fillText(c.name, pHigh.x + 8, pHigh.y + 3);
      }
    });

    // 6. Day/Night Solar Terminator Shadow
    this.renderTerminator(ctx, width, height, radius, bScale);

    // 7. Update HUD parameters
    this.updateHUD();
  }

  renderStars(ctx, width, height) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    // Deterministic pseudo-stars
    for (let i = 0; i < 45; i++) {
      const sx = ((i * 137.5) % width);
      const sy = ((i * 293.7) % height);
      const size = (i % 3 === 0) ? 1.5 : 0.9;
      ctx.fillRect(sx, sy, size, size);
    }
  }

  renderTerminator(ctx, width, height, radius, bScale) {
    // Semi-transparent night shadow on eastern limb
    const shadowGrad = ctx.createLinearGradient(
      width / 2 - radius * 0.3 * this.zoom, 0,
      width / 2 + radius * 1.05 * this.zoom, 0
    );
    shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    shadowGrad.addColorStop(0.65, "rgba(2, 6, 23, 0.55)");
    shadowGrad.addColorStop(1, "rgba(2, 6, 23, 0.88)");

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * this.zoom, radius * bScale * this.zoom, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = shadowGrad;
    ctx.fillRect(-radius * this.zoom, -radius * this.zoom, radius * 2 * this.zoom, radius * 2 * this.zoom);
    ctx.restore();
  }

  handleClick(clickX, clickY) {
    if (!this.renderedSites) return;
    for (let i = this.renderedSites.length - 1; i >= 0; i--) {
      const item = this.renderedSites[i];
      const dist = Math.hypot(clickX - item.x, clickY - item.y);
      if (dist <= 14) {
        if (this.app && typeof this.app.selectCandidate === "function") {
          this.app.selectCandidate(item.candidate.id);
        }
        // Smoothly rotate camera towards clicked site
        this.focusOnSite(item.candidate.lat, item.candidate.lon);
        return;
      }
    }
  }

  focusOnSite(latDeg, lonDeg) {
    const targetYaw = -(lonDeg * Math.PI) / 180;
    const targetPitch = (latDeg * Math.PI) / 180 * 0.4;
    this.yaw = targetYaw;
    this.pitch = Math.max(-0.8, Math.min(0.8, targetPitch));
    this.render();
  }

  updateHUD() {
    const body = this.bodies[this.currentBodyKey];
    const effFlattening = body.f * this.exaggeration;
    const bEff = body.a * (1 - Math.min(0.5, effFlattening));
    const ecc = Math.sqrt(Math.max(0, 2 * body.f - body.f * body.f));
    const volumeKm3 = (4 / 3) * Math.PI * Math.pow(body.a, 2) * body.b;

    const elBody = document.getElementById("globe-hud-body");
    const elMajor = document.getElementById("globe-hud-major");
    const elMinor = document.getElementById("globe-hud-minor");
    const elFlat = document.getElementById("globe-hud-flat");
    const elEcc = document.getElementById("globe-hud-ecc");
    const elVol = document.getElementById("globe-hud-vol");
    const elExagg = document.getElementById("globe-hud-exagg");

    if (elBody) elBody.textContent = body.name;
    if (elMajor) elMajor.textContent = `${body.a.toFixed(1)} km`;
    if (elMinor) elMinor.textContent = `${body.b.toFixed(1)} km`;
    if (elFlat) elFlat.textContent = `1/${(1 / body.f).toFixed(2)} (${body.f.toFixed(6)})`;
    if (elEcc) elEcc.textContent = ecc.toFixed(5);
    if (elVol) elVol.textContent = `${volumeKm3.toExponential(3)} km³`;
    if (elExagg) elExagg.textContent = `${this.exaggeration}x`;
  }
}

// Global exposure
window.OblateSpheroidGlobe = OblateSpheroidGlobe;
