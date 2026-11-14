"""
TerraAnalog - AI Reverse Search Engine
Deterministic NLP query parser, parameter extractor, and nearest-neighbor vector matcher.
Translates natural language or mineralogical assays into structured multi-criteria spatial queries.
"""
import re
import math
from typing import Dict, Any, List, Optional
from app.features.definitions import FEATURE_CATALOG, get_lithology_similarity

class ReverseSearchEngine:
    """Intelligent reverse discovery of Earth analogs and planetary targets"""
    
    # Mineral and terrain vocabulary
    KEYWORDS_LITHOLOGY = {
        "basalt": "basalt",
        "basalto": "basalt",
        "basáltico": "basalt",
        "basaltic": "basalt",
        "anorthosite": "anorthosite",
        "anortosita": "anorthosite",
        "anorthositic": "anorthosite",
        "impact melt": "impact_melt",
        "breccia": "impact_melt",
        "brecha de impacto": "impact_melt",
        "crater": "impact_melt",
        "cráter": "impact_melt",
        "clay": "clay_clastic",
        "arcilla": "clay_clastic",
        "clastic": "clay_clastic",
        "evaporite": "evaporite_salar",
        "salar": "evaporite_salar",
        "salt": "evaporite_salar",
        "salino": "evaporite_salar",
        "permafrost": "permafrost",
        "ice": "permafrost",
        "hielo": "permafrost",
        "polar": "permafrost"
    }
    
    KEYWORDS_TERRAIN = {
        "dunes": "Desert",
        "dunas": "Desert",
        "desert": "Desert",
        "desierto": "Desert",
        "volcano": "Volcanic",
        "volcán": "Volcanic",
        "volcan": "Volcanic",
        "lava": "Volcanic",
        "caldera": "Volcanic",
        "crater": "Crater",
        "cráter": "Crater",
        "polar": "Polar",
        "tundra": "Polar",
        "glacier": "Polar",
        "salar": "Salar",
        "cave": "Lava_Tube",
        "cueva": "Lava_Tube",
        "tubo de lava": "Lava_Tube"
    }
    
    KEYWORDS_BODY = {
        "moon": "Moon",
        "luna": "Moon",
        "lunar": "Moon",
        "mars": "Mars",
        "marte": "Mars",
        "marciano": "Mars",
        "marciana": "Mars",
        "earth": "Earth",
        "tierra": "Earth"
    }

    def parse_natural_query(self, query: str) -> Dict[str, Any]:
        """
        Extract structured scientific criteria from a natural language query string.
        """
        q_lower = query.lower()
        extracted_filters: Dict[str, Any] = {
            "raw_query": query,
            "detected_lithology": None,
            "detected_terrain_type": None,
            "target_body": None,
            "slope_max": None,
            "slope_min": None,
            "iron_oxide_min": None,
            "thermal_inertia_min": None,
            "roughness_max": None,
            "radiation_max": None,
            "matched_keywords": []
        }
        
        # 1. Detect planetary body intent
        for kw, body in self.KEYWORDS_BODY.items():
            if re.search(rf"\b{re.escape(kw)}\b", q_lower):
                extracted_filters["target_body"] = body
                extracted_filters["matched_keywords"].append(kw)
                break
                
        # 2. Detect lithology / mineral composition
        for kw, lith in self.KEYWORDS_LITHOLOGY.items():
            if re.search(rf"\b{re.escape(kw)}\b", q_lower):
                extracted_filters["detected_lithology"] = lith
                extracted_filters["matched_keywords"].append(kw)
                break
                
        # 3. Detect terrain type
        for kw, terrain in self.KEYWORDS_TERRAIN.items():
            if re.search(rf"\b{re.escape(kw)}\b", q_lower):
                extracted_filters["detected_terrain_type"] = terrain
                extracted_filters["matched_keywords"].append(kw)
                break
                
        # 4. Extract numerical constraints with regex
        # Slopes (e.g., "pendiente menor a 15", "slope < 10 deg", "baja pendiente")
        slope_match = re.search(r"(?:slope|pendiente|inclinaci[oó]n)\s*(?:<|<=|menor a|less than|under)?\s*(\d+(?:\.\d+)?)\s*(?:deg|°|grados)?", q_lower)
        if slope_match:
            extracted_filters["slope_max"] = float(slope_match.group(1))
            extracted_filters["matched_keywords"].append(slope_match.group(0))
        elif "baja pendiente" in q_lower or "gentle slope" in q_lower or "flat" in q_lower or "plano" in q_lower:
            extracted_filters["slope_max"] = 10.0
            extracted_filters["matched_keywords"].append("flat/gentle slope")
            
        # Iron oxide (e.g., "alto hierro", "high iron", "iron > 10")
        iron_match = re.search(r"(?:iron|hierro|fe|feo|fe2o3)\s*(?:>|>=|mayor a|more than)?\s*(\d+(?:\.\d+)?)\s*(?:%|wt%)?", q_lower)
        if iron_match:
            extracted_filters["iron_oxide_min"] = float(iron_match.group(1))
            extracted_filters["matched_keywords"].append(iron_match.group(0))
        elif "alto hierro" in q_lower or "high iron" in q_lower or "hematite" in q_lower or "hematita" in q_lower:
            extracted_filters["iron_oxide_min"] = 10.0
            extracted_filters["matched_keywords"].append("high iron/hematite")

        # Roughness (e.g., "baja rugosidad", "low roughness", "smooth")
        if "baja rugosidad" in q_lower or "low roughness" in q_lower or "smooth" in q_lower or "suave" in q_lower:
            extracted_filters["roughness_max"] = 0.25
            extracted_filters["matched_keywords"].append("low roughness")
            
        # Radiation (e.g., "alta radiación", "high radiation")
        if "alta radiaci[oó]n" in q_lower or "high radiation" in q_lower:
            extracted_filters["radiation_min"] = 2.0
            extracted_filters["matched_keywords"].append("high radiation")
            
        return extracted_filters

    def search_candidates_by_vector(
        self,
        parsed_query: Dict[str, Any],
        candidates: List[Dict[str, Any]],
        measurements_by_region: Dict[str, List[Dict[str, Any]]]
    ) -> List[Dict[str, Any]]:
        """
        Rank candidates against parsed query criteria using deterministic score weighting.
        """
        ranked_results = []
        
        for cand in candidates:
            reg_id = cand["id"]
            meas_list = measurements_by_region.get(reg_id, [])
            meas_map = {m["feature_key"]: m for m in meas_list}
            
            score_acc = 0.0
            max_score = 0.0
            reasons = []
            
            # Lithology match
            target_lith = parsed_query.get("detected_lithology")
            if target_lith:
                max_score += 35.0
                cand_lith = meas_map.get("lithology_type", {}).get("value_text")
                sim_lith = get_lithology_similarity(cand_lith, target_lith)
                score_acc += sim_lith * 35.0
                reasons.append(f"Lithology: '{cand_lith}' has {sim_lith*100:.0f}% compatibility with query '{target_lith}'")
                
            # Terrain type match
            target_terrain = parsed_query.get("detected_terrain_type")
            if target_terrain:
                max_score += 25.0
                if cand["region_type"].lower() == target_terrain.lower():
                    score_acc += 25.0
                    reasons.append(f"Terrain: exact match with '{target_terrain}' classification")
                else:
                    reasons.append(f"Terrain: candidate is '{cand['region_type']}' while query preferred '{target_terrain}'")

            # Slope filter
            slope_max = parsed_query.get("slope_max")
            if slope_max is not None:
                max_score += 20.0
                slope_val = meas_map.get("slope_mean", {}).get("value_numeric")
                if slope_val is not None:
                    if slope_val <= slope_max:
                        score_acc += 20.0
                        reasons.append(f"Slope: {slope_val:.1f}° meets constraint (<= {slope_max}°)")
                    else:
                        penalty = max(0.0, 20.0 - (slope_val - slope_max) * 2.0)
                        score_acc += penalty
                        reasons.append(f"Slope: {slope_val:.1f}° exceeds preferred {slope_max}°")
                        
            # Iron oxide filter
            iron_min = parsed_query.get("iron_oxide_min")
            if iron_min is not None:
                max_score += 20.0
                fe_val = meas_map.get("iron_oxide_content", {}).get("value_numeric")
                if fe_val is not None:
                    if fe_val >= iron_min:
                        score_acc += 20.0
                        reasons.append(f"Iron Oxide: {fe_val:.1f}% meets constraint (>= {iron_min}%)")
                    else:
                        ratio = fe_val / iron_min
                        score_acc += ratio * 20.0
                        reasons.append(f"Iron Oxide: {fe_val:.1f}% below preferred {iron_min}%")
                        
            # Roughness filter
            rough_max = parsed_query.get("roughness_max")
            if rough_max is not None:
                max_score += 15.0
                rough_val = meas_map.get("roughness", {}).get("value_numeric")
                if rough_val is not None:
                    if rough_val <= rough_max:
                        score_acc += 15.0
                        reasons.append(f"Roughness: {rough_val:.2f} satisfies smoothness threshold")
                    else:
                        score_acc += 5.0
                        
            final_relevance = (score_acc / max_score * 100.0) if max_score > 0 else 50.0
            
            ranked_results.append({
                "candidate_id": cand["id"],
                "candidate_name": cand["name"],
                "country": cand["country"],
                "region_type": cand["region_type"],
                "latitude": cand["latitude"],
                "longitude": cand["longitude"],
                "relevance_score": round(final_relevance, 1),
                "matched_reasons": reasons,
                "parsed_query": parsed_query
            })
            
        ranked_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return ranked_results
