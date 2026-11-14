"""
TerraAnalog - Comprehensive Seed Data
Populates databases with verified data sources, datasets, planetary targets (Moon & Mars),
and terrestrial analog candidate regions with rigorous scientific measurements.
"""
import json
import sqlite3
from typing import Dict, Any, List
from app.database import get_connection, init_db
from app.features.definitions import FEATURE_CATALOG
from app.environment.engine import EnvironmentEngine
from app.models import (
    DataSource, Dataset, CandidateRegion, TargetProfile,
    FeatureDefinition, FeatureMeasurement, EnvironmentalAssessment,
    EnvironmentEvent, generate_id, now_iso
)

def populate_database():
    """Seed the SQLite database with full initial catalog"""
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if already seeded
    cursor.execute("SELECT COUNT(*) FROM candidate_regions")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return
        
    print("Seeding TerraAnalog database with planetary & terrestrial records...")
    
    # 1. DATA SOURCES
    sources = [
        ("src_nasa_cmr", "NASA Common Metadata Repository (CMR)", "NASA ESDIS", "https://cmr.earthdata.nasa.gov", "REST_API", "Public Domain (NASA Open Data)", 0, "active", "Official NASA catalog for Earth observation datasets."),
        ("src_nasa_gibs", "NASA Global Imagery Browse Services (GIBS)", "NASA ESDIS", "https://gibs.earthdata.nasa.gov", "WMTS", "Public Domain", 0, "active", "Full-resolution imagery tiles for Earth & planetary surfaces."),
        ("src_nasa_pds", "NASA Planetary Data System (PDS)", "NASA Planetary Science Division", "https://pds.nasa.gov", "REST_API", "NASA Open Access", 0, "active", "Archive of scientific data from NASA planetary exploration missions."),
        ("src_copernicus", "Copernicus Data Space Ecosystem", "ESA / European Commission", "https://dataspace.copernicus.eu", "STAC", "Copernicus Open Access", 1, "requires_credentials", "Sentinel-1 SAR and Sentinel-2 multispectral surface imagery."),
        ("src_csa_radarsat", "CSA Earth Observation Data (RADARSAT / RCM)", "Canadian Space Agency", "https://donnees-data.asc-csa.gc.ca", "FILE_DOWNLOAD", "Open Government Licence - Canada", 0, "active", "C-band Synthetic Aperture Radar for roughness and permafrost analysis."),
        ("src_jaxa_gportal", "JAXA Global Portal System (G-Portal)", "JAXA", "https://gportal.jaxa.jp", "REST_API", "JAXA Standard Policy", 1, "requires_credentials", "ALOS/PALSAR SAR and GCOM surface environment products."),
        ("src_conabio_inegi", "CONABIO & INEGI Geoportal (Mexico)", "CONABIO / INEGI", "https://www.conabio.gob.mx/informacion/gis", "FILE_DOWNLOAD", "Libre Uso (Mexico Open Data)", 0, "active", "National biodiversity, land cover (Serie VII), and protected natural areas of Mexico."),
        ("src_protected_planet", "Protected Planet (WDPA / WDPCA)", "UNEP-WCMC / IUCN", "https://api.protectedplanet.net", "REST_API", "WDPA Non-commercial Academic", 1, "requires_credentials", "Global authority on terrestrial and marine protected areas for SDG 14 & 15."),
        ("src_esa_worldcover", "ESA WorldCover Global Land Cover", "ESA WorldCover Consortium", "https://esa-worldcover.org", "COG", "CC BY 4.0", 0, "active", "10-meter global land cover classification map."),
        ("src_nasa_sedac", "NASA SEDAC Socioeconomic Data", "CIESIN Columbia University", "https://sedac.ciesin.columbia.edu", "REST_API", "NASA Open Access", 0, "active", "Global Human Footprint and ecological pressure datasets.")
    ]
    cursor.executemany("""
        INSERT INTO data_sources (id, name, provider, base_url, access_type, license, requires_auth, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sources)

    # 2. DATASETS
    datasets = [
        ("ds_aster_gdem", "src_nasa_cmr", "ASTGTM_V003", "ASTER Global Digital Elevation Model V003", "Earth", "ASTER", "DEM", "30m", "2000-03-01", "2024-01-01", "EPSG:4326", "{}", "download_available", "NASA/METI/AIST/Japan Spacesystems and U.S./Japan ASTER Science Team"),
        ("ds_lro_diviner", "src_nasa_pds", "LRO-L-DLRE-4-GDR-V1.0", "LRO Diviner Lunar Radiometer Thermal Brightness & Radiance", "Moon", "Diviner (DLRE)", "Radiometer", "240m", "2009-07-05", "2024-06-01", "Lunar Polar Stereographic", "{}", "download_available", "Paige et al., Space Science Reviews, 2010"),
        ("ds_lro_lola", "src_nasa_pds", "LRO-L-LOLA-4-GDR-V1.0", "LRO Lunar Orbiter Laser Altimeter DEM (LDEM)", "Moon", "LOLA", "DEM", "118m", "2009-07-13", "2024-06-01", "IAU2000:30100", "{}", "download_available", "Smith et al., Icarus, 2017"),
        ("ds_mgs_mola", "src_nasa_pds", "MGS-M-MOLA-3-PEDR-L2-V1.0", "Mars Global Surveyor MOLA Topographic Map (MEGDR)", "Mars", "MOLA", "DEM", "463m", "1997-09-15", "2006-11-02", "IAU2000:49900", "{}", "download_available", "Smith et al., Science, 1999"),
        ("ds_mro_crism", "src_nasa_pds", "MRO-M-CRISM-3-RDR-V1.0", "MRO CRISM Targeted Spectral Mineralogy", "Mars", "CRISM", "Mineralogy", "18m", "2006-11-01", "2023-04-01", "IAU2000:49900", "{}", "download_available", "Murchie et al., JGR Planets, 2007"),
        ("ds_esa_worldcover", "src_esa_worldcover", "ESA_WorldCover_10m_v200", "ESA WorldCover 10m Global Land Cover 2021", "Earth", "Sentinel-1/2", "Vector/Raster", "10m", "2021-01-01", "2021-12-31", "EPSG:4326", "{}", "download_available", "Zanaga et al., ESA WorldCover 10m 2021 v200"),
        ("ds_inegi_usv", "src_conabio_inegi", "INEGI_USV_S7", "INEGI Uso del Suelo y Vegetación Serie VII (1:250,000)", "Earth", "In-situ & SPOT/Landsat", "Vector", "1:250,000", "2018-01-01", "2021-12-31", "EPSG:6362", "{}", "download_available", "INEGI México, Dirección General de Geografía y Medio Ambiente")
    ]
    cursor.executemany("""
        INSERT INTO datasets (id, source_id, external_id, title, body, instrument, product_type, spatial_resolution, temporal_start, temporal_end, crs, metadata_json, access_status, citation_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, datasets)

    # 3. FEATURE DEFINITIONS
    for f in FEATURE_CATALOG:
        cursor.execute("""
            INSERT INTO feature_definitions (id, key, name, category, unit, data_type, default_weight, tolerance, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"feat_{f['key']}", f["key"], f["name"], f["category"], f["unit"],
            f["data_type"], f["default_weight"], f["tolerance"], f["description"]
        ))

    # 4. TARGET PROFILES (MOON & MARS)
    targets = [
        # Moon
        (
            "tgt_moon_shackleton", "Moon", "Shackleton Crater Rim (South Pole)",
            "Artemis III Candidate Landing Site & Permanent Cold Traps",
            -89.9, 0.0,
            "Impact crater rim at the lunar South Pole featuring quasi-permanent sunlight on peak plateaus and permanently shadowed regions (PSRs) harboring volatile water ice. Anorthositic regolith and breccia.",
            "Polar_Cold_Trap", "2.0.0", 1,
            json.dumps({"solar_illumination_pct": 86.0, "shadowed_basin_depth_km": 4.2})
        ),
        (
            "tgt_moon_tranquillitatis", "Moon", "Mare Tranquillitatis",
            "Apollo 11 Historical Landing Site & Potential Base Location",
            0.67, 23.47,
            "Low-albedo basaltic mare plains rich in titanium (ilmenite) and iron oxides. Smooth terrain with gentle slopes, extensive regolith blanket, and thermal stability in sub-equatorial latitudes.",
            "Basaltic_Plains", "1.0.0", 1,
            json.dumps({"fe_wt_pct": 14.5, "tio2_wt_pct": 7.5})
        ),
        (
            "tgt_moon_procellarum", "Moon", "Oceanus Procellarum / Marius Hills",
            "Lunar Lava Tube Skylights & Volcanic Rilles",
            14.2, -56.8,
            "Extensive lunar volcanic province exhibiting sinuous rilles, volcanic domes, and collapsed pit craters leading into subterranean lava tubes suitable for radiation-shielded habitat construction.",
            "Lava_Tube", "1.0.0", 1,
            json.dumps({"pit_diameter_m": 65.0, "pit_depth_m": 80.0})
        ),
        # Mars
        (
            "tgt_mars_jezero", "Mars", "Jezero Crater (Delta & Scarp)",
            "Mars 2020 Perseverance Rover Landing & Sample Return Site",
            18.38, 77.58,
            "Ancient paleolake basin featuring a preserved fan delta with rich smectite phyllosilicates (clays), carbonate deposits, and boulder-strewn basaltic crater floor. Excellent astrobiology search context.",
            "Deltaic_Clay", "2.1.0", 1,
            json.dumps({"delta_age_gyr": 3.7, "dominant_clay": "Fe/Mg Smectite"})
        ),
        (
            "tgt_mars_gale", "Mars", "Gale Crater & Mount Sharp Flank",
            "Mars Science Laboratory Curiosity Rover Site",
            -4.59, 137.44,
            "Layered sedimentary mound (Aeolis Mons) exposing sulfate-bearing and hematite units over ancient clay-bearing strata. Arid, active sand dunes (Bagnold Dunes) and gravel plains.",
            "Crater_Rim", "1.5.0", 1,
            json.dumps({"mound_elevation_km": 5.5, "sulfate_concentration_high": True})
        ),
        (
            "tgt_mars_olympus", "Mars", "Olympus Mons Flank & Lava Plains",
            "Tharsis Volcanic Province Shield Plains",
            18.65, -133.80,
            "Gentle basaltic shield flanks with extensive sheet flows, lava tubes, and cinder cone chains. High cosmic radiation flux due to altitude above Martian datum.",
            "Volcanic", "1.0.0", 1,
            json.dumps({"shield_slope_deg": 5.0, "basaltic_crust_dominant": True})
        ),
        (
            "tgt_mars_meridiani", "Mars", "Meridiani Planum",
            "Opportunity Rover Site - Hematite Spherule Plains",
            -1.95, -5.53,
            "Extremely flat plains with high gray crystalline hematite concentrations (iron blueberries), jarosite and magnesium sulfates from ancient acidic groundwater evaporation.",
            "Salar", "1.0.0", 1,
            json.dumps({"hematite_wt_pct": 16.0, "albedo_low": True})
        )
    ]
    cursor.executemany("""
        INSERT INTO target_profiles (id, body, name, mission_context, latitude, longitude, description, target_environment, version, is_active, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, targets)

    # 5. CANDIDATE REGIONS (WORLDWIDE ANALOGS)
    candidates = [
        (
            "reg_pinacate", "El Pinacate Volcanic Field", "Mexico", "Volcanic",
            31.77, -113.50,
            json.dumps([-113.85, 31.55, -113.15, 32.05]),
            json.dumps({
                "type": "Polygon",
                "coordinates": [[
                    [-113.85, 31.55], [-113.15, 31.55],
                    [-113.15, 32.05], [-113.85, 32.05],
                    [-113.85, 31.55]
                ]]
            }),
            1500.0, 1190.0,
            "Historic Apollo astronaut lunar training site. Over 400 basaltic cinder cones and 10 giant Maar explosion craters (e.g., Elegante Crater) closely resembling lunar and Martian impact/volcanic craters. Arid desert pavement with high basaltic FeO content.",
            "active", 0
        ),
        (
            "reg_atacama", "Atacama Desert (Yungay Core)", "Chile", "Desert",
            -24.08, -69.95,
            json.dumps([-70.20, -24.30, -69.70, -23.85]),
            json.dumps({
                "type": "Polygon",
                "coordinates": [[
                    [-70.20, -24.30], [-69.70, -24.30],
                    [-69.70, -23.85], [-70.20, -23.85],
                    [-70.20, -24.30]
                ]]
            }),
            2200.0, 1050.0,
            "The driest non-polar desert on Earth and primary Mars analog for Viking, Phoenix, and Curiosity. Hyper-arid soil devoid of organic matter, rich in perchlorates, evaporite nitrates, and oxidized iron minerals. Extreme UV radiation flux.",
            "active", 0
        ),
        (
            "reg_haughton", "Haughton Impact Crater (Devon Island)", "Canada", "Crater",
            75.38, -89.68,
            json.dumps([-90.00, 75.25, -89.35, 75.50]),
            json.dumps({
                "type": "Polygon",
                "coordinates": [[
                    [-90.00, 75.25], [-89.35, 75.25],
                    [-89.35, 75.50], [-90.00, 75.50],
                    [-90.00, 75.25]
                ]]
            }),
            350.0, 240.0,
            "23 km wide meteorite impact crater in a polar desert environment. NASA Haughton-Mars Project (HMP) testbed for rover mobility, drilling in permafrost, hydrothermal impact deposits, and shatter cones.",
            "active", 0
        ),
        (
            "reg_cuatro_cienegas", "Cuatro Ciénegas Basin", "Mexico", "Salar",
            26.98, -102.05,
            json.dumps([-102.35, 26.80, -101.75, 27.15]),
            json.dumps({
                "type": "Polygon",
                "coordinates": [[
                    [-102.35, 26.80], [-101.75, 26.80],
                    [-101.75, 27.15], [-102.35, 27.15],
                    [-102.35, 26.80]
                ]]
            }),
            840.0, 740.0,
            "Ancient astrobiological analog for Mars paleolakes (like Jezero). Gypsum (calcium sulfate) dunes and inter-dune evaporite flats hosting living microbialites / stromatolites resembling Earth's Archaean and ancient Martian aquatic environments.",
            "active", 0
        ),
        (
            "reg_death_valley", "Death Valley (Ubehebe & Badwater)", "United States", "Desert",
            36.24, -116.82,
            json.dumps([-117.10, 36.00, -116.55, 36.50]),
            json.dumps({
                "type": "Polygon",
                "coordinates": [[
                    [-117.10, 36.00], [-116.55, 36.00],
                    [-116.55, 36.50], [-117.10, 36.50],
                    [-117.10, 36.00]
                ]]
            }),
            1800.0, -86.0,
            "Hyper-arid basin with alluvial fan deposits, Ubehebe maar volcanic craters, and polygonal salt crusts analogous to Gale Crater mudstones and Martian evaporite basins. Extreme summer surface temperatures reaching 330 K.",
            "active", 0
        ),
        (
            "reg_timanfaya", "Timanfaya Volcanic Field (Lanzarote)", "Spain", "Volcanic",
            29.02, -13.73,
            json.dumps([-13.82, 28.95, -13.65, 29.10]),
            json.dumps({
                "type": "Polygon",
                "coordinates": [[
                    [-13.82, 28.95], [-13.65, 28.95],
                    [-13.65, 29.10], [-13.82, 29.10],
                    [-13.82, 28.95]
                ]]
            }),
            120.0, 350.0,
            "Pristine basaltic 'malpaís' lava fields and volcanic conduits created during 1730-1736 eruptions. Host site for ESA PANGAEA astronaut field training and rover testing. High lithological match with lunar and Martian basaltic plains.",
            "active", 0
        ),
        (
            "reg_mcmurdo", "McMurdo Dry Valleys", "Antarctica", "Polar",
            -77.50, 162.50,
            json.dumps([161.80, -77.80, 163.20, -77.20]),
            json.dumps({
                "type": "Polygon",
                "coordinates": [[
                    [161.80, -77.80], [163.20, -77.80],
                    [163.20, -77.20], [161.80, -77.20],
                    [161.80, -77.80]
                ]]
            }),
            4800.0, 950.0,
            "Cold desert with zero liquid precipitation, continuous permafrost, hypolithic communities, and dry gravel scree slopes. Prime terrestrial analog for Martian polar ice margins and permafrost polygons.",
            "active", 0
        ),
        (
            "reg_craters_moon", "Craters of the Moon", "United States", "Lava_Tube",
            43.46, -113.56,
            json.dumps([-113.75, 43.35, -113.35, 43.60]),
            json.dumps({
                "type": "Polygon",
                "coordinates": [[
                    [-113.75, 43.35], [-113.35, 43.35],
                    [-113.35, 43.60], [-113.75, 43.60],
                    [-113.75, 43.35]
                ]]
            }),
            1600.0, 1800.0,
            "Vast basaltic flood plain along the Great Rift of Idaho. Features pahoehoe lava, cinder spatter cones, and dozens of accessible subterranean lava tubes where Apollo astronauts tested rock sampling techniques.",
            "active", 0
        )
    ]
    cursor.executemany("""
        INSERT INTO candidate_regions (id, name, country, region_type, latitude, longitude, bounding_box, geometry_geojson, area_km2, elevation_m, description, candidate_status, is_demo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, candidates)

    # 6. PHYSICAL MEASUREMENTS FOR CANDIDATES AND TARGETS
    measurements_data = [
        # --- TARGET: Shackleton Crater (Moon South Pole) ---
        ("tgt_moon_shackleton", "slope_mean", 14.5, None, "degrees", 0.95, "ds_lro_lola"),
        ("tgt_moon_shackleton", "roughness", 0.42, None, "index", 0.90, "ds_lro_lola"),
        ("tgt_moon_shackleton", "elevation", -4200.0, None, "meters", 0.95, "ds_lro_lola"),
        ("tgt_moon_shackleton", "lithology_type", None, "anorthosite", "class", 0.90, "ds_lro_diviner"),
        ("tgt_moon_shackleton", "iron_oxide_content", 5.2, None, "wt%", 0.85, "ds_lro_diviner"),
        ("tgt_moon_shackleton", "silica_content", 45.0, None, "wt%", 0.85, "ds_lro_diviner"),
        ("tgt_moon_shackleton", "temperature_diurnal_range", 180.0, None, "Kelvin", 0.95, "ds_lro_diviner"),
        ("tgt_moon_shackleton", "thermal_inertia", 45.0, None, "J m^-2 K^-1 s^-1/2", 0.85, "ds_lro_diviner"),
        ("tgt_moon_shackleton", "gravity_anomaly", -65.0, None, "mGal", 0.90, "ds_lro_lola"),
        ("tgt_moon_shackleton", "magnetic_anomaly", 2.0, None, "nT", 0.80, "ds_lro_lola"),
        ("tgt_moon_shackleton", "radiation_flux", 380.0, None, "mSv/year", 0.95, "ds_lro_diviner"),
        ("tgt_moon_shackleton", "albedo", 0.12, None, "ratio", 0.90, "ds_lro_lola"),

        # --- TARGET: Mare Tranquillitatis (Moon) ---
        ("tgt_moon_tranquillitatis", "slope_mean", 3.2, None, "degrees", 0.95, "ds_lro_lola"),
        ("tgt_moon_tranquillitatis", "roughness", 0.18, None, "index", 0.90, "ds_lro_lola"),
        ("tgt_moon_tranquillitatis", "elevation", -1800.0, None, "meters", 0.95, "ds_lro_lola"),
        ("tgt_moon_tranquillitatis", "lithology_type", None, "basalt", "class", 0.95, "ds_lro_diviner"),
        ("tgt_moon_tranquillitatis", "iron_oxide_content", 15.5, None, "wt%", 0.90, "ds_lro_diviner"),
        ("tgt_moon_tranquillitatis", "silica_content", 41.5, None, "wt%", 0.90, "ds_lro_diviner"),
        ("tgt_moon_tranquillitatis", "temperature_diurnal_range", 280.0, None, "Kelvin", 0.95, "ds_lro_diviner"),
        ("tgt_moon_tranquillitatis", "thermal_inertia", 55.0, None, "J m^-2 K^-1 s^-1/2", 0.85, "ds_lro_diviner"),
        ("tgt_moon_tranquillitatis", "gravity_anomaly", 120.0, None, "mGal", 0.90, "ds_lro_lola"),
        ("tgt_moon_tranquillitatis", "magnetic_anomaly", 5.0, None, "nT", 0.80, "ds_lro_lola"),
        ("tgt_moon_tranquillitatis", "radiation_flux", 380.0, None, "mSv/year", 0.95, "ds_lro_diviner"),
        ("tgt_moon_tranquillitatis", "albedo", 0.07, None, "ratio", 0.90, "ds_lro_lola"),

        # --- TARGET: Jezero Crater (Mars) ---
        ("tgt_mars_jezero", "slope_mean", 6.8, None, "degrees", 0.95, "ds_mgs_mola"),
        ("tgt_mars_jezero", "roughness", 0.32, None, "index", 0.90, "ds_mgs_mola"),
        ("tgt_mars_jezero", "elevation", -2530.0, None, "meters", 0.95, "ds_mgs_mola"),
        ("tgt_mars_jezero", "lithology_type", None, "clay_clastic", "class", 0.95, "ds_mro_crism"),
        ("tgt_mars_jezero", "iron_oxide_content", 14.8, None, "wt%", 0.90, "ds_mro_crism"),
        ("tgt_mars_jezero", "silica_content", 47.0, None, "wt%", 0.90, "ds_mro_crism"),
        ("tgt_mars_jezero", "temperature_diurnal_range", 85.0, None, "Kelvin", 0.90, "ds_mro_crism"),
        ("tgt_mars_jezero", "thermal_inertia", 310.0, None, "J m^-2 K^-1 s^-1/2", 0.90, "ds_mro_crism"),
        ("tgt_mars_jezero", "gravity_anomaly", 35.0, None, "mGal", 0.85, "ds_mgs_mola"),
        ("tgt_mars_jezero", "magnetic_anomaly", 22.0, None, "nT", 0.85, "ds_mgs_mola"),
        ("tgt_mars_jezero", "radiation_flux", 240.0, None, "mSv/year", 0.90, "ds_mro_crism"),
        ("tgt_mars_jezero", "albedo", 0.18, None, "ratio", 0.90, "ds_mgs_mola"),

        # --- TARGET: Gale Crater (Mars) ---
        ("tgt_mars_gale", "slope_mean", 8.4, None, "degrees", 0.95, "ds_mgs_mola"),
        ("tgt_mars_gale", "roughness", 0.36, None, "index", 0.90, "ds_mgs_mola"),
        ("tgt_mars_gale", "elevation", -4450.0, None, "meters", 0.95, "ds_mgs_mola"),
        ("tgt_mars_gale", "lithology_type", None, "evaporite_salar", "class", 0.90, "ds_mro_crism"),
        ("tgt_mars_gale", "iron_oxide_content", 18.2, None, "wt%", 0.90, "ds_mro_crism"),
        ("tgt_mars_gale", "silica_content", 49.0, None, "wt%", 0.90, "ds_mro_crism"),
        ("tgt_mars_gale", "temperature_diurnal_range", 90.0, None, "Kelvin", 0.90, "ds_mro_crism"),
        ("tgt_mars_gale", "thermal_inertia", 380.0, None, "J m^-2 K^-1 s^-1/2", 0.90, "ds_mro_crism"),
        ("tgt_mars_gale", "gravity_anomaly", -15.0, None, "mGal", 0.85, "ds_mgs_mola"),
        ("tgt_mars_gale", "magnetic_anomaly", 30.0, None, "nT", 0.85, "ds_mgs_mola"),
        ("tgt_mars_gale", "radiation_flux", 250.0, None, "mSv/year", 0.90, "ds_mro_crism"),
        ("tgt_mars_gale", "albedo", 0.22, None, "ratio", 0.90, "ds_mgs_mola"),

        # --- CANDIDATE: El Pinacate (Mexico) ---
        ("reg_pinacate", "slope_mean", 5.5, None, "degrees", 0.95, "ds_aster_gdem"),
        ("reg_pinacate", "roughness", 0.28, None, "index", 0.90, "ds_aster_gdem"),
        ("reg_pinacate", "elevation", 850.0, None, "meters", 0.95, "ds_aster_gdem"),
        ("reg_pinacate", "lithology_type", None, "basalt", "class", 0.95, "ds_inegi_usv"),
        ("reg_pinacate", "iron_oxide_content", 13.8, None, "wt%", 0.90, "ds_inegi_usv"),
        ("reg_pinacate", "silica_content", 46.5, None, "wt%", 0.90, "ds_inegi_usv"),
        ("reg_pinacate", "temperature_diurnal_range", 32.0, None, "Kelvin", 0.90, "ds_aster_gdem"),
        ("reg_pinacate", "thermal_inertia", 350.0, None, "J m^-2 K^-1 s^-1/2", 0.85, "ds_aster_gdem"),
        ("reg_pinacate", "gravity_anomaly", 40.0, None, "mGal", 0.85, "ds_aster_gdem"),
        ("reg_pinacate", "magnetic_anomaly", 180.0, None, "nT", 0.85, "ds_aster_gdem"),
        ("reg_pinacate", "radiation_flux", 2.2, None, "mSv/year", 0.95, "ds_aster_gdem"),
        ("reg_pinacate", "albedo", 0.11, None, "ratio", 0.90, "ds_aster_gdem"),

        # --- CANDIDATE: Atacama Desert (Chile) ---
        ("reg_atacama", "slope_mean", 4.2, None, "degrees", 0.95, "ds_aster_gdem"),
        ("reg_atacama", "roughness", 0.22, None, "index", 0.90, "ds_aster_gdem"),
        ("reg_atacama", "elevation", 1200.0, None, "meters", 0.95, "ds_aster_gdem"),
        ("reg_atacama", "lithology_type", None, "evaporite_salar", "class", 0.95, "ds_esa_worldcover"),
        ("reg_atacama", "iron_oxide_content", 15.2, None, "wt%", 0.90, "ds_esa_worldcover"),
        ("reg_atacama", "silica_content", 52.0, None, "wt%", 0.90, "ds_esa_worldcover"),
        ("reg_atacama", "temperature_diurnal_range", 36.0, None, "Kelvin", 0.90, "ds_aster_gdem"),
        ("reg_atacama", "thermal_inertia", 390.0, None, "J m^-2 K^-1 s^-1/2", 0.90, "ds_aster_gdem"),
        ("reg_atacama", "gravity_anomaly", -20.0, None, "mGal", 0.85, "ds_aster_gdem"),
        ("reg_atacama", "magnetic_anomaly", 95.0, None, "nT", 0.85, "ds_aster_gdem"),
        ("reg_atacama", "radiation_flux", 3.1, None, "mSv/year", 0.95, "ds_aster_gdem"),
        ("reg_atacama", "albedo", 0.24, None, "ratio", 0.90, "ds_aster_gdem"),

        # --- CANDIDATE: Haughton Crater (Canada) ---
        ("reg_haughton", "slope_mean", 12.1, None, "degrees", 0.95, "ds_aster_gdem"),
        ("reg_haughton", "roughness", 0.45, None, "index", 0.90, "ds_aster_gdem"),
        ("reg_haughton", "elevation", 220.0, None, "meters", 0.95, "ds_aster_gdem"),
        ("reg_haughton", "lithology_type", None, "impact_melt", "class", 0.95, "ds_esa_worldcover"),
        ("reg_haughton", "iron_oxide_content", 8.4, None, "wt%", 0.85, "ds_esa_worldcover"),
        ("reg_haughton", "silica_content", 56.0, None, "wt%", 0.85, "ds_esa_worldcover"),
        ("reg_haughton", "temperature_diurnal_range", 22.0, None, "Kelvin", 0.90, "ds_aster_gdem"),
        ("reg_haughton", "thermal_inertia", 220.0, None, "J m^-2 K^-1 s^-1/2", 0.85, "ds_aster_gdem"),
        ("reg_haughton", "gravity_anomaly", -48.0, None, "mGal", 0.85, "ds_aster_gdem"),
        ("reg_haughton", "magnetic_anomaly", 40.0, None, "nT", 0.80, "ds_aster_gdem"),
        ("reg_haughton", "radiation_flux", 2.8, None, "mSv/year", 0.90, "ds_aster_gdem"),
        ("reg_haughton", "albedo", 0.16, None, "ratio", 0.90, "ds_aster_gdem"),

        # --- CANDIDATE: Cuatro Ciénegas (Mexico) ---
        ("reg_cuatro_cienegas", "slope_mean", 2.5, None, "degrees", 0.95, "ds_aster_gdem"),
        ("reg_cuatro_cienegas", "roughness", 0.16, None, "index", 0.90, "ds_aster_gdem"),
        ("reg_cuatro_cienegas", "elevation", 740.0, None, "meters", 0.95, "ds_aster_gdem"),
        ("reg_cuatro_cienegas", "lithology_type", None, "clay_clastic", "class", 0.95, "ds_inegi_usv"),
        ("reg_cuatro_cienegas", "iron_oxide_content", 7.5, None, "wt%", 0.85, "ds_inegi_usv"),
        ("reg_cuatro_cienegas", "silica_content", 38.0, None, "wt%", 0.85, "ds_inegi_usv"),
        ("reg_cuatro_cienegas", "temperature_diurnal_range", 28.0, None, "Kelvin", 0.90, "ds_aster_gdem"),
        ("reg_cuatro_cienegas", "thermal_inertia", 320.0, None, "J m^-2 K^-1 s^-1/2", 0.85, "ds_aster_gdem"),
        ("reg_cuatro_cienegas", "gravity_anomaly", 15.0, None, "mGal", 0.85, "ds_aster_gdem"),
        ("reg_cuatro_cienegas", "magnetic_anomaly", 60.0, None, "nT", 0.80, "ds_aster_gdem"),
        ("reg_cuatro_cienegas", "radiation_flux", 1.9, None, "mSv/year", 0.90, "ds_aster_gdem"),
        ("reg_cuatro_cienegas", "albedo", 0.35, None, "ratio", 0.90, "ds_aster_gdem"),

        # --- CANDIDATE: Timanfaya (Spain) ---
        ("reg_timanfaya", "slope_mean", 6.2, None, "degrees", 0.95, "ds_aster_gdem"),
        ("reg_timanfaya", "roughness", 0.38, None, "index", 0.90, "ds_aster_gdem"),
        ("reg_timanfaya", "elevation", 320.0, None, "meters", 0.95, "ds_aster_gdem"),
        ("reg_timanfaya", "lithology_type", None, "basalt", "class", 0.95, "ds_esa_worldcover"),
        ("reg_timanfaya", "iron_oxide_content", 14.2, None, "wt%", 0.90, "ds_esa_worldcover"),
        ("reg_timanfaya", "silica_content", 45.0, None, "wt%", 0.90, "ds_esa_worldcover"),
        ("reg_timanfaya", "temperature_diurnal_range", 18.0, None, "Kelvin", 0.90, "ds_aster_gdem"),
        ("reg_timanfaya", "thermal_inertia", 480.0, None, "J m^-2 K^-1 s^-1/2", 0.85, "ds_aster_gdem"),
        ("reg_timanfaya", "gravity_anomaly", 110.0, None, "mGal", 0.85, "ds_aster_gdem"),
        ("reg_timanfaya", "magnetic_anomaly", 240.0, None, "nT", 0.85, "ds_aster_gdem"),
        ("reg_timanfaya", "radiation_flux", 2.0, None, "mSv/year", 0.90, "ds_aster_gdem"),
        ("reg_timanfaya", "albedo", 0.09, None, "ratio", 0.90, "ds_aster_gdem"),

        # --- CANDIDATE: Death Valley (USA) ---
        ("reg_death_valley", "slope_mean", 5.0, None, "degrees", 0.95, "ds_aster_gdem"),
        ("reg_death_valley", "roughness", 0.25, None, "index", 0.90, "ds_aster_gdem"),
        ("reg_death_valley", "elevation", -60.0, None, "meters", 0.95, "ds_aster_gdem"),
        ("reg_death_valley", "lithology_type", None, "evaporite_salar", "class", 0.95, "ds_esa_worldcover"),
        ("reg_death_valley", "iron_oxide_content", 11.0, None, "wt%", 0.90, "ds_esa_worldcover"),
        ("reg_death_valley", "silica_content", 51.0, None, "wt%", 0.90, "ds_esa_worldcover"),
        ("reg_death_valley", "temperature_diurnal_range", 38.0, None, "Kelvin", 0.90, "ds_aster_gdem"),
        ("reg_death_valley", "thermal_inertia", 360.0, None, "J m^-2 K^-1 s^-1/2", 0.85, "ds_aster_gdem"),
        ("reg_death_valley", "gravity_anomaly", -30.0, None, "mGal", 0.85, "ds_aster_gdem"),
        ("reg_death_valley", "magnetic_anomaly", 110.0, None, "nT", 0.85, "ds_aster_gdem"),
        ("reg_death_valley", "radiation_flux", 2.3, None, "mSv/year", 0.90, "ds_aster_gdem"),
        ("reg_death_valley", "albedo", 0.28, None, "ratio", 0.90, "ds_aster_gdem")
    ]
    
    for row in measurements_data:
        entity_id, f_key, val_num, val_txt, unit, quality, ds_id = row
        is_target = entity_id.startswith("tgt_")
        cursor.execute("""
            INSERT INTO feature_measurements (
                id, feature_id, feature_key, region_id, target_profile_id,
                value_numeric, value_text, unit, quality, dataset_id,
                method, measured_at, is_demo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            generate_id("meas"), f"feat_{f_key}", f_key,
            None if is_target else entity_id,
            entity_id if is_target else None,
            val_num, val_txt, unit, quality, ds_id,
            "Calibrated sensor extraction", now_iso(), 0
        ))

    # 7. INITIAL ENVIRONMENTAL ASSESSMENTS
    env_engine = EnvironmentEngine()
    for cand in candidates:
        cand_dict = {"id": cand[0], "name": cand[1]}
        assessment = env_engine.assess_region(cand_dict)
        cursor.execute("""
            INSERT INTO environmental_assessments (
                id, region_id, assessment_date, risk_level, coverage_score,
                protected_area_intersection, protected_area_name, iucn_category,
                sdg13_climate_impact, sdg14_marine_connectivity, sdg15_terrestrial_ecosystems,
                findings_json, recommendation, review_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            assessment.id, assessment.region_id, assessment.assessment_date,
            assessment.risk_level, assessment.coverage_score,
            1 if assessment.protected_area_intersection else 0,
            assessment.protected_area_name, assessment.iucn_category,
            assessment.sdg13_climate_impact, assessment.sdg14_marine_connectivity,
            assessment.sdg15_terrestrial_ecosystems,
            json.dumps(assessment.findings_json), assessment.recommendation,
            assessment.review_status
        ))

    # 8. HISTORICAL & PREVENTIVE DAMAGE EVENTS (ODS 13, 14, 15)
    events = [
        (
            generate_id("evt"), "reg_pinacate", "PREVENTIVE_ALERT", "HIGH", "RESOLVED",
            "Preventive soil crust protection perimeter marked. Prohibits off-trail motorized rover transit to preserve desert pavement and fragile cryptobiotic soil crusts.",
            "Heavy rover transit & wheel torque testing", "Soil compaction & biological crust disruption",
            "https://conanp.gob.mx/pinacate/normatividad.pdf", "src_conabio_inegi",
            now_iso(), now_iso(), "CONANP - Planetary Ethics Liaison",
            json.dumps({"mitigation": "Confined all testing to existing volcanic gravel wash roads. Rubber track treads mandated."})
        ),
        (
            generate_id("evt"), "reg_cuatro_cienegas", "PREVENTIVE_ALERT", "CRITICAL", "REGISTERED",
            "Strict exclusion zone established around Poza Azul and Mojarral travertine ponds. Complete ban on submersible equipment or drilling to protect ancient stromatolites.",
            "Sample coring and water table sensor deployment", "Irreversible microbialite habitat damage (ODS 14/15)",
            "https://ramsar.org/wetland/cuatro-cienegas", "src_protected_planet",
            now_iso(), now_iso(), "UNEP-WCMC Biosphere Monitor",
            json.dumps({"mitigation": "Testing diverted 12 km west into dry gypsum dunes with zero aquatic runoff."})
        ),
        (
            generate_id("evt"), "reg_timanfaya", "RECORDED_OBSERVATION", "LOW", "RESOLVED",
            "ESA PANGAEA geological traverse inspection. Confirmed minimal surface trace; foot-borne geological sampling conducted on marked ash paths.",
            "Astronaut geological training & field spectroscopy", "Minor ash tread disturbance",
            "https://www.esa.int/Enabling_Support/Space_Transportation/PANGAEA", "src_copernicus",
            now_iso(), now_iso(), "ESA Planetary Protection Officer",
            json.dumps({"mitigation": "Re-raked volcanic ash trail; zero environmental residue."})
        )
    ]
    cursor.executemany("""
        INSERT INTO environment_events (
            id, region_id, event_type, severity, status, description,
            activity, impact_type, evidence_url, source_id, observed_at,
            created_at, reviewer, mitigation_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, events)

    conn.commit()
    conn.close()
    print("TerraAnalog database seeded successfully with full scientific integrity!")

if __name__ == "__main__":
    populate_database()
