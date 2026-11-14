# TerraAnalog — Open Data Sources & Integration Strategy

This document provides an exhaustive inventory of the scientific data sources integrated into TerraAnalog, detailing their official endpoints, instruments, products, access modes, licenses, and specific role in analog characterization.

---

## 1. Master Data Source Inventory

| Source Name | Provider | Access Mode | Instrument / Product | Planetary Body | License | Status in TerraAnalog |
|---|---|---|---|---|---|---|
| **NASA CMR** | NASA ESDIS | REST API | ASTER GDEM V003 (30m DEM) | Earth | Public Domain | Fully integrated (`src_nasa_cmr`) |
| **NASA Worldview GIBS** | NASA ESDIS | WMTS / WMS | MODIS / VIIRS Corrected Reflectance | Earth / Moon / Mars | Public Domain | Fully integrated (`src_nasa_gibs`) |
| **NASA PDS Geosciences** | NASA PDS | REST / Archive | LRO Diviner (DLRE GDR), LRO LOLA (LDEM) | Moon | NASA Open Access | Fully integrated (`src_nasa_pds`) |
| **NASA PDS Imaging** | NASA PDS | REST / Archive | MGS MOLA (MEGDR), MRO CRISM (RDR) | Mars | NASA Open Access | Fully integrated (`src_nasa_pds`) |
| **Copernicus Data Space** | ESA / EU | STAC API | Sentinel-1 (C-SAR), Sentinel-2 (MSI) | Earth | Copernicus Open Access | Adapter ready (`src_copernicus`) |
| **CSA RADARSAT** | CSA / ASC | File Download | RADARSAT-1 & RCM (C-SAR) | Earth | Open Government Licence | Fully integrated (`src_csa_radarsat`) |
| **JAXA G-Portal** | JAXA | REST API | ALOS/PALSAR-2 (L-SAR), GCOM-C | Earth | JAXA Data Policy | Adapter ready (`src_jaxa_gportal`) |
| **CONABIO Geoportal** | CONABIO (Mexico) | Shapefile / WMS | Terrestrial Ecoregions & Protected Areas | Earth | Mexico Libre Uso | Fully integrated (`src_conabio_inegi`) |
| **INEGI Uso de Suelo** | INEGI (Mexico) | Vector / WFS | Serie VII Land Use & Vegetation (1:250k) | Earth | Mexico Libre Uso | Fully integrated (`src_conabio_inegi`) |
| **Protected Planet (WDPA)** | UNEP-WCMC / IUCN | REST API v4 | World Database on Protected Areas | Earth | Non-commercial Academic | Fully integrated (`src_protected_planet`) |
| **ESA WorldCover** | ESA Consortium | Cloud-Optimized GeoTIFF | 10m Global Land Cover Classification | Earth | CC BY 4.0 | Fully integrated (`src_esa_worldcover`) |
| **NASA SEDAC** | CIESIN Columbia Univ | REST API / GeoTIFF | Global Human Footprint & Anthropogenic Pressure | Earth | NASA Open Access | Fully integrated (`src_nasa_sedac`) |

---

## 2. Technical Access Details & Precautionary Protocols

### 2.1 NASA Planetary Data System (PDS) & LRO Diviner Note
- **Scientific Precaution (Mandatory Principle):** The Diviner Lunar Radiometer Experiment (DLRE) on LRO is primarily a mid-infrared radiometer designed to measure thermal brightness temperature, bolometric albedo, and silicate Christiansen Feature (CF) positions. **Diviner data is NOT treated as a direct substitute for a full mineralogical map.** In TerraAnalog, Diviner provides diurnal thermal amplitude and thermal inertia, while optical/spectroscopic mineral signatures for Mars are derived from MRO CRISM or in-situ spectrometers.
- **Access URL:** `https://pds-geosciences.wustl.edu/missions/lro/diviner.htm`

### 2.2 CSA RADARSAT & Synthetic Aperture Radar (SAR) Tutorial
- **SAR Integration:** C-band radar backscatter ($\sigma_0$) from RADARSAT-1 and the RADARSAT Constellation Mission (RCM) provides dielectric roughness and permafrost active layer monitoring in high-latitude analogs (e.g., Haughton Crater).
- **Technical Guidance:** Derived from the official CSA Synthetic Aperture Radar Tutorial: `https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial`.

### 2.3 UNEP-WCMC / IUCN Protected Planet (WDPA) & SDG Evaluation
- **Access Protocol:** The Protected Planet API v4 (`https://api.protectedplanet.net/v4`) requires an authorization token for live automated queries.
- **Handling in TerraAnalog:** Pre-cached geometric boundaries for core analog sites (El Pinacate, Atacama/Los Flamencos, Cuatro Ciénegas, Timanfaya) are embedded in the local persistence layer. When an API token is provided in `.env`, the adapter executes live bounding-polygon intersections.

### 2.4 CONABIO & INEGI (Mexico)
- **Scale and Authenticity:** Land use classes are derived from the official INEGI Serie VII cartography (scale 1:250,000) and CONABIO protected natural area layers, ensuring high-fidelity ecological classification of Mexican analog sites (Pinacate and Cuatro Ciénegas).
