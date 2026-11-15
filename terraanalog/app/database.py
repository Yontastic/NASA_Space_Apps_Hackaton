"""
TerraAnalog - Database & Persistence Layer
Robust SQLite storage with JSON support, adhering to PostGIS target schema conventions.
"""
import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from app.config import config
from app.models import (
    DataSource, Dataset, DataAsset, CandidateRegion, TargetProfile,
    FeatureDefinition, FeatureMeasurement, SimilarityRun, SimilarityResult,
    EnvironmentalAssessment, EnvironmentEvent, SimulationRun, ArSession,
    ProcessingJob, generate_id, now_iso
)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "terraanalog.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create all required tables for TerraAnalog"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS data_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        base_url TEXT NOT NULL,
        access_type TEXT NOT NULL,
        license TEXT NOT NULL,
        requires_auth INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        last_checked_at TEXT,
        notes TEXT
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS datasets (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        external_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        instrument TEXT NOT NULL,
        product_type TEXT NOT NULL,
        spatial_resolution TEXT,
        temporal_start TEXT,
        temporal_end TEXT,
        crs TEXT DEFAULT 'EPSG:4326',
        metadata_json TEXT,
        access_status TEXT DEFAULT 'download_available',
        citation_text TEXT,
        FOREIGN KEY(source_id) REFERENCES data_sources(id)
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS data_assets (
        id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        asset_url TEXT NOT NULL,
        local_path TEXT,
        media_type TEXT,
        checksum TEXT,
        asset_role TEXT,
        processing_status TEXT,
        FOREIGN KEY(dataset_id) REFERENCES datasets(id)
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS candidate_regions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        region_type TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        bounding_box TEXT NOT NULL,
        geometry_geojson TEXT NOT NULL,
        area_km2 REAL,
        elevation_m REAL,
        description TEXT,
        candidate_status TEXT DEFAULT 'active',
        is_demo INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS target_profiles (
        id TEXT PRIMARY KEY,
        body TEXT NOT NULL,
        name TEXT NOT NULL,
        mission_context TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        description TEXT,
        target_environment TEXT,
        version TEXT DEFAULT '1.0.0',
        is_active INTEGER DEFAULT 1,
        metadata_json TEXT
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS feature_definitions (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit TEXT,
        data_type TEXT,
        default_weight REAL,
        tolerance REAL,
        description TEXT
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS feature_measurements (
        id TEXT PRIMARY KEY,
        feature_id TEXT NOT NULL,
        feature_key TEXT NOT NULL,
        region_id TEXT,
        target_profile_id TEXT,
        value_numeric REAL,
        value_text TEXT,
        unit TEXT,
        quality REAL DEFAULT 1.0,
        dataset_id TEXT,
        asset_id TEXT,
        method TEXT,
        measured_at TEXT,
        is_demo INTEGER DEFAULT 1,
        FOREIGN KEY(feature_id) REFERENCES feature_definitions(id)
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS similarity_runs (
        id TEXT PRIMARY KEY,
        target_profile_id TEXT NOT NULL,
        algorithm_version TEXT,
        parameters_json TEXT,
        candidate_count INTEGER,
        status TEXT,
        created_at TEXT
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS similarity_results (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        region_id TEXT NOT NULL,
        region_name TEXT,
        target_profile_id TEXT,
        target_name TEXT,
        target_body TEXT,
        physical_similarity REAL,
        data_coverage REAL,
        confidence REAL,
        classification TEXT,
        operational_feasibility REAL,
        environmental_risk_level TEXT,
        dimension_scores_json TEXT,
        variable_breakdown_json TEXT,
        missing_variables_json TEXT,
        explanation_json TEXT,
        is_provisional INTEGER DEFAULT 0,
        FOREIGN KEY(run_id) REFERENCES similarity_runs(id)
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS environmental_assessments (
        id TEXT PRIMARY KEY,
        region_id TEXT NOT NULL,
        assessment_date TEXT,
        risk_level TEXT,
        coverage_score REAL,
        protected_area_intersection INTEGER,
        protected_area_name TEXT,
        iucn_category TEXT,
        sdg13_climate_impact TEXT,
        sdg14_marine_connectivity TEXT,
        sdg15_terrestrial_ecosystems TEXT,
        findings_json TEXT,
        recommendation TEXT,
        review_status TEXT,
        FOREIGN KEY(region_id) REFERENCES candidate_regions(id)
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS environment_events (
        id TEXT PRIMARY KEY,
        region_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        description TEXT NOT NULL,
        activity TEXT NOT NULL,
        impact_type TEXT NOT NULL,
        evidence_url TEXT,
        source_id TEXT,
        observed_at TEXT,
        created_at TEXT,
        reviewer TEXT,
        mitigation_json TEXT,
        FOREIGN KEY(region_id) REFERENCES candidate_regions(id)
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS simulation_runs (
        id TEXT PRIMARY KEY,
        region_id TEXT NOT NULL,
        scenario_name TEXT NOT NULL,
        scenario_type TEXT NOT NULL,
        parameters_json TEXT,
        output_json TEXT,
        model_version TEXT,
        status TEXT,
        created_at TEXT
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ar_sessions (
        id TEXT PRIMARY KEY,
        region_id TEXT NOT NULL,
        origin_latitude REAL,
        origin_longitude REAL,
        origin_altitude_m REAL,
        device_info TEXT,
        coordinate_reference TEXT,
        scene_asset_url TEXT,
        overlay_layers_json TEXT,
        observations_json TEXT,
        created_at TEXT
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS processing_jobs (
        id TEXT PRIMARY KEY,
        job_type TEXT NOT NULL,
        status TEXT,
        progress INTEGER,
        params_json TEXT,
        error_message TEXT,
        started_at TEXT,
        finished_at TEXT
    );
    """)
    
    conn.commit()
    conn.close()

class DatabaseManager:
    """Helper repository to query and persist models"""
    
    @staticmethod
    def get_sources() -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM data_sources ORDER BY provider, name")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows
        
    @staticmethod
    def get_source_by_id(source_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM data_sources WHERE id = ?", (source_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def get_datasets(body: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        if body:
            cursor.execute("SELECT * FROM datasets WHERE body = ? ORDER BY title", (body,))
        else:
            cursor.execute("SELECT * FROM datasets ORDER BY body, title")
        rows = []
        for r in cursor.fetchall():
            d = dict(r)
            if d.get("metadata_json"):
                d["metadata_json"] = json.loads(d["metadata_json"])
            rows.append(d)
        conn.close()
        return rows

    @staticmethod
    def get_candidate_regions(region_type: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        if region_type:
            cursor.execute("SELECT * FROM candidate_regions WHERE region_type = ? ORDER BY name", (region_type,))
        else:
            cursor.execute("SELECT * FROM candidate_regions ORDER BY name")
        rows = []
        for r in cursor.fetchall():
            d = dict(r)
            if isinstance(d.get("bounding_box"), str):
                try:
                    d["bounding_box"] = json.loads(d["bounding_box"])
                except Exception:
                    pass
            if isinstance(d.get("geometry_geojson"), str):
                try:
                    d["geometry_geojson"] = json.loads(d["geometry_geojson"])
                except Exception:
                    pass
            rows.append(d)
        conn.close()
        return rows

    @staticmethod
    def get_candidate_region_by_id(region_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM candidate_regions WHERE id = ?", (region_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return None
        d = dict(row)
        if isinstance(d.get("bounding_box"), str):
            try:
                d["bounding_box"] = json.loads(d["bounding_box"])
            except Exception:
                pass
        if isinstance(d.get("geometry_geojson"), str):
            try:
                d["geometry_geojson"] = json.loads(d["geometry_geojson"])
            except Exception:
                pass
        return d

    @staticmethod
    def get_target_profiles(body: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        if body:
            cursor.execute("SELECT * FROM target_profiles WHERE body = ? AND is_active = 1 ORDER BY name", (body,))
        else:
            cursor.execute("SELECT * FROM target_profiles WHERE is_active = 1 ORDER BY body, name")
        rows = []
        for r in cursor.fetchall():
            d = dict(r)
            if d.get("metadata_json"):
                d["metadata_json"] = json.loads(d["metadata_json"])
            rows.append(d)
        conn.close()
        return rows

    @staticmethod
    def get_target_profile_by_id(target_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM target_profiles WHERE id = ?", (target_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return None
        d = dict(row)
        if d.get("metadata_json"):
            d["metadata_json"] = json.loads(d["metadata_json"])
        return d

    @staticmethod
    def get_feature_definitions() -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM feature_definitions ORDER BY category, name")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def get_measurements_for_region(region_id: str) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT m.*, f.name as feature_name, f.category, f.unit as default_unit, f.tolerance, f.default_weight
            FROM feature_measurements m
            JOIN feature_definitions f ON m.feature_id = f.id
            WHERE m.region_id = ?
        """, (region_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def get_measurements_for_target(target_id: str) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT m.*, f.name as feature_name, f.category, f.unit as default_unit, f.tolerance, f.default_weight
            FROM feature_measurements m
            JOIN feature_definitions f ON m.feature_id = f.id
            WHERE m.target_profile_id = ?
        """, (target_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def get_environmental_assessment(region_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM environmental_assessments WHERE region_id = ?", (region_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return None
        d = dict(row)
        if d.get("findings_json"):
            d["findings_json"] = json.loads(d["findings_json"])
        return d

    @staticmethod
    def get_environment_events(region_id: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        if region_id:
            cursor.execute("SELECT * FROM environment_events WHERE region_id = ? ORDER BY observed_at DESC", (region_id,))
        else:
            cursor.execute("SELECT * FROM environment_events ORDER BY observed_at DESC")
        rows = []
        for r in cursor.fetchall():
            d = dict(r)
            if d.get("mitigation_json"):
                d["mitigation_json"] = json.loads(d["mitigation_json"])
            rows.append(d)
        conn.close()
        return rows

    @staticmethod
    def insert_environment_event(event: EnvironmentEvent) -> str:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO environment_events (
                id, region_id, event_type, severity, status, description,
                activity, impact_type, evidence_url, source_id, observed_at,
                created_at, reviewer, mitigation_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event.id, event.region_id, event.event_type, event.severity, event.status,
            event.description, event.activity, event.impact_type, event.evidence_url,
            event.source_id, event.observed_at, event.created_at, event.reviewer,
            json.dumps(event.mitigation_json)
        ))
        conn.commit()
        conn.close()
        return event.id

    @staticmethod
    def insert_similarity_run(run_data: Dict[str, Any], results: List[SimilarityResult]) -> str:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO similarity_runs (id, target_profile_id, algorithm_version, parameters_json, candidate_count, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            run_data.get("run_id", generate_id("simrun")),
            run_data.get("target_id", ""),
            run_data.get("algorithm_version", "2.1.0-gaussian"),
            json.dumps(run_data.get("parameters", {})),
            len(results),
            "completed",
            now_iso()
        ))
        for res in results:
            cursor.execute("""
                INSERT INTO similarity_results (
                    id, run_id, region_id, region_name, target_profile_id, target_name, target_body,
                    physical_similarity, data_coverage, confidence, classification,
                    operational_feasibility, environmental_risk_level, dimension_scores_json,
                    variable_breakdown_json, missing_variables_json, explanation_json, is_provisional
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                res.id, res.run_id, res.region_id, res.region_name, res.target_profile_id,
                res.target_name, res.target_body, res.physical_similarity, res.data_coverage,
                res.confidence, res.classification, res.operational_feasibility,
                res.environmental_risk_level, json.dumps(res.dimension_scores),
                json.dumps(res.variable_breakdown), json.dumps(res.missing_variables),
                json.dumps(res.explanation), 1 if res.is_provisional else 0
            ))
        conn.commit()
        conn.close()
        return run_data.get("run_id", "")

    @staticmethod
    def insert_simulation_run(sim: SimulationRun) -> str:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO simulation_runs (id, region_id, scenario_name, scenario_type, parameters_json, output_json, model_version, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sim.id, sim.region_id, sim.scenario_name, sim.scenario_type,
            json.dumps(sim.parameters_json), json.dumps(sim.output_json),
            sim.model_version, sim.status, sim.created_at
        ))
        conn.commit()
        conn.close()
        return sim.id
