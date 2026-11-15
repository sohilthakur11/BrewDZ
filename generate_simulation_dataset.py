"""
ChE 303: Fluid Particle Systems
Course Project: Engineering the Perfect Coffee Powder
Company: BrewDz Particle Engineering Pvt. Ltd.

Module: Parametric Simulation Dataset Generator

This is a Python steady-state population model of the closed-loop circuit
(MIXER -> ROLLER MILL -> SCREEN -> CYCLONE, oversize recycled to the mixer).
It mirrors the structure of the Aspen Plus Solids flowsheet (CRUSH + SCREEN +
recycle) but it is NOT an Aspen export: every number is computed here.

Outputs (always written together, so they can never drift apart):
  simulation_dataset.csv  - 399 cases = 19 feed rates x 3 grind profiles x 7 screen apertures
  simulation_data.js      - the same cases + PSD curves + model parameters for the website

Model summary
  1. Mill product per pass = fines mode (log-normal) + main mode (Rosin-Rammler, d63 = 1.3 x roll gap).
  2. Screen: sharp cut at the aperture with imperfect recoveries E_O and E_U.
  3. Recycle closes analytically:  M = F / (1 - r),  r = fraction of mill product sent back.
  4. Cyclone de-dusts the screen undersize with a grade-efficiency curve T(d).
  5. Bond's law on fresh feed (closed-circuit convention), P80 = d80 of circuit product.
  6. Ergun equation for the brewing bed, using the Sauter mean diameter d32 of the product.
"""

import csv
import json
import math

# --------------------------------------------------------------------------
# Model parameters (all assumptions are listed here and shown on the website)
# --------------------------------------------------------------------------
PARAMS = {
    "bond_work_index_kwh_per_t": 12.5,   # assumed for roasted coffee
    "feed_d80_um": 6500.0,               # whole roasted bean
    "rr_uniformity_n": 3.5,              # Rosin-Rammler exponent, roller mill main mode
    "mill_size_factor": 1.3,             # mill characteristic size d63 = factor x roll gap
    "fines_mode_median_um": 40.0,        # log-normal fines mode produced by fracture
    "fines_mode_sigma_g": 1.8,
    "screen_oversize_recovery": 0.96,    # E_O: oversize reporting to the recycle
    "screen_undersize_recovery": 0.98,   # E_U: undersize reporting to the product side
    "cyclone_cut_um": 45.0,              # d_c in T(d) = 1 / (1 + (d/d_c)^k)
    "cyclone_sharpness_k": 3.0,
    "water_density_kgm3": 965.0,         # 92 C
    "water_viscosity_Pas": 0.000306,     # 92 C
    "conventional_fines_frac": 0.18,     # open-loop burr grinder: fines mode share
    "conventional_rr_n": 1.6,            # broad main mode
    "fines_limit_um": 100.0,
}

PROFILES = [
    {
        "name": "Espresso", "label": "Espresso",
        "target_d50_um": 250.0, "roller_gap_mm": 0.25,
        "design_aperture_um": 350.0, "aperture_step_um": 25.0,
        "mill_fines_frac": 0.10,
        "bed_porosity": 0.38, "bed_length_m": 0.02, "superficial_velocity_ms": 0.0022,
    },
    {
        "name": "Drip_PourOver", "label": "Drip / Pour-Over",
        "target_d50_um": 550.0, "roller_gap_mm": 0.55,
        "design_aperture_um": 700.0, "aperture_step_um": 50.0,
        "mill_fines_frac": 0.06,
        "bed_porosity": 0.44, "bed_length_m": 0.05, "superficial_velocity_ms": 0.0012,
    },
    {
        "name": "FrenchPress_ColdBrew", "label": "French Press / Cold Brew",
        "target_d50_um": 950.0, "roller_gap_mm": 0.95,
        "design_aperture_um": 1200.0, "aperture_step_um": 75.0,
        "mill_fines_frac": 0.04,
        "bed_porosity": 0.48, "bed_length_m": 0.08, "superficial_velocity_ms": 0.0008,
    },
]

