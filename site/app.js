/* Startup College Tier List: the page. Reads RANKING_DATA and Scoring, renders everything. */
(function () {
  const DATA = window.RANKING_DATA;
  const { compute, SIGNALS, DEFAULTS, TIERS } = window.Scoring;

  // Related sectors share a hue family (see styles.css --sec-*).
  const SECTORS = [
    ["ai", "AI"], ["soft", "Software & cloud"], ["sec", "Security"],
    ["chip", "Chips"], ["dev", "Devices & hardware"],
    ["web", "Internet & social"], ["media", "Media & games"],
    ["shop", "Commerce & marketplaces"], ["retail", "Consumer brands & retail"],
    ["fin", "Finance & fintech"],
    ["bio", "Biotech & pharma"], ["med", "Medtech & genomics"],
    ["space", "Space, defense & robotics"], ["energy", "EVs & energy"], ["move", "Transport & logistics"],
  ];
  const SECTOR_NAME = Object.fromEntries(SECTORS);
  const REGIONS = ["North America", "Europe", "Middle East", "Asia", "Latin America", "Oceania"];
  const SIGNAL_INFO = {
    value: { name: "Value created", short: "Value", fmt: (r) => "$" + fmtB(sumValue(r)) + " peak" },
    count: { name: "Companies", short: "Companies", fmt: (r) => fmtNum(r.signals.count) + " companies" },
    impact: { name: "Impact", short: "Impact", fmt: (r) => fmtNum(r.signals.impact) + " impact pts" },
    density: { name: "Per student", short: "Per student", fmt: (r) => r.signals.density.toFixed(2) + " pts / 10k students" },
  };
  const ERAS = [
    ["all", "All years", 0, 9999], ["pre90", "Before 1990", 0, 1989],
    ["90s00s", "1990–2009", 1990, 2009], ["since10", "2010 and later", 2010, 9999],
  ];
  const ROLE_NAME = { ug: "undergrad", grad: "grad", left: "left" };

  const regionVar = (r) => `var(--reg-${r.toLowerCase().replace(/ /g, "-")})`;
  const sectorVar = (s) => `var(--sec-${s})`;
  const sigVar = (k) => `var(--sig-${k})`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmtNum = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  function fmtB(b) {
    if (b >= 1000) return (b / 1000).toFixed(b >= 10000 ? 0 : 1) + "T";
    if (b >= 1) return Math.round(b) + "B";
    return b > 0 ? b.toFixed(1) + "B" : "0";
  }
  const sumValue = (r) => r.companies.reduce((s, x) => s + x.share * (x.company.v || 0), 0);
  const tag = (label, color) => `<span class="tag" style="--c:${color}">${esc(label)}</span>`;

  // ---- state
  let state = freshState();
  let rows = [];
  let sort = { key: "rank", asc: true };
  let showAllD = false;

  function freshState() {
    return {
      weights: { ...DEFAULTS.weights },
      roles: { ...DEFAULTS.roles },
      split: false,
      era: "all",
      sectors: new Set(SECTORS.map((s) => s[0])),
      regions: new Set(REGIONS),
    };
  }

  function options() {
    const era = ERAS.find((e) => e[0] === state.era);
    return {
      weights: state.weights,
      roles: state.roles,
      split: state.split,
      yearMin: era[2],
      yearMax: era[3],
      sectors: state.sectors.size === SECTORS.length ? null : [...state.sectors],
      regions: state.regions.size === REGIONS.length ? null : [...state.regions],
    };
  }

  // ---- controls
  function buildControls() {
    const w = document.getElementById("weights");
    w.innerHTML = SIGNALS.map((k) => `
      <div class="weight">
        <span class="swatch" style="background:${sigVar(k)}"></span>
        <label for="w-${k}">${SIGNAL_INFO[k].name}<input type="range" id="w-${k}" min="0" max="100" step="5" data-w="${k}"></label>
        <output for="w-${k}" id="wo-${k}"></output>
      </div>`).join("");
    w.addEventListener("input", (e) => {
      const k = e.target.dataset.w;
      if (!k) return;
      state.weights[k] = +e.target.value;
      update();
    });

    document.querySelectorAll("[data-role]").forEach((cb) =>
      cb.addEventListener("change", () => { state.roles[cb.dataset.role] = cb.checked; update(); }));
    document.getElementById("split").addEventListener("change", (e) => { state.split = e.target.checked; update(); });

    const era = document.getElementById("era");
    era.innerHTML = ERAS.map(([k, label]) => `<button type="button" role="radio" data-era="${k}">${label}</button>`).join("");
    era.addEventListener("click", (e) => {
      const k = e.target.dataset.era;
      if (k) { state.era = k; update(); }
    });

    const sec = document.getElementById("sectors");
    sec.innerHTML = SECTORS.map(([k, label]) =>
      `<button type="button" class="chip" data-sector="${k}" style="--c:${sectorVar(k)}"><span class="dot"></span>${label}</button>`).join("");
    sec.addEventListener("click", (e) => {
      const b = e.target.closest("[data-sector]");
      if (!b) return;
      toggle(state.sectors, b.dataset.sector, e.altKey || e.metaKey);
      update();
    });
    document.getElementById("sectors-all").addEventListener("click", () => {
      state.sectors = new Set(SECTORS.map((s) => s[0])); update();
    });

    const reg = document.getElementById("regions");
    reg.innerHTML = REGIONS.map((r) =>
      `<button type="button" class="chip" data-region="${r}" style="--c:${regionVar(r)}"><span class="dot"></span>${r}</button>`).join("");
    reg.addEventListener("click", (e) => {
      const b = e.target.closest("[data-region]");
      if (!b) return;
      toggle(state.regions, b.dataset.region, e.altKey || e.metaKey);
      update();
    });
    document.getElementById("regions-all").addEventListener("click", () => {
      state.regions = new Set(REGIONS); update();
    });

    document.getElementById("reset").addEventListener("click", () => { state = freshState(); showAllD = false; update(); });
  }

  // Click toggles one; ⌥/⌘-click shows only that one.
  function toggle(set, key, solo) {
    if (solo) { set.clear(); set.add(key); return; }
    if (set.has(key)) { if (set.size > 1) set.delete(key); } else set.add(key);
  }

  function syncControls() {
    for (const k of SIGNALS) {
      document.getElementById("w-" + k).value = state.weights[k];
      document.getElementById("wo-" + k).textContent = state.weights[k];
    }
    document.querySelectorAll("[data-role]").forEach((cb) => (cb.checked = state.roles[cb.dataset.role]));
    document.getElementById("split").checked = state.split;
    document.querySelectorAll("[data-era]").forEach((b) => b.setAttribute("aria-checked", b.dataset.era === state.era));
    document.querySelectorAll("[data-sector]").forEach((b) => b.setAttribute("aria-pressed", state.sectors.has(b.dataset.sector)));
    document.querySelectorAll("[data-region]").forEach((b) => b.setAttribute("aria-pressed", state.regions.has(b.dataset.region)));
  }

  // ---- tiers
  function renderTiers() {
    const el = document.getElementById("tiers");
    el.innerHTML = TIERS.map(({ key, min }) => {
      let list = rows.filter((r) => r.tier === key);
      const total = list.length;
      const cap = key === "D" && !showAllD ? 24 : Infinity;
      list = list.slice(0, cap);
      const cards = list.map((r) => `
        <button type="button" class="college-card" data-id="${r.id}" style="--c:${regionVar(r.region)}"
          title="${esc(r.country)}">
          <span class="nm">${esc(r.name)}</span>
          <span class="st">${Math.floor(r.score)} · ${fmtNum(r.signals.count)} ${r.signals.count === 1 ? "company" : "companies"}</span>
        </button>`).join("");
      const more = total > list.length
        ? `<button type="button" class="tier-more" id="more-d">+ ${total - list.length} more</button>` : "";
      const label = key === "D" ? "below 6" : `${min}+`;
      return `<div class="tier-row" style="--t:var(--tier-${key});--ti:var(--tier-ink-${key})">
        <div class="tier-label"><div>${key}<small>${label}</small></div></div>
        <div class="tier-cards">${cards || '<span class="empty">No colleges in this tier with these settings.</span>'}${more}</div>
      </div>`;
    }).join("");
  }

  // ---- chart: top 15 as stacked horizontal bars
  function renderChart() {
    document.getElementById("legend").innerHTML = SIGNALS.map((k) =>
      `<span style="--c:${sigVar(k)}"><i></i>${SIGNAL_INFO[k].name} (${state.weights[k]})</span>`).join("");

    const top = rows.slice(0, 15);
    const box = document.getElementById("chart");
    if (!top.length) { box.innerHTML = '<p class="empty">Nothing matches these filters.</p>'; return; }
    const W = Math.max(320, box.clientWidth - 32);
    const narrow = W < 560;
    const labelW = narrow ? 120 : 250;
    const valW = 36;
    const barH = 18, gap = 10, axisH = 22;
    const plotW = W - labelW - valW;
    const H = top.length * (barH + gap) + axisH;
    const x = (v) => labelW + (v / 100) * plotW;

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Top 15 colleges by score, split into signal contributions">`;
    for (const t of [0, 25, 50, 75, 100]) {
      svg += `<line class="gridline" x1="${x(t)}" x2="${x(t)}" y1="0" y2="${H - axisH + 4}"/>`;
      svg += `<text class="axis" x="${x(t)}" y="${H - 4}" text-anchor="middle">${t}</text>`;
    }
    top.forEach((r, i) => {
      const y = i * (barH + gap);
      const name = narrow && r.name.length > 16 ? r.name.slice(0, 15) + "…" : r.name;
      svg += `<rect class="row-hit" x="0" y="${y - gap / 2}" width="${W}" height="${barH + gap}" data-id="${r.id}"/>`;
      svg += `<text class="lbl" x="${labelW - 10}" y="${y + barH / 2 + 4.5}" text-anchor="end" pointer-events="none">${esc(name)}</text>`;
      let cx = x(0);
      const segs = SIGNALS.filter((k) => r.contrib[k] > 0.05);
      segs.forEach((k, j) => {
        const w = (r.contrib[k] / 100) * plotW;
        const isLast = j === segs.length - 1;
        // 2px surface gap between stacked segments; rounded data-end on the last one
        const drawW = Math.max(0, w - (isLast ? 0 : 2));
        if (isLast && drawW > 4) {
          svg += `<path class="seg-rect" d="M${cx},${y} h${drawW - 4} a4,4 0 0 1 4,4 v${barH - 8} a4,4 0 0 1 -4,4 h${-(drawW - 4)} z" fill="${sigVar(k)}" data-id="${r.id}" data-sig="${k}"/>`;
        } else {
          svg += `<rect class="seg-rect" x="${cx}" y="${y}" width="${drawW}" height="${barH}" fill="${sigVar(k)}" data-id="${r.id}" data-sig="${k}"/>`;
        }
        cx += w;
      });
      svg += `<text class="val" x="${x(r.score) + 6}" y="${y + barH / 2 + 4}" pointer-events="none">${r.score.toFixed(0)}</text>`;
    });
    svg += "</svg>";
    box.innerHTML = svg;
  }

  function chartTooltip(e) {
    const tip = document.getElementById("tooltip");
    const t = e.target.closest("[data-id]");
    if (!t || !t.closest("#chart")) { tip.hidden = true; return; }
    const r = rows.find((x) => x.id === t.dataset.id);
    if (!r) return;
    const sig = t.dataset.sig;
    tip.innerHTML = `<b>${esc(r.name)}</b>` +
      SIGNALS.map((k) => `<div class="row" style="${k === sig ? "color:var(--text);font-weight:600" : ""}">
        <span>${SIGNAL_INFO[k].short}</span><span>+${r.contrib[k].toFixed(1)} · ${esc(SIGNAL_INFO[k].fmt(r))}</span></div>`).join("") +
      `<div class="row" style="color:var(--text)"><span>Score</span><span>${r.score.toFixed(1)} (${r.tier} tier)</span></div>`;
    tip.hidden = false;
    const pad = 14;
    let left = e.clientX + pad, top = e.clientY + pad;
    const b = tip.getBoundingClientRect();
    if (left + b.width > window.innerWidth - 8) left = e.clientX - b.width - pad;
    if (top + b.height > window.innerHeight - 8) top = e.clientY - b.height - pad;
    tip.style.left = Math.max(8, left) + "px";
    tip.style.top = Math.max(8, top) + "px";
  }

  // ---- full table
  function renderTable() {
    const q = document.getElementById("search").value.trim().toLowerCase();
    let list = rows.filter((r) => !q || r.name.toLowerCase().includes(q) || r.country.toLowerCase().includes(q));
    const key = sort.key;
    const val = (r) => key === "name" ? r.name : key === "tier" ? r.rank : key === "count" || key === "impact" ? r.signals[key]
      : key === "value" ? sumValue(r) : r[key];
    list = [...list].sort((a, b) => {
      const va = val(a), vb = val(b);
      const c = typeof va === "string" ? va.localeCompare(vb) : va - vb;
      return sort.asc ? c : -c;
    });
    document.querySelectorAll("#table th[data-sort]").forEach((th) => {
      th.classList.toggle("sorted", th.dataset.sort === key);
      th.classList.toggle("asc", th.dataset.sort === key && sort.asc);
    });
    document.querySelector("#table tbody").innerHTML = list.map((r) => `
      <tr data-id="${r.id}" tabindex="0">
        <td class="num">${r.rank}</td>
        <td><span class="cname">${esc(r.name)}</span> <span class="ccountry">${tag(r.country, regionVar(r.region))}</span></td>
        <td><span class="tier-pill" style="--t:var(--tier-${r.tier});--ti:var(--tier-ink-${r.tier})">${r.tier}</span></td>
        <td class="num">${r.score.toFixed(1)}</td>
        <td class="num">${fmtNum(r.signals.count)}</td>
        <td class="num">${fmtNum(r.signals.impact)}</td>
        <td class="num">$${fmtB(sumValue(r))}</td>
        <td class="best">${r.companies.slice(0, 3).map((x) => esc(x.company.n)).join(", ")}${r.companies.length > 3 ? "…" : ""}</td>
      </tr>`).join("") || `<tr><td colspan="8" class="empty">No colleges match.</td></tr>`;
  }

  function buildTableSort() {
    document.querySelectorAll("#table th[data-sort]").forEach((th) => th.addEventListener("click", () => {
      const k = th.dataset.sort;
      if (sort.key === k) sort.asc = !sort.asc;
      else sort = { key: k, asc: k === "rank" || k === "name" || k === "tier" };
      renderTable();
    }));
    document.getElementById("search").addEventListener("input", renderTable);
  }

  // ---- companies table (static)
  function renderCompanies() {
    const list = [...DATA.companies].sort((a, b) => (b.v || 0) - (a.v || 0));
    document.querySelector("#companies-table tbody").innerHTML = list.map((c) => `
      <tr>
        <td><b>${esc(c.n)}</b><div class="role">${esc(c.w)}</div></td>
        <td class="num">${c.y}</td>
        <td>${tag(SECTOR_NAME[c.s], sectorVar(c.s))}</td>
        <td class="num">${c.v ? "$" + fmtB(c.v) : "—"}</td>
        <td class="num">${c.i}</td>
        <td>${c.f.map(([name, links]) => `${esc(name)} <span class="role">(${links.map(([id, role]) =>
          esc(DATA.colleges[id][0]) + ", " + ROLE_NAME[role]).join("; ")})</span>`).join("<br>")}</td>
      </tr>`).join("");
  }

  // ---- detail dialog
  function openDetail(id) {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    document.getElementById("detail-title").textContent = r.name;
    document.getElementById("detail-sub").innerHTML =
      `#${r.rank} · ${r.tier} tier · score ${r.score.toFixed(1)} · ${tag(r.country, regionVar(r.region))} · about ${fmtNum(r.enroll)}k students`;
    const sigs = SIGNALS.map((k) => `<div class="signal" style="--c:${sigVar(k)}">
        <div class="k">${SIGNAL_INFO[k].name}</div>
        <div class="v">${r.norm[k].toFixed(0)}</div>
        <div class="n">${esc(SIGNAL_INFO[k].fmt(r))}</div></div>`).join("");
    const cos = r.companies.map(({ company: c, founders, share }) => `
      <div class="co">
        <div class="co-head"><b>${esc(c.n)}</b><span class="yr">${c.y}</span>${tag(SECTOR_NAME[c.s], sectorVar(c.s))}
          <span class="yr">${c.v ? "$" + fmtB(c.v) + " peak" : "value n/a"} · impact ${c.i}/5${share < 1 ? ` · ${Math.round(share * 100)}% credit` : ""}</span></div>
        <div class="co-why">${esc(c.w)}</div>
        <div class="co-founders">${founders.map((f) => `${esc(f.founder)} <span class="role">(${f.roles.map((x) => ROLE_NAME[x]).join(", ")})</span>`).join(" · ")}</div>
      </div>`).join("");
    document.getElementById("detail-body").innerHTML =
      `<div class="signals">${sigs}</div><h3>${r.companies.length} ${r.companies.length === 1 ? "company" : "companies"} founded by alumni</h3>${cos}`;
    const dlg = document.getElementById("detail");
    if (!dlg.open) dlg.showModal();
  }

  function wireDetail() {
    document.addEventListener("click", (e) => {
      if (e.target.id === "more-d") { showAllD = true; renderTiers(); return; }
      const t = e.target.closest("[data-id]");
      if (t && !t.closest("dialog")) openDetail(t.dataset.id);
    });
    document.querySelector("#table tbody").addEventListener("keydown", (e) => {
      const tr = e.target.closest("tr[data-id]");
      if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openDetail(tr.dataset.id); }
    });
    const dlg = document.getElementById("detail");
    document.getElementById("detail-close").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    const chart = document.getElementById("chart");
    chart.addEventListener("mousemove", chartTooltip);
    chart.addEventListener("mouseleave", () => (document.getElementById("tooltip").hidden = true));
  }

  // ---- main
  function update() {
    rows = compute(DATA, options());
    syncControls();
    renderTiers();
    renderChart();
    renderTable();
  }

  function init() {
    const n = DATA.companies.length;
    const used = new Set(DATA.companies.flatMap((c) => c.f.flatMap(([, l]) => l.map(([id]) => id))));
    document.getElementById("meta").textContent =
      `${n} landmark companies · ${DATA.companies.reduce((s, c) => s + c.f.length, 0)} founders · ${used.size} colleges in ${new Set([...used].map((id) => DATA.colleges[id][1])).size} countries`;
    document.getElementById("n-companies").textContent = n;
    document.getElementById("n-companies-2").textContent = n;
    document.getElementById("region-legend").innerHTML =
      REGIONS.map((r) => `<span style="--c:${regionVar(r)}"><i></i>${r}</span>`).join("");
    buildControls();
    buildTableSort();
    wireDetail();
    renderCompanies();
    update();
    let raf;
    window.addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(renderChart); });
  }

  init();
})();
