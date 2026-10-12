# Validation record

## Completed checks

- JavaScript syntax checks on engine.js and app.js passed.
- 11 engine test groups passed on the final engine.
- All five built-in scenarios were run for 48 hours each: 240 simulated hours.
- 120 seeded randomized villages were run for 12 hours each: 1,440 simulated hours.
- Total property/scenario coverage: 1,680 hourly steps, plus targeted cases.
- Every property step checked whole-system energy conservation including losses, reserve and capacity limits, nonnegative credits, conservation of total credits, served energy not exceeding demand, per-building connection limits, shared-bus throughput, and matching imports/exports.
- Targeted checks covered zero network throughput, zero solar at protected reserves, zero buyer credits, critical-priority ordering, invalid inputs, reserve guard rejection, normal-day benefit, deterministic synthetic model training and held-out evaluation.
- Offline trades survived serialization; reconnect updated statuses exactly once without changing energy or credit balances.
- A Node.js DOM contract harness exercised startup, all tabs, hourly stepping, guard validation, connectivity switching, sync, sliders, both CSV-export handlers, model retraining, reset, configuration, autoplay/pause, local storage and restoration in a new JavaScript context.
- Bundled HTML was checked for complete embedded source, no external resource dependencies and unique static element IDs.

## Concrete measured demonstration trace

Default configuration, first run from 10:00, changing the scenario before each step:

| Step | Scenario | Shared kWh | GridShare unmet kWh | No-sharing unmet kWh | Critical coverage |
|---|---|---:|---:|---:|---:|
| 1 | Normal | 2.101 | 0.000 | 2.101 | 100.00% |
| 2 | Cloud cover | 8.201 | 0.788 | 7.844 | 100.00% |
| 3 | Emergency | 10.487 | 7.213 | 16.821 | 98.47% |

These are synthetic simulation observations from this exact configuration, not field measurements or universal performance guarantees. Changes to sliders, starting resources or scenario order change results.

## Verification limits

A real browser rendering/session was unavailable in the build environment. The DOM contract harness does not verify visual layout, native file downloads, browser-specific file:// storage, responsive screenshots or physical device behaviour. No claims of visual browser QA or hardware validation are made.

Before presenting: extract, open OPEN_GRIDSHARE.html in your intended Chrome/Edge browser, run one hour, click a building, export a CSV, and reload once. Reset before the live demonstration. Keep a backup copy on another laptop or USB drive.

## Reproduce tests (optional)

With Node.js installed, run from the extracted project folder:

    node source/test_engine.cjs
    node source/test_ui.cjs

No Node.js installation is needed to run the application itself. To regenerate the bundled application after editing sources, use Python 3:

    python rebuild.py

No third-party packages are required by the app, build script or tests.

## UI and deployment revision

Refined the UI with warm neutral surfaces, restrained green accents, serif headings, custom SVG building drawings and directional exchange paths. Added a validated Node.js static build and GitHub Actions workflow. The deploy directory is public/.

Retested all engine and UI-handler cases after the revision. Added an injected-failure check proving that failed simulation steps cannot partially mutate live or saved state. Custom sliders now clear misleading preset selection outside emergency mode.

Browser visual QA remains unavailable; no screenshot-based verification is claimed.
