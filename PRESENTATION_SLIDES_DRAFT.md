# ChE 303: Final Evaluation Presentation Slide Deck
## Project: Engineering the Perfect Coffee Powder
**Company:** BrewDz Particle Engineering Pvt. Ltd.  
**Course:** ChE 303: Fluid Particle Systems  

---

### Slide 1: Company Profile & Problem Formulation
* **Slide Title:** BrewDz Particle Engineering: Redefining Coffee Powder Physics
* **Company Identity:**
  * **Name:** BrewDz Particle Engineering Pvt. Ltd. (Sanwer Road Industrial Area, Indore, MP).
  * **Mission:** Engineering narrow-span coffee powders for uniform fluid percolation and flavor extraction.
* **Target Customers:**
  * Specialty cafés & artisanal roasters (e.g., Chapter One Indore, Blue Tokai, Subko).
  * Industrial instant coffee and soluble extraction manufacturers (Tata Coffee, CCL Products).
  * Commercial roasteries seeking toll-classification and custom-milled particle packs.
* **The Engineering Problem:**
  * Standard burr/disc mills produce wide, bimodal Particle Size Distributions (PSD).
  * **"Boulders" (> 1000 µm):** Under-extract due to long internal diffusion pathways, causing sourness.
  * **"Fines" (< 100 µm):** Blind bed filter pores, causing channel-flow and over-extracting bitter astringents.
  * No classification step: off-size material goes straight into the product (baseline model: 18% fines mode, span ≈ 2.3–2.4).
* **BrewDz Proposed Solution:**
  * Closed-loop, low-shear chilled roller milling with continuous vibrating screen classification and automated oversize recycle and cyclone de-dusting. Modelled on-spec yield is $92\text{--}96\%$; the rest is recovered as a fines by-product, not waste.

---

### Slide 2: Competitor Benchmarking Survey (Indore & India)
* **Slide Title:** Competitor Landscape & Market Differentiation
* **Market Comparison Matrix:**
  * **Kaapi Machines (Pan-India):** Distributors of imported Mahlkönig/Ditting commercial grinders. *Limitation:* High CapEx (₹3L–₹15L); open-loop batch processing without oversize recycle.
  * **Chapter One Coffee Roasters (Indore, MP):** Local specialty café and roastery. *Limitation:* Relies on manual batch retail grinders; subject to batch-to-batch PSD drift; manual disposal of fines.
  * **Raj Electricals / Gujarat Millers (Indore Industrial Belt):** Heavy disc/hammer pulverizers. *Limitation:* Severe impact shear causing frictional heating (>55°C) that volatilizes aromatic oils; excessive fines (>30%).
  * **Hosokawa Micron India (Chennai):** Enterprise Air Classifier Mills (ACM). *Limitation:* Geared for ton/hr bulk mineral/chemical plants; prohibitively expensive for food startups (>₹50L).
* **BrewDz Differentiation:**
  * Modular, food-grade closed-loop milling sized for SME roasters (50–500 kg/h).
  * Integrated screen with automated recycle: $92\text{--}96\%$ on-spec product in the model, with fines cut by $72\text{--}86\%$ against the open-loop baseline.
  * *Before presenting: confirm every competitor figure on this slide (prices, temperatures, fines percentages) against a cited source, or remove it.*
  * Chilled-roll temperature control (<28°C) preventing aroma loss.

---

### Slide 3: Aspen Plus Solids Flowsheet Design
* **Slide Title:** Process Flowsheet Architecture & Modeling Strategy
* **Simulation Configuration:**
  * **Stream Class:** `SOLIDS` / `CISOLID` with geometric PSD mesh (10 bins from $50\,\mu\text{m}$ to $2000\,\mu\text{m}$).
  * **Property Method:** `SOLIDS` (Solid density $\rho_s = 1250\text{ kg/m}^3$, Bulk density $\rho_b \approx 400\text{ kg/m}^3$).
