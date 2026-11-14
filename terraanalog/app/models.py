"""
TerraAnalog - Core Data Models
Complete representation of the 13 required entities:
- data_sources
- datasets
- data_assets
- candidate_regions
- target_profiles
- feature_definitions
- feature_measurements
- similarity_runs
- similarity_results
- environmental_assessments
- environment_events
- simulation_runs
- ar_sessions
- processing_jobs
"""
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional
import datetime
import uuid

def generate_id(prefix: str = "") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}" if prefix else uuid.uuid4().hex[:12]

def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

@dataclass
class DataSource:
    """Source provider for open spatial data"""
    id: str
    name: str
    provider: str                      # NASA, ESA, CSA, JAXA, CONABIO, INEGI, WDPA, SEDAC
    base_url: str
    access_type: str                   # REST_API, STAC, WMS, WMTS, COG, FILE_DOWNLOAD
    license: str
    requires_auth: bool = False
    status: str = "active"             # active, requires_credentials, degraded, unavailable
    last_checked_at: str = field(default_factory=now_iso)
    notes: Optional[str] = None

@dataclass
class Dataset:
    """Specific scientific dataset/collection"""
    id: str
    source_id: str
    external_id: str
    title: str
    body: str                          # Earth, Moon, Mars
    instrument: str
    product_type: str                  # DEM, Radiometer, Mineralogy, SAR, Multispectral, Vector
    spatial_resolution: str
    temporal_start: Optional[str] = None
    temporal_end: Optional[str] = None
    crs: str = "EPSG:4326"
    metadata_json: Dict[str, Any] = field(default_factory=dict)
    access_status: str = "download_available" # catalog_only, visualization_only, download_available, processed
    citation_text: str = ""

@dataclass
class DataAsset:
    """Individual file or tile asset associated with a dataset"""
    id: str
    dataset_id: str
    asset_url: str
    local_path: Optional[str] = None
    media_type: str = "image/tiff; application=geotiff; profile=cloud-optimized"
    checksum: Optional[str] = None
    asset_role: str = "data"           # data, visual, metadata, preview
    processing_status: str = "raw"     # raw, clipped, normalized, ready

@dataclass
class CandidateRegion:
    """Terrestrial analog candidate region"""
    id: str
    name: str
    country: str
    region_type: str                   # Desert, Volcanic, Polar, Crater, Lava_Tube, Salar, Cave
    latitude: float
    longitude: float
    bounding_box: List[float]          # [min_lon, min_lat, max_lon, max_lat]
    geometry_geojson: Dict[str, Any]   # GeoJSON Polygon / MultiPolygon
    area_km2: float
    elevation_m: float
    description: str
    candidate_status: str = "active"   # active, under_review, rejected, validated
    is_demo: bool = True
    created_at: str = field(default_factory=now_iso)
    updated_at: str = field(default_factory=now_iso)

@dataclass
class TargetProfile:
    """Planetary exploration target profile (Moon / Mars)"""
    id: str
    body: str                          # Moon, Mars
    name: str
    mission_context: str               # e.g., Artemis III Landing Site, Mars 2020 Jezero
    latitude: float
    longitude: float
    description: str
    target_environment: str            # Crater_Rim, Basaltic_Plains, Polar_Cold_Trap, Deltaic_Clay
    version: str = "1.0.0"
    is_active: bool = True
    metadata_json: Dict[str, Any] = field(default_factory=dict)

@dataclass
class FeatureDefinition:
    """Physical feature catalog definition"""
    id: str
    key: str                           # e.g. slope_mean, roughness, albedo, thermal_inertia
    name: str
    category: str                      # geology, topography, geophysics, thermal, environment
    unit: str
    data_type: str                     # numeric, categorical, boolean
    default_weight: float
    tolerance: float                   # tau_i parameter for Gaussian similarity
    description: str

@dataclass
class FeatureMeasurement:
    """Measured or modeled physical value for a candidate region or target profile"""
    id: str
    feature_id: str
    feature_key: str
    region_id: Optional[str] = None
    target_profile_id: Optional[str] = None
    value_numeric: Optional[float] = None
    value_text: Optional[str] = None
    unit: str = ""
    quality: float = 1.0               # Confidence / data quality [0.0 - 1.0]
    dataset_id: Optional[str] = None
    asset_id: Optional[str] = None
    method: str = "zonal_mean"         # zonal_mean, in_situ, spectral_unmixing, radiative_model
    measured_at: str = field(default_factory=now_iso)
    is_demo: bool = True

@dataclass
class DimensionScore:
    """Score breakdown for a specific physical dimension"""
    dimension: str
    score: float                       # [0 - 100]
    coverage: float                    # [0 - 100]
    variables_count: int
    evaluated_count: int

