"""
TerraAnalog - Feature Definitions & Physical Variables Catalog
Standardized definitions for Geology, Topography, Geophysics, Thermal and Environmental variables.
"""
from typing import Dict, Any, List

FEATURE_CATALOG: List[Dict[str, Any]] = [
    # Topography & Geomorphology
    {
        "key": "slope_mean",
        "name": "Mean Surface Slope",
        "category": "topography",
        "unit": "degrees",
        "data_type": "numeric",
        "default_weight": 0.20,
        "tolerance": 4.0,  # tau: 4 deg
        "description": "Average topographic incline within the target AOI derived from DEM."
    },
    {
        "key": "roughness",
        "name": "Surface Roughness Index",
        "category": "topography",
        "unit": "index",
        "data_type": "numeric",
        "default_weight": 0.15,
        "tolerance": 0.20, # tau: 0.20
        "description": "Standard deviation of slope and residual topography indicating obstacle density."
    },
    {
        "key": "elevation",
        "name": "Elevation / Local Relief",
        "category": "topography",
        "unit": "meters",
        "data_type": "numeric",
        "default_weight": 0.05,
        "tolerance": 1200.0,
        "description": "Absolute altitude or relative topographic amplitude."
    },
    # Geology & Mineralogy
    {
        "key": "lithology_type",
        "name": "Dominant Lithology / Rock Type",
        "category": "geology",
        "unit": "class",
        "data_type": "categorical",
        "default_weight": 0.25,
        "tolerance": 1.0,
        "description": "Dominant lithological class (e.g., Basalt, Anorthosite, Regolith, Evaporite, Clastic Clay)."
    },
    {
        "key": "iron_oxide_content",
        "name": "Iron Oxide / Hematite Abundance",
        "category": "geology",
        "unit": "wt%",
        "data_type": "numeric",
        "default_weight": 0.15,
        "tolerance": 4.5,
        "description": "Estimated FeO / Fe2O3 weight percentage from multispectral/spectroscopic inversion."
    },
    {
        "key": "silica_content",
        "name": "Silica (SiO2) Concentration",
        "category": "geology",
        "unit": "wt%",
        "data_type": "numeric",
        "default_weight": 0.10,
        "tolerance": 6.0,
        "description": "Total silica concentration characterizing mafic vs felsic composition."
    },
    # Thermal Properties
    {
        "key": "temperature_diurnal_range",
        "name": "Diurnal Surface Temperature Range",
        "category": "thermal",
        "unit": "Kelvin",
        "data_type": "numeric",
        "default_weight": 0.15,
        "tolerance": 35.0, # tau: 35 K
        "description": "Delta between maximum daytime and minimum nighttime surface temperature."
    },
    {
        "key": "thermal_inertia",
        "name": "Thermal Inertia",
        "category": "thermal",
        "unit": "J m^-2 K^-1 s^-1/2",
        "data_type": "numeric",
        "default_weight": 0.15,
        "tolerance": 110.0,
        "description": "Resistance of the upper layer to temperature variations, indicative of particle size."
    },
    # Geophysics: Gravity, Magnetic, Radiation
    {
        "key": "gravity_anomaly",
        "name": "Bouguer Gravity Anomaly",
        "category": "geophysics",
        "unit": "mGal",
        "data_type": "numeric",
        "default_weight": 0.10,
        "tolerance": 45.0,
        "description": "Subsurface density variation measured by satellite gravimetry (GRACE/GOCE / GRAIL)."
    },
    {
        "key": "magnetic_anomaly",
        "name": "Crustal Magnetic Field Anomaly",
        "category": "geophysics",
        "unit": "nT",
        "data_type": "numeric",
        "default_weight": 0.10,
        "tolerance": 150.0,
        "description": "Remanent crustal magnetization intensity."
    },
    {
        "key": "radiation_flux",
        "name": "Surface Cosmic/Gamma Radiation Flux",
        "category": "geophysics",
        "unit": "mSv/year",
        "data_type": "numeric",
        "default_weight": 0.10,
        "tolerance": 1.5,
        "description": "Ambient ionizing radiation dose rate at the surface."
    },
    # Surface Properties
    {
        "key": "albedo",
        "name": "Bolometric / Optical Albedo",
        "category": "geology",
        "unit": "ratio",
        "data_type": "numeric",
        "default_weight": 0.08,
        "tolerance": 0.06,
        "description": "Reflectance of the surface across optical wavelengths."
    }
]

# Categorical Lithology Compatibility Matrix
LITHOLOGY_COMPATIBILITY: Dict[str, Dict[str, float]] = {
    "basalt": {
        "basalt": 1.00,
        "anorthosite": 0.65,
        "volcanic_tephra": 0.85,
        "impact_melt": 0.80,
        "clay_clastic": 0.30,
        "evaporite_salar": 0.20,
        "sandstone": 0.35,
        "granite": 0.40,
        "permafrost": 0.25
    },
    "anorthosite": {
        "anorthosite": 1.00,
        "basalt": 0.65,
        "impact_melt": 0.85,
        "volcanic_tephra": 0.50,
        "clay_clastic": 0.20,
        "evaporite_salar": 0.15,
        "granite": 0.55
    },
    "impact_melt": {
        "impact_melt": 1.00,
        "breccia": 0.90,
        "basalt": 0.80,
        "anorthosite": 0.85,
        "sandstone": 0.40
    },
    "clay_clastic": {
        "clay_clastic": 1.00,
        "mudstone": 0.90,
        "evaporite_salar": 0.60,
        "sandstone": 0.70,
        "basalt": 0.30
    },
    "evaporite_salar": {
        "evaporite_salar": 1.00,
        "clay_clastic": 0.60,
        "sandstone": 0.40,
        "permafrost": 0.45,
        "basalt": 0.20
    },
    "permafrost": {
        "permafrost": 1.00,
        "glacio_volcanic": 0.80,
        "evaporite_salar": 0.45,
        "basalt": 0.25
    }
}

def get_lithology_similarity(type_a: str, type_b: str) -> float:
    a = (type_a or "").strip().lower().replace(" ", "_")
    b = (type_b or "").strip().lower().replace(" ", "_")
    if not a or not b:
        return 0.5
    if a == b:
        return 1.0
    if a in LITHOLOGY_COMPATIBILITY and b in LITHOLOGY_COMPATIBILITY[a]:
        return LITHOLOGY_COMPATIBILITY[a][b]
    if b in LITHOLOGY_COMPATIBILITY and a in LITHOLOGY_COMPATIBILITY[b]:
        return LITHOLOGY_COMPATIBILITY[b][a]
    return 0.30
