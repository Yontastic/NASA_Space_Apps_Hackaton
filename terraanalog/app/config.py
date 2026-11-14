"""
TerraAnalog - Global Configuration & Environment Settings
"""
import os
from dataclasses import dataclass, field
from typing import Dict, Any

@dataclass
class AppConfig:
    # General
    APP_NAME: str = "TerraAnalog"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")
    
    # Storage & DB
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///terraanalog.db")
    DATA_STORAGE_PATH: str = os.getenv("DATA_STORAGE_PATH", "./data")
    
    # Server
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    API_PREFIX: str = "/api/v1"
    
    # External Data Source Credentials (optional, fallbacks to DEMO / Catalog mode)
    PROTECTED_PLANET_API_TOKEN: str = os.getenv("PROTECTED_PLANET_API_TOKEN", "")
    EARTHDATA_USERNAME: str = os.getenv("EARTHDATA_USERNAME", "")
    EARTHDATA_PASSWORD: str = os.getenv("EARTHDATA_PASSWORD", "")
    COPERNICUS_CLIENT_ID: str = os.getenv("COPERNICUS_CLIENT_ID", "")
    COPERNICUS_CLIENT_SECRET: str = os.getenv("COPERNICUS_CLIENT_SECRET", "")
    
    # Quality & Similarity Thresholds
    MIN_COVERAGE_THRESHOLD: float = 60.0  # Under 60% coverage -> PROVISIONAL classification
    HIGH_SIMILARITY_THRESHOLD: float = 85.0
    MODERATE_SIMILARITY_THRESHOLD: float = 70.0
    PARTIAL_SIMILARITY_THRESHOLD: float = 50.0
    
    # Standard Physical Tolerances (tau_i in scientific units)
    DEFAULT_TOLERANCES: Dict[str, float] = field(default_factory=lambda: {
        "slope_mean": 4.0,              # degrees
        "roughness": 0.25,              # dimensionless index [0, 1]
        "elevation": 800.0,             # meters
        "temperature_mean": 25.0,       # Kelvin
        "thermal_inertia": 120.0,       # J m^-2 K^-1 s^-1/2
        "gravity_anomaly": 40.0,        # mGal
        "magnetic_field": 5000.0,       # nT
        "radiation_flux": 0.35,         # mSv/day
        "albedo": 0.08,                 # dimensionless [0, 1]
        "soil_grain_size": 1.5,         # phi scale
    })
    
    # Feature Category Weights (Total = 1.0)
    CATEGORY_WEIGHTS: Dict[str, float] = field(default_factory=lambda: {
        "geology": 0.30,
        "topography": 0.25,
        "geophysics": 0.20,
        "thermal": 0.15,
        "environment": 0.10,
    })

config = AppConfig()