@dataclass
class SimilarityResult:
    """Evaluated match between a terrestrial candidate and a planetary target"""
    id: str
    run_id: str
    region_id: str
    region_name: str
    target_profile_id: str
    target_name: str
    target_body: str
    physical_similarity: float         # [0 - 100]
    data_coverage: float               # [0 - 100]
    confidence: float                  # [0 - 100]
    classification: str                # High, Moderate, Partial, Low, Provisional
    operational_feasibility: float     # [0 - 100]
    environmental_risk_level: str      # LOW_ALERT, MEDIUM_ALERT, HIGH_ALERT, RESTRICTED_REVIEW, NO_DATA
    dimension_scores: List[Dict[str, Any]] = field(default_factory=list)
    variable_breakdown: List[Dict[str, Any]] = field(default_factory=list)
    missing_variables: List[str] = field(default_factory=list)
    explanation: Dict[str, Any] = field(default_factory=dict)
    is_provisional: bool = False

@dataclass
class SimilarityRun:
    """Execution run of the mathematical similarity pipeline"""
    id: str
    target_profile_id: str
    algorithm_version: str = "2.1.0-gaussian"
    parameters_json: Dict[str, Any] = field(default_factory=dict)
    candidate_count: int = 0
    status: str = "completed"          # pending, running, completed, failed
    created_at: str = field(default_factory=now_iso)
    results: List[SimilarityResult] = field(default_factory=list)

@dataclass
class EnvironmentalAssessment:
    """Ecological and Sustainable Development Goals (SDG 13, 14, 15) assessment"""
    id: str
    region_id: str
    assessment_date: str = field(default_factory=now_iso)
    risk_level: str = "LOW_ALERT"      # NO_DATA, LOW_ALERT, MEDIUM_ALERT, HIGH_ALERT, RESTRICTED_REVIEW
    coverage_score: float = 100.0
    protected_area_intersection: bool = False
    protected_area_name: Optional[str] = None
    iucn_category: Optional[str] = None
    sdg13_climate_impact: str = "Low risk of soil degradation or permafrost thawing."
    sdg14_marine_connectivity: str = "Not applicable (inland terrestrial basin)."
    sdg15_terrestrial_ecosystems: str = "Arid desert biome with sparse endemic flora."
    findings_json: Dict[str, Any] = field(default_factory=dict)
    recommendation: str = "Permitted for non-invasive rover mobility tests under monitoring."
    review_status: str = "preliminary" # preliminary, reviewed, approved, rejected

@dataclass
class EnvironmentEvent:
    """Historical and preventive ecosystem damage register"""
    id: str
    region_id: str
    event_type: str                    # PREVENTIVE_ALERT, RECORDED_OBSERVATION, MITIGATION_ACTION
    severity: str                      # LOW, MEDIUM, HIGH, CRITICAL
    status: str                        # REGISTERED, INVESTIGATING, RESOLVED, DISMISSED
    description: str
    activity: str                      # Heavy rover mobility, core drilling, night illumination, camp deployment
    impact_type: str                   # Soil compaction, micro-crust disturbance, endemic fauna disruption
    evidence_url: Optional[str] = None
    source_id: Optional[str] = None
    observed_at: str = field(default_factory=now_iso)
    created_at: str = field(default_factory=now_iso)
    reviewer: str = "TerraAnalog Planetary Ethics Board"
    mitigation_json: Dict[str, Any] = field(default_factory=dict)

@dataclass
class SimulationRun:
    """Testing scenario configuration and results"""
    id: str
    region_id: str
    scenario_name: str
    scenario_type: str                 # ROVER_MOBILITY, THERMAL_CYCLING, DRILLING_SIMULATION, SENSOR_TEST
    parameters_json: Dict[str, Any] = field(default_factory=dict)
    output_json: Dict[str, Any] = field(default_factory=dict)
    model_version: str = "1.0.0-synthetic"
    status: str = "completed"
    created_at: str = field(default_factory=now_iso)

@dataclass
class ArSession:
    """Augmented Reality field session contract"""
    id: str
    region_id: str
    origin_latitude: float
    origin_longitude: float
    origin_altitude_m: float
    device_info: str = "WebXR / Field Tablet"
    coordinate_reference: str = "WGS84_TO_ENU"
    scene_asset_url: str = "/api/v1/ar/regions/{id}/scene"
    overlay_layers: List[str] = field(default_factory=lambda: ["slopes", "mineralogy", "eco_boundary"])
    observations_json: List[Dict[str, Any]] = field(default_factory=list)
    created_at: str = field(default_factory=now_iso)

@dataclass
class ProcessingJob:
    """Asynchronous background processing job"""
    id: str
    job_type: str                      # INGESTION, ZONAL_STATS, SIMILARITY_RUN, AR_MESH_GEN
    status: str = "completed"          # queued, running, completed, failed
    progress: int = 100                # [0 - 100]
    params_json: Dict[str, Any] = field(default_factory=dict)
    error_message: Optional[str] = None
    started_at: str = field(default_factory=now_iso)
    finished_at: Optional[str] = field(default_factory=now_iso)
