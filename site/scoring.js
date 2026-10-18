/*
 * Startup College Tier List: scoring.
 * Pure functions, no DOM. Used by the page and by the tests.
 */
(function (root) {
  const SIGNALS = ["value", "count", "impact", "density"];

  const DEFAULTS = {
    weights: { value: 35, count: 20, impact: 30, density: 15 },
    roles: { ug: true, grad: true, left: true },
    sectors: null, // null = all, otherwise an array of sector keys
    regions: null, // null = all, otherwise an array of region names
    yearMin: 0,
    yearMax: 9999,
    split: false, // split each company's credit evenly across the colleges it credits
  };

  // Students (in units of 10,000) added to every college before dividing, so a
  // tiny college with one famous founder doesn't top the per-student signal.
  const DENSITY_PRIOR = 2;

  const TIERS = [
    { key: "S", min: 60 },
    { key: "A", min: 30 },
    { key: "B", min: 15 },
    { key: "C", min: 6 },
    { key: "D", min: 0 },
  ];

  function tierFor(score) {
    return TIERS.find((t) => score >= t.min).key;
  }

  function withDefaults(opts) {
    const o = Object.assign({}, DEFAULTS, opts || {});
    o.weights = Object.assign({}, DEFAULTS.weights, (opts || {}).weights);
    o.roles = Object.assign({}, DEFAULTS.roles, (opts || {}).roles);
    return o;
  }

  function companyPasses(c, collegeRegion, o) {
    if (c.y < o.yearMin || c.y > o.yearMax) return false;
    if (o.sectors && !o.sectors.includes(c.s)) return false;
    return true;
  }

  // Which colleges does this company credit, and through which founders?
  function creditsFor(c, o) {
    const byCollege = new Map();
    for (const [founder, links] of c.f) {
      for (const [id, role] of links) {
        if (!o.roles[role]) continue;
        if (!byCollege.has(id)) byCollege.set(id, []);
        const list = byCollege.get(id);
        const existing = list.find((x) => x.founder === founder);
        if (existing) existing.roles.push(role);
        else list.push({ founder, roles: [role] });
      }
    }
    return byCollege;
  }

  function compute(data, opts) {
    const o = withDefaults(opts);
    const rows = new Map();
    const rowFor = (id) => {
      if (!rows.has(id)) {
        const [name, country, region, enroll] = data.colleges[id];
        rows.set(id, {
          id, name, country, region, enroll,
          companies: [],
          signals: { value: 0, count: 0, impact: 0, density: 0 },
        });
      }
      return rows.get(id);
    };

    for (const c of data.companies) {
      if (!companyPasses(c, null, o)) continue;
      const credits = creditsFor(c, o);
      let ids = [...credits.keys()];
      if (o.regions) ids = ids.filter((id) => o.regions.includes(data.colleges[id][2]));
      if (!ids.length) continue;
      const share = o.split ? 1 / credits.size : 1;
      for (const id of ids) {
        const r = rowFor(id);
        r.companies.push({ company: c, founders: credits.get(id), share });
        r.signals.value += share * Math.log2(1 + (c.v || 0));
        r.signals.count += share;
        r.signals.impact += share * c.i;
      }
    }

    const list = [...rows.values()];
    for (const r of list) r.signals.density = r.signals.impact / (r.enroll / 10 + DENSITY_PRIOR);

    const max = {};
    for (const k of SIGNALS) max[k] = Math.max(0, ...list.map((r) => r.signals[k]));
    const wSum = SIGNALS.reduce((s, k) => s + Math.max(0, o.weights[k]), 0) || 1;

    for (const r of list) {
      r.norm = {};
      r.contrib = {};
      let raw = 0;
      for (const k of SIGNALS) {
        r.norm[k] = max[k] ? (100 * r.signals[k]) / max[k] : 0;
        r.contrib[k] = (r.norm[k] * Math.max(0, o.weights[k])) / wSum;
        raw += r.contrib[k];
      }
      r.raw = raw;
    }

    // Rescale so the leader scores 100; tiers are relative to the leader.
    const top = Math.max(0, ...list.map((r) => r.raw)) || 1;
    for (const r of list) {
      const f = 100 / top;
      r.score = r.raw * f;
      for (const k of SIGNALS) r.contrib[k] *= f;
      r.tier = tierFor(r.score);
      r.companies.sort((a, b) => b.company.i - a.company.i || (b.company.v || 0) - (a.company.v || 0));
    }

    list.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    list.forEach((r, i) => (r.rank = i + 1));
    return list;
  }

  const api = { compute, tierFor, SIGNALS, TIERS, DEFAULTS, DENSITY_PRIOR };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Scoring = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
