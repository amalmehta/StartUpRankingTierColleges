# File Structure

```
StartUpRankingTierColleges/
├── README.md                     At-a-glance overview with screenshots and links
├── StartUpRankingTierColleges.md The project brief (meta-instructions, context, changelog)
├── package.json                  npm start (local server) and npm test
├── .github/workflows/pages.yml   Runs the tests, then deploys site/ to GitHub Pages on every push to main
├── site/                         The website: open site/index.html or serve this folder
│   ├── index.html                Page structure: controls, tiers, chart, table, method, detail dialog
│   ├── styles.css                Light and dark color tokens, layout, components
│   ├── data.js                   The dataset: colleges and companies with founders
│   ├── scoring.js                Pure ranking logic (signals, normalization, tiers); shared with tests
│   ├── app.js                    Rendering and interaction (controls, tier list, SVG chart, tables, dialog)
│   └── favicon.svg, favicon.ico, apple-touch-icon.png   Site icons
├── tests/
│   └── scoring.test.js           Node test suite for the data and scoring rules
└── docs/
    ├── INSTRUCTIONS.md           Setup, run, test, use, edit the data
    ├── SYSTEM-DESIGN.md          Architecture, flows, decisions, limits
    ├── FILE-STRUCTURE.md         This file
    └── images/                   README screenshots (tiers, chart, controls)
```