FEED_RATES = list(range(50, 525, 25))  # 19 levels, kg/h

# --------------------------------------------------------------------------
# Size grid (log-spaced bins, 1 um to 10 mm)
# --------------------------------------------------------------------------
N_BINS = 640
EDGES = [10 ** (4.0 * i / N_BINS) for i in range(N_BINS + 1)]
CENTERS = [math.sqrt(EDGES[i] * EDGES[i + 1]) for i in range(N_BINS)]


def rr_cdf(d, d63, n):
    return 1.0 - math.exp(-((d / d63) ** n))


def lognormal_cdf(d, median, sigma_g):
    return 0.5 * (1.0 + math.erf(math.log(d / median) / (math.log(sigma_g) * math.sqrt(2.0))))


def bimodal_psd(fines_frac, d63, n):
    """Mass fraction per bin: fines log-normal mode + Rosin-Rammler main mode."""
    med, sg = PARAMS["fines_mode_median_um"], PARAMS["fines_mode_sigma_g"]
    out = []
    for i in range(N_BINS):
        lo, hi = EDGES[i], EDGES[i + 1]
        f = lognormal_cdf(hi, med, sg) - lognormal_cdf(lo, med, sg)
        m = rr_cdf(hi, d63, n) - rr_cdf(lo, d63, n)
        out.append(fines_frac * f + (1.0 - fines_frac) * m)
    s = sum(out)
    return [x / s for x in out]


def percentile(psd, q):
    """Size below which a mass fraction q of the (normalised) PSD lies."""
    total = sum(psd)
    target = q * total
    acc = 0.0
    for i, m in enumerate(psd):
        if acc + m >= target and m > 0:
            t = (target - acc) / m
            return EDGES[i] * (EDGES[i + 1] / EDGES[i]) ** t
        acc += m
    return EDGES[-1]


def fraction_below(psd, size):
    total = sum(psd)
    acc = 0.0
    for i, m in enumerate(psd):
        if EDGES[i + 1] <= size:
            acc += m
        elif EDGES[i] < size:
            acc += m * math.log(size / EDGES[i]) / math.log(EDGES[i + 1] / EDGES[i])
    return acc / total


def sauter_d32(psd):
    return sum(psd) / sum(m / d for m, d in zip(psd, CENTERS))


def span(psd):
    return (percentile(psd, 0.9) - percentile(psd, 0.1)) / percentile(psd, 0.5)


def ergun_kpa(dp_um, prof):
    dp = dp_um * 1e-6
    eps, u, L = prof["bed_porosity"], prof["superficial_velocity_ms"], prof["bed_length_m"]
    mu, rho = PARAMS["water_viscosity_Pas"], PARAMS["water_density_kgm3"]
    viscous = 150.0 * (1 - eps) ** 2 / eps ** 3 * mu * u / dp ** 2
    inertial = 1.75 * (1 - eps) / eps ** 3 * rho * u ** 2 / dp
    return (viscous + inertial) * L / 1000.0


def bond_kwh_per_t(p80_um):
    return 10.0 * PARAMS["bond_work_index_kwh_per_t"] * (
        1.0 / math.sqrt(p80_um) - 1.0 / math.sqrt(PARAMS["feed_d80_um"]))


