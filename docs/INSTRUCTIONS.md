# Instructions

## Set up

Nothing to install. The site is plain HTML, CSS and JavaScript with no build step and no dependencies. You need:

- A web browser
- Python 3 (to serve the folder locally; any static file server works)
- Node.js 18 or later (only to run the tests)

## Run

```bash
npm start
```

Then open http://localhost:8765. That runs `python3 -m http.server 8765 --directory site`.

You can also double-click `site/index.html`: it uses classic scripts, not ES modules, so it works from `file://` too.

## Live site

https://amalmehta.github.io/StartUpRankingTierColleges/ — redeployed automatically by `.github/workflows/pages.yml` whenever `main` is pushed (tests must pass first).

## Test

```bash
npm test
```

This runs the Node test suite in `tests/`. It checks the dataset's integrity (every founder points at a known college and role) and the scoring rules (normalization, tiers, filters, split credit, role toggles).

## Use

- **Weights**: four sliders set how much each signal counts. *Value created* is the log-damped peak value of alumni companies, *Companies* is the count, *Impact* sums 1–5 impact scores, and *Per student* divides impact by enrollment. Weights are relative; they don't need to add up to 100.
- **Founders count when they…**: choose whether undergraduate degrees, graduate degrees (MS, MBA, PhD, MD, JD) and attending without finishing (dropouts and transfers) earn a college credit. Turning off "left" removes, for example, Reed College's credit for Apple.
- **Split credit**: by default every college a company's founders attended gets full credit. Tick this to divide each company evenly across its colleges instead.
- **Companies founded**: limit to an era (before 1990, 1990–2009, 2010 and later).
- **Sectors / College regions**: click a chip to toggle it. ⌥-click or ⌘-click shows only that one. "all" turns every chip back on.
- **Tiers**: click any college card for its companies, founders and signal breakdown. The D tier shows the first 24; "+ N more" shows the rest.
- **Chart**: hover a bar to see each signal's contribution and raw value. Click a bar to open the college.
- **Full ranking**: search by college or country; click a column header to sort.
- **Reset to defaults** restores every control.

## Edit the data

All data lives in `site/data.js`. To add a company, append an entry to `companies`:

```js
{ n: "Name", y: 2015, s: "ai", v: 12, i: 3, w: "One line on why it matters",
  f: [["Founder Name", [["stanford", "ug"], ["mit", "grad"]]]] },
```

If a college isn't listed yet, add it to `colleges` as `id: [name, country, region, enrollment in thousands]`. Run `npm test` afterwards. It catches unknown college IDs and bad roles.
