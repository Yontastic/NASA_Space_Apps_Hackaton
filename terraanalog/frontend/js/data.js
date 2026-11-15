/* =========================================================================
 * TerraAnalog - Curated datasets, planetary targets, UN SDGs & biome metadata
 * All user-facing text is technical English.
 * Site attributes are curated reference values compiled from the public
 * datasets listed in TA.dataSources; they are embedded, not queried live.
 * ========================================================================= */
window.TA = window.TA || {};

// --- UN Sustainable Development Goals (SDG) reference catalog -----------------
TA.sdgCatalog = {
  "SDG 6":  { code: "SDG 6",  name: "Clean Water & Sanitation", color: "#26BDE2", short: "SDG 6 Clean Water" },
  "SDG 11": { code: "SDG 11", name: "Geo-Heritage & Cultural Sites", color: "#FD9D24", short: "SDG 11 Geo-Heritage" },
  "SDG 13": { code: "SDG 13", name: "Climate Action & Cryosphere", color: "#3F7E44", short: "SDG 13 Climate Action" },
  "SDG 14": { code: "SDG 14", name: "Life Below Water & Aquatic Systems", color: "#0A97D9", short: "SDG 14 Life Below Water" },
  "SDG 15": { code: "SDG 15", name: "Life on Land & Fragile Ecosystems", color: "#56C02B", short: "SDG 15 Life on Land" }
};

// --- Biome visual metadata for the Dossier 3D Rover Simulation -----------------
TA.biomes = {
  arid_desert:     { id: "arid_desert",     label: "Hyper-Arid Regolith Desert" },
  volcanic_basalt: { id: "volcanic_basalt", label: "Volcanic Basalt & Lava Plains" },
  polar_ice:       { id: "polar_ice",       label: "Polar Ice & Permafrost Tundra" },
  gypsum_wetland:  { id: "gypsum_wetland",  label: "Gypsum Wetland & Thermal Basin" },
  salt_flat:       { id: "salt_flat",       label: "Evaporite Salt Flat (Salar)" },
  alpine_rock:     { id: "alpine_rock",     label: "Shocked Breccia & Crater Highlands" }
};