def circuit(prof, d63, aperture):
    """Solve the closed loop per 1 kg/h of fresh feed. Returns intensive results + PSDs."""
    mill = bimodal_psd(prof["mill_fines_frac"], d63, PARAMS["rr_uniformity_n"])
    e_o, e_u = PARAMS["screen_oversize_recovery"], PARAMS["screen_undersize_recovery"]
    dc, k = PARAMS["cyclone_cut_um"], PARAMS["cyclone_sharpness_k"]

    under, over = [], []
    for m, d in zip(mill, CENTERS):
        to_over = e_o if d >= aperture else (1.0 - e_u)
        over.append(m * to_over)
        under.append(m * (1.0 - to_over))
    r = sum(over)                         # fraction of mill product recycled
    mill_per_feed = 1.0 / (1.0 - r)       # M / F
    under = [x * mill_per_feed for x in under]   # now sums to 1 (= F)

    product, fines = [], []
    for m, d in zip(under, CENTERS):
        t = 1.0 / (1.0 + (d / dc) ** k)
        fines.append(m * t)
        product.append(m * (1.0 - t))

    p80_circuit = percentile(under, 0.8)
    d32 = sauter_d32(product)
    return {
        "mill_per_feed": mill_per_feed,
        "recycle_ratio": mill_per_feed - 1.0,
        "yield_frac": sum(product),
        "product_d50": percentile(product, 0.5),
        "product_d80": percentile(product, 0.8),
        "span": span(product),
        "d32": d32,
        "fines_frac": fraction_below(product, PARAMS["fines_limit_um"]),
        "spec_energy_kwh_t": bond_kwh_per_t(p80_circuit),
        "p80_circuit": p80_circuit,
        "dP_kPa": ergun_kpa(d32, prof),
        "psd_product": product,
        "psd_mill": mill,
    }


def bisect(fn, lo, hi, target):
    """fn is increasing in its argument."""
    for _ in range(80):
        mid = 0.5 * (lo + hi)
        if fn(mid) < target:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


def curve_for_chart(psd, sizes):
    """Frequency (% per log10 size decade) sampled at chart sizes."""
    total = sum(psd)
    dlog = math.log10(EDGES[1] / EDGES[0])
    out = []
    for s in sizes:
        i = min(range(N_BINS), key=lambda j: abs(math.log(CENTERS[j] / s)))
        lo, hi = max(0, i - 4), min(N_BINS, i + 5)       # light smoothing
        out.append(round(100.0 * sum(psd[lo:hi]) / (hi - lo) / total / dlog, 2))
    return out


