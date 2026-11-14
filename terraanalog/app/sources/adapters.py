"""
TerraAnalog - External Data Source Adapters
Implements modular connectors and metadata handlers for NASA, ESA, CSA, JAXA, CONABIO, INEGI, WDPA, SEDAC.
"""
from typing import Dict, Any, List, Optional
import datetime
from app.config import config

class BaseSourceAdapter:
    """Standardized adapter interface for geospatial & planetary providers"""
    source_id: str = "base"
    provider_name: str = "Generic Provider"
    base_url: str = ""
    access_type: str = "REST_API"
    license_info: str = "Open Access"
    requires_auth: bool = False
    
    def __init__(self):
        self.status = "active" if not self.requires_auth else "requires_credentials"
        
    def healthcheck(self) -> Dict[str, Any]:
        return {
            "source_id": self.source_id,
            "provider": self.provider_name,
            "status": self.status,
            "requires_auth": self.requires_auth,
            "base_url": self.base_url,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
    def search(self, query: str = "", bbox: Optional[List[float]] = None) -> List[Dict[str, Any]]:
        raise NotImplementedError

class NasaCmrAdapter(BaseSourceAdapter):
    """NASA Common Metadata Repository (CMR) Earthdata Search Catalog Adapter"""
    source_id = "src_nasa_cmr"
    provider_name = "NASA Earth Science Data and Information System (ESDIS)"
    base_url = "https://cmr.earthdata.nasa.gov/search"
    access_type = "REST_API"
    license_info = "NASA Open Data Policy (Public Domain)"
    requires_auth = False
    
    def search(self, query: str = "ASTER GDEM", bbox: Optional[List[float]] = None) -> List[Dict[str, Any]]:
        # Structured catalog representation
        return [
            {
                "collection_id": "C1711961296-LPCLOUD",
                "title": "ASTER Global Digital Elevation Model V003 (ASTGTM)",
                "platform": "TERRA",
                "instrument": "ASTER",
                "resolution": "30 meters",
                "format": "GeoTIFF",
                "status": "catalog_only" if not config.EARTHDATA_USERNAME else "download_available",
                "url": "https://search.earthdata.nasa.gov/search/granules?p=C1711961296-LPCLOUD"
            },
            {
                "collection_id": "C1239566722-GES_DISC",
                "title": "MERRA-2 Surface Meteorology and Incident Solar Radiation",
                "platform": "Reanalysis",
                "instrument": "Model",
                "resolution": "0.5 x 0.625 deg",
                "format": "NetCDF-4",
                "status": "download_available",
                "url": "https://cmr.earthdata.nasa.gov/search/concepts/C1239566722-GES_DISC.json"
            }
        ]

class NasaGibsAdapter(BaseSourceAdapter):
    """NASA Global Imagery Browse Services (GIBS) Tile & Visualization Adapter"""
    source_id = "src_nasa_gibs"
    provider_name = "NASA GIBS / Worldview"
    base_url = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best"
    access_type = "WMTS"
    license_info = "NASA Open Data Policy"
    requires_auth = False
    
    def get_layer_capabilities(self) -> List[Dict[str, Any]]:
        return [
            {
                "layer_id": "MODIS_Terra_CorrectedReflectance_TrueColor",
                "title": "MODIS Terra True Color (250m)",
                "tile_matrix_set": "250m",
                "format": "image/jpeg",
                "attribution": "NASA Worldview / GIBS"
            },
            {
                "layer_id": "VIIRS_SNPP_CorrectedReflectance_TrueColor",
                "title": "VIIRS Suomi NPP True Color (375m)",
                "tile_matrix_set": "250m",
                "format": "image/jpeg",
                "attribution": "NASA Worldview / GIBS"
            }
        ]

class NasaPdsAdapter(BaseSourceAdapter):
    """NASA Planetary Data System (PDS) Geosciences & Imaging Nodes"""
    source_id = "src_nasa_pds"
    provider_name = "NASA Planetary Data System (PDS)"
    base_url = "https://pds-geosciences.wustl.edu"
    access_type = "REST_API"
    license_info = "NASA Planetary Science Division Open Access"
    requires_auth = False
    
    def get_lunar_products(self) -> List[Dict[str, Any]]:
        return [
            {
                "dataset_id": "LRO-L-DLRE-4-GDR-V1.0",
                "mission": "Lunar Reconnaissance Orbiter (LRO)",
                "instrument": "Diviner Lunar Radiometer Experiment (DLRE)",
                "product": "Global Thermal Radiance & Bolometric Temperature Map (GDR)",
                "resolution": "128 pixels/degree (~240m at equator)",
                "citation": "Paige et al., Space Science Reviews, 2010"
            },
            {
                "dataset_id": "LRO-L-LOLA-4-GDR-V1.0",
                "mission": "Lunar Reconnaissance Orbiter (LRO)",
                "instrument": "Lunar Orbiter Laser Altimeter (LOLA)",
                "product": "Lunar Digital Elevation Model (LDEM 128)",
                "resolution": "118 meters/pixel",
                "citation": "Smith et al., Icarus, 2017"
            }
        ]
        
    def get_mars_products(self) -> List[Dict[str, Any]]:
        return [
            {
                "dataset_id": "MRO-M-CRISM-3-RDR-V1.0",
                "mission": "Mars Reconnaissance Orbiter (MRO)",
                "instrument": "Compact Reconnaissance Imaging Spectrometer for Mars (CRISM)",
                "product": "Targeted Empirical Mineralogy & Phyllosilicates Products",
                "resolution": "18-36 meters/pixel",
                "citation": "Murchie et al., J. Geophys. Res., 2007"
            },
            {
                "dataset_id": "MGS-M-MOLA-3-PEDR-L2-V1.0",
                "mission": "Mars Global Surveyor (MGS)",
                "instrument": "Mars Orbiter Laser Altimeter (MOLA)",
                "product": "Mission Experiment Gridded Data Record (MEGDR 128)",
                "resolution": "463 meters/pixel",
                "citation": "Smith et al., Science, 1999"
            }
        ]

class CopernicusAdapter(BaseSourceAdapter):
    """ESA Copernicus Data Space Ecosystem STAC & Sentinel Hub Adapter"""
    source_id = "src_copernicus"
    provider_name = "European Space Agency (ESA) / Copernicus"
    base_url = "https://catalogue.dataspace.copernicus.eu/stac"
    access_type = "STAC"
    license_info = "Copernicus Open Access Policy"
    requires_auth = True if not config.COPERNICUS_CLIENT_ID else False

class CsaRadarsatAdapter(BaseSourceAdapter):
    """Canadian Space Agency (CSA) RADARSAT & RCM SAR Adapter"""
    source_id = "src_csa_radarsat"
    provider_name = "Canadian Space Agency (CSA / ASC)"
    base_url = "https://donnees-data.asc-csa.gc.ca"
    access_type = "FILE_DOWNLOAD"
    license_info = "Open Government Licence - Canada"
    requires_auth = False

class JaxaGportalAdapter(BaseSourceAdapter):
    """JAXA Global Portal System (G-Portal) Adapter"""
    source_id = "src_jaxa_gportal"
    provider_name = "Japan Aerospace Exploration Agency (JAXA)"
    base_url = "https://gportal.jaxa.jp/gpr/index/index"
    access_type = "REST_API"
    license_info = "JAXA Standard Data Policy"
    requires_auth = True

class ConabioInegiAdapter(BaseSourceAdapter):
    """Mexican GIS Adapters (CONABIO Biodiversity & INEGI Land Cover)"""
    source_id = "src_conabio_inegi"
    provider_name = "CONABIO & INEGI (Mexico)"
    base_url = "http://www.conabio.gob.mx/informacion/gis/"
    access_type = "FILE_DOWNLOAD"
    license_info = "Open Government Data (Mexico Libre Uso)"
    requires_auth = False

class ProtectedPlanetAdapter(BaseSourceAdapter):
    """UNEP-WCMC & IUCN Protected Planet (WDPA) v4 Adapter"""
    source_id = "src_protected_planet"
    provider_name = "UNEP-WCMC / IUCN Protected Planet"
    base_url = "https://api.protectedplanet.net/v4"
    access_type = "REST_API"
    license_info = "WDPA Terms of Use (Non-commercial research / Attribution)"
    requires_auth = True if not config.PROTECTED_PLANET_API_TOKEN else False

class EsaWorldCoverAdapter(BaseSourceAdapter):
    """ESA WorldCover 10m Cloud-Optimized GeoTIFF Adapter"""
    source_id = "src_esa_worldcover"
    provider_name = "ESA WorldCover Consortium"
    base_url = "https://esa-worldcover.org/en/data-access"
    access_type = "COG"
    license_info = "Creative Commons Attribution 4.0 International (CC BY 4.0)"
    requires_auth = False

class NasaSedacAdapter(BaseSourceAdapter):
    """NASA Socioeconomic Data and Applications Center (SEDAC) Adapter"""
    source_id = "src_nasa_sedac"
    provider_name = "NASA SEDAC / CIESIN Columbia University"
    base_url = "https://sedac.ciesin.columbia.edu"
    access_type = "REST_API"
    license_info = "NASA SEDAC Open Access"
    requires_auth = False

# Registry of all instantiated adapters
ADAPTER_REGISTRY: Dict[str, BaseSourceAdapter] = {
    "src_nasa_cmr": NasaCmrAdapter(),
    "src_nasa_gibs": NasaGibsAdapter(),
    "src_nasa_pds": NasaPdsAdapter(),
    "src_copernicus": CopernicusAdapter(),
    "src_csa_radarsat": CsaRadarsatAdapter(),
    "src_jaxa_gportal": JaxaGportalAdapter(),
    "src_conabio_inegi": ConabioInegiAdapter(),
    "src_protected_planet": ProtectedPlanetAdapter(),
    "src_esa_worldcover": EsaWorldCoverAdapter(),
    "src_nasa_sedac": NasaSedacAdapter()
}