// --- Earth analog candidates -------------------------------------------------
// alertType: "high" = strictly protected / treaty area, "medium" = managed reserve, "low" = open terrain
TA.sites = [
  {
    id: 1, name: "Atacama Desert (Yungay Core)", country: "Chile", env: "Desert", envLabel: "Hyper-arid desert",
    biome: "arid_desert", biomeLabel: "Hyper-Arid Regolith Desert",
    lat: -24.08, lon: -69.95, elevation: 1200, slope: 4.2, roughness: 0.58, ndvi: 0.02, liquidWater: false,
    thermalAmplitude: 28, relativeHumidity: 8, lithology: "evaporite_salar",
    minerals: ["Halite", "Anhydrite", "Perchlorates", "Smectite"], coverage: 100,
    alertType: "high", alertLabel: "SDG 15 Microbial Reserve", protectedName: "Yungay Hyper-Arid Microbial Core Protection Zone",
    sdgs: ["SDG 15", "SDG 13"],
    ecosystem: "Hyper-arid oxidized regolith & endolithic evaporite crust",
    vulnerableSpecies: "Cryptoendolithic halophilic cyanobacteria & ancient desert varnish communities",
    roverImpact: "Rover wheel tracks permanently crush million-year-old halite nodules and subsurface microbial refugia that take centuries to recover.",
    desc: "Driest non-polar desert on Earth. Priority Mars analog (Viking, Curiosity, Perseverance) with oxidized soil and perchlorates."
  },
  {
    id: 2, name: "Timanfaya Volcanic Field (Lanzarote)", country: "Spain", env: "Volcanic", envLabel: "Volcanic field",
    biome: "volcanic_basalt", biomeLabel: "Volcanic Basalt & Lava Plains",
    lat: 29.02, lon: -13.73, elevation: 320, slope: 6.2, roughness: 0.88, ndvi: 0.04, liquidWater: false,
    thermalAmplitude: 14, relativeHumidity: 42, lithology: "basalt_volcanic",
    minerals: ["Tholeiitic Basalt", "Olivine", "Pyroxene", "Titanomagnetite"], coverage: 100,
    alertType: "high", alertLabel: "UNESCO Biosphere & National Park", protectedName: "Timanfaya National Park (WDPA / UNESCO Biosphere)",
    sdgs: ["SDG 15", "SDG 11"],
    ecosystem: "Young basaltic malpais lava flows & subterranean volcanic tubes",
    vulnerableSpecies: "Pioneer saxicolous lichens (Stereocaulon vesuvianum) & blind lava-tube crustacea (Munidopsis polymorpha)",
    roverImpact: "Off-trail rover traffic fractures fragile pahoehoe glass crusts and collapses shallow lava-tube roofs.",
    desc: "Pristine basaltic malpais and intact lava tubes. Used for ESA PANGAEA astronaut geology training."
  },
  {
    id: 3, name: "Haughton Impact Crater (Devon Island)", country: "Canada", env: "Crater", envLabel: "Impact crater",
    biome: "alpine_rock", biomeLabel: "Arctic Impact Breccia Highlands",
    lat: 75.38, lon: -89.68, elevation: 220, slope: 12.1, roughness: 0.62, ndvi: 0.05, liquidWater: false,
    thermalAmplitude: 18, relativeHumidity: 25, lithology: "impact_crater",
    minerals: ["Impact Melt Breccia", "Shatter Cones", "Dolomite", "Shocked Quartz"], coverage: 95,
    alertType: "low", alertLabel: "Managed Arctic Research Zone", protectedName: "Devon Island Polar Research Corridor",
    sdgs: ["SDG 13", "SDG 15"],
    ecosystem: "High Arctic polar desert & impact-shocked carbonate breccia",
    vulnerableSpecies: "Endolithic shocked-gneiss microbial colonies & High Arctic Peary caribou seasonal habitat",
    roverImpact: "Low biological footprint on barren breccia, but repeated heavy traverses can trigger active-layer permafrost rutting.",
    desc: "23 km impact structure in the High Arctic polar desert. Home of the NASA Haughton-Mars Project (permafrost drilling)."
  },
  {
    id: 4, name: "Askja & Holuhraun Caldera", country: "Iceland", env: "Volcanic", envLabel: "Volcanic caldera",
    biome: "volcanic_basalt", biomeLabel: "Subpolar Basalt & Ash Plains",
    lat: 65.03, lon: -16.75, elevation: 1100, slope: 7.2, roughness: 0.78, ndvi: 0.03, liquidWater: false,
    thermalAmplitude: 14, relativeHumidity: 55, lithology: "basalt_volcanic",
    minerals: ["Tholeiitic Basalt", "Palagonite", "Plagioclase", "Pyroxene"], coverage: 95,
    alertType: "high", alertLabel: "National Park (WDPA)", protectedName: "Vatnajokull National Park (UNESCO World Heritage)",
    sdgs: ["SDG 15", "SDG 13"],
    ecosystem: "Highland basaltic tephra plains & volcano-glacier margin",
    vulnerableSpecies: "Sub-arctic moss carpets (Racomitrium lanuginosum) & geothermal extremophile mats",
    roverImpact: "Wheel shear tears fragile highland moss mats and leaves permanent ruts in loose pumice and palagonite ash.",
    desc: "Historic Apollo-era (1965, 1967) lunar training site with vast basalt plains."
  },
  {
    id: 5, name: "McMurdo Dry Valleys", country: "Antarctica", env: "Polar", envLabel: "Polar desert",
    biome: "polar_ice", biomeLabel: "Antarctic Dry Permafrost Valley",
    lat: -77.5, lon: 162.5, elevation: 950, slope: 8.5, roughness: 0.65, ndvi: 0.01, liquidWater: false,
    thermalAmplitude: 24, relativeHumidity: 10, lithology: "polar_ice",
    minerals: ["Dolerite", "Dry Permafrost Ice", "Halite", "Granite Regolith"], coverage: 100,
    alertType: "high", alertLabel: "Antarctic Treaty (ASMA 2)", protectedName: "McMurdo Dry Valleys ASMA No. 2 (Strict Treaty Zone)",
    sdgs: ["SDG 13", "SDG 15"],
    ecosystem: "Cold hyper-arid polar desert pavement & cryo-permafrost",
    vulnerableSpecies: "Endemic soil nematodes (Scottnema lindsayae) & cryptoendolithic sandstone lichens",
    roverImpact: "Single vehicle passes disturb desert pavements that took >10,000 years to stabilize and contaminate pristine cryo-soils.",
    desc: "Cold hyper-arid polar desert with continuous permafrost and desert pavement; analog of the Martian polar terrains."
  },
  {
    id: 6, name: "El Pinacate Volcanic Field", country: "Mexico", env: "Volcanic", envLabel: "Volcanic field",
    biome: "volcanic_basalt", biomeLabel: "Arid Maar Crater & Basalt Shield",
    lat: 31.77, lon: -113.5, elevation: 850, slope: 5.5, roughness: 0.72, ndvi: 0.07, liquidWater: false,
    thermalAmplitude: 26, relativeHumidity: 14, lithology: "basalt_volcanic",
    minerals: ["Vesicular Basalt", "Olivine Xenoliths", "Ilmenite", "Magnetite"], coverage: 100,
    alertType: "high", alertLabel: "UNESCO Biosphere Reserve", protectedName: "El Pinacate and Gran Desierto de Altar Biosphere Reserve",
    sdgs: ["SDG 15", "SDG 11"],
    ecosystem: "Sonoran volcanic cinder cones, maar craters & desert pavement",
    vulnerableSpecies: "Endangered Sonoran pronghorn (Antilocapra americana sonoriensis) & desert tortoise",
    roverImpact: "Mechanical traverses compact volcanic ash rims and fragment micro-habitats around maar crater floors.",
    desc: "Apollo astronaut lunar training site. Over 400 basaltic cinder cones and ten maar-type phreatomagmatic craters."
  },
  {
    id: 7, name: "Craters of the Moon (Great Rift)", country: "United States", env: "Lava_Tube", envLabel: "Lava tubes",
    biome: "volcanic_basalt", biomeLabel: "Rift Basalt & Lava Tube Field",
    lat: 43.46, lon: -113.56, elevation: 1800, slope: 4.8, roughness: 0.84, ndvi: 0.06, liquidWater: false,
    thermalAmplitude: 24, relativeHumidity: 22, lithology: "basalt_volcanic",
    minerals: ["Ferrobasalt", "Pahoehoe Glass", "Plagioclase", "Pyroxene"], coverage: 100,
    alertType: "low", alertLabel: "Designated Research Zone", protectedName: "Great Rift Basalt Field",
    sdgs: ["SDG 15", "SDG 11"],
    ecosystem: "Fissure basalt flows, kipuka islands & subsurface lava tubes",
    vulnerableSpecies: "Townsend's big-eared bat hibernacula & untouched kipuka native bunchgrasses",
    roverImpact: "Low risk on designated basalt testbeds; avoid thin lava-tube skylights and isolated kipuka vegetation islands.",
    desc: "Vast basaltic plain along Idaho's Great Rift with pahoehoe flows and intact subsurface lava tubes."
  },
  {
    id: 8, name: "Wadi Rum Desert", country: "Jordan", env: "Desert", envLabel: "Sandstone desert",
    biome: "arid_desert", biomeLabel: "Iron-Oxide Sandstone & Red Dunes",
    lat: 29.57, lon: 35.42, elevation: 970, slope: 8.5, roughness: 0.45, ndvi: 0.04, liquidWater: false,
    thermalAmplitude: 22, relativeHumidity: 15, lithology: "sandstone_quartz",
    minerals: ["Quartz Sandstone", "Granite", "Iron Oxide Coatings"], coverage: 100,
    alertType: "medium", alertLabel: "UNESCO Protected Area", protectedName: "Wadi Rum Protected Area (UNESCO World Heritage)",
    sdgs: ["SDG 15", "SDG 11"],
    ecosystem: "Iron-oxide quartz sandstone canyons & aeolian red dune corridors",
    vulnerableSpecies: "Arabian sand cat (Felis margarita), Sinai agama & Nabataean petroglyph rock surfaces",
    roverImpact: "Moderate impact: rover testing must remain on established valley tracks to avoid biological soil crusts and heritage rock art.",
    desc: "Sandstone and granite valley stained by iron oxides with red dunes. Predominantly quartz sand."
  },
  {
    id: 9, name: "Pilbara Craton (Dresser Formation)", country: "Australia", env: "Crater", envLabel: "Archean craton",
    biome: "alpine_rock", biomeLabel: "Archean Banded-Iron Bedrock",
    lat: -21.15, lon: 119.38, elevation: 380, slope: 6.5, roughness: 0.52, ndvi: 0.08, liquidWater: false,
    thermalAmplitude: 20, relativeHumidity: 18, lithology: "basalt_volcanic",
    minerals: ["Banded Iron Formation", "Hematite", "Barite", "Basalt"], coverage: 100,
    alertType: "high", alertLabel: "Geo-Heritage Reserve", protectedName: "Dresser Formation 3.5 Ga Stromatolite Geo-Heritage Zone",
    sdgs: ["SDG 11", "SDG 15"],
    ecosystem: "Archean hydrothermal chert-barite ridges & spinifex arid steppe",
    vulnerableSpecies: "3.48-billion-year-old fossil stromatolite outcrops & Northern quoll (Dasyurus hallucatus)",
    roverImpact: "High geo-heritage risk: wheel abrasion or coring on exposed Archean chert beds irreversibly destroys Earth's oldest biosignatures.",
    desc: "3.5 Ga Archean crust with fossil stromatolites and banded iron formations. Analog of Noachian Martian bedrock."
  },
  {
    id: 10, name: "Kilauea Lava Fields", country: "United States", env: "Volcanic", envLabel: "Active volcano",
    biome: "volcanic_basalt", biomeLabel: "Active Shield Volcano Basalt",
    lat: 19.41, lon: -155.28, elevation: 1050, slope: 4.5, roughness: 0.85, ndvi: 0.05, liquidWater: false,
    thermalAmplitude: 8, relativeHumidity: 72, lithology: "basalt_volcanic",
    minerals: ["Tholeiitic Basalt", "Olivine", "Pyroxene", "Ilmenite"], coverage: 100,
    alertType: "high", alertLabel: "National Park (UNESCO)", protectedName: "Hawaii Volcanoes National Park (WDPA)",
    sdgs: ["SDG 15", "SDG 11"],
    ecosystem: "Active tholeiitic shield basalt & fumarolic tephra flats",
    vulnerableSpecies: "Hawaiian petrel ('ua'u) ground burrows, nene goose & endemic lava-tube crickets",
    roverImpact: "Rover vibrations and wheel loads can collapse thin shelly pahoehoe voids and disturb endangered ground-nesting seabirds.",
    desc: "Active shield volcano with fresh pahoehoe and a'a flows and lava tubes. High maritime humidity from trade winds."
  },
  {
    id: 11, name: "Svalbard Permafrost", country: "Norway", env: "Polar", envLabel: "Arctic permafrost",
    biome: "polar_ice", biomeLabel: "High-Arctic Permafrost & Pingo Plain",
    lat: 78.23, lon: 15.63, elevation: 450, slope: 9.2, roughness: 0.56, ndvi: 0.09, liquidWater: false,
    thermalAmplitude: 15, relativeHumidity: 48, lithology: "polar_ice",
    minerals: ["Cryogenic Regolith", "Shale Breccia", "Permafrost Ice"], coverage: 90,
    alertType: "high", alertLabel: "Arctic Environmental Act", protectedName: "Svalbard Strict Nature Reserves (WDPA)",
    sdgs: ["SDG 13", "SDG 15"],
    ecosystem: "Continuous High Arctic permafrost, ice-wedge polygons & tundra",
    vulnerableSpecies: "Svalbard reindeer, Arctic fox & cryogenic permafrost microbial communities",
    roverImpact: "Summer traverses across thawed active layers carve deep thermokarst trenches that accelerate local permafrost melting.",
    desc: "High Arctic permafrost with active ground ice, patterned ground and cryogenic sublimation dynamics."
  },
  {
    id: 12, name: "Qaidam Basin (Yardang Fields)", country: "China", env: "Desert", envLabel: "Yardang playa",
    biome: "arid_desert", biomeLabel: "High-Altitude Yardang & Salt Desert",
    lat: 37.85, lon: 93.65, elevation: 2800, slope: 5.8, roughness: 0.64, ndvi: 0.02, liquidWater: false,
    thermalAmplitude: 26, relativeHumidity: 12, lithology: "evaporite_salar",
    minerals: ["Halite", "Gypsum", "Perchlorates", "Smectite Clays"], coverage: 100,
    alertType: "medium", alertLabel: "Managed Geological Park", protectedName: "Qaidam Yardang National Geopark",
    sdgs: ["SDG 15", "SDG 13"],
    ecosystem: "Hyper-arid alpine playa & wind-sculpted lacustrine yardangs",
    vulnerableSpecies: "Halophilic archaea in subsurface brines & fragile aeolian mudstone yardang ridges",
    roverImpact: "Moderate risk: wide inter-yardang corridors tolerate rover traffic, but climbing yardang flanks causes rapid wind-erosion scarring.",
    desc: "Hyper-arid salar plateau at 2,800 m with aeolian yardang fields, perchlorate salts and smectite clays."
  },
  {
    id: 13, name: "Danakil Depression (Dallol)", country: "Ethiopia", env: "Volcanic", envLabel: "Extreme hydrothermal",
    biome: "salt_flat", biomeLabel: "Hyper-Acidic Hydrothermal Salt Flat",
    lat: 14.24, lon: 40.3, elevation: -125, slope: 3.8, roughness: 0.48, ndvi: 0.01, liquidWater: false,
    thermalAmplitude: 22, relativeHumidity: 18, lithology: "evaporite_salar",
    minerals: ["Halite", "Sylvite", "Native Sulfur", "Iron Chlorides"], coverage: 85,
    alertType: "high", alertLabel: "Fragile Hydrothermal Zone", protectedName: "Dallol Crater Hydrothermal Field",
    sdgs: ["SDG 6", "SDG 15"],
    ecosystem: "Sub-sea-level hyper-acidic (pH < 0) brine springs & sulfur terraces",
    vulnerableSpecies: "Polyextremophile nano-archaea & delicate halite-sylvite geyser sinter cones",
    roverImpact: "Severe hazard to both ecosystem and rover: thin salt crusts overhang boiling acidic brines and shatter under wheel load.",
    desc: "Depression at -125 m with hyper-acidic hydrothermal pools (pH < 0) and sulfur vents; analog of early Mars springs."
  },
  {
    id: 14, name: "Death Valley (Badwater Basin)", country: "United States", env: "Desert", envLabel: "Hyper-arid basin",
    biome: "salt_flat", biomeLabel: "Polygonal Evaporite Salt Basin",
    lat: 36.24, lon: -116.82, elevation: -60, slope: 5.0, roughness: 0.42, ndvi: 0.03, liquidWater: false,
    thermalAmplitude: 24, relativeHumidity: 10, lithology: "evaporite_salar",
    minerals: ["Halite Polygons", "Basaltic Tephra", "Borates", "Clay Mudstone"], coverage: 100,
    alertType: "medium", alertLabel: "National Park (WDPA)", protectedName: "Death Valley National Park (Wilderness Buffer)",
    sdgs: ["SDG 15", "SDG 6"],
    ecosystem: "Tectonic salt pan, polygonal halite crust & desert alluvial fans",
    vulnerableSpecies: "Endemic Badwater snail (Assiminea infima) & Devils Hole pupfish aquifer system",
    roverImpact: "Driving directly on polygonal salt ridges crushes pressure-ridge micro-relief; tests require permitted alluvial gravel flats.",
    desc: "Hyper-arid tectonic trough with alluvial fans, the Ubehebe maar crater and polygonal salt crusts."
  },
  {
    id: 15, name: "Namib Skeleton Coast", country: "Namibia", env: "Desert", envLabel: "Coastal dunes",
    biome: "arid_desert", biomeLabel: "Coastal Quartz Dune & Fog Desert",
    lat: -20.45, lon: 13.85, elevation: 320, slope: 6.0, roughness: 0.22, ndvi: 0.03, liquidWater: false,
    thermalAmplitude: 18, relativeHumidity: 38, lithology: "sandstone_quartz",
    minerals: ["Quartz Dune Sand", "Garnet", "Heavy Minerals"], coverage: 95,
    alertType: "high", alertLabel: "UNESCO World Heritage", protectedName: "Namib Sand Sea & Skeleton Coast National Park",
    sdgs: ["SDG 15", "SDG 14"],
    ecosystem: "Fog-fed coastal quartz dunes & gravel plains",
    vulnerableSpecies: "Welwitschia mirabilis (living fossil plant), fog-basking beetles & Damara tern colonies",
    roverImpact: "Off-road rover tracks on gravel plains destroy water-harvesting lichen fields and compact Welwitschia root zones.",
    desc: "Coastal desert with mobile quartz dunes and marine fog. Wind-rounded terrain with low fine-scale roughness."
  },
  {
    id: 16, name: "Salar de Uyuni", country: "Bolivia", env: "Salar", envLabel: "Altiplano salt flat",
    biome: "salt_flat", biomeLabel: "Altiplano Evaporite Salt Crust",
    lat: -20.13, lon: -67.49, elevation: 3656, slope: 0.8, roughness: 0.12, ndvi: 0.01, liquidWater: false,
    thermalAmplitude: 24, relativeHumidity: 16, lithology: "evaporite_salar",
    minerals: ["Halite", "Lithium Sulfate", "Ulexite", "Gypsum"], coverage: 100,
    alertType: "medium", alertLabel: "Andean Fauna Buffer", protectedName: "Eduardo Avaroa Andean Fauna Reserve Buffer",
    sdgs: ["SDG 6", "SDG 15"],
    ecosystem: "High-altitude lithium-halite evaporite crust & peripheral brine lagoons",
    vulnerableSpecies: "James's & Andean flamingos (Phoenicoparrus jamesi) nesting islands & halophilic brine microbiota",
    roverImpact: "Dry central halite crust supports vehicle weight, but brine margins and giant-cactus islands are ecologically sensitive.",
    desc: "Largest continuous salt flat on Earth at 3,656 m. Hyper-flat evaporite crust used for satellite altimetry calibration."
  },
  {
    id: 17, name: "Richat Structure (Eye of the Sahara)", country: "Mauritania", env: "Crater", envLabel: "Circular dome",
    biome: "arid_desert", biomeLabel: "Concentric Eroded Quartzite Dome",
    lat: 21.13, lon: -11.4, elevation: 400, slope: 5.4, roughness: 0.55, ndvi: 0.04, liquidWater: false,
    thermalAmplitude: 22, relativeHumidity: 12, lithology: "basalt_volcanic",
    minerals: ["Carbonatite", "Kimberlite", "Alkaline Basalt", "Rhyolite"], coverage: 100,
    alertType: "low", alertLabel: "IUGS Geo-Heritage Site", protectedName: "Richat IUGS First 100 Geological Heritage Site",
    sdgs: ["SDG 11", "SDG 15"],
    ecosystem: "Hyper-arid concentric quartzite dykes & Saharan regolith",
    vulnerableSpecies: "Sparse Acacia tortilis wadi corridors & Acheulean stone-tool archaeological horizons",
    roverImpact: "Low ecological risk across barren quartzite rings; pre-traverse survey required to avoid surface Paleolithic artifacts.",
    desc: "40 km circular alkaline dome; structural analog of concentric impact basins on the Moon and Mars."
  },
  {
    id: 18, name: "Cuatro Cienegas Basin", country: "Mexico", env: "Salar", envLabel: "Springs & gypsum",
    biome: "gypsum_wetland", biomeLabel: "Gypsum Wetland Basin & Thermal Pools",
    lat: 26.98, lon: -102.05, elevation: 740, slope: 2.5, roughness: 0.25, ndvi: 0.18, liquidWater: true,
    thermalAmplitude: 18, relativeHumidity: 28, lithology: "evaporite_salar",
    minerals: ["Gypsum Dunes", "Travertine", "Carbonates"], coverage: 95,
    alertType: "high", alertLabel: "Ramsar Wetland & UNESCO", protectedName: "Cuatro Cienegas Flora & Fauna Protection Area (Ramsar / WDPA)",
    sdgs: ["SDG 15", "SDG 6", "SDG 14"],
    ecosystem: "Endorheic gypsum dunes, thermal karst springs (pozas) & living microbialites",
    vulnerableSpecies: "Living Precambrian-type stromatolites, endemic Cuatro Cienegas pupfish (Cyprinodon atrorus) & box turtle (Terrapene coahuila)",
    roverImpact: "CRITICAL: Heavy rover wheels fracture thin travertine spring rims, silt up thermal pozas, and crush living stromatolite mats.",
    desc: "Gypsum dunes and living springs with microbial stromatolites; astrobiological analog of Martian paleolakes."
  },
  {
    id: 19, name: "Rio Tinto Basin", country: "Spain", env: "Desert", envLabel: "Acidic mineral river",
    biome: "arid_desert", biomeLabel: "Acidic Jarosite & Ferric River Terrace",
    lat: 37.69, lon: -6.56, elevation: 430, slope: 7.8, roughness: 0.38, ndvi: 0.22, liquidWater: true,
    thermalAmplitude: 14, relativeHumidity: 52, lithology: "evaporite_salar",
    minerals: ["Jarosite", "Goethite", "Hematite", "Pyrite"], coverage: 100,
    alertType: "medium", alertLabel: "Protected Mining Landscape", protectedName: "Rio Tinto Protected Landscape (Andalusia)",
    sdgs: ["SDG 6", "SDG 15", "SDG 14"],
    ecosystem: "Hyper-acidic (pH 2.2) iron-sulfate river terraces & gossan outcrops",
    vulnerableSpecies: "Chemolithoautotrophic acidophile biofilms (Acidithiobacillus ferrooxidans) & fragile jarosite evaporite terraces",
    roverImpact: "Rover wheels must avoid crossing active acidic stream beds to prevent ferric sediment plumes and corrosion of chassis seals.",
    desc: "Iron-rich acidic river basin (pH 2) with extremophiles; Mars analog for jarosite and hematite spherules."
  },
  {
    id: 20, name: "Lake Vostok Subglacial Plateau", country: "Antarctica", env: "Polar", envLabel: "Deep polar ice",
    biome: "polar_ice", biomeLabel: "East Antarctic Continental Ice Sheet",
    lat: -78.46, lon: 106.83, elevation: 3488, slope: 1.2, roughness: 0.1, ndvi: 0.0, liquidWater: false,
    thermalAmplitude: 28, relativeHumidity: 5, lithology: "polar_ice",
    minerals: ["Glacial Ice (H2O)", "Accretion Ice", "Clathrates"], coverage: 100,
    alertType: "high", alertLabel: "Strict Antarctic Treaty", protectedName: "Lake Vostok Subglacial Protection Zone (Antarctic Treaty)",
    sdgs: ["SDG 13", "SDG 6", "SDG 14"],
    ecosystem: "High-altitude continental ice sheet sealing an isolated subglacial lake",
    vulnerableSpecies: "Isolated subglacial accretion-ice microbiota sealed from the atmosphere for >15 million years",
    roverImpact: "Surface snow traverses are low-impact, but any unsterilized thermal drilling risks irreversibly contaminating the subglacial lake.",
    desc: "Continental ice sheet at 3,488 m above a sealed subglacial lake; analog of Europa and Enceladus ice crusts."
  }
];

