"""
TerraAnalog - REST API Router & Controller Implementation
Provides all endpoints under /api/v1 adhering to OpenAPI and GeoJSON standards.
"""
import json
from dataclasses import asdict
from typing import Dict, Any, List, Optional
from app.config import config
from app.database import DatabaseManager
from app.features.definitions import FEATURE_CATALOG
from app.similarity.engine import SimilarityEngine
from app.reverse_search.engine import ReverseSearchEngine
from app.environment.engine import EnvironmentEngine
from app.simulation.engine import SimulationEngine
from app.ar.scene import ArSceneBuilder
from app.sources.adapters import ADAPTER_REGISTRY
from app.models import (
    CandidateRegion, SimilarityRun, SimilarityResult,
    EnvironmentEvent, SimulationRun, generate_id, now_iso
)

class TerraAnalogAPI:
    """Core controller handling all REST endpoint logic"""
    
    def __init__(self):
        self.sim_engine = SimilarityEngine()
        self.reverse_engine = ReverseSearchEngine()
        self.env_engine = EnvironmentEngine()
        self.sim_runner = SimulationEngine()

    def get_health(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "app": config.APP_NAME,
            "version": config.VERSION,
            "environment": config.ENVIRONMENT,
            "demo_mode": config.DEMO_MODE,
            "api_version": "v1",
            "timestamp": now_iso()
        }

    def get_sources(self) -> List[Dict[str, Any]]:
        sources = DatabaseManager.get_sources()
        for s in sources:
            adapter = ADAPTER_REGISTRY.get(s["id"])
            if adapter:
                s["live_health"] = adapter.healthcheck()
        return sources

    def search_source(self, source_id: str, query: str = "", bbox: Optional[List[float]] = None) -> Dict[str, Any]:
        adapter = ADAPTER_REGISTRY.get(source_id)
        if not adapter:
            return {"error": f"Source adapter '{source_id}' not found", "results": []}
        try:
            results = adapter.search(query=query, bbox=bbox)
            return {"source_id": source_id, "query": query, "count": len(results), "results": results}
        except Exception as e:
            return {"source_id": source_id, "error": str(e), "results": []}

    def get_datasets(self, body: Optional[str] = None) -> List[Dict[str, Any]]:
        return DatabaseManager.get_datasets(body=body)

    def get_candidate_regions(self, region_type: Optional[str] = None) -> List[Dict[str, Any]]:
        return DatabaseManager.get_candidate_regions(region_type=region_type)

    def get_candidate_region_by_id(self, region_id: str) -> Optional[Dict[str, Any]]:
        region = DatabaseManager.get_candidate_region_by_id(region_id)
        if not region:
            return None
        # Attach measurements and environmental assessment
        region["measurements"] = DatabaseManager.get_measurements_for_region(region_id)
        region["environmental_assessment"] = DatabaseManager.get_environmental_assessment(region_id)
        return region

    def get_target_profiles(self, body: Optional[str] = None) -> List[Dict[str, Any]]:
        return DatabaseManager.get_target_profiles(body=body)

    def get_target_profile_by_id(self, target_id: str) -> Optional[Dict[str, Any]]:
        target = DatabaseManager.get_target_profile_by_id(target_id)
        if not target:
            return None
        target["measurements"] = DatabaseManager.get_measurements_for_target(target_id)
        return target

    def run_similarity(self, target_id: str, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute full matching pipeline between all candidates and the specified target.
        """
        target = DatabaseManager.get_target_profile_by_id(target_id)
        if not target:
            return {"error": f"Target '{target_id}' not found"}
            
        target_meas = DatabaseManager.get_measurements_for_target(target_id)
        candidates = DatabaseManager.get_candidate_regions()
        
        run_id = generate_id("simrun")
        results = []
        
        for cand in candidates:
            earth_meas = DatabaseManager.get_measurements_for_region(cand["id"])
            res = self.sim_engine.evaluate_candidate(
                region=cand,
                target_profile=target,
                earth_measurements=earth_meas,
                target_measurements=target_meas,
                run_id=run_id
            )
            # Enrich with environmental risk level
            env_assessment = DatabaseManager.get_environmental_assessment(cand["id"])
            if env_assessment:
                res.environmental_risk_level = env_assessment["risk_level"]
            results.append(res)
            
        # Sort by physical similarity descending
        results.sort(key=lambda x: x.physical_similarity, reverse=True)
        
        return {
            "run_id": run_id,
            "target": {
                "id": target["id"],
                "name": target["name"],
                "body": target["body"],
                "mission_context": target["mission_context"]
            },
            "algorithm_version": "2.1.0-gaussian",
            "candidate_count": len(results),
            "results": [asdict(r) for r in results]
        }

    def reverse_search(self, query: str, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Reverse search candidates and targets from natural language description or mineral parameters.
        """
        parsed_query = self.reverse_engine.parse_natural_query(query)
        if filters:
            parsed_query.update(filters)
            
        candidates = DatabaseManager.get_candidate_regions()
        meas_by_region = {}
        for c in candidates:
            meas_by_region[c["id"]] = DatabaseManager.get_measurements_for_region(c["id"])
            
        ranked_candidates = self.reverse_engine.search_candidates_by_vector(
            parsed_query=parsed_query,
            candidates=candidates,
            measurements_by_region=meas_by_region
        )
        
        return {
            "query": query,
            "parsed_criteria": parsed_query,
            "matched_candidates_count": len(ranked_candidates),
            "ranked_candidates": ranked_candidates
        }

    def assess_environment(self, region_id: str) -> Dict[str, Any]:
        region = DatabaseManager.get_candidate_region_by_id(region_id)
        if not region:
            return {"error": f"Region '{region_id}' not found"}
        assessment = self.env_engine.assess_region(region)
        return asdict(assessment)

    def get_environment_events(self, region_id: Optional[str] = None) -> List[Dict[str, Any]]:
        return DatabaseManager.get_environment_events(region_id=region_id)

    def log_environment_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        event = EnvironmentEvent(
            id=generate_id("evt"),
            region_id=event_data["region_id"],
            event_type=event_data.get("event_type", "PREVENTIVE_ALERT"),
            severity=event_data.get("severity", "MEDIUM"),
            status=event_data.get("status", "REGISTERED"),
            description=event_data["description"],
            activity=event_data.get("activity", "Rover Field Testing"),
            impact_type=event_data.get("impact_type", "Terrain Disturbance"),
            evidence_url=event_data.get("evidence_url"),
            source_id=event_data.get("source_id"),
            observed_at=event_data.get("observed_at", now_iso()),
            created_at=now_iso(),
            reviewer=event_data.get("reviewer", "Planetary Ethics Board"),
            mitigation_json=event_data.get("mitigation_json", {})
        )
        evt_id = DatabaseManager.insert_environment_event(event)
        return {"status": "success", "event_id": evt_id}

    def run_simulation(self, region_id: str, scenario_type: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        region = DatabaseManager.get_candidate_region_by_id(region_id)
        if not region:
            return {"error": f"Region '{region_id}' not found"}
        measurements = {m["feature_key"]: m for m in DatabaseManager.get_measurements_for_region(region_id)}
        sim_run = self.sim_runner.run_scenario(
            region_id=region_id,
            scenario_type=scenario_type,
            custom_params=params or {},
            measurements=measurements
        )
        return asdict(sim_run)

    def get_ar_scene(self, region_id: str) -> Dict[str, Any]:
        region = DatabaseManager.get_candidate_region_by_id(region_id)
        if not region:
            return {"error": f"Region '{region_id}' not found"}
        measurements = {m["feature_key"]: m for m in DatabaseManager.get_measurements_for_region(region_id)}
        env_assessment = DatabaseManager.get_environmental_assessment(region_id)
        return ArSceneBuilder.build_scene_contract(region, measurements, env_assessment)

    def export_region_summary(self, region_id: str) -> Dict[str, Any]:
        region = self.get_candidate_region_by_id(region_id)
        if not region:
            return {"error": f"Region '{region_id}' not found"}
        return {
            "type": "Feature",
            "properties": {
                "id": region["id"],
                "name": region["name"],
                "country": region["country"],
                "region_type": region["region_type"],
                "elevation_m": region["elevation_m"],
                "area_km2": region["area_km2"],
                "description": region["description"],
                "environmental_risk": region["environmental_assessment"]["risk_level"] if region.get("environmental_assessment") else "NO_DATA",
                "measurements_count": len(region.get("measurements", []))
            },
            "geometry": region["geometry_geojson"]
        }

api_controller = TerraAnalogAPI()
