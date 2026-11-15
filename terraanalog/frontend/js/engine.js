/* =========================================================================
 * TerraAnalog - Scoring, discard-funnel and hazard engine
 * Every number shown in a marker or result card comes from evaluate().
 * ========================================================================= */
window.TA = window.TA || {};

TA.defaults = function () {
  return {
    thresholds: {
      maxNdvi: 0.10, excludeWater: true, lithologyType: "all", maxSlope: 15, minRoughness: 0.35,
      minThermalAmp: 15, maxHumidity: 30, maxElevation: 5000, minTraction: 0.30, checkEthics: true
    },
    // relative importance of each physical dimension (normalised at scoring time)
    weights: { slope: 30, roughness: 20, thermal: 15, elevation: 10, traction: 15, humidity: 10 }
  };
};
TA.state = TA.state || {};
Object.assign(TA.state, TA.defaults());

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const gauss = (d, tau) => Math.exp(-0.5 * Math.pow(d / tau, 2));

TA.engine = {
  // Rover trafficability index (0..1) derived from terrain and surface moisture
  traction(site) {
    return clamp(1 - site.slope / 40 - Math.abs(site.roughness - 0.5) * 0.35 - (site.liquidWater ? 0.15 : 0) - site.relativeHumidity / 400, 0, 1);
  },

  // Evaluate one site against the current thresholds, weights and target.
  evaluate(site, targetKey) {
    const th = TA.state.thresholds, w = TA.state.weights;
    const target = TA.targets[targetKey] || TA.targets.shackleton;
    const traction = this.traction(site);
    const reasons = [];

    // ---- Discard funnel: 4 cascading stages -------------------------------------
    let s1 = true, s2, s3, s4;
    if (site.ndvi > th.maxNdvi) { s1 = false; reasons.push(`NDVI ${site.ndvi.toFixed(2)} > ${th.maxNdvi.toFixed(2)} (biological alteration)`); }
    if (th.excludeWater && site.liquidWater) { s1 = false; reasons.push("Active surface liquid water present"); }
    s2 = s1;
    if (th.lithologyType !== "all" && site.lithology !== th.lithologyType) { s2 = false; reasons.push(`Lithology '${TA.lithologyLabels[site.lithology] || site.lithology}' does not match filter`); }
    s3 = s2;
    if (site.slope > th.maxSlope) { s3 = false; reasons.push(`Slope ${site.slope.toFixed(1)}\u00B0 > ${th.maxSlope.toFixed(0)}\u00B0 (landing / traverse risk)`); }
    if (site.roughness < th.minRoughness) { s3 = false; reasons.push(`Roughness ${site.roughness.toFixed(2)} < ${th.minRoughness.toFixed(2)} (smooth / eroded terrain)`); }
    if (site.elevation > th.maxElevation) { s3 = false; reasons.push(`Elevation ${site.elevation} m > ${th.maxElevation} m limit`); }
    if (traction < th.minTraction) { s3 = false; reasons.push(`Traction index ${traction.toFixed(2)} < ${th.minTraction.toFixed(2)} (rover mobility)`); }
    s4 = s3;
    if (site.relativeHumidity > th.maxHumidity) { s4 = false; reasons.push(`Humidity ${site.relativeHumidity.toFixed(0)}% > ${th.maxHumidity.toFixed(0)}% (oxidation risk)`); }
    if (site.thermalAmplitude < th.minThermalAmp) { s4 = false; reasons.push(`Thermal swing ${site.thermalAmplitude.toFixed(0)}\u00B0C < ${th.minThermalAmp.toFixed(0)}\u00B0C (mild climate)`); }

    // ---- Gaussian similarity components, s_i = exp(-0.5 (d_i / tau_i)^2) ----------
    // tolerances (tau) are tied to the active thresholds, so moving a slider moves the score
    const comp = {
      slope: gauss(site.slope - target.targetSlope, Math.max(2.5, th.maxSlope / 2.5)),
      roughness: gauss(site.roughness - target.targetRough, 0.12 + (0.95 - th.minRoughness) * 0.2),
      thermal: gauss(site.thermalAmplitude - Math.max(25, th.minThermalAmp), 12),
      elevation: site.elevation <= th.maxElevation
        ? 1 - 0.3 * clamp(Math.max(0, site.elevation) / th.maxElevation, 0, 1)
        : 0.5 * gauss(site.elevation - th.maxElevation, 1000),
      traction: traction >= th.minTraction
        ? 0.7 + 0.3 * (traction - th.minTraction) / Math.max(0.05, 1 - th.minTraction)
        : 0.7 * traction / Math.max(0.05, th.minTraction),
      humidity: site.relativeHumidity <= th.maxHumidity
        ? 1 - 0.4 * site.relativeHumidity / th.maxHumidity
        : 0.5 * Math.exp(-(site.relativeHumidity - th.maxHumidity) / 15)
    };
    let wSum = 0, acc = 0;
    Object.keys(comp).forEach(k => { const wi = Math.max(0, w[k] || 0); wSum += wi; acc += wi * comp[k]; });
    let physical = wSum > 0 ? acc / wSum : 0.5;

    // ---- Environmental restrictions act as multiplicative penalties ------------------
    let env = 1;
    if (site.ndvi > th.maxNdvi) env *= 0.75;
    if (th.excludeWater && site.liquidWater) env *= 0.70;
    if (th.lithologyType !== "all") env *= (site.lithology === th.lithologyType ? 1 : 0.80);
    else env *= (site.lithology === target.lithology ? 1 : 0.92);
    if (th.checkEthics) env *= site.alertType === "high" ? 0.85 : (site.alertType === "medium" ? 0.93 : 1);
    // data coverage < 100% lowers confidence slightly
    env *= 0.9 + 0.1 * (site.coverage / 100);

    const score = Math.round(clamp(physical * env * 100, 5, 99));
    const hazards = this.hazards(site, traction);
    const critical = hazards.some(h => h.severity === "high");

    // Marker / card status: red = protected or critical hazard, yellow = caution, green = high viability
    let status = "viable";
    if (th.checkEthics && site.alertType === "high") status = "hazard";
    else if (critical) status = "hazard";
    else if (reasons.length > 0 || score < 75 || (th.checkEthics && site.alertType === "medium")) status = "caution";

    return { passed: reasons.length === 0, reasons, score, traction, status, hazards, critical,
             stage1: s1, stage2: s2, stage3: s3, stage4: s4, components: comp };
  },

  // ---- Area hazards: indicative footprints derived from site attributes ----------------
  hazards(site, traction) {
    const th = TA.state.thresholds, list = [];
    if (site.alertType === "high" || site.alertType === "medium") {
      const high = site.alertType === "high";
      list.push({ kind: "protected", severity: high ? "high" : "medium", radiusKm: high ? 55 : 35, offset: [0, 0],
        title: high ? "Protected area (WDPA)" : "Managed reserve (WDPA)",
        text: `${site.protectedName || site.alertLabel}. ${high
          ? "Strictly protected: sampling and mechanical traverses require a permit and a non-invasion protocol (SDG 15)."
          : "Managed zone: restricted-access corridors and low-impact operations only."}` });
    }
    if (site.slope >= 9 || site.slope > th.maxSlope) {
      list.push({ kind: "slope", severity: site.slope > th.maxSlope ? "high" : "medium", radiusKm: 28, offset: [0.45, 0.55],
        title: "Steep-slope zone",
        text: `Mean slope ${site.slope.toFixed(1)}\u00B0 (limit ${th.maxSlope.toFixed(0)}\u00B0). Landing and rover traverse risk; rollover margin is reduced.` });
    }
    if (site.liquidWater || site.ndvi > 0.10) {
      list.push({ kind: "fragile", severity: (site.liquidWater && th.excludeWater) ? "high" : "medium", radiusKm: 24, offset: [-0.5, -0.4],
        title: "Fragile terrain / biological activity",
        text: `${site.liquidWater ? "Active surface water. " : ""}NDVI ${site.ndvi.toFixed(2)}. Microbial mats and living communities are vulnerable to contamination (planetary-protection and SDG 14 / 15 concern).` });
    }
    if (site.liquidWater === false && site.relativeHumidity > th.maxHumidity && site.relativeHumidity >= 50) {
      list.push({ kind: "humidity", severity: "medium", radiusKm: 20, offset: [0.1, -0.7], title: "High-humidity zone",
        text: `Relative humidity ${site.relativeHumidity.toFixed(0)}%: corrosion and dust-adhesion risk for instruments.` });
    }
    return list;
  },

  // Deterministic irregular polygon around a centre (lat/lon in degrees)
  polygon(site, hz) {
    let seed = (site.id * 9301 + hz.kind.length * 49297) % 233280;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const n = 16, pts = [];
    const kmLat = 111.0, kmLon = 111.0 * Math.max(0.2, Math.cos(site.lat * Math.PI / 180));
    const cLat = site.lat + (hz.offset[1] * hz.radiusKm) / kmLat;
    const cLon = site.lon + (hz.offset[0] * hz.radiusKm) / kmLon;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, r = hz.radiusKm * (0.72 + rnd() * 0.5);
      pts.push([clamp(cLat + (Math.sin(a) * r) / kmLat, -89.5, 89.5), cLon + (Math.cos(a) * r) / kmLon]);
    }
    return pts;
  },

  // Funnel counts for a site list
  funnel(sites, targetKey) {
    const c = { total: sites.length, s1: 0, s2: 0, s3: 0, s4: 0 };
    sites.forEach(s => { const e = this.evaluate(s, targetKey); if (e.stage1) c.s1++; if (e.stage2) c.s2++; if (e.stage3) c.s3++; if (e.stage4) c.s4++; });
    return c;
  },

  // Best live match for a mineral signature among the given sites
  spectralMatch(sig, sites, targetKey) {
    let best = 0, n = 0;
    sites.forEach(s => {
      if (s.minerals.some(m => sig.keywords.some(k => m.toLowerCase().includes(k)))) {
        n++; best = Math.max(best, this.evaluate(s, targetKey).score);
      }
    });
    return { best, count: n };
  }
};