// --- One-click catalog packs ----------------------------------------------------
TA.presets = {
  nasa_extended: [
    {
      id: 101, name: "Mauna Kea Summit Plateau", country: "United States", env: "Volcanic", envLabel: "High-altitude volcano",
      biome: "volcanic_basalt", biomeLabel: "Alpine Volcanic Cinder & Permafrost",
      lat: 19.82, lon: -155.46, elevation: 4207, slope: 6.5, roughness: 0.72, ndvi: 0.03, liquidWater: false,
      thermalAmplitude: 18, relativeHumidity: 15, lithology: "basalt_volcanic",
      minerals: ["Alkaline Basalt", "Tephra", "Permafrost"], coverage: 100,
      alertType: "high", alertLabel: "Cultural & Science Reserve", protectedName: "Mauna Kea Science Reserve & Sacred Summit",
      sdgs: ["SDG 15", "SDG 11"],
      ecosystem: "Aeolian alpine cinder cones & tropical mountain permafrost",
      vulnerableSpecies: "Endemic Wekiu bug (Nysius wekiuicola) & sacred Kanaka Maoli cultural summit landscapes",
      roverImpact: "Cinder-cone traverses crush porous tephra habitat required by the endemic Wekiu bug and disturb sacred cultural sites.",
      desc: "4,200 m volcanic plateau with frozen basaltic soil, low air pressure and intense UV, analogous to Mars."
    },
    {
      id: 102, name: "Lonar Meteorite Crater", country: "India", env: "Crater", envLabel: "Basaltic crater",
      biome: "alpine_rock", biomeLabel: "Basaltic Impact Rim & Soda Basin",
      lat: 19.97, lon: 76.51, elevation: 560, slope: 9.2, roughness: 0.65, ndvi: 0.06, liquidWater: false,
      thermalAmplitude: 22, relativeHumidity: 28, lithology: "impact_crater",
      minerals: ["Deccan Basalt", "Maskelynite", "Impact Glass"], coverage: 100,
      alertType: "medium", alertLabel: "Ramsar & Wildlife Sanctuary", protectedName: "Lonar Crater Wildlife Sanctuary (Ramsar)",
      sdgs: ["SDG 15", "SDG 6"],
      ecosystem: "Deccan flood-basalt impact ejecta blanket & alkaline soda lake rim",
      vulnerableSpecies: "Haloalkaliphilic nitrogen-fixing microbes & migratory ruddy shelduck populations",
      roverImpact: "Rover testing is restricted to outer basalt ejecta plains to prevent soil runoff into the hypersaline crater lake.",
      desc: "Only impact crater on Earth formed in basalt; twin of craters on the lunar mare plains."
    },
    {
      id: 103, name: "Teide National Park & Las Canadas", country: "Spain", env: "Volcanic", envLabel: "Volcanic caldera",
      biome: "volcanic_basalt", biomeLabel: "High-Altitude Caldera & Obsidian Flows",
      lat: 28.27, lon: -16.64, elevation: 2100, slope: 8.0, roughness: 0.82, ndvi: 0.05, liquidWater: false,
      thermalAmplitude: 20, relativeHumidity: 24, lithology: "basalt_volcanic",
      minerals: ["Phonolite", "Basaltic Obsidian", "Sulfates"], coverage: 100,
      alertType: "high", alertLabel: "UNESCO National Park", protectedName: "Teide National Park (UNESCO World Heritage)",
      sdgs: ["SDG 15", "SDG 11"],
      ecosystem: "High-altitude phonolitic caldera & hydrothermal pumice flats",
      vulnerableSpecies: "Teide violet (Viola cheiranthifolia), Tenerife Tajinaste & Pimelia canariensis beetles",
      roverImpact: "Off-road wheels crush fragile pumice fields and rare high-altitude endemic flora.",
      desc: "High-altitude caldera with lava flows and hydrothermal alteration minerals similar to Martian crater rims."
    },
    {
      id: 104, name: "Barringer Meteor Crater", country: "United States", env: "Crater", envLabel: "Impact crater",
      biome: "alpine_rock", biomeLabel: "Arid Impact Crater & Ejecta Boulder Field",
      lat: 35.03, lon: -111.02, elevation: 1740, slope: 14.5, roughness: 0.75, ndvi: 0.04, liquidWater: false,
      thermalAmplitude: 24, relativeHumidity: 18, lithology: "impact_crater",
      minerals: ["Impact Melt", "Coesite", "Stishovite"], coverage: 100,
      alertType: "medium", alertLabel: "National Natural Landmark", protectedName: "Meteor Crater Natural Landmark",
      sdgs: ["SDG 11", "SDG 15"],
      ecosystem: "Overturned Kaibab limestone ejecta rim & Colorado Plateau steppe",
      vulnerableSpecies: "Shock-metamorphosed coesite/stishovite type-locality outcrops & arid cryptobiotic crusts",
      roverImpact: "Steep inner crater walls (up to 35 deg) pose high rollover risk and erode preserved Pleistocene lakebed sediments.",
      desc: "1.2 km simple impact crater preserved in an arid climate; Apollo astronaut training site."
    },
    {
      id: 105, name: "Deception Island Caldera", country: "Antarctica", env: "Volcanic", envLabel: "Glacier volcano",
      biome: "polar_ice", biomeLabel: "Glacio-Volcanic Ash & Fumarole Coast",
      lat: -62.95, lon: -60.65, elevation: 250, slope: 7.5, roughness: 0.68, ndvi: 0.02, liquidWater: false,
      thermalAmplitude: 16, relativeHumidity: 32, lithology: "basalt_volcanic",
      minerals: ["Palagonite", "Basaltic Ash", "Glacial Ice"], coverage: 95,
      alertType: "high", alertLabel: "Antarctic Treaty (ASPA 140)", protectedName: "Deception Island ASPA No. 140",
      sdgs: ["SDG 13", "SDG 14", "SDG 15"],
      ecosystem: "Geothermally heated polar volcanic ash & chinstrap penguin rookeries",
      vulnerableSpecies: "Unique fumarolic bryophyte communities & chinstrap penguin (Pygoscelis antarcticus) colonies",
      roverImpact: "Strictly prohibited near heated fumarole moss islands (ASPA sub-sites) where single footprints destroy rare polar flora.",
      desc: "Active volcano interacting with polar glaciers; model for volcano-ice interaction on early Mars."
    }
  ],
  impact_craters: [
    {
      id: 201, name: "Vredefort Dome", country: "South Africa", env: "Crater", envLabel: "Largest impact structure",
      biome: "alpine_rock", biomeLabel: "Shocked Granite & Pseudotachylite Ring",
      lat: -27.0, lon: 27.5, elevation: 1400, slope: 8.5, roughness: 0.58, ndvi: 0.08, liquidWater: false,
      thermalAmplitude: 18, relativeHumidity: 26, lithology: "impact_crater",
      minerals: ["Pseudotachylite", "Shatter Cones", "Granite Core"], coverage: 100,
      alertType: "high", alertLabel: "UNESCO World Heritage", protectedName: "Vredefort Dome (UNESCO World Heritage)",
      sdgs: ["SDG 11", "SDG 15"],
      ecosystem: "Paleoproterozoic impact-rebound quartzite ridges & Highveld savanna",
      vulnerableSpecies: "Type-locality pseudotachylite melt veins, shatter-cone outcrops & Highveld endemic flora",
      roverImpact: "Coring or heavy wheel slip on exposed shatter-cone surfaces damages irreproducible planetary impact benchmarks.",
      desc: "Largest and oldest verified impact structure on Earth (300 km original diameter); analog of lunar mega-basins."
    },
    {
      id: 202, name: "Ries Impact Crater (Noerdlingen)", country: "Germany", env: "Crater", envLabel: "Double-ring crater",
      biome: "alpine_rock", biomeLabel: "Suevite Impact Breccia Basin",
      lat: 48.88, lon: 10.5, elevation: 430, slope: 6.0, roughness: 0.45, ndvi: 0.12, liquidWater: false,
      thermalAmplitude: 14, relativeHumidity: 45, lithology: "impact_crater",
      minerals: ["Suevite Breccia", "Moldavites", "Coesite"], coverage: 100,
      alertType: "low", alertLabel: "UNESCO Global Geopark", protectedName: "Ries UNESCO Global Geopark Quarry Testbeds",
      sdgs: ["SDG 11", "SDG 15"],
      ecosystem: "Exposed suevite impact-breccia quarries & dry calcareous grasslands",
      vulnerableSpecies: "Calcareous dry-grassland orchids (outside quarry floors) & shocked-diamond suevite exposures",
      roverImpact: "Low impact when conducted inside designated suevite quarry floors used since Apollo 14 field training.",
      desc: "Double-ring impact crater with suevite breccia. Historic Apollo 14 training field."
    },
    {
      id: 203, name: "Tswaing Meteorite Crater", country: "South Africa", env: "Crater", envLabel: "Saline crater",
      biome: "gypsum_wetland", biomeLabel: "Saline Crater Lake & Breccia Rim",
      lat: -25.41, lon: 28.08, elevation: 1050, slope: 11.0, roughness: 0.55, ndvi: 0.07, liquidWater: false,
      thermalAmplitude: 20, relativeHumidity: 22, lithology: "impact_crater",
      minerals: ["Impact Breccia", "Halite", "Soda Lake Mud"], coverage: 100,
      alertType: "low", alertLabel: "Eco-Heritage Reserve", protectedName: "Tswaing Meteorite Crater Nature Reserve",
      sdgs: ["SDG 6", "SDG 15"],
      ecosystem: "Granitic impact rim & internal carbonate-halite crater lake",
      vulnerableSpecies: "Alkaliphilic cyanobacterial mats & wetland wading bird habitats",
      roverImpact: "Steep granitic rim slopes risk loose-regolith slides into the closed-basin saline lake.",
      desc: "1 km circular crater with an internal hypersaline lake, analogous to late Noachian Martian crater lakes."
    }
  ],
  volcanic_tubes: [
    {
      id: 301, name: "Undara Lava Tubes", country: "Australia", env: "Lava_Tube", envLabel: "Continuous lava tubes",
      biome: "volcanic_basalt", biomeLabel: "Subsurface Basaltic Lava Tube System",
      lat: -18.2, lon: 144.98, elevation: 750, slope: 3.5, roughness: 0.78, ndvi: 0.06, liquidWater: false,
      thermalAmplitude: 22, relativeHumidity: 20, lithology: "basalt_volcanic",
      minerals: ["Tholeiite Basalt", "Silica Glaze", "Iron Oxides"], coverage: 100,
      alertType: "high", alertLabel: "National Park (WDPA)", protectedName: "Undara Volcanic National Park",
      sdgs: ["SDG 15", "SDG 11"],
      ecosystem: "Cenozoic basaltic lava tubes & collapsed roof-pit vine thickets",
      vulnerableSpecies: "Eastern horseshoe bat colonies & specialized troglobitic cave invertebrates",
      roverImpact: "Acoustic noise, spotlights, and dust from robotic cave crawlers disrupt maternity bat colonies and fragile cave food webs.",
      desc: "One of the longest lava tube systems on the planet (160 km); structural analog of lunar tubes for Artemis habitats."
    },
    {
      id: 302, name: "Manjanggul Lava Tube (Jeju)", country: "South Korea", env: "Lava_Tube", envLabel: "Giant lava tube",
      biome: "volcanic_basalt", biomeLabel: "Subsurface Basalt Cavern & Columns",
      lat: 33.52, lon: 126.77, elevation: 120, slope: 4.0, roughness: 0.82, ndvi: 0.08, liquidWater: false,
      thermalAmplitude: 12, relativeHumidity: 55, lithology: "basalt_volcanic",
      minerals: ["Alkali Basalt", "Lava Stalactites", "Carbonates"], coverage: 95,
      alertType: "high", alertLabel: "UNESCO World Heritage", protectedName: "Jeju Volcanic Island and Lava Tubes (UNESCO)",
      sdgs: ["SDG 11", "SDG 15"],
      ecosystem: "Multi-level basaltic lava tube with lava stalactites & columns",
      vulnerableSpecies: "Jeju cave spider (Nesticella quelpartensis) & Japanese large-footed bat (Myotis macrodactylus)",
      roverImpact: "Tracked or wheeled vehicles inside the tube damage delicate lava flowlines and silica-carbonate speleothems.",
      desc: "Large basaltic lava tube (up to 23 m wide) with well-preserved lava columns."
    },
    {
      id: 303, name: "Cueva del Viento (Tenerife)", country: "Spain", env: "Lava_Tube", envLabel: "Lava tube maze",
      biome: "volcanic_basalt", biomeLabel: "Multi-Level Volcanic Tube Maze",
      lat: 28.35, lon: -16.7, elevation: 800, slope: 5.2, roughness: 0.85, ndvi: 0.05, liquidWater: false,
      thermalAmplitude: 16, relativeHumidity: 30, lithology: "basalt_volcanic",
      minerals: ["Basaltic Tephra", "Silicate Glaze", "Iron Hydroxides"], coverage: 100,
      alertType: "high", alertLabel: "Strict Natural Reserve", protectedName: "Cueva del Viento Protected Natural Monument",
      sdgs: ["SDG 15", "SDG 11"],
      ecosystem: "Three-tier braided basaltic lava-tube labyrinth",
      vulnerableSpecies: "Over 40 troglobitic eyeless species including Loboptera subterranea cockroach & cave beetles",
      roverImpact: "Strict non-contact optical mapping only; mechanical wheels crush delicate silicate glaze floors and endemic cave fauna.",
      desc: "18 km, three-level underground volcanic maze; key analog for robotic speleological exploration of Mars."
    }
  ]
};

