# GridShare AI

An interactive research simulator for renewable-energy coordination in a rural microgrid. Ten agents manage generation, demand, protected battery reserves and local energy-credit exchanges.

## Run locally

Open `OPEN_GRIDSHARE.html` in Chrome or Edge. No installation, server or Internet connection is required. See `START_HERE.txt` and `DEMO_GUIDE.md` for presentation instructions.

## Build and test

Node.js 22 or newer is sufficient. No packages need to be installed.

```sh
node scripts/build.cjs
```

The build runs the engine and DOM contract test suites, then produces `public/index.html` and the offline HTML. Builds fail if a test fails. `VALIDATION.md` documents test evidence and limits.

## Deploy on Render

Create a **Static Site** connected to this repository:

| Setting | Value |
|---|---|
| Branch | main |
| Build command | `node scripts/build.cjs` |
| Publish directory | `public` |
| Environment variables | None required |

Only the `public` directory is published. GitHub Actions also runs the same validation on pushes and pull requests.

## Features

- Per-building agents and explainable trade decisions.
- Reserve protection, priority allocation and connection limits.
- Conservative energy/credit accounting and transaction-safe simulation steps.
- Local session persistence and offline settlement simulation.
- Solar regression trained on synthetic data with separate evaluation days.
- Independent no-sharing baseline, results comparison and CSV exports.
- Responsive village interface with custom building drawings and directional trade paths.

## Research boundaries

This is a simulation, not a physical microgrid controller. Meter readings, transfers, network links and settlement are simulated. No real blockchain, cryptocurrency, payments, LoRa mesh or electrical equipment is connected. Credits have no redemption value. Forecasting uses synthetic data and does not yet control trading. The trade allocator is rule-based; agents are coordinated by a scheduler inside one browser.

Real browser visual verification has not been performed in the build environment. Automated checks cover engine properties and application event-handler contracts, not rendered layout.

## Source layout

- `source/engine.js`: simulation, accounting, constraints and synthetic ML.
- `source/app.js`: controls, rendering, persistence and export.
- `source/layout.html`, `source/style.css`: UI source.
- `source/test_engine.cjs`, `source/test_ui.cjs`: dependency-free tests.
- `scripts/build.cjs`: validation and static bundle generation.
