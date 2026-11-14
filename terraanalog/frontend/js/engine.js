/**
 * TerraAnalog - Client-Side Scientific Engine
 * Full implementation of the Gaussian similarity mathematics,
 * data coverage tracking, and reverse AI search parser.
 */

const SCIENTIFIC_ENGINE = {
  // Scientific Tolerances (tau_i)
  tolerances: {
    slope_mean: 4.0,              // degrees
    roughness: 0.20,              // index
    elevation: 1200.0,            // meters
    temperature_diurnal_range: 35.0, // Kelvin
    thermal_inertia: 110.0,       // J m^-2 K^-1 s^-1/2
    gravity_anomaly: 45.0,        // mGal
    magnetic_anomaly: 150.0,      // nT
    radiation_flux: 1.5,          // mSv/year (Earth) / relative scaling
    iron_oxide_content: 4.5,      // wt%
    silica_content: 6.0,          // wt%
    albedo: 0.06                  // ratio
  },

  // Variable Importance Weights
  weights: {
    slope_mean: 0.20,
    roughness: 0.15,
    elevation: 0.05,
    lithology_type: 0.25,
    iron_oxide_content: 0.15,
    silica_content: 0.10,
    temperature_diurnal_range: 0.15,
    thermal_inertia: 0.15,
    gravity_anomaly: 0.10,
    magnetic_anomaly: 0.10,
    radiation_flux: 0.10,
    albedo: 0.08
  },

  // Categorical Lithology Compatibility Matrix
  lithologyMatrix: {
    basalt: { basalt: 1.0, anorthosite: 0.65, impact_melt: 0.80, clay_clastic: 0.30, evaporite_salar: 0.20, permafrost: 0.25 },
    anorthosite: { anorthosite: 1.0, basalt: 0.65, impact_melt: 0.85, clay_clastic: 0.20, evaporite_salar: 0.15 },
    impact_melt: { impact_melt: 1.0, basalt: 0.80, anorthosite: 0.85, clay_clastic: 0.40 },
    clay_clastic: { clay_clastic: 1.0, evaporite_salar: 0.60, basalt: 0.30, impact_melt: 0.40 },
    evaporite_salar: { evaporite_salar: 1.0, clay_clastic: 0.60, basalt: 0.20, permafrost: 0.45 },
    permafrost: { permafrost: 1.0, evaporite_salar: 0.45, basalt: 0.25 }
  },

  getLithologySimilarity(typeA, typeB) {
    const a = (typeA || "").trim().toLowerCase();
    const b = (typeB || "").trim().toLowerCase();
    if (!a || !b) return 0.5;
    if (a === b) return 1.0;
    if (this.lithologyMatrix[a] && this.lithologyMatrix[a][b] !== undefined) return this.lithologyMatrix[a][b];
    if (this.lithologyMatrix[b] && this.lithologyMatrix[b][a] !== undefined) return this.lithologyMatrix[b][a];
    return 0.30;
  },

  computeVariableSimilarity(key, earthVal, targetVal) {
    if (earthVal === undefined || targetVal === undefined || earthVal === null || targetVal === null) {
      return { score: 0.0, delta: 0.0, status: "MISSING" };
    }

    if (key === "lithology_type") {
      const s = this.getLithologySimilarity(earthVal, targetVal);
      return { score: s, delta: 0.0, status: "EVALUATED" };
    }

    const vE = parseFloat(earthVal);
    const vT = parseFloat(targetVal);
    if (isNaN(vE) || isNaN(vT)) return { score: 0.0, delta: 0.0, status: "INVALID" };

    const delta = Math.abs(vE - vT);
    const tau = this.tolerances[key] || 1.0;
    
    // Gaussian Kernel: s_i = exp(-0.5 * (d_i / tau_i)^2)
    const exponent = -0.5 * Math.pow(delta / tau, 2);
    const score = exponent > -25.0 ? Math.exp(exponent) : 0.0;

    return { score, delta, status: "EVALUATED", tau };
  },

  evaluateCandidate(candidate, targetProfile) {
    let weightedSimSum = 0.0;
    let evaluatedWeightSum = 0.0;
    let totalPossibleWeightSum = 0.0;

    const breakdown = [];
    const missingVars = [];

    const dimAccum = {
      geology: { simSum: 0, wSum: 0, totalW: 0 },
      topography: { simSum: 0, wSum: 0, totalW: 0 },
      geophysics: { simSum: 0, wSum: 0, totalW: 0 },
      thermal: { simSum: 0, wSum: 0, totalW: 0 }
    };

    const categoryMap = {
      slope_mean: "topography", roughness: "topography", elevation: "topography",
      lithology_type: "geology", iron_oxide_content: "geology", silica_content: "geology", albedo: "geology",
      temperature_diurnal_range: "thermal", thermal_inertia: "thermal",
      gravity_anomaly: "geophysics", magnetic_anomaly: "geophysics", radiation_flux: "geophysics"
    };

    for (const [key, weight] of Object.entries(this.weights)) {
      totalPossibleWeightSum += weight;
      const cat = categoryMap[key] || "geology";
      dimAccum[cat].totalW += weight;

      const eVal = candidate.measurements[key];
      const tVal = targetProfile.measurements[key];

      const res = this.computeVariableSimilarity(key, eVal, tVal);

      if (res.status !== "EVALUATED") {
        missingVars.push(key);
        breakdown.push({
          key, name: this.getFeatureName(key), category: cat,
          earthVal: eVal, targetVal: tVal, status: "MISSING",
          similarity: null, weight
        });
        continue;
      }

      const quality = 1.0; // Calibrated observation
      const effWeight = weight * quality;
      weightedSimSum += effWeight * res.score;
      evaluatedWeightSum += effWeight;

      dimAccum[cat].simSum += effWeight * res.score;
      dimAccum[cat].wSum += effWeight;

      breakdown.push({
        key, name: this.getFeatureName(key), category: cat,
        earthVal: eVal, targetVal: tVal, delta: res.delta, tau: res.tau,
        similarity: Math.round(res.score * 1000) / 10,
        weight, contribution: Math.round(effWeight * res.score * 1000) / 10,
        status: "EVALUATED"
      });
    }

    const physicalSimilarity = evaluatedWeightSum > 0 ? (weightedSimSum / evaluatedWeightSum) * 100.0 : 0.0;
    const dataCoverage = totalPossibleWeightSum > 0 ? (evaluatedWeightSum / totalPossibleWeightSum) * 100.0 : 0.0;
    const confidence = physicalSimilarity * (dataCoverage / 100.0);

    const isProvisional = dataCoverage < 60.0;
    let classification = "Low Match";
    if (isProvisional) classification = "Provisional (Low Data)";
    else if (physicalSimilarity >= 85.0) classification = "High Match (Coincidencia Alta)";
    else if (physicalSimilarity >= 70.0) classification = "Moderate Match (Coincidencia Considerable)";
    else if (physicalSimilarity >= 50.0) classification = "Partial Match (Coincidencia Parcial)";

    // Operational feasibility
    let feasibility = 85.0;
    const slope = candidate.measurements.slope_mean || 0;
    const roughness = candidate.measurements.roughness || 0;
    if (slope > 20) feasibility -= 30;
    else if (slope > 12) feasibility -= 15;
    if (roughness > 0.4) feasibility -= 20;

    // Dimension breakdown
    const dimensionScores = {};
    for (const [dim, acc] of Object.entries(dimAccum)) {
      dimensionScores[dim] = acc.wSum > 0 ? Math.round((acc.simSum / acc.wSum) * 1000) / 10 : 0.0;
    }

    return {
      candidateId: candidate.id,
      candidateName: candidate.name,
      country: candidate.country,
      regionType: candidate.region_type,
      lat: candidate.lat,
      lon: candidate.lon,
      elevation: candidate.elevation,
      physicalSimilarity: Math.round(physicalSimilarity * 10) / 10,
      dataCoverage: Math.round(dataCoverage * 10) / 10,
      confidence: Math.round(confidence * 10) / 10,
      operationalFeasibility: Math.max(10, Math.min(100, Math.round(feasibility))),
      classification,
      isProvisional,
      environmentalRisk: candidate.env ? candidate.env.risk_level : "NO_DATA",
      dimensionScores,
      breakdown,
      missingVars
    };
  },

  getFeatureName(key) {
    const names = {
      slope_mean: "Mean Surface Slope",
      roughness: "Roughness Index",
      elevation: "Elevation / Relief",
      lithology_type: "Lithology / Rock Type",
      iron_oxide_content: "Iron Oxide Content",
      silica_content: "Silica (SiO2)",
      temperature_diurnal_range: "Diurnal Temp Range",
      thermal_inertia: "Thermal Inertia",
      gravity_anomaly: "Bouguer Gravity Anomaly",
      magnetic_anomaly: "Magnetic Field Anomaly",
      radiation_flux: "Surface Radiation Flux",
      albedo: "Optical Albedo"
    };
    return names[key] || key;
  },

  // Deterministic NLP query parser for Reverse AI Search
  parseReverseQuery(queryText) {
    const q = (queryText || "").toLowerCase();
    const criteria = {
      rawQuery: queryText,
      lithology: null,
      terrain: null,
      body: null,
      slopeMax: null,
      ironMin: null,
      roughnessMax: null,
      matchedTokens: []
    };

    // Body
    if (q.includes("moon") || q.includes("luna") || q.includes("lunar")) { criteria.body = "Moon"; criteria.matchedTokens.push("Moon"); }
    if (q.includes("mars") || q.includes("marte") || q.includes("marciano")) { criteria.body = "Mars"; criteria.matchedTokens.push("Mars"); }

    // Lithology
    if (q.includes("basalt") || q.includes("basalto") || q.includes("basáltico")) { criteria.lithology = "basalt"; criteria.matchedTokens.push("Basalt"); }
    else if (q.includes("anorthosite") || q.includes("anortosita")) { criteria.lithology = "anorthosite"; criteria.matchedTokens.push("Anorthosite"); }
    else if (q.includes("clay") || q.includes("arcilla") || q.includes("smectite")) { criteria.lithology = "clay_clastic"; criteria.matchedTokens.push("Clay/Smectite"); }
    else if (q.includes("salar") || q.includes("evaporite") || q.includes("salt") || q.includes("salino")) { criteria.lithology = "evaporite_salar"; criteria.matchedTokens.push("Evaporite/Salar"); }
    else if (q.includes("crater") || q.includes("cráter") || q.includes("breccia") || q.includes("impact")) { criteria.lithology = "impact_melt"; criteria.matchedTokens.push("Impact Melt"); }
    else if (q.includes("polar") || q.includes("permafrost") || q.includes("ice") || q.includes("hielo")) { criteria.lithology = "permafrost"; criteria.matchedTokens.push("Permafrost"); }

    // Terrain
    if (q.includes("desert") || q.includes("desierto") || q.includes("dunes") || q.includes("dunas")) { criteria.terrain = "Desert"; criteria.matchedTokens.push("Desert"); }
    else if (q.includes("volcano") || q.includes("volcán") || q.includes("volcan") || q.includes("caldera")) { criteria.terrain = "Volcanic"; criteria.matchedTokens.push("Volcanic"); }
    else if (q.includes("crater") || q.includes("cráter")) { criteria.terrain = "Crater"; criteria.matchedTokens.push("Crater"); }
    else if (q.includes("cave") || q.includes("cueva") || q.includes("lava tube") || q.includes("tubo")) { criteria.terrain = "Lava_Tube"; criteria.matchedTokens.push("Lava Tube"); }

    // Slopes
    const slopeMatch = q.match(/(?:slope|pendiente)\s*(?:<|<=|menor a|under)?\s*(\d+(?:\.\d+)?)/);
    if (slopeMatch) {
      criteria.slopeMax = parseFloat(slopeMatch[1]);
      criteria.matchedTokens.push(`Slope <= ${criteria.slopeMax}°`);
    } else if (q.includes("baja pendiente") || q.includes("gentle slope") || q.includes("flat") || q.includes("plano")) {
      criteria.slopeMax = 10.0;
      criteria.matchedTokens.push("Gentle Slope (<=10°)");
    }

    // Iron Oxide
    const ironMatch = q.match(/(?:iron|hierro|fe)\s*(?:>|>=|mayor a)?\s*(\d+(?:\.\d+)?)/);
    if (ironMatch) {
      criteria.ironMin = parseFloat(ironMatch[1]);
      criteria.matchedTokens.push(`Iron >= ${criteria.ironMin}%`);
    } else if (q.includes("alto hierro") || q.includes("high iron") || q.includes("hematite") || q.includes("hematita")) {
      criteria.ironMin = 12.0;
      criteria.matchedTokens.push("High Iron (>=12%)");
    }

    return criteria;
  },

  rankCandidatesByReverseQuery(criteria, candidates) {
    return candidates.map(c => {
      let score = 0;
      let maxScore = 0;
      const reasons = [];

      if (criteria.lithology) {
        maxScore += 40;
        const sim = this.getLithologySimilarity(c.measurements.lithology_type, criteria.lithology);
        score += sim * 40;
        reasons.push(`Lithology: ${c.measurements.lithology_type} (${Math.round(sim*100)}% match with ${criteria.lithology})`);
      }

      if (criteria.terrain) {
        maxScore += 25;
        if (c.region_type.toLowerCase() === criteria.terrain.toLowerCase()) {
          score += 25;
          reasons.push(`Terrain: exact match with ${criteria.terrain}`);
        } else {
          reasons.push(`Terrain: candidate is ${c.region_type}`);
        }
      }

      if (criteria.slopeMax !== null) {
        maxScore += 20;
        const slope = c.measurements.slope_mean || 0;
        if (slope <= criteria.slopeMax) {
          score += 20;
          reasons.push(`Slope: ${slope}° satisfies <= ${criteria.slopeMax}°`);
        } else {
          score += Math.max(0, 20 - (slope - criteria.slopeMax) * 2);
          reasons.push(`Slope: ${slope}° exceeds preferred ${criteria.slopeMax}°`);
        }
      }

      if (criteria.ironMin !== null) {
        maxScore += 15;
        const fe = c.measurements.iron_oxide_content || 0;
        if (fe >= criteria.ironMin) {
          score += 15;
          reasons.push(`Iron: ${fe}% satisfies >= ${criteria.ironMin}%`);
        } else {
          score += (fe / criteria.ironMin) * 15;
          reasons.push(`Iron: ${fe}% is lower than ${criteria.ironMin}%`);
        }
      }

      const relevance = maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 50.0;
      return {
        candidate: c,
        relevance,
        reasons
      };
    }).sort((a, b) => b.relevance - a.relevance);
  }
};