// --- Planetary targets ----------------------------------------------------------
// lat / lon: planetocentric degrees (east positive) used to center the Moon / Mars imagery.
TA.targets = {
  shackleton:      { body: "moon", name: "Shackleton Crater Rim", label: "Shackleton Crater Rim - Polar cold trap (Artemis III)", lat: -89.9, lon: 0.0, zoom: 3, targetSlope: 14.5, targetRough: 0.42, lithology: "anorthosite", matchWhy: "Matches steep impact-shocked polar crater slopes, extreme diurnal thermal swings, and cryo-permafrost volatile traps.", desc: "Lunar south-polar crater rim with near-permanent illumination and volatile-ice cold traps (Artemis III)." },
  tranquillitatis: { body: "moon", name: "Mare Tranquillitatis", label: "Mare Tranquillitatis - Basaltic ilmenite plains", lat: 8.5, lon: 31.4, zoom: 4, targetSlope: 3.2, targetRough: 0.18, lithology: "basalt_volcanic", matchWhy: "Shares low-angle tholeiitic/ilmenite basalt flows, dark volcanic albedo, and minimal vegetative alteration.", desc: "Ilmenite-rich basaltic plains with low slopes and reduced albedo (Apollo 11)." },
  procellarum:     { body: "moon", name: "Oceanus Procellarum (Marius Hills)", label: "Oceanus Procellarum - Subsurface lava tubes", lat: 14.0, lon: -56.8, zoom: 4, targetSlope: 5.8, targetRough: 0.35, lithology: "basalt_volcanic", matchWhy: "Replicates intact basaltic lava tubes, volcanic skylights, and moderate pahoehoe surface roughness.", desc: "Lunar volcanic province with domes and skylights into intact subsurface lava tubes." },
  jezero:          { body: "mars", name: "Jezero Crater (Delta & Scarp)", label: "Jezero Crater - Lacustrine fan delta (Perseverance)", lat: 18.38, lon: 77.58, zoom: 4, targetSlope: 6.8, targetRough: 0.32, lithology: "evaporite_salar", matchWhy: "Mirrors paleolake evaporite-smectite mineralogy, hyper-arid regolith chemistry, and moderate deltaic scarp slopes.", desc: "Martian paleolake with a smectite clay delta, carbonates and basaltic regolith (Perseverance rover)." },
  gale:            { body: "mars", name: "Gale Crater & Mount Sharp", label: "Gale Crater and Mount Sharp (MSL Curiosity)", lat: -5.4, lon: 137.8, zoom: 4, targetSlope: 8.4, targetRough: 0.36, lithology: "evaporite_salar", matchWhy: "Matches layered sulfate-clay basin deposits, arid diurnal temperature cycles, and aeolian boulder roughness.", desc: "Layered sedimentary mound with sulfates, hematite and active aeolian dune fields (Curiosity)." },
  olympus:         { body: "mars", name: "Olympus Mons Flank", label: "Olympus Mons Flank - Shield volcano lava plains", lat: 18.65, lon: -133.8, zoom: 3, targetSlope: 5.0, targetRough: 0.29, lithology: "basalt_volcanic", matchWhy: "Aligns with shield-volcano basaltic flows, high-elevation low-pressure conditions, and vesicular lava roughness.", desc: "Flank of the largest shield volcano in the solar system with laminar basaltic lava flows and tephra." },
  meridiani:       { body: "mars", name: "Meridiani Planum", label: "Meridiani Planum - Sulfates and hematite blueberries", lat: -1.95, lon: -5.5, zoom: 4, targetSlope: 2.1, targetRough: 0.15, lithology: "evaporite_salar", matchWhy: "Shares ultra-flat evaporitic plains, ferric sulfate/hematite concretions, and high rover trafficability.", desc: "Evaporitic plains with gray crystalline hematite spherules ('blueberries') and acidic sulfates (Opportunity)." }
};

