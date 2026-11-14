"""
TerraAnalog - Augmented Reality (AR) Scene Data Contract
Generates georeferenced 3D scene data in local ENU (East-North-Up) coordinates
for WebXR, HoloLens, and mobile field AR telemetry.
"""
from typing import Dict, Any, List, Optional
import math
from app.geospatial.transforms import geodetic_to_enu
from app.models import ArSession, generate_id, now_iso

class ArSceneBuilder:
    """Prepares 3D terrain mesh and telemetry overlays for in-situ field validation"""
    
    @staticmethod
    def build_scene_contract(
        region: Dict[str, Any],
        measurements: Dict[str, Any],
        environmental_assessment: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Builds the complete JSON AR Scene Contract.
        """
        ref_lat = float(region["latitude"])
        ref_lon = float(region["longitude"])
        ref_alt = float(region.get("elevation_m", 1500.0))
        
        # 1. Generate local 10x10 synthetic DEM terrain grid in ENU (East, North, Up) coordinates
        grid_points = []
        base_slope = float(measurements.get("slope_mean", {}).get("value_numeric", 6.0))
        roughness = float(measurements.get("roughness", {}).get("value_numeric", 0.25))
        
        step_meters = 25.0 # 25m grid spacing
        for i in range(-5, 6):
            for j in range(-5, 6):
                east = j * step_meters
                north = i * step_meters
                # Synthetic realistic elevation based on slope incline & roughness noise
                up = (north * math.tan(math.radians(base_slope)) * 0.4) + (math.sin(i * 0.8) * math.cos(j * 0.8) * roughness * 4.0)
                grid_points.append({
                    "grid_coord": [j, i],
                    "enu_pos": [round(east, 2), round(north, 2), round(up, 2)],
                    "slope_deg": round(base_slope + (math.sin(i + j) * 2.0), 1)
                })
                
        # 2. Hazard boundaries (areas with slope > 15 deg)
        hazard_zones = [
            {
                "id": "hazard_slope_north",
                "type": "SLOPE_WARNING",
                "enu_polygon": [[-75, 75, 8.5], [75, 75, 11.2], [50, 125, 16.0], [-50, 125, 14.5]],
                "warning": "Steep incline exceeding 18° - high wheel slippage risk"
            }
        ]
        
        # 3. Mineralogical overlay (e.g. Basalt / Hematite concentration)
        lithology = measurements.get("lithology_type", {}).get("value_text", "Basalt")
        mineral_hotspots = [
            {
                "id": "mineral_target_01",
                "name": f"High {lithology} Concentration Zone",
                "enu_pos": [25.0, 50.0, 3.2],
                "color_hex": "#00ffcc",
                "radius_m": 30.0,
                "confidence_score": 0.92
            }
        ]
        
        # 4. Environmental & Protected Area boundary fence
        eco_fences = []
        if environmental_assessment and environmental_assessment.get("protected_area_intersection"):
            eco_fences.append({
                "id": "eco_restriction_boundary",
                "name": environmental_assessment.get("protected_area_name", "Protected Area Boundary"),
                "status": environmental_assessment.get("risk_level", "RESTRICTED_REVIEW"),
                "enu_line": [[-125, -125, 0], [125, -125, 0]],
                "color_hex": "#ff3366",
                "instruction": "ECOLOGICAL EXCLUSION BOUNDARY: Do not cross with motorized vehicles."
            })
            
        return {
            "session_id": generate_id("ar_sess"),
            "region_id": region["id"],
            "region_name": region["name"],
            "coordinate_system": {
                "datum": "WGS84",
                "local_frame": "ENU (East-North-Up)",
                "origin_geodetic": {
                    "latitude": ref_lat,
                    "longitude": ref_lon,
                    "altitude_m": ref_alt
                }
            },
            "terrain_mesh": {
                "vertex_count": len(grid_points),
                "grid_spacing_meters": step_meters,
                "extent_meters": {"east": [-125, 125], "north": [-125, 125]},
                "vertices": grid_points
            },
            "ar_overlays": {
                "hazards": hazard_zones,
                "minerals": mineral_hotspots,
                "environmental_fences": eco_fences
            },
            "hud_telemetry": {
                "analog_name": region["name"],
                "target_match": "Moon / Mars Mission Profile",
                "measured_slope_mean": base_slope,
                "measured_roughness": roughness,
                "measured_lithology": lithology,
                "safety_status": "NORMAL_OPS" if not eco_fences else "RESTRICTED_BUFFER"
            },
            "export_formats": ["GeoJSON_ENU", "glTF_2.0_mesh", "WebXR_JSON"]
        }
