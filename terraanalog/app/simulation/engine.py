"""
TerraAnalog - Environmental Simulator Engine
Configures and runs physical simulation scenarios for hardware & rover analog missions.
"""
from typing import Dict, Any, List
import datetime
from app.models import SimulationRun, generate_id, now_iso

class SimulationEngine:
    """Simulates hardware stress, mobility hazards, and thermal/radiation exposure"""
    
    def run_scenario(
        self,
        region_id: str,
        scenario_type: str,
        custom_params: Dict[str, Any],
        measurements: Dict[str, Any]
    ) -> SimulationRun:
        """
        Execute testing scenario based on measured terrestrial analog variables.
        """
        slope = float(measurements.get("slope_mean", {}).get("value_numeric", 8.0))
        roughness = float(measurements.get("roughness", {}).get("value_numeric", 0.3))
        temp_delta = float(measurements.get("temperature_diurnal_range", {}).get("value_numeric", 30.0))
        radiation = float(measurements.get("radiation_flux", {}).get("value_numeric", 1.8))
        
        output = {}
        
        if scenario_type == "ROVER_MOBILITY":
            # Slippage risk calculation
            slippage_risk = min(max((slope * 2.5 + roughness * 45.0), 5.0), 95.0)
            energy_consumption_multiplier = 1.0 + (slope / 20.0) + (roughness * 0.8)
            hazard_level = "HIGH" if slippage_risk > 65 else ("MEDIUM" if slippage_risk > 35 else "LOW")
            
            output = {
                "scenario": "Rover Mobility & Obstacle Negotiation",
                "simulated_slope_deg": slope,
                "simulated_roughness": roughness,
                "wheel_slippage_risk_pct": round(slippage_risk, 1),
                "energy_consumption_multiplier": round(energy_consumption_multiplier, 2),
                "hazard_level": hazard_level,
                "recommended_wheel_grousers": "High-tread titanium mesh" if roughness > 0.4 else "Standard flexible rim",
                "max_safe_transit_speed_kmh": round(max(0.5, 6.0 - (slope * 0.2 + roughness * 4.0)), 2)
            }
            
        elif scenario_type == "THERMAL_CYCLING":
            thermal_shock_risk = "MODERATE" if temp_delta > 40.0 else "LOW"
            battery_efficiency_degradation_pct = round(temp_delta * 0.35, 1)
            
            output = {
                "scenario": "Thermal Cycling & Radiator Degradation",
                "diurnal_delta_kelvin": temp_delta,
                "thermal_shock_risk": thermal_shock_risk,
                "battery_efficiency_loss_pct": battery_efficiency_degradation_pct,
                "survival_heaters_required": temp_delta > 35.0,
                "thermal_blanket_layers_recommended": 12 if temp_delta > 45 else 8
            }
            
        elif scenario_type == "RADIATION_EXPOSURE":
            accumulated_dose_30days_msv = round((radiation / 365.25) * 30.0, 3)
            solar_panel_cell_degradation_pct = round(accumulated_dose_30days_msv * 0.08, 2)
            
            output = {
                "scenario": "Radiation Shielding & Sensor SEU (Single Event Upset) Test",
                "ambient_radiation_msv_year": radiation,
                "cumulative_30day_dose_msv": accumulated_dose_30days_msv,
                "seu_expected_rate_per_month": round(radiation * 0.12, 1),
                "solar_panel_cell_degradation_pct": solar_panel_cell_degradation_pct,
                "radiation_tolerance_compliance": "PASS (Standard commercial avionics viable with ECC memory)"
            }
        else:
            output = {
                "scenario": scenario_type,
                "status": "Generic baseline simulation complete",
                "environmental_stability_index": 78.5
            }
            
        return SimulationRun(
            id=generate_id("sim_run"),
            region_id=region_id,
            scenario_name=f"{scenario_type} - Automated Assessment",
            scenario_type=scenario_type,
            parameters_json=custom_params,
            output_json=output,
            model_version="1.2.0-spatial-mechanics",
            status="completed",
            created_at=now_iso()
        )