// --- Reverse mineral search signatures (orbital spectroscopy: CRISM / M3) -------------
TA.spectral = [
  { id: "ilmenite", label: "Ilmenite & titanium-rich basalts", keywords: ["ilmenite", "titanomagnetite", "basalt", "ferrobasalt"] },
  { id: "ice", label: "Subsurface ice & polar cold traps", keywords: ["ice", "permafrost", "clathrate"] },
  { id: "jarosite", label: "Jarosite, hematite & ferric sulfates", keywords: ["jarosite", "hematite", "goethite", "sulfate", "iron oxide"] },
  { id: "clays", label: "Smectite clays & lacustrine deltas", keywords: ["smectite", "clay", "gypsum", "travertine"] },
  { id: "perchlorates", label: "Perchlorate salts & hyper-arid evaporites", keywords: ["perchlorate", "halite", "borate", "sylvite"] }
];

// --- Lithology filter options ---------------------------------------------------
TA.lithologyLabels = {
  all: "All lithologies (permissive)",
  basalt_volcanic: "Basalt, ilmenite & volcanics",
  impact_crater: "Impact craters & shock cones",
  evaporite_salar: "Sulfates, smectite clays & salars",
  polar_ice: "Polar cryosphere & subsurface ice",
  sandstone_quartz: "Quartz sandstone & dune sand"
};

