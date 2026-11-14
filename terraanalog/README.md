# TerraAnalog — Planetary Analog Discovery & Scientific Validation Platform

> **Autonomous Multi-Functional Platform for Characterizing Terrestrial Analogs for Lunar and Martian Exploration using Open Earth & Planetary Data.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![NASA Space Apps Ready](https://img.shields.io/badge/NASA-Space_Apps_Challenge-orange.svg)](https://www.spaceappschallenge.org/)
[![SDG 13, 14, 15](https://img.shields.io/badge/UN_SDGs-13_|_14_|_15-green.svg)](https://sdgs.un.org/goals)
[![Architecture: Modular](https://img.shields.io/badge/Architecture-FastAPI_+_MapLibre-cyan.svg)](ARCHITECTURE.md)

---

## Executive Summary

Selecting future landing sites and base locations for lunar and Martian exploration (e.g., NASA Artemis, Mars Sample Return) demands comprehensive surface testing before flight. While terrestrial sites like the Atacama Desert, Haughton Crater, and El Pinacate share geological, topographical, and environmental traits with extraterrestrial bodies, these analogs have historically suffered from non-uniform characterization and lack of ecological safeguards.

**TerraAnalog** is an end-to-end geospatial and planetary data platform that ingests open data from NASA (Earthdata CMR, GIBS, PDS, LRO, MGS, MRO), ESA (Copernicus, WorldCover), CSA (RADARSAT), JAXA (G-Portal), CONABIO, INEGI, and Protected Planet (WDPA). It features:
1. **A Transparent Gaussian Similarity Engine** ($s_i = \exp(-0.5 (d_i / \tau_i)^2)$) measuring multi-dimensional physical congruence while tracking data coverage.
2. **An Ethical & Ecological Discard Module** evaluating environmental impact under UN Sustainable Development Goals (SDG 13: Climate Action, SDG 14: Life Below Water, SDG 15: Life on Land) with a persistent damage register.
3. **An AI Reverse Search Engine** translating natural language queries and mineralogical parameters into structured spatial filters.
4. **An Augmented Reality (AR) & 3D Terrain Simulator** with local East-North-Up (ENU) coordinates projection and field HUD telemetry.
5. **A Modern Scientific UI/UX** centered on a high-contrast interactive map.

---

## 8-Part Grading Rubric Alignment (100% Total)

| Criteria | Weight | How TerraAnalog Achieves Excellence |
|---|---|---|
| **01. Technological Innovation** | 12.5% | Multi-objective Gaussian similarity engine with data quality weighting, deterministic NLP reverse search, geodetic WGS84 to local ENU coordinate transformations for AR, and dual-body Moon/Mars matching. |
| **02. User Experience (UX/UI)** | 12.5% | Minimalist scientific dark-theme interface centered on an interactive map. Real-time dimensional radar charts, variable delta tables, color-coded status badges, and responsive drawers. |
| **03. Social Impact** | 12.5% | Ethical planetary testing framework preventing permanent ecological damage to Earth's biomes. Direct integration with Protected Planet (WDPA), ESA WorldCover, and CONABIO/INEGI with persistent damage event logging aligned with SDG 13, 14, and 15. |
| **04. Use of NASA Data** | 12.5% | Deep, accurate integration of NASA Earthdata CMR, GIBS Worldview tiles, and Planetary Data System (PDS) instruments (LRO Diviner, LRO LOLA, MGS MOLA, MRO CRISM, ASTER GDEM, SEDAC). |
| **05. Scientific Solution** | 12.5% | Transparent Gaussian kernel formulations ($s_i = \exp(-0.5 (d_i / \tau_i)^2)$), physical unit tolerances ($\tau_i$), data coverage thresholds, and strict separation between physical similarity, operational feasibility, and environmental risk. |
| **06. Creativity** | 12.5% | Blending space mission simulation with terrestrial biodiversity conservation, reverse AI search allowing geologists to input raw mineral assays, and simulated field AR telemetry. |
| **07. Art & Technology** | 12.5% | High-contrast cartography, real-time 3D Canvas terrain mesh rendering with interactive sun angles and rover path hazard overlays, and futuristic field HUD. |
| **08. Communication** | 12.5% | Complete documentation suite in English, detailed architectural diagrams, dataset citations, and transparent AI tool disclosure. |

---

## System Architecture

```text
┌───────────────────────────────────────────────────────────────────┐
│                    FRONTEND WEB WORKSTATION                       │
│ Interactive Map | Direct & Reverse AI | Inspector | AR Simulator │
└──────────────────────────────┬────────────────────────────────────┘
                               │ HTTP / JSON REST API
┌──────────────────────────────▼────────────────────────────────────┐
│                    API GATEWAY (/api/v1)                          │
│ Health | Catalog | Similarity | Reverse Search | Environment | AR │
└───────┬──────────────┬───────────────┬──────────────┬──────────────┘
        │              │               │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌──────▼───────┐ ┌──▼────────────┐
│ Data Sources │ │ Geospatial │ │ Mathematical │ │ Environment   │
│ Adapters     │ │ Transforms │ │ Similarity   │ │ & SDG Engine  │
│ (10 Sources) │ │ (WGS84->ENU│ │ Engine       │ │ (WDPA / ODS)  │
└───────┬──────┘ └─────┬──────┘ └──────┬───────┘ └──┬────────────┘
        │              │               │              │
┌───────▼──────────────▼───────────────▼──────────────▼────────────┐
│                    PERSISTENCE DATA LAYER                        │
│ 13 Relational Tables | GeoJSON Vectors | Zonal Stats | Audit Log  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Quickstart & Installation

TerraAnalog is designed for **instant, frictionless execution** with zero mandatory third-party software:

### Option A: Direct Standalone Launch (Browser)
Simply open the client-side workstation in any web browser:
```bash
# Double-click or open directly:
c:\Users\gocri\Downloads\ANTIGRAVITY\terraanalog\frontend\index.html
```
The embedded scientific engine, catalog, interactive map, reverse AI, and AR simulator run natively.

### Option B: Local REST API Server (Python)
Run the built-in HTTP server:
```bash
cd c:\Users\gocri\Downloads\ANTIGRAVITY\terraanalog
python -m app.server 8000
```
Navigate to: `http://127.0.0.1:8000`

---

## Running the Automated Test Suite

```bash
cd c:\Users\gocri\Downloads\ANTIGRAVITY\terraanalog
python tests/run_all_tests.py
```
Validates:
- Gaussian similarity exact matches, $1\tau$, and $2\tau$ limits.
- Missing variable handling without numerical distortion.
- Data coverage and `PROVISIONAL` classification thresholds.
- Reverse AI natural language intent extraction.
- Protected Planet WDPA alert and critical exclusion logic.
- Geodetic WGS84 to local ENU coordinate transformations.

---

## API Reference (`/api/v1`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health check and source statuses |
| `GET` | `/sources` | Catalog of all 10 open data providers |
| `GET` | `/targets` | Planetary profiles for Moon and Mars |
| `GET` | `/regions` | Terrestrial analog candidates with GeoJSON bounds |
| `GET` | `/regions/{id}` | Detailed candidate view with all physical measurements |
| `POST` | `/similarity/runs` | Execute Gaussian similarity run against a planetary target |
| `POST` | `/reverse-search` | Natural language and parameter-driven reverse search |
| `GET` | `/regions/{id}/environment` | Ecological and SDG 13/14/15 impact assessment |
| `POST` | `/environment/events` | Register new historical or preventive event in damage log |
| `GET` | `/environment/events` | Query persistent environmental damage history |
| `POST` | `/simulation/runs` | Execute hardware testing stress scenario (Rover, Thermal) |
| `GET` | `/ar/regions/{id}/scene` | Retrieve local ENU 3D AR Scene Data Contract |

---

## Documentation Suite

- [ARCHITECTURE.md](docs/ARCHITECTURE.md): Technical architecture, data flow, and database schema.
- [DATA_SOURCES.md](docs/DATA_SOURCES.md): Exhaustive catalog of all 10 open space and environmental data sources.
- [SCIENTIFIC_METHOD.md](docs/SCIENTIFIC_METHOD.md): Complete mathematical formulas, Gaussian tolerance parameters ($\tau_i$), and SDG evaluation framework.
- [GRADING_RUBRIC_EVALUATION.md](docs/GRADING_RUBRIC_EVALUATION.md): Self-evaluation matrix for all 8 grading criteria.
- [CITATIONS_AND_AI_DISCLOSURE.md](docs/CITATIONS_AND_AI_DISCLOSURE.md): Formal citations of scientific datasets and AI transparency disclosure.

---

*Developed for the NASA International Space Apps Challenge & Planetary Science Community.*