* **Equipment Blocks & Sequence:**
  1. **`MIXER`:** Combines fresh whole beans (6.5 mm) with recycled oversize coffee particles.
  2. **`CRUSH` (Roller Mill):** Low-shear size reduction based on breakage selection matrices.
  3. **`SCREEN` (Vibrating Sieve):** Separates oversize boulders from the product stream ($E_O = 0.96$, $E_U = 0.98$).
  4. **Cyclone:** De-dusts the screen undersize; super-fines leave as a by-product.
* **Note on the dataset:** the website dataset is produced by a Python steady-state model (`generate_simulation_dataset.py`) that mirrors this flowsheet. It is not an Aspen export; present Aspen results separately if you have them.
* **Recycle Stream Justification:**
  * Oversize stream is rerouted to the mixer, closing the loop and eliminating disposal losses.
* **Key Model Assumptions:**
  * Steady-state continuous operation; isothermal comminution via jacketed cooling water; negligible solids attrition in ducting.

---

### Slide 4: Aspen Simulation Results & Material Balances
* **Slide Title:** Stream Balances & Parametric Sensitivity Analysis
* **Mass Balance Closure:**
  * Espresso, 100 kg/h fresh beans, 350 µm screen: 100 + 33.7 kg/h oversize recycle = 133.7 kg/h mill throughput.
  * Product stream: 91.5 kg/h powder (product $d_{50} = 255\,\mu\text{m}$, span 0.81).
  * Cyclone fines by-product: 8.5 kg/h.
* **Parametric Sensitivity:**
  * Feed rate varied from 50 to 500 kg/h across 3 grind profiles and 7 screen apertures each.
  * A finer screen gives a finer product but raises the circulating load (Drip: $R/F$ from 0.19 at 850 µm to 1.62 at 550 µm).
  * Mill power scales linearly with throughput ($P = 0.28\text{ kW}$ at 50 kg/h to $2.78\text{ kW}$ at 500 kg/h for Espresso, design aperture).
  * Recycle ratio $R = \dot{m}_{\text{recycle}} / \dot{m}_{\text{fresh}}$ remains constant at steady-state for a given roll gap and screen aperture.
* **Model Limitations:**
  * Bond work index and mill PSD parameters are assumed, not measured; recycled oversize is assumed to re-break like fresh feed.
  * Assumes homogeneous bean hardness; does not account for roast-level brittleness variance (light vs. dark roast).

---

### Slide 5: Python Equipment Calculations & Independent Verification
* **Slide Title:** Equipment Sizing, Bond's Comminution Law, & Hand Verification
* **Governing Equations:**
  * **Bond's Law for Mill Power:**
    $$P = 10 \cdot W_i \cdot \dot{m} \left( \frac{1}{\sqrt{d_{p,2}}} - \frac{1}{\sqrt{d_{p,1}}} \right)$$
    Where $W_i = 12.5\text{ kWh/tonne}$ (assumed), $\dot{m} = 0.250\text{ ton/h}$ of fresh feed (closed-circuit convention), $d_{p,1} = 6500\,\mu\text{m}$, $d_{p,2} = 400\,\mu\text{m}$.
  * **Screen Effectiveness ($E$):**
    $$E = E_O \cdot E_U = \left( \frac{O \cdot x_O}{F \cdot x_F} \right) \left( \frac{U \cdot (1 - x_U)}{F \cdot (1 - x_F)} \right)$$
* **Sample Calculation vs. Python Output:**
  * Analytical Hand Calc: $E = 10 \times 12.5 \times (0.0500 - 0.0124) = 4.700\text{ kWh/t} \implies P = 0.250 \times 4.700 = \mathbf{1.1749\text{ kW}}$.
  * Python Script: `P = 1.1749 kW` (Discrepancy: $0.0000000000\text{ kW}$ — $100\%$ exact match).
  * Screen Effectiveness: Analytical $= 84.14\%$; Python $= 84.14\%$ ($100\%$ match).

---