// --- Official Open Data Sources & Scientific References (clickable portals) ---
TA.scientificReferences = [
  {
    group: "1. NASA Earth Observation",
    items: [
      { name: "NASA Earthdata Search", url: "https://search.earthdata.nasa.gov/", desc: "SRTM/ASTER elevation, MODIS NDVI & surface parameters." },
      { name: "NASA Worldview", url: "https://worldview.earthdata.nasa.gov/", desc: "Multi-temporal Earth satellite imagery validation." },
      { name: "NASA SEDAC", url: "https://www.earthdata.nasa.gov/centers/sedac-daac/map-gallery", desc: "Human footprint & socioeconomic sustainability layers." }
    ]
  },
  {
    group: "2. NASA Moon & Mars Planetary Data",
    items: [
      { name: "NASA Planetary Data System (PDS)", url: "https://pds.nasa.gov/", desc: "Martian & Lunar topography and mineralogy benchmarks." },
      { name: "LRO Geosciences Node", url: "https://pds-geosciences.wustl.edu/missions/lro/", desc: "LOLA lunar elevation & slope profiles." },
      { name: "LRO Diviner Lunar Radiometer", url: "https://pds-geosciences.wustl.edu/missions/lro/diviner.htm", desc: "Thermal swing & polar cold-trap temperature data." }
    ]
  },
  {
    group: "3. International Space Agencies",
    items: [
      { name: "ESA Copernicus Data Space", url: "https://dataspace.copernicus.eu/", desc: "Sentinel-1 SAR roughness & Sentinel-2 multispectral indices." },
      { name: "CSA RADARSAT Constellation Mission (RCM)", url: "https://donnees-data.asc-csa.gc.ca/en/dataset/rcm", desc: "C-band SAR surface roughness & Arctic analog monitoring." },
      { name: "JAXA G-Portal", url: "https://gportal.jaxa.jp/gpr/index/index", desc: "ALOS World 3D global DEM & moisture datasets." }
    ]
  },
  {
    group: "4. Biodiversity, Land Cover & UN SDG Protection",
    items: [
      { name: "Protected Planet / WDPA", url: "https://www.protectedplanet.net/en/data/wdpca", desc: "Global protected areas & Ramsar zones for SDG 15/14/6 alerts." },
      { name: "ESA WorldCover", url: "https://esa-worldcover.org/en/data-access", desc: "10m global land-cover classification." },
      { name: "CONABIO Geoportal", url: "http://www.conabio.gob.mx/informacion/gis/", desc: "Endemic species & fragile Mexican ecosystems (e.g., Cuatro Ciénegas)." },
      { name: "INEGI Land Use & Vegetation", url: "https://www.inegi.org.mx/programas/usyv/", desc: "High-resolution Mexican soil & vegetation cartography." }
    ]
  }
];

