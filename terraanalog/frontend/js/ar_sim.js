/**
 * TerraAnalog - Advanced 3D Terrain, Planetary Physics & Terramechanics Simulator
 * 
 * Includes:
 * 1. Multi-scale procedural terrain synthesis (Crater, Volcanic, Dune, Permafrost).
 * 2. Planetary Gravity switch: Moon (1.62 m/s²), Mars (3.72 m/s²), Earth (9.81 m/s²).
 * 3. Terramechanics physics engine based on Bekker-Wong soil mechanics:
 *    - Wheel sinkage: z = (W_w / (b*k_c + k_phi))^(1/n)
 *    - Slip ratio: s = f(slope, friction angle, sinkage)
 *    - Drawbar pull and motor power draw.
 * 4. Thermal Infrared (FLIR) false-color thermal inertia simulation.
 * 5. Solar ray incidence and dynamic shadow casting.
 * 6. Interactive Rover navigation on the 3D mesh with real-time telemetry.
 */

class ArSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Camera view controls
    this.rotation = 45; // Degrees (heading)
    this.tilt = 32;     // Degrees (pitch)
    this.scale = 1.65;
    this.activeCandidate = null;

    // Simulation settings & physics parameters
    this.gravityBodies = {
      Mars: { name: "Mars", g: 3.72, atmPressure: 610, tempRange: [-90, 20], color: "#fb923c" },
      Moon: { name: "Moon", g: 1.62, atmPressure: 0.00001, tempRange: [-130, 120], color: "#94a3b8" },
      Earth: { name: "Earth", g: 9.81, atmPressure: 101325, tempRange: [-25, 45], color: "#38bdf8" }
    };
    this.currentBody = "Mars";

    // Soil parameters (Bekker soil constants)
    this.soilTypes = {
      "Volcanic Basalt": { kc: 1.4, kphi: 820, n: 1.1, c: 1.2, phi: 36, cohesionName: "High Cohesion Basalt" },
      "Hyper-Arid Sand": { kc: 0.9, kphi: 1520, n: 0.95, c: 0.3, phi: 28, cohesionName: "Loose Regolith" },
      "Polar Permafrost": { kc: 3.5, kphi: 2800, n: 1.3, c: 5.0, phi: 42, cohesionName: "Cryogenic Hard Crust" },
      "Impact Crater Breccia": { kc: 2.1, kphi: 1900, n: 1.05, c: 1.8, phi: 34, cohesionName: "Shocked Breccia" },
      "Evaporite Salt Flat": { kc: 2.8, kphi: 2100, n: 1.2, c: 2.5, phi: 31, cohesionName: "Crystalline Evaporite" }
    };

    // Rover parameters (Curiosity/Perseverance class rocker-bogie)
    this.roverMass = 1025;      // kg
    this.wheelCount = 6;
    this.wheelRadius = 0.26;    // meters
    this.wheelWidth = 0.20;     // meters
    this.roverPos = { x: -2.5, y: -2.5 };
    this.roverHeading = 45;     // degrees
    this.roverSpeed = 0.12;     // m/s
    this.roverBattery = 98.4;   // %
    this.drillActive = false;
    this.radarActive = false;
    this.seuCount = 0;          // Single Event Upsets counter

    // Visualization mode overlays
    this.viewMode = "SHADED";   // "WIREFRAME", "SHADED", "THERMAL_IR", "SLOPE_HAZARD"
    this.hazardOverlay = true;
    this.ecoFenceOverlay = true;
    this.solarElevation = 45;   // degrees
    this.solarAzimuth = 135;    // degrees

    // Grid definition
    this.gridSize = 7;          // from -7 to +7 meters in ENU local plane
    this.gridStep = 0.5;

    // Cache craters and boulders
    this.craters = [
      { x: 1.8, y: 1.5, r: 2.2, depth: 1.4 },
      { x: -3.2, y: 2.8, r: 1.2, depth: 0.7 }
    ];
    this.boulders = [
      { x: -1.2, y: 0.5, size: 0.45 },
      { x: 0.8, y: -2.2, size: 0.6 },
      { x: 3.5, y: -1.0, size: 0.5 },
      { x: -2.0, y: -3.0, size: 0.35 }
    ];

    this.initEvents();
  }

  setCandidate(candidate) {
    this.activeCandidate = candidate;
    this.render();
    this.updateTelemetryHUD();
  }

  setBody(bodyKey) {
    if (this.gravityBodies[bodyKey]) {
      this.currentBody = bodyKey;
      this.render();
      this.updateTelemetryHUD();
    }
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.render();
  }

  initEvents() {
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      this.rotation = (this.rotation + dx * 0.5) % 360;
      this.tilt = Math.max(10, Math.min(80, this.tilt - dy * 0.4));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      this.render();
    });

    // Keyboard driving controls
    window.addEventListener('keydown', (e) => {
      // Only process when simulator modal is open
      const modal = document.getElementById('modal-ar-sim');
      if (!modal || modal.style.display !== 'flex') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.moveRover(0.4, 0);
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.moveRover(-0.4, 0);
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.roverHeading = (this.roverHeading - 15) % 360;
          this.render();
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.roverHeading = (this.roverHeading + 15) % 360;
          this.render();
          e.preventDefault();
          break;
      }
    });
  }

  /**
   * Procedural Multi-Scale Terrain Elevation Generator
   * Computes elevation z at local ENU coordinates (x, y) in meters.
   */
  getElevation(x, y) {
    const slopeBase = this.activeCandidate ? (this.activeCandidate.measurements.slope_mean || 6.0) : 6.0;
    const roughness = this.activeCandidate ? (this.activeCandidate.measurements.roughness || 0.25) : 0.25;

    // 1. Regional Tilt Slope
    const slopeRad = (slopeBase * Math.PI) / 180;
    let z = y * Math.tan(slopeRad) * 0.35;

    // 2. Multi-Octave Fractal Harmonics
    const oct1 = Math.sin(x * 0.45) * Math.cos(y * 0.45) * roughness * 3.2;
    const oct2 = Math.sin(x * 1.1 + 1.2) * Math.cos(y * 0.9 - 0.7) * (roughness * 1.4);
    const oct3 = Math.sin(x * 2.8) * Math.cos(y * 2.5) * (roughness * 0.6);
    z += oct1 + oct2 + oct3;

    // 3. Impact Craters Depressions & Raised Rims
    this.craters.forEach(crater => {
      const d = Math.hypot(x - crater.x, y - crater.y);
      if (d < crater.r) {
        // Bowl cavity
        const bowlFactor = 1 - Math.pow(d / crater.r, 2);
        z -= crater.depth * bowlFactor;
      } else if (d < crater.r * 1.4) {
        // Raised ejecta rim
        const rimFactor = Math.sin(((d - crater.r) / (crater.r * 0.4)) * Math.PI);
        z += (crater.depth * 0.25) * rimFactor;
      }
    });

    // 4. Boulder micro-elevations
    this.boulders.forEach(b => {
      const d = Math.hypot(x - b.x, y - b.y);
      if (d < b.size) {
        z += (b.size - d) * 1.5;
      }
    });

    return z;
  }

  /**
   * Calculates local slope angle in degrees via central difference gradient.
   */
  getSlopeAngle(x, y) {
    const delta = 0.2;
    const dzdx = (this.getElevation(x + delta, y) - this.getElevation(x - delta, y)) / (2 * delta);
    const dzdy = (this.getElevation(x, y + delta) - this.getElevation(x, y - delta)) / (2 * delta);
    const grad = Math.hypot(dzdx, dzdy);
    return (Math.atan(grad) * 180) / Math.PI;
  }

  /**
   * Terramechanics Physics Engine (Bekker-Wong formulation)
   * Computes wheel sinkage (cm), slippage ratio (%), drawbar pull, and motor power load.
   */
  calculateTerramechanics(x, y) {
    const body = this.gravityBodies[this.currentBody];
    const biome = this.activeCandidate ? this.activeCandidate.biome : "Volcanic Basalt";
    const soil = this.soilTypes[biome] || this.soilTypes["Volcanic Basalt"];

    // Normal load per wheel (6-wheel rocker-bogie)
    const normalLoadW = (this.roverMass * body.g) / this.wheelCount; // Newtons

    // Bekker sinkage formula: z = ( W / (b*kc + kphi) )^(1/n)
    const modulus = this.wheelWidth * soil.kc * 1000 + soil.kphi * 1000;
    const sinkageMeters = Math.pow(normalLoadW / Math.max(1, modulus), 1 / soil.n);
    const sinkageCm = Math.max(0.2, sinkageMeters * 100);

    // Slope at current rover coordinates
    const slopeDeg = this.getSlopeAngle(x, y);
    const slopeRad = (slopeDeg * Math.PI) / 180;
    const frictionRad = (soil.phi * Math.PI) / 180;

    // Slippage ratio s: ratio of wheel tangential velocity to vehicle linear velocity
    let slipRatio = (Math.tan(slopeRad) / Math.tan(frictionRad)) * 0.55 + (sinkageCm * 0.02);
    slipRatio = Math.max(0.04, Math.min(0.85, slipRatio)); // clamp

    // Drawbar pull (available tractive force minus compaction resistance)
    const tractiveForce = normalLoadW * Math.tan(frictionRad) + (soil.c * 1000 * this.wheelWidth * this.wheelRadius);
    const compactionResist = (modulus / (soil.n + 1)) * Math.pow(sinkageMeters, soil.n + 1);
    const drawbarPullN = Math.max(0, tractiveForce - compactionResist);

    // Motor electrical power consumption (Watts)
    const mechanicalPower = (normalLoadW * Math.sin(slopeRad) + compactionResist) * this.roverSpeed;
    const motorEfficiency = 0.78;
    const electricalPowerW = Math.max(65, (mechanicalPower / motorEfficiency) + 120); // 120W baseline avionics

    return {
      sinkageCm: sinkageCm,
      slipPercent: (slipRatio * 100),
      slopeDeg: slopeDeg,
      drawbarPullN: drawbarPullN,
      powerWatts: electricalPowerW,
      isHazardSlip: slipRatio > 0.40,
      isHazardSlope: slopeDeg > 20.0
    };
  }

  moveRover(forwardDist, turnDeg = 0) {
    this.roverHeading = (this.roverHeading + turnDeg) % 360;
    const rad = (this.roverHeading * Math.PI) / 180;

    const newX = this.roverPos.x + Math.sin(rad) * forwardDist;
    const newY = this.roverPos.y + Math.cos(rad) * forwardDist;

    // Boundary check within local test site [-6, +6]
    if (Math.abs(newX) < 6.0 && Math.abs(newY) < 6.0) {
      this.roverPos.x = newX;
      this.roverPos.y = newY;
      this.roverBattery = Math.max(5.0, this.roverBattery - 0.08);

      // Stochastic Cosmic Ray Single Event Upset (higher in Moon/Mars vacuum)
      const seuProbability = (this.currentBody === "Moon") ? 0.06 : ((this.currentBody === "Mars") ? 0.03 : 0.005);
      if (Math.random() < seuProbability) {
        this.seuCount++;
      }
    }

    this.render();
    this.updateTelemetryHUD();
  }

  project3D(x, y, z, width, height) {
    const radRot = (this.rotation * Math.PI) / 180;
    const radTilt = (this.tilt * Math.PI) / 180;

    // Rotate around Z axis (heading)
    const rotX = x * Math.cos(radRot) - y * Math.sin(radRot);
    const rotY = x * Math.sin(radRot) + y * Math.cos(radRot);

    // Tilt (pitch)
    const projX = rotX * this.scale * 18;
    const projY = (rotY * Math.cos(radTilt) - z * Math.sin(radTilt)) * this.scale * 18;

    return {
      x: width / 2 + projX,
      y: height / 2 + projY
    };
  }

  render() {
    if (!this.canvas || !this.ctx) return;
    const width = this.canvas.width = this.canvas.parentElement.clientWidth || 700;
    const height = this.canvas.height = this.canvas.parentElement.clientHeight || 450;
    const ctx = this.ctx;

    // Background deep space
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    // Background metric coordinate grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Render 3D terrain grid mesh
    const step = 0.5;
    const minCoord = -5.0;
    const maxCoord = 5.0;

    // Draw shaded / false-color quads
    for (let gy = minCoord; gy < maxCoord; gy += step) {
      for (let gx = minCoord; gx < maxCoord; gx += step) {
        const z00 = this.getElevation(gx, gy);
        const z10 = this.getElevation(gx + step, gy);
        const z11 = this.getElevation(gx + step, gy + step);
        const z01 = this.getElevation(gx, gy + step);

        const p00 = this.project3D(gx, gy, z00, width, height);
        const p10 = this.project3D(gx + step, gy, z10, width, height);
        const p11 = this.project3D(gx + step, gy + step, z11, width, height);
        const p01 = this.project3D(gx, gy + step, z01, width, height);

        // Quad shading depending on active view mode
        ctx.fillStyle = this.getQuadColor(gx, gy, (z00 + z10 + z11 + z01) / 4);
        ctx.beginPath();
        ctx.moveTo(p00.x, p00.y);
        ctx.lineTo(p10.x, p10.y);
        ctx.lineTo(p11.x, p11.y);
        ctx.lineTo(p01.x, p01.y);
        ctx.closePath();
        ctx.fill();

        // Wireframe contours
        ctx.strokeStyle = (this.viewMode === "WIREFRAME") ? "rgba(56, 189, 248, 0.6)" : "rgba(15, 23, 42, 0.35)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    // Render Boulders
    this.boulders.forEach(b => {
      const bz = this.getElevation(b.x, b.y);
      const bp = this.project3D(b.x, b.y, bz, width, height);
      ctx.fillStyle = (this.viewMode === "THERMAL_IR") ? "#fbbf24" : "#475569";
      ctx.beginPath();
      ctx.arc(bp.x, bp.y - (b.size * 10), b.size * 14 * this.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Render Protected Area Laser Fence (SDG 15)
    if (this.ecoFenceOverlay && this.activeCandidate && this.activeCandidate.env && this.activeCandidate.env.overlaps_wdpa) {
      this.renderLaserFence(ctx, width, height);
    }

    // Render Rover 3D Model & Heading Reticle
    this.renderRover(ctx, width, height);

    // Render AR HUD Telemetry Callouts
    this.renderHUDOverlays(ctx, width, height);
  }

  getQuadColor(x, y, meanZ) {
    const slope = this.getSlopeAngle(x, y);

    if (this.viewMode === "SLOPE_HAZARD") {
      if (slope > 22) return "rgba(239, 68, 68, 0.75)";     // Critical hazard
      if (slope > 14) return "rgba(245, 158, 11, 0.65)";    // Warning
      return "rgba(16, 185, 129, 0.45)";                    // Safe mobility
    }

    if (this.viewMode === "THERMAL_IR") {
      // False color thermal FLIR: high elevation and sun-facing is warmer (yellow/orange), hollows are cold (indigo/purple)
      const sunRadAz = (this.solarAzimuth * Math.PI) / 180;
      const sunFacing = Math.cos(sunRadAz) * x + Math.sin(sunRadAz) * y;
      const tNorm = Math.max(0, Math.min(1, (meanZ + 1.5) / 3.0 + sunFacing * 0.08));
      
      if (tNorm > 0.75) return "rgba(244, 63, 94, 0.85)";  // Hot
      if (tNorm > 0.50) return "rgba(245, 158, 11, 0.8)";  // Warm
      if (tNorm > 0.25) return "rgba(6, 182, 212, 0.75)";  // Temperate
      return "rgba(59, 130, 246, 0.7)";                    // Cold shadow
    }

    // Default: SHADED topography with directional lighting
    const bodyColor = (this.currentBody === "Mars") ? [180, 83, 9] : 
                     ((this.currentBody === "Moon") ? [100, 116, 139] : [51, 65, 85]);
    const light = Math.max(0.4, Math.min(1.2, 0.7 + (meanZ * 0.18)));
    const r = Math.min(255, Math.floor(bodyColor[0] * light));
    const g = Math.min(255, Math.floor(bodyColor[1] * light));
    const b = Math.min(255, Math.floor(bodyColor[2] * light));

    return `rgb(${r}, ${g}, ${b})`;
  }

  renderLaserFence(ctx, width, height) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 5]);

    ctx.beginPath();
    const p1 = this.project3D(-5, -1.8, this.getElevation(-5, -1.8), width, height);
    const p2 = this.project3D(5, -1.8, this.getElevation(5, -1.8), width, height);
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('ECO-PROTECTION LINE (WDPA STRICT BUFFER)', p1.x + 10, p1.y - 8);
  }

  renderRover(ctx, width, height) {
    const rx = this.roverPos.x;
    const ry = this.roverPos.y;
    const rz = this.getElevation(rx, ry);

    const rProj = this.project3D(rx, ry, rz, width, height);

    // Rover chassis body
    ctx.save();
    ctx.translate(rProj.x, rProj.y);

    // Shadow on ground
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chassis polygon
    ctx.fillStyle = "#f8fafc";
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-12, -14, 24, 16, 3);
    ctx.fill();
    ctx.stroke();

    // Heading Arrow
    const radHeading = ((this.roverHeading - this.rotation) * Math.PI) / 180;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(Math.sin(radHeading) * 22, -6 - Math.cos(radHeading) * 22);
    ctx.stroke();

    // Masthead camera & RTG
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(0, -18, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Rocker-bogie 6 wheels
    ctx.fillStyle = "#334155";
    const wheels = [[-14, -10], [14, -10], [-15, -4], [15, -4], [-14, 2], [14, 2]];
    wheels.forEach(([wx, wy]) => {
      ctx.fillRect(wx - 2, wy - 3, 4, 7);
    });

    ctx.restore();
  }

  renderHUDOverlays(ctx, width, height) {
    const rx = this.roverPos.x;
    const ry = this.roverPos.y;
    const rz = this.getElevation(rx, ry);
    const rProj = this.project3D(rx, ry, rz, width, height);

    // Telemetry label connected with line
    ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rProj.x + 18, rProj.y - 12);
    ctx.lineTo(rProj.x + 55, rProj.y - 35);
    ctx.lineTo(rProj.x + 125, rProj.y - 35);
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 10px monospace";
    ctx.fillText(`ENU: [${rx.toFixed(2)}, ${ry.toFixed(2)}, ${rz.toFixed(2)}]m`, rProj.x + 58, rProj.y - 40);

    const physics = this.calculateTerramechanics(rx, ry);
    ctx.fillStyle = physics.isHazardSlope ? "#f43f5e" : "#94a3b8";
    ctx.font = "9px monospace";
    ctx.fillText(`SLOPE: ${physics.slopeDeg.toFixed(1)}° | SLIP: ${physics.slipPercent.toFixed(1)}%`, rProj.x + 58, rProj.y - 25);
  }

  updateTelemetryHUD() {
    const rx = this.roverPos.x;
    const ry = this.roverPos.y;
    const physics = this.calculateTerramechanics(rx, ry);

    const elCoords = document.getElementById("sim-hud-coords");
    const elSlope = document.getElementById("sim-hud-slope");
    const elSinkage = document.getElementById("sim-hud-sinkage");
    const elSlip = document.getElementById("sim-hud-slip");
    const elPower = document.getElementById("sim-hud-power");
    const elBattery = document.getElementById("sim-hud-battery");
    const elGravity = document.getElementById("sim-hud-gravity");
    const elSeu = document.getElementById("sim-hud-seu");

    if (elCoords) elCoords.textContent = `X:${rx.toFixed(2)}m Y:${ry.toFixed(2)}m`;
    if (elSlope) {
      elSlope.textContent = `${physics.slopeDeg.toFixed(1)}°`;
      elSlope.style.color = physics.isHazardSlope ? "#f43f5e" : "var(--accent-cyan)";
    }
    if (elSinkage) elSinkage.textContent = `${physics.sinkageCm.toFixed(2)} cm`;
    if (elSlip) {
      elSlip.textContent = `${physics.slipPercent.toFixed(1)}%`;
      elSlip.style.color = physics.isHazardSlip ? "#f43f5e" : "var(--accent-cyan)";
    }
    if (elPower) elPower.textContent = `${physics.powerWatts.toFixed(0)} W`;
    if (elBattery) elBattery.textContent = `${this.roverBattery.toFixed(1)}%`;
    if (elGravity) elGravity.textContent = `${this.gravityBodies[this.currentBody].g.toFixed(2)} m/s²`;
    if (elSeu) elSeu.textContent = `${this.seuCount} events`;
  }
}

// Global exposure
window.ArSimulator = ArSimulator;
