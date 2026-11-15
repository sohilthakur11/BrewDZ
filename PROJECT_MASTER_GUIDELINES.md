# ChE 303: Fluid Particle Systems — Course Project Master Manual
## Project Title: Engineering the Perfect Coffee Powder
**Company Name:** BrewDz Particle Engineering Pvt. Ltd.  
**Course:** ChE 303 — Fluid Particle Systems  
**Domain:** Size Reduction, Particle Size Distribution (PSD), Screening, Comminution, Fluid-Solid Flow

---

> **Status note.** This manual is the original plan. Where it differs from the built project, the built project is current: the dataset has 399 cases (19 feed rates × 3 profiles × 7 screen apertures) from a Python steady-state model rather than an Aspen export, Bond power is on a fresh-feed basis, and modelled on-spec yield is 92–96% with fines recovered as a by-product. See `README.md` and the Method section of the website.

## Executive Summary & Engineering Objective

In specialty coffee processing, grinding is not merely a mechanical reduction; it is a **precision fluid-particle engineering operation**. The particle size distribution (PSD) of ground coffee directly dictates:
1. **Packed Bed Permeability & Hydraulic Resistance:** Governed by the **Ergun Equation** ($\Delta P / L$).
2. **Extraction Kinetics & Contact Area:** High surface-area-to-volume ratio ($S_v = 6 / (\phi_s d_p)$).
3. **Extraction Uniformity:** 
   - **"Boulders" (oversized particles > 1000 µm):** Under-extract, yielding acidic and watery coffee due to low contact time and long internal diffusion paths.
   - **"Fines" (dust < 100 µm):** Over-extract rapidly, leaching bitter chlorogenic acids and tannins, while migrating through the bed to blind filter media and create preferential flow channels.

### The Core Industrial Problem
Conventional industrial grinders use single-pass, open-loop grinding where up to $15\text{--}25\%$ of the product falls outside the optimal extraction window.

### BrewDz's Engineered Solution
**BrewDz Particle Engineering** introduces a closed-loop comminution and classification circuit:
- **Low-shear chilled roller milling** for controlled primary breakage.
- **Vibrating multi-deck screening** to separate out-of-spec fractions.
- **Continuous oversize recycle loop** back into the milling chamber to achieve $>95\%$ on-spec yield.
- **Aerodynamic classification (cyclone/aspirator)** to harvest super-fines as a high-value byproduct (used for instant coffee extraction and cold-brew concentrates), eliminating waste.

---

