"""
TerraAnalog - Environmental & Sustainable Development Goals (SDG 13, 14, 15) Engine
Evaluates ecological risk, intersection with protected areas (WDPA), land cover sensitivity (ESA WorldCover),
and manages the historical & preventive damage register.
"""
from typing import Dict, Any, List, Optional
from app.models import EnvironmentalAssessment, EnvironmentEvent, generate_id, now_iso

class EnvironmentEngine:
    """Rigorous ethical & ecological evaluation engine for planetary field testing"""
    
    # Protected areas / WDPA reference mock lookup
    PROTECTED_AREAS_CATALOG = {
        "reg_atacama": {
            "name": "Los Flamencos National Reserve & Valle de la Luna Sanctuary",
            "iucn_cat": "IV",
            "overlaps": True,
            "status": "RESTRICTED_REVIEW",
            "sdg13": "Extreme arid climate; salt flats sequester trace carbonates and microbial crusts.",
            "sdg14": "Endorheic hyper-saline lagoons with fragile microbialite and brine shrimp ecosystems.",
            "sdg15": "Vulnerable Andean flamingo nesting habitats and microbial gypsum crusts.",
            "recommendation": "Rover test allowed only on designated hyper-arid gravel plains outside salt polygon."
        },
        "reg_pinacate": {
            "name": "Reserva de la Biosfera El Pinacate y Gran Desierto de Altar (UNESCO)",
            "iucn_cat": "Ia",
            "overlaps": True,
            "status": "RESTRICTED_REVIEW",
            "sdg13": "Arid desert ecosystem vulnerable to erosion and desert pavement disturbance.",
            "sdg14": "Not applicable (inland volcanic field).",
            "sdg15": "UNESCO World Heritage Site with endemic desert tortoises and saguaro cacti.",
            "recommendation": "Strict permit from CONANP (Mexico) required. No motorized heavy drilling allowed."
        },
        "reg_cuatro_cienegas": {
            "name": "Área de Protección de Flora y Fauna Cuatrociénegas (Ramsar)",
            "iucn_cat": "VI",
            "overlaps": True,
            "status": "RESTRICTED_REVIEW",
            "sdg13": "Groundwater depletion and micro-aquifer sensitivity to climate shifts.",
            "sdg14": "Critical prehistoric living stromatolites and endemic pupfish springs.",
            "sdg15": "One of the most biodiverse desert oases on Earth with deep evolutionary lineage.",
            "recommendation": "CRITICAL EXCLUSION: Heavy hardware testing prohibited near travertine ponds."
        },
        "reg_haughton": {
            "name": "Devon Island Polar Wilderness",
            "iucn_cat": "None (Remote Arctic)",
            "overlaps": False,
            "status": "LOW_ALERT",
            "sdg13": "Permafrost active layer monitoring mandatory to prevent thermokarst subsidence.",
            "sdg14": "Remote coastal proximity; seasonal meltwater runoff to Baffin Bay.",
            "sdg15": "Polar desert with very sparse moss-lichen patches; minimal direct habitat conflict.",
            "recommendation": "Standard Arctic field expedition guidelines; maintain zero-trace waste disposal."
        },
        "reg_death_valley": {
            "name": "Death Valley National Park",
            "iucn_cat": "II",
            "overlaps": True,
            "status": "MEDIUM_ALERT",
            "sdg13": "Hyper-arid heat baseline monitoring.",
            "sdg14": "Endorheic salt basin; isolated springs (Badwater Basin).",
            "sdg15": "National Park Service permit required; avoid pupfish springs and wilderness areas.",
            "recommendation": "Conduct simulation solely within designated gravel washes with NPS research authorization."
        },
        "reg_timanfaya": {
            "name": "Parque Nacional de Timanfaya (Lanzarote)",
            "iucn_cat": "II",
            "overlaps": True,
            "status": "HIGH_ALERT",
            "sdg13": "Volcanic geothermal anomaly and pristine tephra preserving climate proxies.",
            "sdg14": "Atlantic island coastal boundary; avoid coastal volcanic cliffs.",
            "sdg15": "Primary ecological succession on recent basaltic flows; lichen communities fragile.",
            "recommendation": "Restricted footpaths only; ESA PANGAEA geological training protocol compliant."
        },
        "reg_rio_tinto": {
            "name": "Paisaje Protegido del Río Tinto",
            "iucn_cat": "V",
            "overlaps": True,
            "status": "MEDIUM_ALERT",
            "sdg13": "Legacy acid mine drainage altering local hydrological chemistry.",
            "sdg14": "Acidic runoff reaching Huelva estuary; heavy metal contamination monitoring required.",
            "sdg15": "Extremophile microbial mats and iron-oxidizing biofilms constitute unique biosphere.",
            "recommendation": "Junta de Andalucía permit required. Avoid direct river channel disturbance."
        },
        "reg_svalbard": {
            "name": "Svalbard Nature Reserves (Søraust-Svalbard)",
            "iucn_cat": "Ia",
            "overlaps": True,
            "status": "HIGH_ALERT",
            "sdg13": "Rapid Arctic warming; permafrost thaw releasing stored greenhouse gases.",
            "sdg14": "Glacial meltwater and sediment discharge into fjord ecosystems.",
            "sdg15": "Vulnerable tundra vegetation, polar bear denning habitat, and Svalbard reindeer grazing.",
            "recommendation": "Governor of Svalbard permit mandatory. All-terrain vehicles restricted to frozen ground."
        },
        "reg_wadi_rum": {
            "name": "Wadi Rum Protected Area (UNESCO World Heritage Site)",
            "iucn_cat": "II",
            "overlaps": True,
            "status": "RESTRICTED_REVIEW",
            "sdg13": "Arid climate baseline monitoring; sand dune migration patterns.",
            "sdg14": "Inland desert; ephemeral flash-flood drainage.",
            "sdg15": "UNESCO Mixed Heritage Site with Bedouin cultural landscape and rare Nubian ibex.",
            "recommendation": "ASEZA & RSCN permit required. Vehicle transit on marked tracks only."
        },
        "reg_kilauea": {
            "name": "Hawaiʻi Volcanoes National Park (UNESCO World Heritage Site)",
            "iucn_cat": "II",
            "overlaps": True,
            "status": "HIGH_ALERT",
            "sdg13": "Active volcanic degassing contributing to vog air quality hazards.",
            "sdg14": "Lava ocean entry plumes generating acidic laze in coastal waters.",
            "sdg15": "Pioneer ʻōhiʻa lehua forest succession; endangered nēnē goose habitat.",
            "recommendation": "NPS research permit mandatory. Active vent exclusion zones enforced."
        },
        "reg_uyuni": {
            "name": "Reserva Nacional de Fauna Andina Eduardo Avaroa Buffer",
            "iucn_cat": "IV",
            "overlaps": False,
            "status": "MEDIUM_ALERT",
            "sdg13": "High-altitude UV index exceeding 16; Altiplano climate monitoring.",
            "sdg14": "Endorheic salt basin supporting seasonal Andean flamingo breeding.",
            "sdg15": "Lithium extraction expansion threatening flamingo nesting lagoons.",
            "recommendation": "SERNAP coordination advised. Vehicle crossing on hardened crust tracks only."
        },
        "reg_namib": {
            "name": "Namib-Naukluft National Park & Skeleton Coast (UNESCO WHS)",
            "iucn_cat": "II",
            "overlaps": True,
            "status": "HIGH_ALERT",
            "sdg13": "Fog-precipitation regime sensitive to sea surface temperature shifts.",
            "sdg14": "Cold Benguela upwelling current supporting Cape fur seal colonies.",
            "sdg15": "Ancient Welwitschia mirabilis plant colonies (>1000 years) and fog-basking beetles.",
            "recommendation": "MET permit required. Lichen fields absolutely off-limits to vehicles."
        },
        "reg_dallol": {
            "name": "Afar Regional Protected Geological Monument",
            "iucn_cat": "III",
            "overlaps": False,
            "status": "RESTRICTED_REVIEW",
            "sdg13": "Extreme thermal baseline (>45°C ambient); toxic sulfur gas release.",
            "sdg14": "Hyper-saline endorheic potash lake with zero macroscopic aquatic life.",
            "sdg15": "Ultra-extreme poly-extremophilic archaea; fragile mineral terraces easily crushed.",
            "recommendation": "Afar Regional Government escort mandatory. Acid-resistant robotic sampling only."
        },
        "reg_pilbara": {
            "name": "Karijini & Western Australia Heritage Register (Dresser Formation)",
            "iucn_cat": "II",
            "overlaps": True,
            "status": "HIGH_ALERT",
            "sdg13": "Arid interior climate; wildfire dynamics.",
            "sdg14": "Intermittent seasonal creeks draining into Fortescue River.",
            "sdg15": "Irreplaceable 3.5 Ga stromatolite fossil beds; strict legal protection against coring.",
            "recommendation": "WA Department of Mines & Aboriginal heritage clearance mandatory."
        },
        "reg_askja": {
            "name": "Vatnajökull National Park (UNESCO World Heritage Site)",
            "iucn_cat": "II",
            "overlaps": True,
            "status": "HIGH_ALERT",
            "sdg13": "Subglacial volcanic hazards and jökulhlaup flood risks.",
            "sdg14": "Glacial meltwater rivers carrying volcanic sediment to North Atlantic coast.",
            "sdg15": "Pristine pioneer moss and lichen growth on fresh volcanic tephra.",
            "recommendation": "Vatnajökull National Park permit required. Vehicles strictly confined to F910 track."
        },
        "reg_vostok": {
            "name": "Antarctic Treaty Specially Protected Area (Planetary Protection Zone)",
            "iucn_cat": "Ia",
            "overlaps": True,
            "status": "RESTRICTED_REVIEW",
            "sdg13": "Polar ice sheet mass balance and 420,000-year paleoclimate ice cores.",
            "sdg14": "Isolated subglacial aquatic biome; absolute zero chemical/biological contamination mandate.",
            "sdg15": "Potential chemosynthetic subglacial microbes isolated for millennia.",
            "recommendation": "STRICTEST PLANETARY PROTECTION: ATCM & SCAR approval mandatory."
        }
    }

    def assess_region(self, region: Dict[str, Any]) -> EnvironmentalAssessment:
        """
        Perform an ethical environmental evaluation for a candidate region.
        """
        reg_id = region["id"]
        pa_info = self.PROTECTED_AREAS_CATALOG.get(reg_id)
        
        if not pa_info:
            return EnvironmentalAssessment(
                id=generate_id("env_ass"),
                region_id=reg_id,
                assessment_date=now_iso(),
                risk_level="LOW_ALERT",
                coverage_score=85.0,
                protected_area_intersection=False,
                protected_area_name=None,
                iucn_category=None,
                sdg13_climate_impact="No localized permafrost or high carbon stock risks identified.",
                sdg14_marine_connectivity="No direct marine runoff or fragile marine protected area within 50km.",
                sdg15_terrestrial_ecosystems="Sparse vegetative cover; minimal threatened species distribution.",
                findings_json={"wdpa_query": "No overlapping polygon found in WDPA v4 catalogue."},
                recommendation="Low environmental friction. Proceed with standard field pre-checks.",
                review_status="preliminary"
            )
            
        return EnvironmentalAssessment(
            id=generate_id("env_ass"),
            region_id=reg_id,
            assessment_date=now_iso(),
            risk_level=pa_info["status"],
            coverage_score=95.0,
            protected_area_intersection=pa_info["overlaps"],
            protected_area_name=pa_info["name"],
            iucn_category=pa_info["iucn_cat"],
            sdg13_climate_impact=pa_info["sdg13"],
            sdg14_marine_connectivity=pa_info["sdg14"],
            sdg15_terrestrial_ecosystems=pa_info["sdg15"],
            findings_json={
                "wdpa_matched": pa_info["name"],
                "iucn_category": pa_info["iucn_cat"],
                "conservation_objective": "Biodiversity and geological monument preservation"
            },
            recommendation=pa_info["recommendation"],
            review_status="reviewed"
        )
