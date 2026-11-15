/**
 * BrewDz Particle Engineering - web application script
 * ChE 303: Fluid Particle Systems
 *
 * Data source: window.BREWDZ_DATA from simulation_data.js, which is written by
 * generate_simulation_dataset.py together with simulation_dataset.csv (same cases).
 * This script only retrieves and interpolates those cases; it also recomputes
 * Bond's law and the Ergun equation as an independent hand-check.
 */
(function () {
    'use strict';

    const D = window.BREWDZ_DATA;
    const $ = (id) => document.getElementById(id);

    if (!D) {
        document.body.insertAdjacentHTML('afterbegin',
            '<p style="padding:1rem;background:#fde8e0;color:#7a2a12">simulation_data.js is missing. Run <code>python generate_simulation_dataset.py</code> and reload.</p>');
        return;
    }

    // ---------------------------------------------------------------- data
    const COL = {};
    D.columns.forEach((c, i) => { COL[c] = i; });
    const NUMERIC = D.columns.filter(c => !['case_id', 'grind_profile'].includes(c));
    const PROFILE = {};
    D.profiles.forEach(p => { PROFILE[p.name] = p; });

    // GRID[profile][aperture][feed] -> row array
    const GRID = {};
    D.rows.forEach(r => {
        const p = r[COL.grind_profile], a = r[COL.screen_aperture_um], f = r[COL.feed_rate_kgh];
        ((GRID[p] = GRID[p] || {})[a] = GRID[p][a] || {})[f] = r;
    });

    function bracket(levels, x) {
        const v = Math.min(Math.max(x, levels[0]), levels[levels.length - 1]);
        let i = 0;
        while (i < levels.length - 2 && v > levels[i + 1]) i++;
        return { lo: levels[i], hi: levels[i + 1], t: (v - levels[i]) / (levels[i + 1] - levels[i]) };
    }

    /** Bilinear interpolation over feed rate x screen aperture for one grind profile. */
    function simulate(profileName, feed, aperture) {
        const prof = PROFILE[profileName];
        const fb = bracket(D.feedRates, feed);
        const ab = bracket(prof.apertures, aperture);
        const g = GRID[profileName];
        const out = { profile: profileName };
        NUMERIC.forEach(k => {
            const i = COL[k];
            const lo = g[ab.lo][fb.lo][i] * (1 - fb.t) + g[ab.lo][fb.hi][i] * fb.t;
            const hi = g[ab.hi][fb.lo][i] * (1 - fb.t) + g[ab.hi][fb.hi][i] * fb.t;
            out[k] = lo * (1 - ab.t) + hi * ab.t;
        });
        return out;
    }

    // ------------------------------------------------- independent formulas
    function bondKwhPerT(p80) {
        return 10 * D.params.bond_work_index_kwh_per_t * (1 / Math.sqrt(p80) - 1 / Math.sqrt(D.params.feed_d80_um));
    }
    function ergunKPa(d32um, prof) {
        const dp = d32um * 1e-6, e = prof.bedPorosity, u = prof.velocity;
        const mu = D.params.water_viscosity_Pas, rho = D.params.water_density_kgm3;
        const visc = 150 * Math.pow(1 - e, 2) / Math.pow(e, 3) * mu * u / (dp * dp);
        const inert = 1.75 * (1 - e) / Math.pow(e, 3) * rho * u * u / dp;
        return (visc + inert) * prof.bedLength / 1000;
    }

    const fmt = (x, n) => Number(x).toFixed(n);
    const pctDiff = (a, b) => (b === 0 ? 0 : Math.abs(a - b) / Math.abs(b) * 100);

    // ---------------------------------------------------------------- DOM
    const inputFeed = $('input-feed-rate');
    const inputMesh = $('input-screen-mesh');
    const selectProfile = $('select-grind-profile');
    let activeStream = 'product';
    let current = null;

    D.profiles.forEach(p => {
        const o = document.createElement('option');
        o.value = p.name;
        o.textContent = `${p.label} (nominal d50 ${p.targetD50} µm, roll gap ${p.rollerGap} mm)`;
        selectProfile.appendChild(o);
    });
    selectProfile.value = 'Drip_PourOver';

    function configureMeshSlider(reset) {
        const p = PROFILE[selectProfile.value];
        const lo = p.apertures[0], hi = p.apertures[p.apertures.length - 1];
        inputMesh.min = lo;
        inputMesh.max = hi;
        inputMesh.step = (p.apertures[1] - p.apertures[0]) / 5;
        if (reset) inputMesh.value = p.designAperture;
        $('mesh-min').textContent = `${lo} µm (finer)`;
        $('mesh-max').textContent = `${hi} µm (coarser)`;
    }

    // ------------------------------------------------------------- streams
    function streamInfo(key, r, prof) {
        const F = r.feed_rate_kgh, M = r.mill_total_feed_kgh, R = r.recycle_rate_kgh;
        const P = r.product_rate_kgh, X = r.fines_byproduct_kgh;
        const info = {
            beans: ['BEANS', F, `Whole roasted beans, d80 ≈ ${(D.params.feed_d80_um / 1000).toFixed(1)} mm. Fresh feed to the circuit.`],
            millfeed: ['MILL FEED', M, `Fresh beans plus recycled oversize: ${fmt(F, 1)} + ${fmt(R, 1)} kg/h. This is the load the mill must be sized for.`],
            ground: ['GROUND', M, `Mill discharge. Main mode Rosin–Rammler with d63 = ${prof.millD63} µm (n = ${D.params.rr_uniformity_n}), plus a ${fmt(prof.millFinesFrac * 100, 0)}% fines mode around ${D.params.fines_mode_median_um} µm.`],
            recycle: ['OVERSIZE RECYCLE', R, `Particles coarser than the ${fmt(r.screen_aperture_um, 0)} µm aperture return to the mixer. Circulating load R/F = ${fmt(r.recycle_ratio, 2)}.`],
            undersize: ['UNDERSIZE', F, `Screen undersize sent to the cyclone. At steady state it equals the fresh feed; d80 = ${fmt(r.circuit_p80_um, 0)} µm sets the Bond energy.`],
            product: ['PRODUCT', P, `De-dusted powder: d50 = ${fmt(r.product_d50_um, 0)} µm, d80 = ${fmt(r.product_d80_um, 0)} µm, span = ${fmt(r.product_span, 2)}, fines below 100 µm = ${fmt(r.fines_fraction_pct, 1)}%.`],
            fines: ['FINES', X, `Cyclone overflow (cut near ${D.params.cyclone_cut_um} µm), ${fmt(100 - r.product_yield_pct, 1)}% of the feed. Collected as a by-product for soluble-coffee extraction.`]
        };
        return info[key];
    }

    function renderStreamDetail() {
        if (!current) return;
        const [name, flow, desc] = streamInfo(activeStream, current, PROFILE[current.profile]);
        $('sd-name').textContent = name;
        $('sd-flow').textContent = `${fmt(flow, 1)} kg/h`;
        $('sd-desc').textContent = desc;
        document.querySelectorAll('.stream').forEach(g => {
            g.classList.toggle('active', g.dataset.stream === activeStream);
        });
    }

    document.querySelectorAll('.stream').forEach(g => {
        const pick = () => { activeStream = g.dataset.stream; renderStreamDetail(); };
        g.addEventListener('mouseenter', pick);
        g.addEventListener('focus', pick);
        g.addEventListener('click', pick);
    });

    // ------------------------------------------------------------- charts
    const HAS_CHART = typeof window.Chart !== 'undefined';
    const C = { ink: '#2C1810', muted: '#7A6A5C', grid: 'rgba(44,24,16,0.08)', espresso: '#8C3B1E', drip: '#C8915A', french: '#2F7D5B', conv: '#B4553F', brew: '#2F7D5B' };
    const PROFILE_COLOR = { Espresso: C.espresso, Drip_PourOver: C.drip, FrenchPress_ColdBrew: C.french };
    let chartPower = null, chartPSD = null, chartFines = null;

    function axis(title, extra) {
        return Object.assign({
            title: { display: true, text: title, color: C.muted, font: { size: 12 } },
            grid: { color: C.grid },
            ticks: { color: C.muted }
        }, extra || {});
    }

    const apertureLine = {
        id: 'apertureLine',
        afterDatasetsDraw(chart) {
            const a = chart.options.plugins.apertureLine && chart.options.plugins.apertureLine.value;
            if (!a) return;
            const x = chart.scales.x.getPixelForValue(a);
            const { top, bottom } = chart.chartArea;
            const ctx = chart.ctx;
            ctx.save();
            ctx.setLineDash([5, 4]);
            ctx.strokeStyle = C.ink;
            ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = C.ink;
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`cut ${Math.round(a)} µm`, x + 5, top + 12);
            ctx.restore();
        }
    };

    function initCharts() {
        if (!HAS_CHART) { $('chart-fallback').hidden = false; return; }
        Chart.defaults.font.family = '"Plus Jakarta Sans", system-ui, sans-serif';
        Chart.defaults.color = C.muted;
        const legend = { labels: { color: C.ink, boxWidth: 14, font: { size: 11 } } };

        chartPower = new Chart($('chartPowerFeed'), {
            type: 'line',
            data: {
                datasets: D.profiles.map(p => ({
                    label: p.label,
                    data: D.feedRates.map(f => ({ x: f, y: GRID[p.name][p.designAperture][f][COL.mill_power_kw] })),
                    borderColor: PROFILE_COLOR[p.name], backgroundColor: PROFILE_COLOR[p.name],
                    borderWidth: 2, pointRadius: 0
                })).concat([{
                    label: 'Operating point', data: [], showLine: false,
                    pointRadius: 7, pointHoverRadius: 8, pointBackgroundColor: '#fff',
                    pointBorderColor: C.ink, pointBorderWidth: 3, borderColor: C.ink, backgroundColor: '#fff'
                }])
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: { duration: 200 },
                plugins: { legend, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y.toFixed(2)} kW at ${c.parsed.x} kg/h` } } },
                scales: { x: axis('Fresh feed rate (kg/h)', { type: 'linear', min: 50, max: 500 }), y: axis('Mill power (kW)', { beginAtZero: true }) }
            }
        });

        chartPSD = new Chart($('chartPSD'), {
            type: 'line',
            data: {
                datasets: [
                    { label: 'Conventional open-loop grinder', data: [], borderColor: C.conv, backgroundColor: 'rgba(180,85,63,0.12)', borderDash: [6, 4], borderWidth: 2, pointRadius: 0, fill: true, tension: 0.3 },
                    { label: 'BrewDz closed-loop product', data: [], borderColor: C.brew, backgroundColor: 'rgba(47,125,91,0.18)', borderWidth: 2.5, pointRadius: 0, fill: true, tension: 0.3 }
                ]
            },
            plugins: [apertureLine],
            options: {
                responsive: true, maintainAspectRatio: false, animation: { duration: 200 },
                plugins: { legend, apertureLine: { value: null }, tooltip: { callbacks: { title: i => `${i[0].parsed.x} µm`, label: c => `${c.dataset.label}: ${c.parsed.y.toFixed(0)} %/decade` } } },
                scales: {
                    x: axis('Particle size (µm, log scale)', {
                        type: 'logarithmic', min: 10, max: 4000,
                        ticks: { color: C.muted, callback: v => ([10, 30, 100, 300, 1000, 3000].includes(v) ? v : '') }
                    }),
                    y: axis('Mass frequency (% per log decade)', { beginAtZero: true })
                }
            }
        });

        chartFines = new Chart($('chartFines'), {
            type: 'line',
            data: {
                datasets: [
                    { label: 'Pressure drop vs. fines', data: [], borderColor: C.drip, borderWidth: 2.5, pointRadius: 0, tension: 0.2 },
                    { label: 'BrewDz (your operating point)', data: [], showLine: false, pointRadius: 7, pointBackgroundColor: C.brew, pointBorderColor: '#fff', pointBorderWidth: 2, borderColor: C.brew, backgroundColor: C.brew },
                    { label: 'Conventional grinder', data: [], showLine: false, pointRadius: 7, pointStyle: 'rectRot', pointBackgroundColor: C.conv, pointBorderColor: '#fff', pointBorderWidth: 2, borderColor: C.conv, backgroundColor: C.conv }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: { duration: 200 },
                plugins: { legend, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y.toFixed(3)} kPa at ${c.parsed.x.toFixed(1)}% fines` } } },
                scales: { x: axis('Fines below 100 µm (% of product mass)', { type: 'linear', min: 0 }), y: axis('Bed pressure drop (kPa)', { beginAtZero: true }) }
            }
        });
    }

    function updateCharts(r, prof) {
        if (!HAS_CHART) return;
        chartPower.data.datasets[3].data = [{ x: r.feed_rate_kgh, y: r.mill_power_kw }];
        chartPower.data.datasets.forEach((ds, i) => { if (i < 3) ds.borderWidth = D.profiles[i].name === prof.name ? 3.5 : 1.5; });
        chartPower.update();

        chartPSD.data.datasets[0].data = D.chartSizes.map((s, i) => ({ x: s, y: prof.psdConventional[i] }));
        chartPSD.data.datasets[1].data = D.chartSizes.map((s, i) => ({ x: s, y: prof.psdBrewdz[i] }));
        chartPSD.options.plugins.apertureLine.value = r.screen_aperture_um;
        chartPSD.update();

        chartFines.data.datasets[0].data = prof.sweep.map(p => ({ x: p.finesPct, y: p.dP }));
        chartFines.data.datasets[1].data = [{ x: r.fines_fraction_pct, y: r.ergun_pressure_drop_kPa }];
        chartFines.data.datasets[2].data = [{ x: prof.conventional.finesPct, y: prof.conventional.dP }];
        chartFines.update();
    }

    // --------------------------------------------------------- hand-check
    function renderCheck(r, prof) {
        const F = r.feed_rate_kgh;
        const E = bondKwhPerT(r.circuit_p80_um);
        const P = F / 1000 * E;
        const dP = ergunKPa(r.sauter_d32_um, prof);
        const M = F + r.recycle_rate_kgh;
        const row = (step, calc, res, ref, unit, n) =>
            `<tr><td>${step}</td><td class="mono">${calc}</td><td class="mono">${fmt(res, n)} ${unit}<span class="diff">dataset ${fmt(ref, n)} · ${fmt(pctDiff(res, ref), 2)}% off</span></td></tr>`;
        $('check-body').innerHTML =
            row('Recycle balance', `M = F + R = ${fmt(F, 1)} + ${fmt(r.recycle_rate_kgh, 1)}`, M, r.mill_total_feed_kgh, 'kg/h', 1) +
            row('Bond energy', `E = 10 × ${D.params.bond_work_index_kwh_per_t} × (1/√${fmt(r.circuit_p80_um, 0)} − 1/√${D.params.feed_d80_um})`, E, r.specific_energy_kwh_per_kg * 1000, 'kWh/t', 3) +
            row('Mill power', `P = ${fmt(F / 1000, 3)} t/h × ${fmt(E, 3)} kWh/t`, P, r.mill_power_kw, 'kW', 3) +
            row('Ergun ΔP', `d32 = ${fmt(r.sauter_d32_um, 0)} µm, ε = ${prof.bedPorosity}, u = ${prof.velocity * 1000} mm/s, L = ${prof.bedLength * 1000} mm`, dP, r.ergun_pressure_drop_kPa, 'kPa', 3);
    }

    function renderParams() {
        const p = D.params;
        const rows = [
            ['Bond work index W<sub>i</sub> (assumed)', `${p.bond_work_index_kwh_per_t} kWh/t`],
            ['Feed size F<sub>80</sub> (whole bean)', `${p.feed_d80_um} µm`],
            ['Mill size rule', `d<sub>63</sub> = ${p.mill_size_factor} × roll gap`],
            ['Rosin–Rammler exponent n', `${p.rr_uniformity_n}`],
            ['Fines mode', `log-normal, median ${p.fines_mode_median_um} µm, σ<sub>g</sub> ${p.fines_mode_sigma_g}`],
            ['Mill fines share φ<sub>f</sub>', D.profiles.map(q => `${q.label.split(' ')[0]} ${fmt(q.millFinesFrac * 100, 0)}%`).join(' · ')],
            ['Screen recoveries', `E<sub>O</sub> = ${p.screen_oversize_recovery}, E<sub>U</sub> = ${p.screen_undersize_recovery}`],
            ['Cyclone grade efficiency', `T(d) = 1 / (1 + (d/${p.cyclone_cut_um} µm)<sup>${p.cyclone_sharpness_k}</sup>)`],
            ['Brew water (92 °C)', `ρ = ${p.water_density_kgm3} kg/m³, μ = ${p.water_viscosity_Pas} Pa·s`],
            ['Conventional grinder baseline', `${fmt(p.conventional_fines_frac * 100, 0)}% fines mode, n = ${p.conventional_rr_n}, same nominal d50`]
        ];
        $('param-body').innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td class="mono">${r[1]}</td></tr>`).join('');
    }

    function renderHero() {
        const stats = D.profiles.map(p => {
            const r = simulate(p.name, 250, p.designAperture);
            return { y: r.product_yield_pct, s: r.product_span, f: (1 - r.fines_fraction_pct / p.conventional.finesPct) * 100 };
        });
        const range = (k, n, suffix) => {
            const v = stats.map(s => s[k]);
            return `${fmt(Math.min(...v), n)}–${fmt(Math.max(...v), n)}${suffix}`;
        };
        $('hero-yield').textContent = range('y', 0, '%');
        $('hero-fines').textContent = range('f', 0, '%');
        $('hero-span').textContent = range('s', 2, '');
        $('footer-cases').textContent = D.rows.length;
    }

    // -------------------------------------------------------------- update
    function update() {
        const prof = PROFILE[selectProfile.value];
        const feed = parseFloat(inputFeed.value);
        const mesh = parseFloat(inputMesh.value);
        const r = simulate(prof.name, feed, mesh);
        current = r;

        $('val-feed-rate').textContent = `${feed} kg/h`;
        $('val-screen-mesh').textContent = `${mesh} µm`;

        $('out-power').textContent = `${fmt(r.mill_power_kw, 2)} kW`;
        $('out-spec-energy').textContent = `Specific energy ${fmt(r.specific_energy_kwh_per_kg * 1000, 2)} kWh per tonne of fresh feed`;
        $('out-recycle').textContent = `${fmt(r.recycle_rate_kgh, 1)} kg/h`;
        $('out-recycle-ratio').textContent = `Circulating load R/F = ${fmt(r.recycle_ratio, 2)} · mill throughput ${fmt(r.mill_total_feed_kgh, 0)} kg/h`;
        $('out-yield').textContent = `${fmt(r.product_yield_pct, 1)}%`;
        $('out-product').textContent = `${fmt(r.product_rate_kgh, 1)} kg/h product · ${fmt(r.fines_byproduct_kgh, 1)} kg/h fines by-product`;
        $('out-d50').textContent = `${fmt(r.product_d50_um, 0)} µm`;
        $('out-span').textContent = `Span ${fmt(r.product_span, 2)} (conventional ${fmt(prof.conventional.span, 2)}) · d80 ${fmt(r.product_d80_um, 0)} µm`;
        $('out-fines').textContent = `${fmt(r.fines_fraction_pct, 1)}%`;
        $('out-fines-cmp').textContent = `${fmt((1 - r.fines_fraction_pct / prof.conventional.finesPct) * 100, 0)}% lower than the conventional grinder model (${fmt(prof.conventional.finesPct, 1)}%)`;
        $('out-ergun').textContent = `${fmt(r.ergun_pressure_drop_kPa, 3)} kPa`;
        $('out-ergun-cmp').textContent = `Sauter d32 = ${fmt(r.sauter_d32_um, 0)} µm · conventional bed ${fmt(prof.conventional.dP, 3)} kPa (clean-bed estimate)`;

        $('pfd-beans').textContent = `${fmt(feed, 0)} kg/h`;
        $('pfd-millfeed').textContent = `${fmt(r.mill_total_feed_kgh, 0)} kg/h`;
        $('pfd-ground').textContent = `${fmt(r.mill_total_feed_kgh, 0)} kg/h`;
        $('pfd-recycle').textContent = `${fmt(r.recycle_rate_kgh, 0)} kg/h`;
        $('pfd-undersize').textContent = `${fmt(feed, 0)} kg/h`;
        $('pfd-product').textContent = `${fmt(r.product_rate_kgh, 0)} kg/h`;
        $('pfd-fines').textContent = `${fmt(r.fines_byproduct_kgh, 1)} kg/h`;
        $('pfd-gap').textContent = `gap ${prof.rollerGap} mm`;
        $('pfd-aperture').textContent = `${fmt(mesh, 0)} µm`;

        renderStreamDetail();
        renderCheck(r, prof);
        updateCharts(r, prof);
    }

    inputFeed.addEventListener('input', update);
    inputMesh.addEventListener('input', update);
    selectProfile.addEventListener('change', () => { configureMeshSlider(true); update(); });
    $('btn-reset-mesh').addEventListener('click', () => { configureMeshSlider(true); update(); });

    const navToggle = $('nav-toggle'), navLinks = $('nav-links');
    navToggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') { navLinks.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false'); }
    });

    configureMeshSlider(true);
    renderParams();
    renderHero();
    initCharts();
    update();
})();