## Master Step-by-Step Execution Plan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PROJECT ROADMAP                                 │
└─────────────────────────────────────────────────────────────────────────────┘
  [Phase 1] ──► Step 1: Company Profile & Problem Formulation
  [Phase 2] ──► Step 2: Indian & Regional Competitor Survey (Indore Focus)
  [Phase 3] ──► Step 3: Aspen Plus Solids Flowsheet Design (Crusher + Screen + Recycle)
  [Phase 4] ──► Step 4: Python Engineering Calculation & Hand Verification (Bond's Law & Screen)
  [Phase 5] ──► Step 5: Parametric Aspen Simulation & CSV Dataset Generation
  [Phase 6] ──► Step 6: Interactive Web Application (Calculator + Charts + PFD)
  [Phase 7] ──► Step 7 & 8: Final Presentation Slide Deck & Technical Defense Prep
```

---

## Step 1: Identify the Problem & Design Your Company

### 1.1 Company Identity
- **Company Name:** **BrewDz Particle Engineering Pvt. Ltd.**
- **Tagline:** *Precision Particle Mechanics for Flawless Extraction.*
- **Headquarters / Pilot Location:** Sanwer Road Industrial Area, Indore, Madhya Pradesh, India.
- **Core Value Proposition:** Closed-loop particle engineering technology that reduces grinding fines by $65\%$, eliminates oversize boulders, and increases brewing yield efficiency from $80\%$ to $96\%$.

### 1.2 Target Customers (Three Distinct Segments)
1. **Specialty Café Chains & Regional Roasters (B2B):**
   - High-end cafes in Indore (e.g., Chapter One, Nomad, Medias, Chai Kaapi) and national brands (Blue Tokai, Third Wave, Subko).
   - They require pre-ground, batch-consistent coffee packs calibrated to specific brewing equipment (Espresso, Pour-over, AeroPress, French Press).
2. **Industrial Instant Coffee & Extract Manufacturers:**
   - Companies like Tata Coffee, CCL Products, and Nestlé that require uniform bed porosity in percolation columns to maximize solid extraction yield without column clogging.
3. **Equipment & Toll-Milling Services:**
   - Providing custom toll-grinding and screening services for coffee estates and roasters who cannot afford multimillion-rupee industrial multi-stage roller mills.

### 1.3 Quantified Problem Statement
- In standard commercial burr and blade grinders:
  - Particle Size Span: $\text{Span} = \frac{d_{90} - d_{10}}{d_{50}} \approx 1.8\text{--}2.5$ (very broad, heterogeneous).
  - Excessive fines generation ($15\text{--}22\% < 100\,\mu\text{m}$) caused by uncontrolled shear and compressive over-grinding.
  - Thermal degradation: High-speed mechanical friction heats coffee beans above $50^\circ\text{C}$, volatilizing aromatic terpenes and aldehydes.
- **BrewDz Performance Target:**
  - Narrow span: $\text{Span} \le 0.85$.
  - Thermal control: Grinding chamber kept below $28^\circ\text{C}$ via water-jacketed chilled rolls.
  - Overall yield of on-spec target grind: $>95\%$ via closed-loop screening and oversize recycle.

---

## Step 2: Conduct a Competitor Survey (Indore & Pan-India)

Your report requires a structured competitor benchmark table with at least 3–5 companies, distinguishing direct competitors from alternative solutions:

| Company Name | Location | Category | Offerings & Tech | Limitations / Competitor Gaps | BrewDz Differentiation | Credible Source / Link |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Kaapi Machines India Pvt. Ltd.** | Bengaluru / Mumbai / Delhi | Direct Competitor (Equipment) | Commercial imported grinders (Mahlkönig, Ditting, Compak). | High CapEx ($₹3\text{L} - ₹15\text{L}$ per unit); open-loop batch operations; no integrated continuous screening or automated oversize recycle. | Modular, indigenous closed-loop continuous milling system with inline screen separation at $40\%$ lower CapEx. | [kaapimachines.com](https://kaapimachines.com/) |
| **Chapter One Coffee Roasters** | New Palasia, Indore, MP | Customer / Indirect Competitor | Artisanal specialty coffee roastery; batch retail grinding. | Relies on standalone burr grinders with manual adjustments; batch-to-batch PSD variance; manual disposal of fines. | Offers automated B2B toll-grinding services and pre-engineered calibrated grounds with certified PSD curves. | Local Indore Roastery Survey / [chapteronecoffee.in](https://chapteronecoffee.in/) |
| **Raj Electricals / Industrial Millers** | Ahmedabad / Indore Industrial Belt | Alternative Solution | Industrial hammer mills, pin mills, and disc pulverizers for food grains. | Destructive impact comminution; high fines ($>30\%$); thermal degradation of delicate aroma oils; no classification. | Precision low-shear roller milling with cryogenic or chilled air sweep, preserving volatile aromatic compounds. | [indiamart.com/rajelectricals](https://www.indiamart.com/) |
| **Blue Tokai Coffee Roasters** | Gurugram, NCR / Pan-India | Direct / Alternative Competitor | Fresh roast-and-ground specialty coffee pouches; custom grind selection. | Focuses on coffee roasting rather than milling machine engineering; relies on German burr mills without closed-loop recycle. | We supply specialty roasters with precision powder processing systems and narrow-span bulk processing technology. | [bluetokaicoffee.com](https://bluetokaicoffee.com/) |
| **Hosokawa Micron India Pvt. Ltd.** | Chennai, Tamil Nadu | Alternative Solution (High-End) | Industrial Air Classifier Mills (ACM), Alpine pin mills for pharma/fine chemicals. | Enterprise-scale machinery geared for ton/hr bulk minerals and pharma; prohibitively high cost for coffee SMEs ($>₹50\text{L}$). | Sized specifically for SME coffee roasteries ($50\text{--}500\,\text{kg/h}$); plug-and-play food-grade sanitary design. | [hosokawa-micron.com](https://www.hosokawa-micron.com/) |

---

## Step 3: Develop Your Aspen Plus Solids Flowsheet

In chemical engineering, solids processing requires specialized handling of stream classes and particle size distributions.

### 3.1 Aspen Plus Setup Specifications
- **Stream Class:** `SOLIDS` or `MIXED` + `CISOLID` (Conventional Inert Solid).
- **Physical Property Method:** `SOLIDS` or `IDEAL`.
- **Component Definition:**
  - Component ID: `COFFEE`
  - Type: Solid (`CISOLID`)
  - Solid density: $\rho_s = 1250\text{ kg/m}^3$
  - Bulk density: $\rho_b = 380\text{--}420\text{ kg/m}^3$
  - Moisture content: $2.5\text{ wt}\%$
- **Particle Size Distribution (PSD) Grid:**
  - Define a geometric mesh distribution across 10 to 15 size bins:
  - Range: $50\,\mu\text{m}$ to $2000\,\mu\text{m}$ (e.g., bins at $50, 100, 200, 300, 425, 600, 850, 1180, 1700, 2000\,\mu\text{m}$).

### 3.2 Equipment Blocks in Flowsheet
1. **Mixer Block (`MIXER`):**
   - Combines fresh roasted coffee bean feed with the recycled oversize solids stream.
2. **Size Reduction Unit (`CRUSHER` / `MILL`):**
   - Aspen model block: `CRUSH` (or `CRUSHER`).
   - Operating type: Roller Mill or Cage Mill.
   - Operating parameters: Roll clearance / gap ($0.3\text{--}1.0\text{ mm}$), roll speed ratio ($1:1.5$ to $1:2.5$), breakage distribution function.
3. **Separation / Classification Unit (`SCREEN`):**
   - Aspen model block: `SCREEN`.
   - Classification type: Vibrating screen with double deck or single deck with defined aperture ($d_{cut}$).
   - Top Stream (`OVERSIZE`): Particles $> d_{cut}$ routed to recycle.
   - Bottom Stream (`PRODUCT`): Particles within target size window ($d_{min} \le d_p \le d_{max}$).
4. **Recycle Convergence Block:**
   - Closed material loop returning `OVERSIZE` back into the `MIXER`.
   - Convergence method: Wegstein or Direct Substitution algorithm to ensure mass balance closure without accumulation.

### 3.3 Flowsheet Diagram Architecture

```
  [Fresh Feed: BEANS]
  (50 - 500 kg/h, dp = 6.5 mm)
          │
          ▼
   ┌─────────────┐
   │    MIXER    │◄─────────────────────────────┐
   └──────┬──────┘                              │
          │ Total Feed (Fresh + Recycle)        │
          ▼                                     │
   ┌─────────────┐                              │
   │ CRUSH / MILL│ (Roller Mill Size Reduction) │
   └──────┬──────┘                              │
          │ Ground Coffee Slurry / Effluent     │
          ▼                                     │
   ┌─────────────┐                              │
   │   SCREEN    │───► [OVERSIZE Stream] ───────┘
   └──────┬──────┘     (dp > 600 µm, recycled to 100% recovery)
          │
          ▼
   [PRODUCT Stream] 
   (On-spec powder: 250 - 600 µm for Drip/Espresso)
```

### 3.4 Key Aspen Assumptions & Simplifications
- Steady-state continuous operation.
- Constant grain particle density ($\rho_p = 1250\text{ kg/m}^3$).
- Zero chemical reaction or devolatilization during mechanical comminution (heat generation is absorbed by cooling jacket).
- Complete solid recovery (no losses through seals or dusting in the simplified Aspen mass balance).

---

## Step 4: Equipment-Level Calculations in Python

You must select **one equipment unit** and implement its governing chemical engineering equations in Python, backed by a **manual hand-calculation verification**.

### 4.1 Unit Chosen: Roller Mill Comminution Power & Vibrating Screen Effectiveness

#### Part A: Size Reduction Power (Bond's Law of Comminution)
Bond's Law states that the work required to form particles of size $d_p$ from very large feed is inversely proportional to the square root of the diameter:

$$E = 10 \cdot W_i \left( \frac{1}{\sqrt{d_{p,2}}} - \frac{1}{\sqrt{d_{p,1}}} \right)$$

$$P = \dot{m} \cdot E = 10 \cdot W_i \cdot \dot{m} \left( \frac{1}{\sqrt{d_{p,2}}} - \frac{1}{\sqrt{d_{p,1}}} \right)$$

Where:
- $P$: Power required by the mill ($\text{kW}$)
- $W_i$: Bond Work Index for roasted coffee ($\approx 12.5\text{ kWh / metric ton}$)
- $\dot{m}$: Total solid feed rate through the mill ($\text{metric tons / hour}$)
- $d_{p,1}$: $80\%$ passing size of feed ($d_{80, \text{feed}}$ in $\mu\text{m}$)
- $d_{p,2}$: $80\%$ passing size of product ($d_{80, \text{product}}$ in $\mu\text{m}$)

#### Part B: Vibrating Screen Effectiveness ($E$)
From particle technology principles, screening effectiveness measures how cleanly the screen separates oversized and undersized particles:

$$\text{Oversize Recovery } E_O = \frac{O \cdot x_O}{F \cdot x_F}$$

$$\text{Undersize Recovery } E_U = \frac{U \cdot (1 - x_U)}{F \cdot (1 - x_F)}$$

$$\text{Overall Screen Effectiveness } E = E_O \cdot E_U = \frac{O \cdot U \cdot x_O \cdot (1 - x_U)}{F^2 \cdot x_F \cdot (1 - x_F)}$$

Where:
- $F, O, U$: Mass flow rates of Feed, Overflow (Oversize), and Underflow (Undersize) in $\text{kg/h}$.
- $x_F, x_O, x_U$: Mass fraction of oversize material ($> d_{cut}$) in Feed, Overflow, and Underflow streams.

#### Part C: Bed Pressure Drop Validation (Ergun Equation)
To prove the quality of the engineered powder to the coffee customer:

$$\frac{\Delta P}{L} = 150 \frac{(1 - \epsilon)^2}{\epsilon^3} \frac{\mu \cdot u_0}{d_p^2} + 1.75 \frac{1 - \epsilon}{\epsilon^3} \frac{\rho \cdot u_0^2}{d_p}$$

Demonstrating that narrowing the PSD prevents filter blinding and channel-driven extraction failure.

### 4.2 Hand Calculation Verification Template
For your presentation slide and report:
* **Input Data:**
  - Fresh Feed Rate: $\dot{m}_{\text{fresh}} = 200\text{ kg/h} = 0.200\text{ metric ton/h}$
  - Recycle Rate: $\dot{m}_{\text{recycle}} = 50\text{ kg/h}$
  - Total Mill Feed Rate: $\dot{m} = 250\text{ kg/h} = 0.250\text{ metric ton/h}$
  - Feed $d_{80, 1} = 6500\,\mu\text{m}$ (whole bean)
  - Target Product $d_{80, 2} = 400\,\mu\text{m}$ (filter coffee)
  - Bond Work Index $W_i = 12.5\text{ kWh/tonne}$
* **Step-by-Step Manual Calculation:**
  1. Term 1: $\frac{1}{\sqrt{400}} = \frac{1}{20} = 0.0500\,\mu\text{m}^{-0.5}$
  2. Term 2: $\frac{1}{\sqrt{6500}} = \frac{1}{80.6226} = 0.0124\,\mu\text{m}^{-0.5}$
  3. Energy per ton: $E = 10 \times 12.5 \times (0.0500 - 0.0124) = 125 \times 0.0376 = 4.700\text{ kWh/tonne}$
  4. Total Power required: $P = \dot{m} \times E = 0.250\text{ ton/h} \times 4.700\text{ kWh/ton} = \mathbf{1.175\text{ kW}}$
* **Python Code Result:** The Python script must output exactly $1.175\text{ kW}$ (relative error $< 0.001\%$).

---

## Step 5: Simulate the Process & Generate the CSV Dataset

You must simulate the flowsheet over a range of operating parameters and export the precomputed cases to a CSV file.

### 5.1 Operating Range Parameter Matrix
- **Input Parameter 1: Fresh Bean Feed Rate ($\dot{m}_{\text{fresh}}$):**
  - Range: $50\text{ to }500\text{ kg/h}$ (step size: $25\text{ kg/h}$, 19 discrete levels).
- **Input Parameter 2: Target Brewing Grind Profile ($d_{50}$):**
  - **Espresso:** $d_{50} = 250\,\mu\text{m}$ (Roller gap $= 0.25\text{ mm}$, Screen mesh $= 350\,\mu\text{m}$)
  - **Drip / AeroPress:** $d_{50} = 550\,\mu\text{m}$ (Roller gap $= 0.55\text{ mm}$, Screen mesh $= 700\,\mu\text{m}$)
  - **French Press / Cold Brew:** $d_{50} = 950\,\mu\text{m}$ (Roller gap $= 0.95\text{ mm}$, Screen mesh $= 1100\,\mu\text{m}$)

### 5.2 Resulting CSV Dataset Structure (`simulation_dataset.csv`)
The CSV dataset contains the parametric results:
- `case_id`: Integer identifier ($1\text{ to }57$).
- `feed_rate_kgh`: Feed mass flow rate ($50\text{--}500\text{ kg/h}$).
- `grind_profile`: Category (`Espresso`, `Drip`, `FrenchPress`).
- `target_d50_um`: Target particle diameter ($\mu\text{m}$).
- `roller_gap_mm`: Mechanical clearance ($0.25\text{--}0.95\text{ mm}$).
- `recycle_rate_kgh`: Steady-state oversize recycle flow rate ($\text{kg/h}$).
- `recycle_ratio`: $R = \dot{m}_{\text{recycle}} / \dot{m}_{\text{fresh}}$.
- `product_yield_pct`: On-spec recovery percentage ($92\%\text{--}98\%$).
- `mill_power_kw`: Comminution power requirement ($\text{kW}$).
- `specific_energy_kwh_per_kg`: Energy efficiency metric ($\text{kWh/kg}$).
- `fines_percentage`: Undesirable fines $< 100\,\mu\text{m}$ ($3\%\text{--}7\%$).
- `ergun_pressure_drop_kpa`: Bed pressure drop during fluid extraction ($\text{kPa}$).

---

## Step 6: Interactive Website Development

The website is a **standalone engineering portal** for potential customers and evaluators.

### 6.1 Website Architecture
- **Zero Aspen Live Dependency:** Operates fully client-side using JavaScript/HTML5, loading the precomputed CSV dataset and running the live Python/JS engineering formulas.
- **Visual Design:** Professional chemical engineering startup aesthetic (deep espresso brown `#2C1810`, warm crema `#D4A373`, clean white background `#F9F9FB`, crisp modern typography).

### 6.2 Required Sections in Website
1. **Header & Hero Section:** 
   - BrewDz branding, company elevator pitch, target markets, and problem showcase.
2. **Interactive Process Flow Diagram (PFD):**
   - Clean SVG schematic of the closed-loop system: Feed Hopper $\to$ Chilled Roller Mill $\to$ Multi-Deck Vibrating Screen $\to$ Cyclone Air Classifier.
   - Interactive stream hover/click tooltips displaying mass flows, temperatures, and mean sizes.
3. **Interactive Engineering Calculator:**
   - **Inputs:** Slider for Feed Rate ($50\text{--}500\text{ kg/h}$), Dropdown for Brewing Method (Espresso, Drip, Cold Brew), Slider for Sieve Cut Size.
   - **Outputs:** Real-time computation of Mill Power ($\text{kW}$), Specific Energy ($\text{kWh/kg}$), Recycle Flow Rate ($\text{kg/h}$), Product Yield ($\%$), and Ergun Extraction $\Delta P$.
   - **Dataset Retrieval:** Interpolates values between nearest simulated grid points in `simulation_dataset.csv`.
4. **Interactive Engineering Plots (Chart.js / Plotly):**
   - **Chart 1:** Power & Specific Energy vs. Feed Rate.
   - **Chart 2:** Particle Size Distribution (PSD) Comparison: Standard Grinder (bimodal, broad span) vs. BrewDz Closed-Loop (narrow gaussian, high uniformity).
   - **Chart 3:** Extraction Yield & Bed Pressure Drop vs. Fines Fraction.
5. **Competitor Comparison Matrix:** 
   - Direct interactive comparison table against Kaapi Machines, Chapter One, and Raj Electricals.

---

## Step 7 & 8: Required Evaluation Presentation (Slide-by-Slide)

Your 8-slide presentation outline matching the exact evaluation rubric:

| Slide # | Slide Title | Core Technical Content to Include |
| :---: | :--- | :--- |
| **1** | **Company & Problem** | • Company Name: BrewDz Particle Engineering.<br>• Problem: Wide PSD, fines causing bitterness/blinding, boulders causing sour under-extraction.<br>• Target Customers: Specialty coffee roasters, commercial café chains, instant coffee extractors.<br>• Engineering Solution: Closed-loop chilled roller milling + screening with automated oversize recycle. |
| **2** | **Competitor Survey** | • Benchmark table: Kaapi Machines, Chapter One (Indore), Raj Electricals, Blue Tokai, Hosokawa.<br>• Identification of gap: Commercial units lack automated oversize recycle and narrow span control.<br>• Differentiation: $96\%$ on-spec yield, $65\%$ fines reduction, lower CapEx. |
| **3** | **Aspen Flowsheet** | • PFD showing Mixer, `CRUSH` (Roller Mill), `SCREEN` (Vibrating sieve), and Recycle stream.<br>• Stream definitions (`BEANS`, `GROUND`, `OVERSIZE`, `PRODUCT`).<br>• Justification of equipment sequence and key model assumptions. |
| **4** | **Aspen Simulation Results** | • Mass balances and stream summary tables across operating points.<br>• Sensitivity: Effect of changing feed rate ($50\text{--}500\text{ kg/h}$) and roller gap on stream splits.<br>• Model limitations (e.g., thermal equilibrium assumptions, constant particle sphericity). |
| **5** | **Python Equipment Calculations** | • Governing Equations: Bond's Comminution Law ($P = 10 W_i \dot{m} [1/\sqrt{d_2} - 1/\sqrt{d_1}]$) and Screen Effectiveness ($E = E_O \cdot E_U$).<br>• Code snippet & logic structure.<br>• Independent hand calculation verification table showing identical numerical agreement. |
| **6** | **CSV Dataset & Web Architecture** | • How Aspen simulation data was exported into `simulation_dataset.csv`.<br>• Dataset schema (57 operating cases, 11 columns).<br>• Search and interpolation algorithms used by the website for arbitrary user inputs. |
| **7** | **Live Website Demonstration** | • Live browser demo of the BrewDz web application.<br>• Interactively tweaking feed rate and grind mode.<br>• Demonstrating real-time updates to power consumption, yield, and dynamic PSD curves. |
| **8** | **Conclusions & Future Scope** | • Key engineering findings: Recycle loop increases total yield by $18.4\%$ compared to single-pass.<br>• Techno-economic feasibility & payback period.<br>• Future enhancements: Cryogenic nitrogen milling for $100\%$ aroma retention, machine learning vision for inline PSD monitoring. |

---

## Group Role Division (Suggested Plan for 4 Team Members)

To ensure smooth teamwork and high individual technical accountability:

- **Member 1: Process Simulation Lead (Aspen Flowsheet)**
  - Responsible for: Step 3 (Aspen Plus Solids setup, `CRUSH` and `SCREEN` blocks, recycle loop convergence, and stream summary tables).
- **Member 2: Computational Modeling Lead (Python & Math)**
  - Responsible for: Step 4 (Python implementation of Bond's Law, Screen Effectiveness, and Ergun equation, plus manual step-by-step verification).
- **Member 3: Web & Data Engineering Lead (Dataset & Interactive Portal)**
  - Responsible for: Steps 5 & 6 (Parametric simulation CSV generation, web application UI/UX, Chart.js visualizer, interpolation script).
- **Member 4: Market Strategy & Systems Lead (Survey & Presentation)**
  - Responsible for: Steps 1, 2, 7 & 8 (Indore & India competitor survey, business problem framing, slide deck preparation, and presentation rehearsal).

---

## Action Items: What We Will Create Next

We can now systematically generate all physical deliverables inside this workspace:
1. `coffee_particle_calc.py`: The complete verified Python calculation script.
2. `simulation_dataset.csv`: The multi-parameter Aspen simulation dataset.
3. `index.html`, `style.css`, `app.js`: The standalone interactive engineering website.
4. Presentation slide deck content and hand-calculation reference sheet.

