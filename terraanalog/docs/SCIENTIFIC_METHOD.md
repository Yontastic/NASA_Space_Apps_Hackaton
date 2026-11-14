# TerraAnalog — Scientific Methodology & Mathematical Formulations

## 1. Principles of Scientific Rigor

TerraAnalog adheres to strict scientific guidelines to ensure reproducibility, traceability, and honesty in analog characterization:
1. **Zero Hallucination of Data:** Missing variables are never assigned zero or perfect similarity. They are tagged as `MISSING_DATA` and directly decrease the Data Coverage metric.
2. **Decoupling of Physical Similarity and Environmental Viability:** A terrestrial region may possess 95% physical congruence with a lunar crater rim while simultaneously being strictly off-limits due to UNESCO Biosphere or Ramsar Wetland status. These dimensions must never be conflated into a single opaque score.
3. **Calibrated Physical Tolerances ($\tau_i$):** Tolerances are defined in native physical units (degrees, Kelvin, mGal, wt%) based on planetary science literature.

---

## 2. Mathematical Similarity Formulation

### 2.1 Numerical Variables (Gaussian Similarity Kernel)
For any numerical continuous variable $i$ (e.g., surface slope, diurnal temperature amplitude, Bouguer gravity anomaly), the similarity $s_i \in [0, 1]$ is computed using a Gaussian kernel:

$$s_i = \exp\left(-0.5 \cdot \left(\frac{|v_{\text{earth}, i} - v_{\text{target}, i}|}{\tau_i}\right)^2\right)$$

Where:
- $v_{\text{earth}, i}$ is the measured terrestrial value.
- $v_{\text{target}, i}$ is the target planetary value (Moon or Mars).
- $d_i = |v_{\text{earth}, i} - v_{\text{target}, i}|$ is the absolute physical deviation.
- $\tau_i$ is the scientific tolerance threshold.

#### Calibration of Tolerance Parameters ($\tau_i$)
| Variable Key | Variable Name | Physical Unit | Scientific Tolerance $\tau_i$ | Scientific Rationale |
|---|---|---|---|---|
| `slope_mean` | Mean Topographic Slope | Degrees (°) | $4.0^\circ$ | Critical for rover traction and wheel slippage limits ($< 15^\circ$ safe). |
| `roughness` | Topographic Roughness Index | Dimensionless $[0, 1]$ | $0.20$ | Obstacle density for autonomous obstacle avoidance systems. |
| `elevation` | Elevation / Local Relief | Meters (m) | $1200.0\text{ m}$ | Local crater rim or caldera relief amplitude. |
| `temperature_diurnal_range` | Diurnal Surface Temp Range | Kelvin (K) | $35.0\text{ K}$ | Thermal fatigue on rover actuators and batteries. |
| `thermal_inertia` | Surface Thermal Inertia | $\text{J}\cdot\text{m}^{-2}\cdot\text{K}^{-1}\cdot\text{s}^{-1/2}$ | $110.0$ | Diagnostic of grain size (fine dust vs gravel vs solid bedrock). |
| `gravity_anomaly` | Bouguer Gravity Anomaly | mGal | $45.0\text{ mGal}$ | Subsurface density and crustal mass concentrations (mascons). |
| `magnetic_anomaly` | Crustal Magnetic Anomaly | NanoTesla (nT) | $150.0\text{ nT}$ | Local remanent crustal magnetization. |
| `radiation_flux` | Surface Cosmic/Gamma Radiation | $\text{mSv/year}$ | $1.5\text{ mSv/y}$ | Ambient ionizing background. |
| `iron_oxide_content` | Total Iron Oxide (FeO + Fe2O3) | Weight % ($\text{wt}\%$) | $4.5\text{ wt}\%$ | Diagnostic of mafic basalt vs weathered clay. |
| `silica_content` | Silica Concentration ($\text{SiO}_2$) | Weight % ($\text{wt}\%$) | $6.0\text{ wt}\%$ | Mafic vs felsic igneous differentiation. |
| `albedo` | Optical / Bolometric Albedo | Ratio $[0, 1]$ | $0.06$ | Surface reflectance and radiative balance. |

---

