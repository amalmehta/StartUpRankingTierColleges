// Run with: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const DATA = require("../site/data.js");
const S = require("../site/scoring.js");

test("every founder link points at a known college with a known role", () => {
  for (const c of DATA.companies) {
    assert.ok(c.n && c.y && c.s && c.i >= 1 && c.i <= 5, `bad company fields: ${c.n}`);
    for (const [founder, links] of c.f) {
      assert.ok(links.length, `${founder} at ${c.n} has no colleges`);
      for (const [id, role] of links) {
        assert.ok(DATA.colleges[id], `unknown college ${id} (${c.n})`);
        assert.ok(["ug", "grad", "left"].includes(role), `bad role ${role} (${c.n})`);
      }
    }
  }
});

test("the leader scores 100 and the list is sorted with ranks 1..n", () => {
  const rows = S.compute(DATA);
  assert.equal(Math.round(rows[0].score), 100);
  rows.forEach((r, i) => {
    assert.equal(r.rank, i + 1);
    if (i) assert.ok(rows[i - 1].score >= r.score);
  });
});

test("contributions add up to the score", () => {
  for (const r of S.compute(DATA)) {
    const sum = S.SIGNALS.reduce((s, k) => s + r.contrib[k], 0);
    assert.ok(Math.abs(sum - r.score) < 1e-9, r.name);
  }
});

test("tiers follow the thresholds", () => {
  assert.equal(S.tierFor(100), "S");
  assert.equal(S.tierFor(60), "S");
  assert.equal(S.tierFor(59.9), "A");
  assert.equal(S.tierFor(15), "B");
  assert.equal(S.tierFor(6), "C");
  assert.equal(S.tierFor(0), "D");
});

test("a company counts once per college even with several alumni founders", () => {
  const meta = S.compute(DATA).find((r) => r.id === "harvard").companies.filter((x) => x.company.n === "Meta");
  assert.equal(meta.length, 1);
  assert.equal(meta[0].founders.length, 4);
});

test("turning off dropouts removes dropout-only credit", () => {
  const all = S.compute(DATA).find((r) => r.id === "reed");
  assert.ok(all, "Reed is credited for Apple via Steve Jobs");
  const noLeft = S.compute(DATA, { roles: { left: false } }).find((r) => r.id === "reed");
  assert.equal(noLeft, undefined);
});

test("split credit divides each company across its colleges", () => {
  const rows = S.compute(DATA, { split: true });
  const google = rows.find((r) => r.id === "michigan").companies.find((x) => x.company.n === "Google");
  assert.equal(google.share, 1 / 3); // Michigan, Maryland, Stanford
});

test("filters by era, sector and region", () => {
  const recent = S.compute(DATA, { yearMin: 2010 });
  for (const r of recent) for (const x of r.companies) assert.ok(x.company.y >= 2010);
  const bio = S.compute(DATA, { sectors: ["bio"] });
  for (const r of bio) for (const x of r.companies) assert.equal(x.company.s, "bio");
  const asia = S.compute(DATA, { regions: ["Asia"] });
  assert.ok(asia.length > 0);
  for (const r of asia) assert.equal(r.region, "Asia");
});

test("zero weights don't crash and give a defined order", () => {
  const rows = S.compute(DATA, { weights: { value: 0, count: 0, impact: 0, density: 0 } });
  assert.ok(rows.length > 0);
  for (const r of rows) assert.ok(Number.isFinite(r.score));
});

test("with default settings Stanford, MIT and Harvard lead", () => {
  const top3 = S.compute(DATA).slice(0, 3).map((r) => r.id).sort();
  assert.deepEqual(top3, ["harvard", "mit", "stanford"]);
});
