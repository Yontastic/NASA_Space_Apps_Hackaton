/**
 * TerraAnalog - Embedded Planetary & Terrestrial Geo-Catalog
 * Provides offline/client-side data capability with full scientific provenance.
 */

const TERRA_DATA = {
  sources: [
    { id: "src_nasa_cmr", name: "NASA Common Metadata Repository (CMR)", provider: "NASA ESDIS", status: "active", access: "REST_API", license: "NASA Open Data" },
    { id: "src_nasa_gibs", name: "NASA Global Imagery Browse Services (GIBS)", provider: "NASA ESDIS", status: "active", access: "WMTS", license: "Public Domain" },
    { id: "src_nasa_pds", name: "NASA Planetary Data System (PDS)", provider: "NASA PDS", status: "active", access: "REST_API", license: "NASA Open Access" },
    { id: "src_copernicus", name: "Copernicus Data Space Ecosystem", provider: "ESA", status: "requires_credentials", access: "STAC", license: "Copernicus Open Access" },
    { id: "src_csa_radarsat", name: "CSA Earth Observation (RADARSAT)", provider: "CSA / ASC", status: "active", access: "FILE_DOWNLOAD", license: "Open Government Licence" },
    { id: "src_jaxa_gportal", name: "JAXA G-Portal", provider: "JAXA", status: "requires_credentials", access: "REST_API", license: "JAXA Standard Policy" },
    { id: "src_conabio_inegi", name: "CONABIO & INEGI Geoportal (Mexico)", provider: "CONABIO / INEGI", status: "active", access: "FILE_DOWNLOAD", license: "Libre Uso (Open Data)" },
    { id: "src_protected_planet", name: "Protected Planet (WDPA / WDPCA)", provider: "UNEP-WCMC / IUCN", status: "requires_credentials", access: "REST_API", license: "WDPA Academic" },
    { id: "src_esa_worldcover", name: "ESA WorldCover Global Land Cover", provider: "ESA", status: "active", access: "COG", license: "CC BY 4.0" },
    { id: "src_nasa_sedac", name: "NASA SEDAC Socioeconomic Data", provider: "CIESIN Columbia Univ", status: "active", access: "REST_API", license: "NASA Open Access" }
  ],

  targets: [
    // MOON
    {
      id: "tgt_moon_shackleton",
      body: "Moon",
      name: "Shackleton Crater Rim",
      context: "Artemis III Candidate Landing Site & Polar Cold Traps",
      lat: -89.9,
      lon: 0.0,
      env: "Polar_Cold_Trap",
      desc: "Lunar South Pole impact crater rim with quasi-permanent illumination and ultra-cold shadowed traps containing water-ice deposits. Anorthositic regolith.",
      measurements: {
        slope_mean: 14.5, roughness: 0.42, elevation: -4200, lithology_type: "anorthosite",
        iron_oxide_content: 5.2, silica_content: 45.0, temperature_diurnal_range: 180.0,
        thermal_inertia: 45.0, gravity_anomaly: -65.0, magnetic_anomaly: 2.0, radiation_flux: 380.0, albedo: 0.12
      }
    },
    {
      id: "tgt_moon_tranquillitatis",
      body: "Moon",
      name: "Mare Tranquillitatis",
      context: "Apollo 11 Landing Site & Lunar Base Candidate",
      lat: 0.67,
      lon: 23.47,
      env: "Basaltic_Plains",
      desc: "Low-albedo basaltic mare plains rich in titanium (ilmenite) and iron oxides. Smooth terrain with gentle slopes and high regolith depth.",
      measurements: {
        slope_mean: 3.2, roughness: 0.18, elevation: -1800, lithology_type: "basalt",
        iron_oxide_content: 15.5, silica_content: 41.5, temperature_diurnal_range: 280.0,
        thermal_inertia: 55.0, gravity_anomaly: 120.0, magnetic_anomaly: 5.0, radiation_flux: 380.0, albedo: 0.07
      }
    },
    {
      id: "tgt_moon_procellarum",
      body: "Moon",
      name: "Oceanus Procellarum (Marius Hills)",
      context: "Subterranean Lava Tubes & Volcanic Rilles",
      lat: 14.2,
      lon: -56.8,
      env: "Lava_Tube",
      desc: "Lunar volcanic province exhibiting sinuous rilles, volcanic domes, and deep pit crater skylights leading to intact lava tubes.",
      measurements: {
        slope_mean: 5.8, roughness: 0.35, elevation: -2100, lithology_type: "basalt",
        iron_oxide_content: 16.0, silica_content: 43.0, temperature_diurnal_range: 260.0,
        thermal_inertia: 70.0, gravity_anomaly: 85.0, magnetic_anomaly: 12.0, radiation_flux: 380.0, albedo: 0.08
      }
    },
    // MARS
    {
      id: "tgt_mars_jezero",
      body: "Mars",
      name: "Jezero Crater (Delta & Scarp)",
      context: "Mars 2020 Perseverance Rover Landing & Sample Return",
      lat: 18.38,
      lon: 77.58,
      env: "Deltaic_Clay",
      desc: "Ancient lacustrine paleolake basin featuring a fan delta rich in smectite clay phyllosilicates, carbonates, and boulder-strewn basaltic crater floor.",
      measurements: {
        slope_mean: 6.8, roughness: 0.32, elevation: -2530, lithology_type: "clay_clastic",
        iron_oxide_content: 14.8, silica_content: 47.0, temperature_diurnal_range: 85.0,
        thermal_inertia: 310.0, gravity_anomaly: 35.0, magnetic_anomaly: 22.0, radiation_flux: 240.0, albedo: 0.18
      }
    },
    {
      id: "tgt_mars_gale",
      body: "Mars",
      name: "Gale Crater & Mount Sharp",
      context: "MSL Curiosity Rover Stratigraphy Site",
      lat: -4.59,
      lon: 137.44,
      env: "Crater_Rim",
      desc: "Layered sedimentary mound (Aeolis Mons) exposing sulfate and hematite units over ancient clay-bearing strata. Active sand dunes and alluvial fans.",
      measurements: {
        slope_mean: 8.4, roughness: 0.36, elevation: -4450, lithology_type: "evaporite_salar",
        iron_oxide_content: 18.2, silica_content: 49.0, temperature_diurnal_range: 90.0,
        thermal_inertia: 380.0, gravity_anomaly: -15.0, magnetic_anomaly: 30.0, radiation_flux: 250.0, albedo: 0.22
      }
    },
    {
      id: "tgt_mars_olympus",
      body: "Mars",
      name: "Olympus Mons Flank",
      context: "Tharsis Shield Volcano Lava Plains",
      lat: 18.65,
      lon: -133.80,
      env: "Volcanic",
      desc: "Immense shield volcano flank with gentle sheet flows, lava channels, and basaltic tephra blankets.",
      measurements: {
        slope_mean: 5.0, roughness: 0.29, elevation: 18000, lithology_type: "basalt",
        iron_oxide_content: 17.5, silica_content: 48.0, temperature_diurnal_range: 75.0,
        thermal_inertia: 260.0, gravity_anomaly: 280.0, magnetic_anomaly: 8.0, radiation_flux: 310.0, albedo: 0.15
      }
    },
    {
      id: "tgt_mars_meridiani",
      body: "Mars",
      name: "Meridiani Planum",
      context: "Opportunity Rover Site - Hematite Spherules",
      lat: -1.95,
      lon: -5.53,
      env: "Salar",
      desc: "Hyper-flat plains with extensive gray crystalline hematite spherules ('blueberries') and sulfate evaporites from acidic groundwater evaporation.",
      measurements: {
        slope_mean: 2.1, roughness: 0.15, elevation: -1400, lithology_type: "evaporite_salar",
        iron_oxide_content: 16.5, silica_content: 42.0, temperature_diurnal_range: 95.0,
        thermal_inertia: 390.0, gravity_anomaly: 10.0, magnetic_anomaly: 15.0, radiation_flux: 240.0, albedo: 0.14
      }
    }
  ],

  candidates: [
    {
      id: "reg_pinacate",
      name: "El Pinacate Volcanic Field",
      country: "Mexico",
      region_type: "Volcanic",
      lat: 31.77,
      lon: -113.50,
      elevation: 850,
      area_km2: 1500,
      bbox: [-113.85, 31.55, -113.15, 32.05],
      desc: "Apollo astronaut lunar training site. Over 400 basaltic cinder cones and 10 giant Maar explosion craters closely matching lunar and Martian volcanic features.",
      measurements: {
        slope_mean: 5.5, roughness: 0.28, elevation: 850, lithology_type: "basalt",
        iron_oxide_content: 13.8, silica_content: 46.5, temperature_diurnal_range: 32.0,
        thermal_inertia: 350.0, gravity_anomaly: 40.0, magnetic_anomaly: 180.0, radiation_flux: 2.2, albedo: 0.11
      },
      env: {
        risk_level: "RESTRICTED_REVIEW",
        overlaps_wdpa: true,
        pa_name: "Reserva de la Biosfera El Pinacate y Gran Desierto de Altar (UNESCO)",
        iucn: "Ia",
        sdg13: "Desert pavement vulnerable to erosion; carbon sequestration in micro-crusts.",
        sdg14: "Inland volcanic basin; no direct marine interaction.",
        sdg15: "UNESCO World Heritage Site with endemic desert tortoise and saguaro flora.",
        recommendation: "CONANP permit mandatory. Testing restricted to pre-existing wash tracks."
      }
    },
    {
      id: "reg_atacama",
      name: "Atacama Desert (Yungay Core)",
      country: "Chile",
      region_type: "Desert",
      lat: -24.08,
      lon: -69.95,
      elevation: 1200,
      area_km2: 2200,
      bbox: [-70.20, -24.30, -69.70, -23.85],
      desc: "Driest desert on Earth; primary Mars analog for Viking, Phoenix, and Curiosity missions. Hyper-arid soil devoid of organic matter with high perchlorates.",
      measurements: {
        slope_mean: 4.2, roughness: 0.22, elevation: 1200, lithology_type: "evaporite_salar",
        iron_oxide_content: 15.2, silica_content: 52.0, temperature_diurnal_range: 36.0,
        thermal_inertia: 390.0, gravity_anomaly: -20.0, magnetic_anomaly: 95.0, radiation_flux: 3.1, albedo: 0.24
      },
      env: {
        risk_level: "RESTRICTED_REVIEW",
        overlaps_wdpa: true,
        pa_name: "Los Flamencos National Reserve & Valle de la Luna Sanctuary",
        iucn: "IV",
        sdg13: "Hyper-arid microclimate with ancient gypsum soil crusts.",
        sdg14: "Endorheic salt lagoons supporting endangered Andean flamingo feeding grounds.",
        sdg15: "Microbial gypsum crusts vulnerable to mechanical tire grinding.",
        recommendation: "Rover test permitted only on designated gravel plains outside wetland polygon."
      }
    },
    {
      id: "reg_haughton",
      name: "Haughton Impact Crater (Devon Island)",
      country: "Canada",
      region_type: "Crater",
      lat: 75.38,
      lon: -89.68,
      elevation: 220,
      area_km2: 350,
      bbox: [-90.00, 75.25, -89.35, 75.50],
      desc: "23 km wide meteorite impact crater in High Arctic polar desert. NASA HMP analog testbed for rover mobility, permafrost drilling, and shatter cones.",
      measurements: {
        slope_mean: 12.1, roughness: 0.45, elevation: 220, lithology_type: "impact_melt",
        iron_oxide_content: 8.4, silica_content: 56.0, temperature_diurnal_range: 22.0,
        thermal_inertia: 220.0, gravity_anomaly: -48.0, magnetic_anomaly: 40.0, radiation_flux: 2.8, albedo: 0.16
      },
      env: {
        risk_level: "LOW_ALERT",
        overlaps_wdpa: false,
        pa_name: "None (Remote Arctic Wilderness)",
        iucn: "None",
        sdg13: "Continuous permafrost active layer monitoring required.",
        sdg14: "Coastal Arctic basin draining to Baffin Bay.",
        sdg15: "Sparse polar moss-lichen patches; minimal direct habitat conflict.",
        recommendation: "Standard Arctic expedition protocol; maintain zero-trace waste disposal."
      }
    },
    {
      id: "reg_cuatro_cienegas",
      name: "Cuatro Ciénegas Basin",
      country: "Mexico",
      region_type: "Salar",
      lat: 26.98,
      lon: -102.05,
      elevation: 740,
      area_km2: 840,
      bbox: [-102.35, 26.80, -101.75, 27.15],
      desc: "Astrobiological analog for ancient Martian paleolakes. Gypsum dunes and freshwater springs hosting living stromatolites resembling Archaean Earth.",
      measurements: {
        slope_mean: 2.5, roughness: 0.16, elevation: 740, lithology_type: "clay_clastic",
        iron_oxide_content: 7.5, silica_content: 38.0, temperature_diurnal_range: 28.0,
        thermal_inertia: 320.0, gravity_anomaly: 15.0, magnetic_anomaly: 60.0, radiation_flux: 1.9, albedo: 0.35
      },
      env: {
        risk_level: "RESTRICTED_REVIEW",
        overlaps_wdpa: true,
        pa_name: "Área de Protección de Flora y Fauna Cuatrociénegas (Ramsar Wetland)",
        iucn: "VI",
        sdg13: "Aquifer recharge sensitivity under regional aridification.",
        sdg14: "Prehistoric stromatolite colonies and endemic pupfish springs.",
        sdg15: "Globally unique evolutionary refugium; high endemism index.",
        recommendation: "CRITICAL EXCLUSION: Heavy hardware testing prohibited near travertine ponds."
      }
    },
    {
      id: "reg_death_valley",
      name: "Death Valley (Badwater & Ubehebe)",
      country: "United States",
      region_type: "Desert",
      lat: 36.24,
      lon: -116.82,
      elevation: -60,
      area_km2: 1800,
      bbox: [-117.10, 36.00, -116.55, 36.50],
      desc: "Hyper-arid graben basin with alluvial fan deposits, Ubehebe maar volcanic crater, and polygon salt crusts analogous to Gale Crater mudstones.",
      measurements: {
        slope_mean: 5.0, roughness: 0.25, elevation: -60, lithology_type: "evaporite_salar",
        iron_oxide_content: 11.0, silica_content: 51.0, temperature_diurnal_range: 38.0,
        thermal_inertia: 360.0, gravity_anomaly: -30.0, magnetic_anomaly: 110.0, radiation_flux: 2.3, albedo: 0.28
      },
      env: {
        risk_level: "MEDIUM_ALERT",
        overlaps_wdpa: true,
        pa_name: "Death Valley National Park",
        iucn: "II",
        sdg13: "Extreme heat baseline monitoring.",
        sdg14: "Endorheic salt basin; isolated pupfish springs.",
        sdg15: "National Park permit required; wilderness zones off-limits.",
        recommendation: "Conduct simulation solely within designated gravel washes with NPS permit."
      }
    },
    {
      id: "reg_timanfaya",
      name: "Timanfaya Volcanic Field (Lanzarote)",
      country: "Spain",
      region_type: "Volcanic",
      lat: 29.02,
      lon: -13.73,
      elevation: 320,
      area_km2: 120,
      bbox: [-13.82, 28.95, -13.65, 29.10],
      desc: "Pristine basaltic 'malpaís' lava fields and volcanic conduits from 18th century eruptions. Host site for ESA PANGAEA astronaut training.",
      measurements: {
        slope_mean: 6.2, roughness: 0.38, elevation: 320, lithology_type: "basalt",
        iron_oxide_content: 14.2, silica_content: 45.0, temperature_diurnal_range: 18.0,
        thermal_inertia: 480.0, gravity_anomaly: 110.0, magnetic_anomaly: 240.0, radiation_flux: 2.0, albedo: 0.09
      },
      env: {
        risk_level: "HIGH_ALERT",
        overlaps_wdpa: true,
        pa_name: "Parque Nacional de Timanfaya (Lanzarote)",
        iucn: "II",
        sdg13: "Geothermal temperature gradient and pristine tephra.",
        sdg14: "Atlantic island boundary; avoid coastal volcanic cliffs.",
        sdg15: "Pioneer lichen ecological succession; extremely fragile surfaces.",
        recommendation: "Marked trails only; ESA PANGAEA geological training protocol compliant."
      }
    },
    {
      id: "reg_mcmurdo",
      name: "McMurdo Dry Valleys",
      country: "Antarctica",
      region_type: "Polar",
      lat: -77.50,
      lon: 162.50,
      elevation: 950,
      area_km2: 4800,
      bbox: [161.80, -77.80, 163.20, -77.20],
      desc: "Cold polar desert with continuous permafrost, hypolithic cyanobacteria, and desert pavement. Prime Mars polar and permafrost analog.",
      measurements: {
        slope_mean: 8.5, roughness: 0.34, elevation: 950, lithology_type: "permafrost",
        iron_oxide_content: 9.8, silica_content: 54.0, temperature_diurnal_range: 16.0,
        thermal_inertia: 280.0, gravity_anomaly: -55.0, magnetic_anomaly: 70.0, radiation_flux: 2.9, albedo: 0.20
      },
      env: {
        risk_level: "HIGH_ALERT",
        overlaps_wdpa: true,
        pa_name: "Antarctic Specially Protected Area (ASPA 131)",
        iucn: "Ia",
        sdg13: "Pristine polar climate baseline; permafrost preservation.",
        sdg14: "Hypersaline closed lake basins (Lake Vanda, Lake Bonney).",
        sdg15: "Endolithic and hypolithic microbial communities vulnerable to contamination.",
        recommendation: "Antarctic Treaty permit mandatory. Rigorous sterilization protocols."
      }
    },
    {
      id: "reg_craters_moon",
      name: "Craters of the Moon",
      country: "United States",
      region_type: "Lava_Tube",
      lat: 43.46,
      lon: -113.56,
      elevation: 1800,
      area_km2: 1600,
      bbox: [-113.75, 43.35, -113.35, 43.60],
      desc: "Vast basaltic flood plain along the Great Rift of Idaho with pahoehoe lava, cinder cones, and subterranean lava tubes where Apollo astronauts trained.",
      measurements: {
        slope_mean: 4.8, roughness: 0.31, elevation: 1800, lithology_type: "basalt",
        iron_oxide_content: 14.5, silica_content: 46.0, temperature_diurnal_range: 28.0,
        thermal_inertia: 420.0, gravity_anomaly: 65.0, magnetic_anomaly: 190.0, radiation_flux: 2.1, albedo: 0.10
      },
      env: {
        risk_level: "LOW_ALERT",
        overlaps_wdpa: true,
        pa_name: "Craters of the Moon National Monument and Preserve",
        iucn: "III",
        sdg13: "Volcanic soil carbon dynamics.",
        sdg14: "Inland volcanic rift; no marine interface.",
        sdg15: "Bat roosting colonies in cave entrances protected under wildlife plans.",
        recommendation: "Lava tube entrance testing permitted with NPS research permit."
      }
    },
    {
      id: "reg_rio_tinto",
      name: "Río Tinto",
      country: "Spain",
      region_type: "Desert",
      lat: 37.69,
      lon: -6.56,
      elevation: 430,
      area_km2: 170,
      bbox: [-6.72, 37.60, -6.40, 37.78],
      desc: "Acidic iron-rich river basin with pH 2–3 waters and extremophile chemolithotrophic microbial communities. Premier Mars analog for jarosite, goethite, and sulfate mineralogy matching Meridiani Planum hematite deposits.",
      measurements: {
        slope_mean: 7.8, roughness: 0.30, elevation: 430, lithology_type: "evaporite_salar",
        iron_oxide_content: 22.5, silica_content: 44.0, temperature_diurnal_range: 24.0,
        thermal_inertia: 340.0, gravity_anomaly: -12.0, magnetic_anomaly: 160.0, radiation_flux: 1.8, albedo: 0.13
      },
      env: {
        risk_level: "MEDIUM_ALERT",
        overlaps_wdpa: true,
        pa_name: "Paisaje Protegido del Río Tinto",
        iucn: "V",
        sdg13: "Legacy acid mine drainage altering local hydrological chemistry since Roman-era mining.",
        sdg14: "Acidic runoff reaching Huelva estuary; heavy metal contamination monitoring required.",
        sdg15: "Extremophile microbial mats and iron-oxidizing biofilms constitute unique biosphere.",
        recommendation: "Junta de Andalucía permit required. Avoid direct river channel disturbance; sample from exposed terraces only."
      }
    },
    {
      id: "reg_svalbard",
      name: "Svalbard Permafrost",
      country: "Norway",
      region_type: "Polar",
      lat: 78.23,
      lon: 15.63,
      elevation: 450,
      area_km2: 3200,
      bbox: [14.80, 77.90, 16.50, 78.55],
      desc: "High-Arctic permafrost terrain with active periglacial landforms, ice-cored moraines, and polygon-patterned ground. Mars polar analog for sublimation processes, ground-ice dynamics, and cryogenic weathering.",
      measurements: {
        slope_mean: 9.2, roughness: 0.38, elevation: 450, lithology_type: "permafrost",
        iron_oxide_content: 7.6, silica_content: 52.0, temperature_diurnal_range: 14.0,
        thermal_inertia: 250.0, gravity_anomaly: -35.0, magnetic_anomaly: 55.0, radiation_flux: 2.6, albedo: 0.32
      },
      env: {
        risk_level: "HIGH_ALERT",
        overlaps_wdpa: true,
        pa_name: "Svalbard Environmental Protection Act Zones (Nordaust-Svalbard & Søraust-Svalbard Nature Reserves)",
        iucn: "Ia",
        sdg13: "Rapid Arctic warming; permafrost thaw releasing stored methane and CO₂.",
        sdg14: "Glacial meltwater and sediment discharge into fjord ecosystems.",
        sdg15: "Vulnerable tundra vegetation, polar bear denning habitat, and Svalbard reindeer grazing grounds.",
        recommendation: "Governor of Svalbard permit mandatory. All-terrain vehicle use restricted to frozen ground; summer access on foot only."
      }
    },
    {
      id: "reg_wadi_rum",
      name: "Wadi Rum",
      country: "Jordan",
      region_type: "Desert",
      lat: 29.57,
      lon: 35.42,
      elevation: 970,
      area_km2: 740,
      bbox: [35.25, 29.40, 35.60, 29.75],
      desc: "Sandstone and granite desert valley with towering inselbergs, wind-carved arches, and iron-stained red dunes. Mars analog for aeolian erosion, ventifact formation, and iron-oxide surface coatings resembling Gale Crater terrain.",
      measurements: {
        slope_mean: 8.5, roughness: 0.33, elevation: 970, lithology_type: "clay_clastic",
        iron_oxide_content: 12.8, silica_content: 68.0, temperature_diurnal_range: 34.0,
        thermal_inertia: 370.0, gravity_anomaly: 18.0, magnetic_anomaly: 85.0, radiation_flux: 2.4, albedo: 0.22
      },
      env: {
        risk_level: "RESTRICTED_REVIEW",
        overlaps_wdpa: true,
        pa_name: "Wadi Rum Protected Area (UNESCO World Heritage Site)",
        iucn: "II",
        sdg13: "Arid climate baseline monitoring; sand dune migration patterns.",
        sdg14: "Inland desert; no direct marine interaction. Ephemeral flash-flood drainage.",
        sdg15: "UNESCO Mixed Heritage Site with Bedouin cultural landscape and rare Nubian ibex populations.",
        recommendation: "ASEZA & Royal Society for Conservation of Nature permit required. Vehicle transit on marked tracks only."
      }
    },
    {
      id: "reg_kilauea",
      name: "Kīlauea Lava Fields",
      country: "United States",
      region_type: "Volcanic",
      lat: 19.41,
      lon: -155.28,
      elevation: 1050,
      area_km2: 600,
      bbox: [-155.45, 19.28, -155.10, 19.55],
      desc: "Active shield volcano with fresh pāhoehoe and ʻaʻā lava flows, lava tubes, and sulfurous fumarole fields. Analog for lunar and Martian volcanic resurfacing, basaltic regolith generation, and subsurface lava tube habitats.",
      measurements: {
        slope_mean: 4.5, roughness: 0.32, elevation: 1050, lithology_type: "basalt",
        iron_oxide_content: 13.5, silica_content: 50.0, temperature_diurnal_range: 12.0,
        thermal_inertia: 520.0, gravity_anomaly: 95.0, magnetic_anomaly: 310.0, radiation_flux: 1.7, albedo: 0.06
      },
      env: {
        risk_level: "HIGH_ALERT",
        overlaps_wdpa: true,
        pa_name: "Hawaiʻi Volcanoes National Park (UNESCO World Heritage Site)",
        iucn: "II",
        sdg13: "Active volcanic degassing (SO₂, CO₂) contributing to vog air quality hazards.",
        sdg14: "Lava ocean entry plumes generating hydrochloric acid (laze) in coastal waters.",
        sdg15: "Pioneer ʻōhiʻa lehua forest succession on new lava; endangered nēnē goose habitat.",
        recommendation: "NPS research permit mandatory. Active vent exclusion zones enforced. Gas masks required near fumaroles."
      }
    },
    {
      id: "reg_uyuni",
      name: "Salar de Uyuni",
      country: "Bolivia",
      region_type: "Salar",
      lat: -20.13,
      lon: -67.49,
      elevation: 3656,
      area_km2: 10582,
      bbox: [-68.10, -20.60, -66.85, -19.65],
      desc: "World's largest salt flat at 3,656 m altitude. Hyper-flat evaporite crust over lithium-rich brine. Analog for Martian chloride salt deposits, satellite altimetry calibration target, and high-UV radiation environment.",
      measurements: {
        slope_mean: 0.8, roughness: 0.08, elevation: 3656, lithology_type: "evaporite_salar",
        iron_oxide_content: 4.2, silica_content: 32.0, temperature_diurnal_range: 30.0,
        thermal_inertia: 410.0, gravity_anomaly: -70.0, magnetic_anomaly: 25.0, radiation_flux: 3.5, albedo: 0.69
      },
      env: {
        risk_level: "MEDIUM_ALERT",
        overlaps_wdpa: false,
        pa_name: "Adjacent to Reserva Nacional de Fauna Andina Eduardo Avaroa",
        iucn: "None",
        sdg13: "High-altitude UV index exceeding 16; climate monitoring baseline for Altiplano.",
        sdg14: "Endorheic salt basin with seasonal shallow brine lake supporting Andean flamingo breeding.",
        sdg15: "Lithium extraction expansion threatening flamingo nesting lagoons and subsurface brine ecology.",
        recommendation: "SERNAP coordination advised. Avoid wet-season lake areas. Vehicle crossing on hardened crust tracks only."
      }
    },
    {
      id: "reg_namib",
      name: "Namib Desert Skeleton Coast",
      country: "Namibia",
      region_type: "Desert",
      lat: -20.45,
      lon: 13.85,
      elevation: 320,
      area_km2: 5000,
      bbox: [13.20, -21.10, 14.50, -19.80],
      desc: "Ancient hyper-arid coastal desert with towering linear dunes, gravel plains, and fog-dependent lichen fields. Mars analog for aeolian dune dynamics, wind-streak formation, and extreme aridity water-scavenging biology.",
      measurements: {
        slope_mean: 6.0, roughness: 0.26, elevation: 320, lithology_type: "clay_clastic",
        iron_oxide_content: 10.5, silica_content: 58.0, temperature_diurnal_range: 26.0,
        thermal_inertia: 330.0, gravity_anomaly: -8.0, magnetic_anomaly: 45.0, radiation_flux: 2.5, albedo: 0.30
      },
      env: {
        risk_level: "HIGH_ALERT",
        overlaps_wdpa: true,
        pa_name: "Namib-Naukluft National Park & Skeleton Coast National Park (Namib Sand Sea UNESCO WHS)",
        iucn: "II",
        sdg13: "Fog-precipitation regime sensitive to sea surface temperature shifts.",
        sdg14: "Cold Benguela upwelling current supporting Cape fur seal colonies along Skeleton Coast.",
        sdg15: "Ancient Welwitschia mirabilis plant colonies (>1000 years), fog-basking beetles, and desert-adapted elephants.",
        recommendation: "MET (Ministry of Environment) permit required. Lichen fields absolutely off-limits to vehicles; designated corridors only."
      }
    },
    {
      id: "reg_dallol",
      name: "Dallol / Danakil Depression",
      country: "Ethiopia",
      region_type: "Volcanic",
      lat: 14.24,
      lon: 40.30,
      elevation: -125,
      area_km2: 950,
      bbox: [40.15, 14.10, 40.45, 14.40],
      desc: "One of the hottest and lowest subaerial places on Earth (-125m). Hyper-acidic (pH < 0), hyper-saline hydrothermal pools with sulfur chimneys and iron oxides. Astrobiological boundary analog for ancient Martian hot springs and early Earth hydrothermal systems.",
      measurements: {
        slope_mean: 3.8, roughness: 0.28, elevation: -125, lithology_type: "evaporite_salar",
        iron_oxide_content: 18.5, silica_content: 35.0, temperature_diurnal_range: 22.0,
        thermal_inertia: 450.0, gravity_anomaly: -25.0, magnetic_anomaly: 140.0, radiation_flux: 2.7, albedo: 0.28
      },
      env: {
        risk_level: "RESTRICTED_REVIEW",
        overlaps_wdpa: false,
        pa_name: "Afar Regional Protected Geological Monument",
        iucn: "None",
        sdg13: "Extreme thermal baseline (>45°C ambient); volcanic degassing of toxic chlorine and sulfur gases.",
        sdg14: "Hyper-saline endorheic potash lake with zero macroscopic aquatic life.",
        sdg15: "Ultra-extreme poly-extremophilic archaea and bacteria; fragile mineral terraces easily crushed by footwear.",
        recommendation: "Afar Regional Government escort mandatory. Acid-resistant robotic sampling only. No heavy foot traffic on salt terraces."
      }
    },
    {
      id: "reg_pilbara",
      name: "Pilbara Craton (North Pole Dome)",
      country: "Australia",
      region_type: "Crater",
      lat: -21.15,
      lon: 119.38,
      elevation: 380,
      area_km2: 4200,
      bbox: [118.80, -21.60, 119.90, -20.80],
      desc: "3.5 billion-year-old Archaean continental crust hosting Earth's oldest fossilized stromatolites and hydrothermal barite cherts. Premier Mars 2020 Perseverance delta and Noachian bedrock analog for the search for ancient biosignatures.",
      measurements: {
        slope_mean: 6.5, roughness: 0.29, elevation: 380, lithology_type: "clay_clastic",
        iron_oxide_content: 21.0, silica_content: 58.0, temperature_diurnal_range: 32.0,
        thermal_inertia: 380.0, gravity_anomaly: 15.0, magnetic_anomaly: 210.0, radiation_flux: 2.1, albedo: 0.17
      },
      env: {
        risk_level: "HIGH_ALERT",
        overlaps_wdpa: true,
        pa_name: "Karijini National Park & Western Australia Heritage Register (Dresser Formation)",
        iucn: "II",
        sdg13: "Arid interior climate; bushfire regime impacting regional vegetation.",
        sdg14: "Intermittent seasonal creeks draining into the Fortescue River basin.",
        sdg15: "Irreplaceable 3.5 Ga stromatolite fossil beds; strict legal protection against unauthorized rock coring or hammering.",
        recommendation: "Western Australia Department of Mines & Aboriginal heritage clearance mandatory. Strictly non-destructive in-situ spectroscopy only."
      }
    },
    {
      id: "reg_askja",
      name: "Askja & Holuhraun Volcanic Field",
      country: "Iceland",
      region_type: "Volcanic",
      lat: 65.03,
      lon: -16.75,
      elevation: 1100,
      area_km2: 1200,
      bbox: [-17.10, 64.85, -16.40, 65.20],
      desc: "Historic Apollo lunar training site (1965 & 1967) and ESA astronaut testbed. Features vast basaltic flood plains, explosion calderas (Öskjuvatn), palagonite tuff ridges, and fresh 2014-2015 Holuhraun basalt flows analogous to Martian volcanic provinces.",
      measurements: {
        slope_mean: 7.2, roughness: 0.36, elevation: 1100, lithology_type: "basalt",
        iron_oxide_content: 14.0, silica_content: 48.0, temperature_diurnal_range: 16.0,
        thermal_inertia: 460.0, gravity_anomaly: 45.0, magnetic_anomaly: 280.0, radiation_flux: 1.6, albedo: 0.08
      },
      env: {
        risk_level: "HIGH_ALERT",
        overlaps_wdpa: true,
        pa_name: "Vatnajökull National Park (UNESCO World Heritage Site)",
        iucn: "II",
        sdg13: "Subglacial volcanic hazards and jökulhlaup (glacial outburst flood) risks.",
        sdg14: "Glacial meltwater rivers carrying volcanic sediment to North Atlantic coast.",
        sdg15: "Pristine pioneer moss and lichen growth on fresh volcanic tephra vulnerable to off-road wheel ruts.",
        recommendation: "Vatnajökull National Park ranger permit required. Vehicles strictly confined to F910 track. Zero off-trail rover transit."
      }
    },
    {
      id: "reg_eye_sahara",
      name: "Richat Structure (Eye of the Sahara)",
      country: "Mauritania",
      region_type: "Crater",
      lat: 21.13,
      lon: -11.40,
      elevation: 400,
      area_km2: 1500,
      bbox: [-11.65, 20.95, -11.15, 21.30],
      desc: "Distinctive 40-km diameter circular ring dome in the Sahara Desert, originally thought to be a meteorite impact crater and now recognized as an alkaline hydrothermal igneous dome. Landmark for astronaut photography and analog for circular ring structures on Mars and the Moon.",
      measurements: {
        slope_mean: 5.4, roughness: 0.24, elevation: 400, lithology_type: "impact_melt",
        iron_oxide_content: 11.5, silica_content: 62.0, temperature_diurnal_range: 35.0,
        thermal_inertia: 360.0, gravity_anomaly: -5.0, magnetic_anomaly: 90.0, radiation_flux: 2.4, albedo: 0.26
      },
      env: {
        risk_level: "LOW_ALERT",
        overlaps_wdpa: false,
        pa_name: "Guelb er Richat Geological Monument",
        iucn: "None",
        sdg13: "Saharan hyper-arid environment; sand sheet deflation and dune migration.",
        sdg14: "Inland desert basin; paleorivers now dry (Wadi el-Abiod).",
        sdg15: "Sparse Saharan acacia desert vegetation; endemic desert lizards and migratory raptor corridor.",
        recommendation: "Mauritanian Ministry of Tourism & Environment notification. Standard desert navigation precautions."
      }
    },
    {
      id: "reg_vostok",
      name: "Lake Vostok Subglacial Plateau",
      country: "Antarctica",
      region_type: "Polar",
      lat: -78.46,
      lon: 106.83,
      elevation: 3488,
      area_km2: 15000,
      bbox: [104.50, -79.50, 109.00, -77.50],
      desc: "Deep subglacial lake sealed beneath 4,000 meters of polar ice for over 15 million years. Primary terrestrial planetary analog for the ice shells and subsurface liquid oceans of Europa, Enceladus, and Ganymede. Extreme cryogenic high-pressure environment.",
      measurements: {
        slope_mean: 1.2, roughness: 0.10, elevation: 3488, lithology_type: "permafrost",
        iron_oxide_content: 1.2, silica_content: 25.0, temperature_diurnal_range: 10.0,
        thermal_inertia: 180.0, gravity_anomaly: -85.0, magnetic_anomaly: 15.0, radiation_flux: 3.8, albedo: 0.88
      },
      env: {
        risk_level: "RESTRICTED_REVIEW",
        overlaps_wdpa: true,
        pa_name: "Antarctic Treaty Specially Protected Area (ATCM Planetary Protection Zone)",
        iucn: "Ia",
        sdg13: "Polar ice sheet mass balance and global climate proxy ice cores spanning 420,000 years.",
        sdg14: "Deep isolated subglacial aquatic biome; absolute zero chemical or biological contamination mandate.",
        sdg15: "Potential chemosynthetic subglacial microbes isolated from Earth's atmosphere for millennia.",
        recommendation: "STRICTEST PLANETARY PROTECTION: ATCM & SCAR approval mandatory. Non-contaminating thermal melting drill heads required."
      }
    },
    {
      id: "reg_qaidam",
      name: "Qaidam Basin Yardang Fields",
      country: "China",
      region_type: "Desert",
      lat: 37.85,
      lon: 93.65,
      elevation: 2800,
      area_km2: 6500,
      bbox: [92.80, 37.20, 94.50, 38.50],
      desc: "Hyper-arid, high-altitude playa plateau in northwestern China covered by the largest terrestrial yardang field. Features polygonal halite crusts, epsomite sulfate evaporites, perchlorate salts, and strong wind sculpting closely matching the Medusae Fossae and Gale Crater yardangs on Mars.",
      measurements: {
        slope_mean: 5.8, roughness: 0.31, elevation: 2800, lithology_type: "evaporite_salar",
        iron_oxide_content: 12.0, silica_content: 54.0, temperature_diurnal_range: 30.0,
        thermal_inertia: 360.0, gravity_anomaly: -40.0, magnetic_anomaly: 80.0, radiation_flux: 3.2, albedo: 0.25
      },
      env: {
        risk_level: "MEDIUM_ALERT",
        overlaps_wdpa: false,
        pa_name: "Qaidam Desert Geopark Reserve",
        iucn: "None",
        sdg13: "High Tibetan Plateau solar irradiance and atmospheric dust generation.",
        sdg14: "Endorheic hyper-saline terminal lakes (Qarhan Playa).",
        sdg15: "Halophilic microbial mats in subsurface salt deposits; desert steppe fringe ecosystems.",
        recommendation: "Qinghai Environmental Bureau permit required. Maintain buffer from industrial potash mining infrastructure."
      }
    }
  ],

  events: [
    {
      id: "evt_1",
      region_id: "reg_pinacate",
      region_name: "El Pinacate Volcanic Field",
      event_type: "PREVENTIVE_ALERT",
      severity: "HIGH",
      status: "RESOLVED",
      description: "Preventive soil crust protection perimeter marked. Prohibits off-trail motorized rover transit to preserve desert pavement.",
      activity: "Heavy rover transit & wheel torque testing",
      impact_type: "Soil compaction & biological crust disruption (SDG 15)",
      reviewer: "CONANP - Planetary Ethics Liaison",
      observed_at: "2024-04-12T10:00:00Z",
      mitigation: "Confined testing to existing volcanic gravel wash roads. Rubber track treads mandated."
    },
    {
      id: "evt_2",
      region_id: "reg_cuatro_cienegas",
      region_name: "Cuatro Ciénegas Basin",
      event_type: "PREVENTIVE_ALERT",
      severity: "CRITICAL",
      status: "REGISTERED",
      description: "Strict exclusion zone established around Poza Azul and Mojarral travertine ponds. Complete ban on submersible equipment or drilling.",
      activity: "Sample coring and water table sensor deployment",
      impact_type: "Irreversible microbialite habitat damage (SDG 14 & 15)",
      reviewer: "UNEP-WCMC Biosphere Monitor",
      observed_at: "2024-06-20T14:30:00Z",
      mitigation: "Testing diverted 12 km west into dry gypsum dunes with zero aquatic runoff."
    },
    {
      id: "evt_3",
      region_id: "reg_timanfaya",
      region_name: "Timanfaya Volcanic Field",
      event_type: "RECORDED_OBSERVATION",
      severity: "LOW",
      status: "RESOLVED",
      description: "ESA PANGAEA geological traverse inspection. Confirmed minimal surface trace; foot-borne sampling on marked ash paths.",
      activity: "Astronaut geological training & field spectroscopy",
      impact_type: "Minor ash tread disturbance",
      reviewer: "ESA Planetary Protection Officer",
      observed_at: "2024-09-05T16:00:00Z",
      mitigation: "Re-raked volcanic ash trail; zero environmental residue."
    }
  ]
};
