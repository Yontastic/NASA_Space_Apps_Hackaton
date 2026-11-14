# TerraAnalog — Citations & AI Tool Disclosure

## 1. Formal Scientific Citations

### Planetary Missions & Instruments (NASA / ESA)
1. **LRO Diviner Lunar Radiometer Experiment (DLRE):**
   - Paige, D. A., et al. (2010). *The Lunar Reconnaissance Orbiter Diviner Lunar Radiometer Experiment*. Space Science Reviews, 150(1-4), 125-160. DOI: [10.1007/s11214-009-9529-2](https://doi.org/10.1007/s11214-009-9529-2).
   - Dataset: PDS Geosciences Node `LRO-L-DLRE-4-GDR-V1.0`.
2. **LRO Lunar Orbiter Laser Altimeter (LOLA):**
   - Smith, D. E., et al. (2017). *Summary of the results from the Lunar Orbiter Laser Altimeter after seven years in lunar orbit*. Icarus, 283, 70-91. DOI: [10.1016/j.icarus.2016.06.006](https://doi.org/10.1016/j.icarus.2016.06.006).
   - Dataset: PDS Geosciences Node `LRO-L-LOLA-4-GDR-V1.0`.
3. **MGS Mars Orbiter Laser Altimeter (MOLA):**
   - Smith, D. E., et al. (1999). *The Global Topography of Mars and Implications for Surface Evolution*. Science, 284(5419), 1495-1503. DOI: [10.1126/science.284.5419.1495](https://doi.org/10.1126/science.284.5419.1495).
   - Dataset: PDS Geosciences Node `MGS-M-MOLA-3-PEDR-L2-V1.0`.
4. **MRO Compact Reconnaissance Imaging Spectrometer for Mars (CRISM):**
   - Murchie, S., et al. (2007). *Compact Reconnaissance Imaging Spectrometer for Mars (CRISM) on Mars Reconnaissance Orbiter (MRO)*. Journal of Geophysical Research: Planets, 112(E5). DOI: [10.1029/2006JE002682](https://doi.org/10.1029/2006JE002682).
   - Dataset: PDS Geosciences Node `MRO-M-CRISM-3-RDR-V1.0`.

### Terrestrial Earth Observation & Environmental Datasets
5. **ASTER Global Digital Elevation Model (GDEM):**
   - NASA/METI/AIST/Japan Spacesystems and U.S./Japan ASTER Science Team. (2019). *ASTER Global Digital Elevation Model V003*. Distributed by NASA EOSDIS Land Processes DAAC. DOI: [10.5067/ASTER/ASTGTM.003](https://doi.org/10.5067/ASTER/ASTGTM.003).
6. **ESA WorldCover 10m 2021:**
   - Zanaga, D., et al. (2022). *ESA WorldCover 10 m 2021 v200*. European Space Agency. DOI: [10.5281/zenodo.5571936](https://doi.org/10.5281/zenodo.5571936).
7. **UNEP-WCMC & IUCN Protected Planet (WDPA):**
   - UNEP-WCMC and IUCN. (2024). *Protected Planet: The World Database on Protected Areas (WDPA)*. Cambridge, UK: UNEP-WCMC and IUCN. Available at: [www.protectedplanet.net](https://www.protectedplanet.net).
8. **INEGI Uso del Suelo y Vegetación (Mexico):**
   - Instituto Nacional de Estadística y Geografía (INEGI). (2021). *Conjunto de datos vectoriales de la carta de Uso del Suelo y Vegetación, Serie VII (escala 1:250,000)*. Aguascalientes, México: INEGI.
9. **CONABIO Geoportal (Mexico):**
   - Comisión Nacional para el Conocimiento y Uso de la Biodiversidad (CONABIO). (2022). *Portal de Geoinformación: Sistema Nacional de Información sobre Biodiversidad (SNIB)*. Ciudad de México: CONABIO.

---

## 2. Artificial Intelligence (AI) Tool Disclosure

In compliance with the evaluation criteria (*08. Communication: AI tool disclosure*):

- **AI Assistants Utilized:** Google DeepMind Antigravity Agentic Assistant.
- **Scope of AI Assistance:**
  - Generating initial architectural scaffolding and REST API boilerplate code adhering to OpenAPI specifications.
  - Formulating and verifying Gaussian kernel tolerance thresholds based on published planetary science parameters.
  - Designing responsive CSS layouts for the scientific dark-theme user interface.
  - Authoring comprehensive unit and integration tests across data normalization and coordinate transformations.
- **Human Verification & Scientific Oversight:**
  - All mathematical equations, tolerance parameters ($\tau_i$), lithological compatibility matrix entries, and environmental SDG evaluation rules were independently formulated, mathematically verified, and tested for domain accuracy.
  - No synthetic data is falsely attributed to real sensor catalogs; all demonstrative values carry explicit `DEMO` and `is_demo=1` indicators.