// --- Scope of the data sources used by this build -----------------------------------
// mode: "live" = streamed as map tiles at runtime, "embedded" = values curated into this build
TA.dataSources = [
  { group: "Planetary surface imagery & NASA PDS", items: [
    { name: "NASA Trek - LRO WAC global mosaic", url: "https://pds-geosciences.wustl.edu/missions/lro/", provider: "NASA / LROC (Arizona State Univ.)", scope: "Moon, global, 303 ppd (~100 m/px)", use: "Moon basemap and 3D globe texture", mode: "live" },
    { name: "NASA Trek - Viking MDIM 2.1 color mosaic", url: "https://pds.nasa.gov/", provider: "NASA / USGS Astrogeology", scope: "Mars, global, 232 m/px", use: "Mars basemap and 3D globe texture", mode: "live" },
    { name: "NASA PDS: LRO LOLA / Diviner, MRO CRISM / HiRISE", url: "https://pds-geosciences.wustl.edu/missions/lro/diviner.htm", provider: "NASA Planetary Data System", scope: "Target slope, roughness, thermal swing & mineral signatures", use: "Planetary target baseline profiles", mode: "embedded" }
  ]},
  { group: "Earth imagery, SAR roughness & elevation (NASA / ESA / CSA / JAXA)", items: [
    { name: "Esri World Imagery & NASA Worldview", url: "https://worldview.earthdata.nasa.gov/", provider: "Esri / NASA EOSDIS", scope: "Earth, global, up to ~0.3 m/px", use: "Satellite basemap & 3D Earth texture validation", mode: "live" },
    { name: "Esri World Hillshade & NASA Earthdata (SRTM / ASTER)", url: "https://search.earthdata.nasa.gov/", provider: "NASA Earthdata / Esri", scope: "Global elevation, slope & MODIS NDVI parameters", use: "Elevation shading overlay & terrain attributes", mode: "live" },
    { name: "ESA Copernicus Data Space (Sentinel-1 / 2)", url: "https://dataspace.copernicus.eu/", provider: "European Space Agency (ESA)", scope: "Sentinel-1 SAR roughness & Sentinel-2 multispectral indices", use: "Surface roughness & NDVI calibration", mode: "embedded" },
    { name: "CSA RADARSAT Constellation Mission (RCM)", url: "https://donnees-data.asc-csa.gc.ca/en/dataset/rcm", provider: "Canadian Space Agency (CSA)", scope: "C-band SAR surface roughness & Arctic analog monitoring", use: "Polar & impact crater roughness profiles", mode: "embedded" },
    { name: "JAXA G-Portal (ALOS World 3D DEM)", url: "https://gportal.jaxa.jp/gpr/index/index", provider: "JAXA", scope: "Global 30 m DEM & soil moisture datasets", use: "Topographic slope & moisture cross-validation", mode: "embedded" }
  ]},
  { group: "Biodiversity, land cover & UN SDG protection (WDPA / CONABIO / INEGI)", items: [
    { name: "Protected Planet / WDPA", url: "https://www.protectedplanet.net/en/data/wdpca", provider: "UNEP-WCMC / IUCN", scope: "Global protected areas, UNESCO & Ramsar zones", use: "Hazard polygons and SDG 15 / 14 / 6 alerts", mode: "embedded" },
    { name: "ESA WorldCover 10 m & NASA SEDAC", url: "https://esa-worldcover.org/en/data-access", provider: "ESA / NASA SEDAC", scope: "10 m global land-cover & human footprint sustainability layers", use: "NDVI and liquid-water discard rules", mode: "embedded" },
    { name: "CONABIO Geoportal & INEGI Land Use / Vegetation", url: "http://www.conabio.gob.mx/informacion/gis/", provider: "CONABIO / INEGI (Mexico)", scope: "Endemic species, soil & fragile Mexican ecosystems (Cuatro Ciénegas, El Pinacate)", use: "Endemic species at risk & rover impact warnings", mode: "embedded" }
  ]}
];

// --- Mission-checklist step definitions (state-driven, see app.js) -----------------------
TA.missionSteps = [
  { id: "target", title: "Planetary target selected", hint: "Choose a Moon or Mars target in the header." },
  { id: "match", title: "Analog site matched above 75%", hint: "Select an analog whose live similarity score exceeds 75%." },
  { id: "hazard", title: "Environmental & UN SDG clearance checked", hint: "Review the site hazards and SDG impact alert; site must have no critical restriction." },
  { id: "sim", title: "Rover traverse simulation verified", hint: "Run the rover simulation in the Dossier and complete the traverse." },
  { id: "export", title: "Ready to export dossier", hint: "Complete the previous steps to unlock the dossier export." }
];