def generate_dataset():
    chart_sizes = [round(10 ** (1.0 + 2.6 * i / 79), 1) for i in range(80)]  # 10 um .. ~4 mm
    cases, profiles_out = [], []
    case_id = 1

    for prof in PROFILES:
        a0 = prof["design_aperture_um"]
        # Mill characteristic size follows the roll gap; product d50 is then a model OUTPUT
        d63 = PARAMS["mill_size_factor"] * prof["roller_gap_mm"] * 1000.0
        design = circuit(prof, d63, a0)

        # Conventional open-loop grinder set to the same nominal d50 (no screen, no cyclone)
        cf, cn = PARAMS["conventional_fines_frac"], PARAMS["conventional_rr_n"]
        cd63 = bisect(lambda x: percentile(bimodal_psd(cf, x, cn), 0.5), 50.0, 8000.0, prof["target_d50_um"])
        conv = bimodal_psd(cf, cd63, cn)
        conv_d32 = sauter_d32(conv)
        conventional = {
            "d50": round(percentile(conv, 0.5), 1),
            "d80": round(percentile(conv, 0.8), 1),
            "span": round(span(conv), 2),
            "d32": round(conv_d32, 1),
            "finesPct": round(100 * fraction_below(conv, PARAMS["fines_limit_um"]), 2),
            "bouldersPct": round(100 * (1 - fraction_below(conv, 2 * prof["target_d50_um"])), 2),
            "dP": round(ergun_kpa(conv_d32, prof), 3),
            "specE": round(bond_kwh_per_t(percentile(conv, 0.8)) / 1000.0, 6),
        }

        # Pressure drop vs fines sweep: coarse (fines-free) product blended with the fines mode
        coarse = bimodal_psd(0.0, d63, PARAMS["rr_uniformity_n"])
        coarse = [m if d < a0 else 0.0 for m, d in zip(coarse, CENTERS)]
        cs = sum(coarse)
        coarse = [m / cs for m in coarse]
        fines_mode = bimodal_psd(1.0, d63, PARAMS["rr_uniformity_n"])
        sweep = []
        for j in range(0, 26):
            x = j / 100.0
            blend = [(1 - x) * c + x * f for c, f in zip(coarse, fines_mode)]
            sweep.append({
                "finesPct": round(100 * fraction_below(blend, PARAMS["fines_limit_um"]), 2),
                "dP": round(ergun_kpa(sauter_d32(blend), prof), 3),
            })

        apertures = [a0 + (k - 3) * prof["aperture_step_um"] for k in range(7)]
        for a in apertures:
            res = design if a == a0 else circuit(prof, d63, a)
            for f_rate in FEED_RATES:
                spec_e_kwh_kg = res["spec_energy_kwh_t"] / 1000.0
                cases.append({
                    "case_id": case_id,
                    "feed_rate_kgh": f_rate,
                    "grind_profile": prof["name"],
                    "nominal_d50_um": prof["target_d50_um"],
                    "roller_gap_mm": prof["roller_gap_mm"],
                    "screen_aperture_um": a,
                    "mill_total_feed_kgh": round(f_rate * res["mill_per_feed"], 2),
                    "recycle_rate_kgh": round(f_rate * res["recycle_ratio"], 2),
                    "recycle_ratio": round(res["recycle_ratio"], 4),
                    "product_rate_kgh": round(f_rate * res["yield_frac"], 2),
                    "fines_byproduct_kgh": round(f_rate * (1 - res["yield_frac"]), 2),
                    "product_yield_pct": round(100 * res["yield_frac"], 2),
                    "product_d50_um": round(res["product_d50"], 1),
                    "product_d80_um": round(res["product_d80"], 1),
                    "product_span": round(res["span"], 3),
                    "circuit_p80_um": round(res["p80_circuit"], 1),
                    "sauter_d32_um": round(res["d32"], 1),
                    "fines_fraction_pct": round(100 * res["fines_frac"], 2),
                    "mill_power_kw": round(f_rate * spec_e_kwh_kg, 4),
                    "specific_energy_kwh_per_kg": round(spec_e_kwh_kg, 6),
                    "ergun_pressure_drop_kPa": round(res["dP_kPa"], 3),
                })
                case_id += 1

        profiles_out.append({
            "name": prof["name"], "label": prof["label"],
            "targetD50": prof["target_d50_um"], "rollerGap": prof["roller_gap_mm"],
            "designAperture": a0, "apertures": apertures,
            "millD63": round(d63, 1), "millFinesFrac": prof["mill_fines_frac"],
            "bedPorosity": prof["bed_porosity"], "bedLength": prof["bed_length_m"],
            "velocity": prof["superficial_velocity_ms"],
            "conventional": conventional,
            "psdBrewdz": curve_for_chart(design["psd_product"], chart_sizes),
            "psdConventional": curve_for_chart(conv, chart_sizes),
            "sweep": sweep,
        })

        print(f"{prof['name']:22s} d63={d63:7.1f} um | recycle ratio={design['recycle_ratio']:.3f} "
              f"yield={100*design['yield_frac']:.2f}% d50={design['product_d50']:.0f} d80={design['product_d80']:.0f} "
              f"span={design['span']:.2f} d32={design['d32']:.0f} fines={100*design['fines_frac']:.2f}% "
              f"E={design['spec_energy_kwh_t']:.3f} kWh/t dP={design['dP_kPa']:.3f} kPa")
        print(f"{'  conventional':22s} {conventional}")

    with open("simulation_dataset.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(cases[0].keys()))
        writer.writeheader()
        writer.writerows(cases)

    keys = list(cases[0].keys())
    payload = {
        "params": PARAMS,
        "feedRates": FEED_RATES,
        "chartSizes": chart_sizes,
        "profiles": profiles_out,
        "columns": keys,
        "rows": [[c[k] for k in keys] for c in cases],
    }
    with open("simulation_data.js", "w", encoding="utf-8") as f:
        f.write("// AUTO-GENERATED by generate_simulation_dataset.py - do not edit by hand.\n")
        f.write("// Same cases as simulation_dataset.csv, embedded so the site also works from file://\n")
        f.write("window.BREWDZ_DATA = ")
        json.dump(payload, f, separators=(",", ":"))
        f.write(";\n")

    print(f"\nWrote {len(cases)} cases to simulation_dataset.csv and simulation_data.js")


if __name__ == "__main__":
    generate_dataset()
