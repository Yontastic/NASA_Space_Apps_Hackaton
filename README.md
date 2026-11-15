# TerraAnalog — Planetary Analog Discovery, Rover Simulation & UN SDG Protection Engine

> **Interactive Geospatial & Scientific Validation Platform for Discovering Moon and Mars Terrestrial Analogs using 13 Official Open Space & Biodiversity Data Sources.**

## Live Interactive Demo

**[Launch TerraAnalog Live App](https://nasaspaceappshackaton-frontend.vercel.app/)** — No installation required; runs directly in any modern browser.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-0A84FF?style=for-the-badge&logo=vercel)](https://nasaspaceappshackaton-frontend.vercel.app/)
[![NASA Space Apps](https://img.shields.io/badge/NASA-Space_Apps_Challenge-orange?style=for-the-badge)](https://www.spaceappschallenge.org/)
[![UN SDGs](https://img.shields.io/badge/UN_SDGs-6_|_11_|_13_|_14_|_15-30D158?style=for-the-badge)](https://sdgs.un.org/goals)
[![Open Data](https://img.shields.io/badge/Open_Data-13_Official_Sources-cyan?style=for-the-badge)](#official-open-data-sources-13)

---

## Executive Summary

Preparing for lunar and Martian surface missions (**NASA Artemis**, **Mars Sample Return**, **ExoMars**) requires validating rovers, drills, and scientific instruments in terrestrial environments that reproduce extraterrestrial geology and climate. Historically, analog selection has lacked standardized real-time comparison and often overlooks the ecological fragility of Earth's protected biomes.

**TerraAnalog** addresses both challenges in a single interactive web workstation:

1. **Real-Time Multi-Dimensional Planetary Matching**: Scores terrestrial analog sites against real NASA Moon and Mars landing targets using a transparent Gaussian similarity model.
2. **Preventive Ecological & UN SDG Safeguards**: Surfaces high-visibility **UN SDG (6, 11, 13, 14, 15)**, **WDPA / Ramsar**, and **endemic species impact alerts** before approving field rover tests.
3. **Dossier 3D Rover Traverse Simulator with Dynamic Biomes**: Simulates a 600-meter rover traverse with live physics telemetry rendered across **site-specific biomes**.

---

## Platform Interface & Key Features

### Mission Control Navigation Bar
Switch effortlessly between **Moon** and **Mars** targets, open GIS data sources, track your **Mission Readiness Checklist (`1/5`–`5/5`)**, inspect scientific methodology, launch the guided tour, or open **Dossier 3D**.

![Mission Control Header](images/navbar.png)

### 1. Interactive 3D Planetary Globe (100% Uniform Illumination)
Explore Earth, the Moon, and Mars on a smooth 3D globe with full 360° illumination (no dark night-side occlusion), atmospheric glow, and a collapsible site HUD that keeps the map unobstructed.

![3D Globe View](images/globe-3d.jpg)

### 2. Dual-Body 2D Exploration (Moon & Mars Mosaics)
Inspect official NASA orbital mosaics (*LRO WAC* & *Viking MDIM 2.1*), select real landing targets (*Shackleton Crater Rim, Mare Tranquillitatis, Oceanus Procellarum, Jezero Crater*), and jump directly to their best terrestrial analogs.

![Moon 2D Surface View](images/moon-2d.jpg)

### 3. Dossier 3D: Rover Traverse Simulator with Dynamic Biomes
Run a physics-based 600 m rover traverse across site-specific biomes (e.g., *Arctic Impact Breccia Highlands*, *Gypsum Wetland Basin*, *Volcanic Basalt*) while monitoring live distance, speed, tilt, wheel slip, battery, surface temperature, and friction $\mu$.

![Dossier 3D Rover Simulator](images/dossier-3d.png)

### 4. Compact Environmental & UN SDG Impact Alerts
Every selected site surfaces a collapsible HUD card showing match percentage, slope/roughness, traction, WDPA status, official UN SDG pills, endangered species at risk, and direct rover-impact warnings.

![Compact UN SDG Alert HUD](images/hud-sdg.png)

### 5. Reactive Quantitative Filters & Live Analog Ranking
Apply NASA fast-discard thresholds with one click or fine-tune NDVI, liquid water exclusion, slope, roughness, and thermal swing. Every adjustment recalculates match percentages and re-ranks all terrestrial analogs in real time.

| Quantitative Filters & Scoring | Live Terrestrial Analogs Ranking |
| :---: | :---: |
| ![Filters and Scoring](images/filters.png) | ![Terrestrial Analogs Ranking](images/ranking.png) |

### 6. Interactive 4-Step Guided Tour & Target Audience
Built to be intuitive from the first click, the walkthrough introduces TerraAnalog's core workflow and target users: **Space Mission Planners**, **Planetary Scientists**, **Environmental Agencies**, and **Students & Educators**.

| Step 1: Mission & Audience | Step 2: Planetary Targets | Step 3: UN SDG Protection |
| :---: | :---: | :---: |
| ![Tour Step 1](images/tour-1.png) | ![Tour Step 2](images/tour-2.png) | ![Tour Step 3](images/tour-3.png) |

---

## Official Open Data Sources (13)

TerraAnalog integrates and cites 13 open scientific datasets across four categories (accessible inside the app's **Methodology** and **Data Sources** modals):

### 1. NASA Earth Observation
- **NASA Earthdata Search** ([search.earthdata.nasa.gov](https://search.earthdata.nasa.gov/)) — SRTM/ASTER elevation, MODIS NDVI, and surface parameters.
- **NASA Worldview** ([worldview.earthdata.nasa.gov](https://worldview.earthdata.nasa.gov/)) — Multi-temporal Earth satellite imagery validation.
- **NASA SEDAC** ([earthdata.nasa.gov/centers/sedac-daac](https://www.earthdata.nasa.gov/centers/sedac-daac/map-gallery)) — Human footprint and socioeconomic sustainability layers.

### 2. NASA Moon & Mars Planetary Data
- **NASA Planetary Data System (PDS)** ([pds.nasa.gov](https://pds.nasa.gov/)) — Lunar and Martian topography and mineralogy benchmarks.
- **LRO Geosciences Node** ([pds-geosciences.wustl.edu/missions/lro](https://pds-geosciences.wustl.edu/missions/lro/)) — LOLA lunar elevation and slope profiles.
- **LRO Diviner Lunar Radiometer** ([pds-geosciences.wustl.edu/missions/lro/diviner.htm](https://pds-geosciences.wustl.edu/missions/lro/diviner.htm)) — Thermal swing and polar cold-trap temperature data.

### 3. International Space Agencies
- **ESA Copernicus Data Space** ([dataspace.copernicus.eu](https://dataspace.copernicus.eu/)) — Sentinel-1 SAR roughness and Sentinel-2 multispectral indices.
- **CSA RADARSAT Constellation Mission (RCM)** ([donnees-data.asc-csa.gc.ca](https://donnees-data.asc-csa.gc.ca/en/dataset/rcm)) — C-band SAR surface roughness and Arctic analog monitoring.
- **JAXA G-Portal** ([gportal.jaxa.jp](https://gportal.jaxa.jp/gpr/index/index)) — ALOS World 3D global DEM and moisture datasets.

### 4. Biodiversity, Land Cover & UN SDG Protection
- **Protected Planet (WDPA)** ([protectedplanet.net](https://www.protectedplanet.net/en/data/wdpca)) — Global protected areas and Ramsar zones for SDG 15/14/6 alerts.
- **ESA WorldCover** ([esa-worldcover.org](https://esa-worldcover.org/en/data-access)) — 10 m global land-cover classification.
- **CONABIO Geoportal** ([conabio.gob.mx/informacion/gis](http://www.conabio.gob.mx/informacion/gis/)) — Endemic species and fragile Mexican ecosystems (e.g., Cuatro Ciénegas).
- **INEGI Land Use & Vegetation** ([inegi.org.mx/programas/usyv](https://www.inegi.org.mx/programas/usyv/)) — High-resolution Mexican soil and vegetation cartography.

---

## How to Run Locally (Optional)

You can use the **[Live Vercel Deployment](https://nasaspaceappshackaton-frontend.vercel.app/)** directly without installing anything. To run locally:

```bash
git clone [https://github.com/Yontastic/NASA_Space_Apps_Hackaton.git](https://github.com/Yontastic/NASA_Space_Apps_Hackaton.git)
cd NASA_Space_Apps_Hackaton/terraanalog/frontend
python -m http.server 8000
```

Then open `http://127.0.0.1:8000` in your browser.

---

## Project Structure

- `terraanalog/frontend/` — Production web application (deployed on Vercel).
- `terraanalog/app/` — Modular Python backend, similarity engine, and data source adapters.
- `terraanalog/tests/` — Automated validation test suite (`python tests/run_all_tests.py`).
- `terraanalog/docs/` — Technical architecture, mathematical methodology, and scientific citations.

---

*Built for the NASA International Space Apps Challenge.*