### 2.2 Categorical Lithology Compatibility Matrix
Geological lithology cannot be compared via arithmetic difference. TerraAnalog utilizes a calibrated compatibility matrix:

| Earth / Target Class | Basalt | Anorthosite | Impact Melt / Breccia | Clay / Clastic | Evaporite / Salar | Permafrost |
|---|---|---|---|---|---|---|
| **Basalt** | **1.00** | 0.65 | 0.80 | 0.30 | 0.20 | 0.25 |
| **Anorthosite** | 0.65 | **1.00** | 0.85 | 0.20 | 0.15 | 0.10 |
| **Impact Melt / Breccia** | 0.80 | 0.85 | **1.00** | 0.40 | 0.25 | 0.30 |
| **Clay / Clastic** | 0.30 | 0.20 | 0.40 | **1.00** | 0.60 | 0.35 |
| **Evaporite / Salar** | 0.20 | 0.15 | 0.25 | 0.60 | **1.00** | 0.45 |
| **Permafrost** | 0.25 | 0.10 | 0.30 | 0.35 | 0.45 | **1.00** |

---

### 2.3 Aggregate Physical Similarity Score
The composite Physical Similarity score is calculated as a quality-weighted average over all evaluated variables:

$$\text{Physical Similarity} = 100 \cdot \frac{\sum_{i \in \text{evaluated}} w_i \cdot q_i \cdot s_i}{\sum_{i \in \text{evaluated}} w_i \cdot q_i}$$

Where:
- $w_i > 0$ is the importance weight of variable $i$ ($\sum w_i = 1.0$).
- $q_i \in (0, 1]$ is the data quality/calibration index of the observation.

---

### 2.4 Data Coverage & Provisional Status
Data Coverage measures the completeness of the scientific characterization relative to all required features:

$$\text{Data Coverage} = 100 \cdot \frac{\sum_{i \in \text{evaluated}} w_i \cdot q_i}{\sum_{i \in \text{all features}} w_i}$$

**Classification Rules:**
- **High Match (Coincidencia Alta):** $\text{Physical Similarity} \ge 85.0\%$ and $\text{Coverage} \ge 60\%$.
- **Moderate Match (Coincidencia Considerable):** $70.0\% \le \text{Physical Similarity} < 85.0\%$ and $\text{Coverage} \ge 60\%$.
- **Partial Match (Coincidencia Parcial):** $50.0\% \le \text{Physical Similarity} < 70.0\%$ and $\text{Coverage} \ge 60\%$.
- **Low Match (Coincidencia Baja):** $\text{Physical Similarity} < 50.0\%$.
- **Provisional Classification:** If $\text{Data Coverage} < 60.0\%$, the candidate is marked as `PROVISIONAL` regardless of physical score.

---

## 3. Environmental & SDG Impact Evaluation Framework

TerraAnalog connects geospatial candidates with the United Nations Sustainable Development Goals:

- **SDG 13 (Climate Action):** Evaluates risk of permafrost degradation, disturbance of carbon-sequestering desert pavement, and logistics carbon footprint.
- **SDG 14 (Life Below Water):** Assesses hydrological runoff into coastal wetlands, endorheic saline lakes, and unique aquatic refugia (e.g., Cuatro Ciénegas stromatolites).
- **SDG 15 (Life on Land):** Spatial intersection with UNEP-WCMC WDPA protected polygons, IUCN protected categories (Ia to VI), fragile biological cryptobiotic soil crusts, and endemic desert biodiversity.

**Ecological Status Classes:**
1. `NO_DATA`: Insufficient biodiversity/protected area records.
2. `LOW_ALERT`: No immediate intersection with conservation polygons; standard leave-no-trace protocol applies.
3. `MEDIUM_ALERT`: Proximity to conservation buffer zones; permits and monitoring required.
4. `HIGH_ALERT`: Fragile pioneer ecological succession (e.g. Timanfaya lichens); strictly marked trails only.
5. `RESTRICTED_REVIEW`: Direct legal overlap with Biosphere Reserves or Ramsar Wetlands (e.g. Cuatro Ciénegas); motorized or drilling operations strictly prohibited without national authority permits.