### Slide 6: Simulation Dataset & Web Architecture
* **Slide Title:** CSV Data Infrastructure & Client-Side System Integration
* **Dataset Structure (`simulation_dataset.csv`):**
  * 399 cases: 19 feed rates (50–500 kg/h) × 3 brewing profiles × 7 screen apertures, from the Python steady-state model.
  * Key fields: `feed_rate_kgh`, `grind_profile`, `screen_aperture_um`, `recycle_rate_kgh`, `recycle_ratio`, `product_yield_pct`, `product_d50_um`, `product_span`, `sauter_d32_um`, `fines_fraction_pct`, `mill_power_kw`, `specific_energy_kwh_per_kg`, `ergun_pressure_drop_kPa`.
  * `simulation_data.js` is written by the same script, so the site and the CSV always match.
* **Website Retrieval & Interpolation Engine:**
  * Standalone client-side web application (HTML5/CSS3/JavaScript).
  * Implements bilinear interpolation (feed rate × screen aperture) between precomputed cases.
  * Zero live Aspen dependency: instant response time for potential customers.

---

### Slide 7: Live Website Demonstration
* **Slide Title:** Interactive Process Portal Demonstration
* **Live Demo Highlights:**
  1. **Dynamic PFD:** Visualizing mass flow rates and stream compositions on the animated flowsheet.
  2. **Real-Time Sliders:** Toggling feed rate (50–500 kg/h) and observing real-time updates in mill power and recycle loads.
  3. **Grind Profile Switching:** Comparing Espresso ($250\,\mu\text{m}$), Drip ($550\,\mu\text{m}$), and French Press ($950\,\mu\text{m}$).
  4. **Interactive PSD Plot:** Demonstrating the stark contrast between standard bimodal grinding and BrewDz narrow-span powder.

---

### Slide 8: Conclusions, Limitations, & Future Roadmap
* **Slide Title:** Key Findings, Engineering Impact, & Future Work
* **Key Findings:**
  * Closed-loop classification narrows the PSD span from about 2.3–2.4 (open-loop baseline) to 0.70–0.81, with $92\text{--}96\%$ on-spec yield.
  * Fines below 100 µm fall by $72\text{--}86\%$ against the baseline model.
  * Specific energy is $0.0022\text{--}0.0056\text{ kWh/kg}$ (French Press to Espresso).
  * Clean-bed Ergun pressure drop is roughly 4–14× lower than the baseline, because fines dominate the Sauter diameter.
* **Engineering Limitations:**
  * Results come from a model with assumed material parameters; the Ergun values are relative, not a prediction of real espresso puck pressure.
  * Vibrating screens for very fine powders (<150 µm) require ultrasonic anti-blinding transducers.
* **Future Work & Scalability:**
  * Cryogenic liquid nitrogen pre-cooling for $100\%$ volatile terpene preservation.
  * Inline laser diffraction particle size analyzer with automated feedback to roller gap actuators.

---

### Evaluation Defense: Potential Viva Questions & Answers
1. **Q: Why choose Bond's law over Kick's or Rittinger's law for coffee beans?**  
   *A:* Bond's law applies in the sub-centimeter to coarse powder regime ($100\,\mu\text{m} \le d_p \le 50\text{ mm}$), where both volume deformation and surface cracking contribute significantly to energy absorption. Kick's law applies to coarse crushing (>50 mm), and Rittinger's law applies only to ultra-fine grinding (<10–50 µm).
2. **Q: How does the recycle stream reach steady state without accumulating solids?**  
   *A:* The roller mill operates with a specific breakage matrix. Because oversized particles are repeatedly fractured during each pass, the mass of oversized solids produced matches the rate of size reduction into undersize, so the loop converges. In the Python model it closes analytically, $M = F / (1 - r)$ with $r$ the recycled fraction of mill product; in Aspen the same loop is converged with Wegstein iteration.
3. **Q: What is the fluid particle relevance of the Ergun equation in your project?**  
   *A:* Coffee brewing is flow through a packed porous bed. The Ergun equation shows that pressure drop is inversely proportional to $d_p^2$ in the viscous regime. Fines dramatically spike $\Delta P$, causing filter blinding and localized channel flow, which destroys extraction consistency.

