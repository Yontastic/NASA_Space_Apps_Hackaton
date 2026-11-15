"""
TerraAnalog - Mathematical Similarity Engine
Implements the Gaussian kernel similarity formula:
    s_i = exp(-0.5 * (d_i / tau_i)^2)
With data quality weighting, coverage penalty, dimensional breakdown,
and strict separation from environmental risk and operational feasibility.
"""
import math
from typing import Dict, Any, List, Tuple, Optional
from app.config import config
from app.features.definitions import FEATURE_CATALOG, get_lithology_similarity
from app.models import SimilarityResult, DimensionScore, generate_id

class SimilarityEngine:
    """Rigorous scientific similarity calculator between Earth analogs and planetary targets"""
    
    def __init__(self, tolerances: Optional[Dict[str, float]] = None):
        self.tolerances = tolerances or config.DEFAULT_TOLERANCES
        self.feature_map = {f["key"]: f for f in FEATURE_CATALOG}

    def compute_variable_similarity(
        self,
        feature_key: str,
        earth_val: Any,
        target_val: Any,
        custom_tau: Optional[float] = None
    ) -> Tuple[float, float, str]:
        """
        Compute similarity for a single variable.
        Returns: (similarity_score [0..1], delta, explanation_text)
        """
        if earth_val is None or target_val is None:
            return 0.0, 0.0, "Missing data on one or both bodies"
            
        feat_def = self.feature_map.get(feature_key, {})
        data_type = feat_def.get("data_type", "numeric")
        
        # Categorical variable (e.g. Lithology)
        if data_type == "categorical":
            s_i = get_lithology_similarity(str(earth_val), str(target_val))
            delta_str = f"{earth_val} vs {target_val}"
            return s_i, 0.0, f"Categorical lithological compatibility score: {s_i:.2f}"
            
        # Numerical variable: Gaussian kernel s_i = exp(-0.5 * (d_i / tau_i)^2)
        try:
            v_earth = float(earth_val)
            v_target = float(target_val)
        except (ValueError, TypeError):
            return 0.0, 0.0, "Invalid numerical format"
            
        delta = abs(v_earth - v_target)
        tau = custom_tau or self.tolerances.get(feature_key, feat_def.get("tolerance", 1.0))
        
        if tau <= 0:
            tau = 1.0
            
        # Scientific Gaussian formula
        exponent = -0.5 * math.pow(delta / tau, 2)
        # Avoid underflow for very large deviations
        s_i = math.exp(exponent) if exponent > -25.0 else 0.0
        
        unit = feat_def.get("unit", "")
        expl = (f"Delta: {delta:.2f} {unit} against scientific tolerance tau: {tau:.2f} {unit} "
                f"yields Gaussian similarity: {s_i * 100:.1f}%")
        return s_i, delta, expl

    def evaluate_candidate(
        self,
        region: Dict[str, Any],
        target_profile: Dict[str, Any],
        earth_measurements: List[Dict[str, Any]],
        target_measurements: List[Dict[str, Any]],
        run_id: str = "run_default"
    ) -> SimilarityResult:
        """
        Evaluate full multi-dimensional analog similarity.
        """
        earth_dict = {m["feature_key"]: m for m in earth_measurements}
        target_dict = {m["feature_key"]: m for m in target_measurements}
        
        weighted_sim_sum = 0.0
        evaluated_weights_sum = 0.0
        total_possible_weights_sum = 0.0
        
        variable_breakdown = []
        missing_variables = []
        dimension_accumulators: Dict[str, Dict[str, float]] = {
            "geology": {"w_sim": 0.0, "w": 0.0, "total_w": 0.0, "count": 0, "eval_count": 0},
            "topography": {"w_sim": 0.0, "w": 0.0, "total_w": 0.0, "count": 0, "eval_count": 0},
            "geophysics": {"w_sim": 0.0, "w": 0.0, "total_w": 0.0, "count": 0, "eval_count": 0},
            "thermal": {"w_sim": 0.0, "w": 0.0, "total_w": 0.0, "count": 0, "eval_count": 0},
        }
        
        for feat in FEATURE_CATALOG:
            key = feat["key"]
            category = feat["category"]
            default_weight = feat["default_weight"]
            
            total_possible_weights_sum += default_weight
            if category in dimension_accumulators:
                dimension_accumulators[category]["total_w"] += default_weight
                dimension_accumulators[category]["count"] += 1
                
            e_meas = earth_dict.get(key)
            t_meas = target_dict.get(key)
            
            # Check availability
            if not e_meas or not t_meas:
                missing_variables.append(feat["name"])
                variable_breakdown.append({
                    "feature_key": key,
                    "name": feat["name"],
                    "category": category,
                    "unit": feat["unit"],
                    "status": "MISSING_DATA",
                    "earth_val": None if not e_meas else (e_meas.get("value_numeric") or e_meas.get("value_text")),
                    "target_val": None if not t_meas else (t_meas.get("value_numeric") or t_meas.get("value_text")),
                    "similarity": None,
                    "quality": None,
                    "weight": default_weight,
                    "source_dataset": "N/A - Unobserved",
                    "citation": "Dataset required"
                })
                continue
                
            e_val = e_meas.get("value_numeric") if feat["data_type"] == "numeric" else e_meas.get("value_text")
            t_val = t_meas.get("value_numeric") if feat["data_type"] == "numeric" else t_meas.get("value_text")
            
            if e_val is None or t_val is None:
                missing_variables.append(feat["name"])
                variable_breakdown.append({
                    "feature_key": key,
                    "name": feat["name"],
                    "category": category,
                    "unit": feat["unit"],
                    "status": "MISSING_DATA",
                    "earth_val": e_val,
                    "target_val": t_val,
                    "similarity": None,
                    "quality": None,
                    "weight": default_weight,
                    "source_dataset": "N/A - Unobserved",
                    "citation": "Dataset required"
                })
                continue
                
            quality = min(max(float(e_meas.get("quality", 1.0)), 0.1), 1.0)
            tau = self.tolerances.get(key, float(feat.get("tolerance", 1.0)))
            
            s_i, delta, explanation = self.compute_variable_similarity(key, e_val, t_val, tau)
            
            effective_weight = default_weight * quality
            weighted_sim_sum += effective_weight * s_i
            evaluated_weights_sum += effective_weight
            
            if category in dimension_accumulators:
                dimension_accumulators[category]["w_sim"] += effective_weight * s_i
                dimension_accumulators[category]["w"] += effective_weight
                dimension_accumulators[category]["eval_count"] += 1
                
            variable_breakdown.append({
                "feature_key": key,
                "name": feat["name"],
                "category": category,
                "unit": feat["unit"],
                "status": "EVALUATED",
                "earth_val": e_val,
                "target_val": t_val,
                "delta": delta,
                "tolerance": tau,
                "similarity": round(s_i * 100, 2),
                "quality": quality,
                "weight": default_weight,
                "contribution_pct": round(effective_weight * s_i * 100, 2),
                "source_dataset": e_meas.get("dataset_id", "NASA Earthdata"),
                "citation": e_meas.get("method", "Standard GIS zonal statistics")
            })
            
        # Calculate Physical Similarity
        if evaluated_weights_sum > 0:
            physical_similarity = (weighted_sim_sum / evaluated_weights_sum) * 100.0
        else:
            physical_similarity = 0.0
            
        # Calculate Data Coverage
        if total_possible_weights_sum > 0:
            data_coverage = (evaluated_weights_sum / total_possible_weights_sum) * 100.0
        else:
            data_coverage = 0.0
            
        # Confidence incorporates coverage
        confidence = (physical_similarity * (data_coverage / 100.0))
        
        # Operational Feasibility (independent index: terrain slope, roughness, thermal extreme)
        operational_feasibility = self._calculate_operational_feasibility(earth_dict)
        
        # Classification thresholds
        is_provisional = data_coverage < config.MIN_COVERAGE_THRESHOLD
        
        if is_provisional:
            classification = "Provisional (Low Data)"
        elif physical_similarity >= config.HIGH_SIMILARITY_THRESHOLD:
            classification = "High Match (Coincidencia Alta)"
        elif physical_similarity >= config.MODERATE_SIMILARITY_THRESHOLD:
            classification = "Moderate Match (Coincidencia Considerable)"
        elif physical_similarity >= config.PARTIAL_SIMILARITY_THRESHOLD:
            classification = "Partial Match (Coincidencia Parcial)"
        else:
            classification = "Low Match (Coincidencia Baja)"
            
        # Dimensions breakdown
        dimension_scores = []
        for dim, acc in dimension_accumulators.items():
            dim_score = (acc["w_sim"] / acc["w"] * 100.0) if acc["w"] > 0 else 0.0
            dim_cov = (acc["w"] / acc["total_w"] * 100.0) if acc["total_w"] > 0 else 0.0
            dimension_scores.append({
                "dimension": dim,
                "score": round(dim_score, 1),
                "coverage": round(dim_cov, 1),
                "variables_count": acc["count"],
                "evaluated_count": acc["eval_count"]
            })
            
        # Top contributing and detracting variables
        evaluated_vars = [v for v in variable_breakdown if v["status"] == "EVALUATED"]
        evaluated_vars.sort(key=lambda x: x["similarity"], reverse=True)
        top_positive = evaluated_vars[:3] if evaluated_vars else []
        top_negative = evaluated_vars[-3:] if evaluated_vars else []
        
        explanation_data = {
            "summary": (f"{region['name']} achieves {physical_similarity:.1f}% physical similarity "
                        f"with {target_profile['name']} ({target_profile['body']}) with {data_coverage:.1f}% data coverage."),
            "top_positive_factors": [f"{v['name']} ({v['similarity']}% similarity)" for v in top_positive],
            "top_detracting_factors": [f"{v['name']} ({v['similarity']}% similarity, delta={v['delta']:.1f} {v['unit']})" for v in top_negative],
            "missing_factors": missing_variables,
            "provisional_warning": "Warning: Data coverage is below 60%. Result is provisional." if is_provisional else None
        }
        
        return SimilarityResult(
            id=generate_id("simres"),
            run_id=run_id,
            region_id=region["id"],
            region_name=region["name"],
            target_profile_id=target_profile["id"],
            target_name=target_profile["name"],
            target_body=target_profile["body"],
            physical_similarity=round(physical_similarity, 1),
            data_coverage=round(data_coverage, 1),
            confidence=round(confidence, 1),
            classification=classification,
            operational_feasibility=round(operational_feasibility, 1),
            environmental_risk_level="EVALUATION_PENDING", # Linked separately in environment module
            dimension_scores=dimension_scores,
            variable_breakdown=variable_breakdown,
            missing_variables=missing_variables,
            explanation=explanation_data,
            is_provisional=is_provisional
        )

    def _calculate_operational_feasibility(self, earth_dict: Dict[str, Any]) -> float:
        """
        Feasibility for field deployment: moderate slope, traversable roughness, acceptable thermal conditions.
        """
        score = 80.0 # base feasibility
        
        # Slope penalty
        if "slope_mean" in earth_dict and earth_dict["slope_mean"].get("value_numeric") is not None:
            slope = float(earth_dict["slope_mean"]["value_numeric"])
            if slope > 25.0:
                score -= 35.0 # hazardous for rovers
            elif slope > 15.0:
                score -= 15.0
            elif slope < 8.0:
                score += 10.0
                
        # Roughness penalty
        if "roughness" in earth_dict and earth_dict["roughness"].get("value_numeric") is not None:
            roughness = float(earth_dict["roughness"]["value_numeric"])
            if roughness > 0.6:
                score -= 20.0
                
        return max(min(score, 100.0), 10.0)
