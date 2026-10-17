# A repeatable transit lesson — 17 October 2026

The old Play curve was a random Gaussian-shaped dip in canvas pixels. Finding it immediately regenerated the curve and replaced the success feedback. It was a game signal, not a physical transit model. The illustrative WebGL hero/comet remain artwork; their labels now say so.

The existing Transit Lab now uses the overlap area of a dark circular planet and a uniformly bright stellar disc, in stellar-radius units. A central straight crossing has constant projected speed. When fully inside the stellar disc, fractional depth equals the squared planet/star radius ratio. This is a deliberately simplified lesson: no limb darkening, orbital integration, period inference, telescope data, instrument noise calibration or detection significance.

Primary references inspected: [NASA: What’s a transit?](https://science.nasa.gov/exoplanets/whats-a-transit/) and [NASA Exoplanet Watch glossary](https://science.nasa.gov/citizen-science/exoplanet-watch/exoplanet-watch-glossary/). The area-overlap implementation is ours; these references do not validate our software.

## Actual route and files

`index.html` → `bootstrap.js` loads `transit-model.js` before the existing stitched app. `parts/h2/04.txt` supplies the controls; `parts/a3/09.txt` and `parts/a4/10.txt` own generation, plotting, input and export. Existing routes, profile progress, quiz, source feeds and other features remain.

The deterministic generator returns schema version, model version, seed, radius ratio, bounded uniform noise, arbitrary time/flux/length units, explicit assumptions and 241 samples. The display uses normalized brightness on a fixed scale. Seed/size/noise changes regenerate the same comparison; New Signal increments the seed. Keyboard arrows and the original buttons move the same cursor. Finding a crossing keeps the result visible and awards once for that generated experiment. It does not lock any portfolio entry. Invalid input clears the old experiment and disables export rather than exporting stale data.

Save this experiment downloads only the generator object. No profile, saved discovery, browser history, API key, location or real observation is added. The generator has no network or storage dependency. Reuse this model for teaching, a museum exhibit or a classroom experiment; scientific inference would need a different, validated model and real observations.

## Privacy repair

The old service worker cached every successful GET, including third-party URLs with `api_key` query parameters. The replacement handles only exact application static paths without a query, fetches network-first, and stores only successful same-origin basic responses. Activation removes only older `caldaspace-` caches and leaves other applications alone. It does not erase profiles or saved discoveries. Personal NASA keys remain an existing explicit browser-only setting; the field is masked and set through its value property, not interpolated into HTML. API calls still go directly to their named providers; this is not an offline/private network sandbox.

## Observed checks

Four Node tests pass: contact/central-depth/symmetry/bounds, exact seeded replay, known depth and noise bounds, and the static-only cache boundary. The full stitched JavaScript parses. In the actual browser: size 10% with quiet noise changed to 16% without noise at the same seed 20261017; displayed model depth changed from 1.00% to 2.56%. Keyboard Enter found the central crossing; feedback stayed visible. Saving produced 241 synthetic samples and only the documented schema keys. A 390×844 emulated viewport had document width 390 and no page-width overflow. Physical phone and independent learning-effectiveness acceptance remain open. Legacy browser test scripts were updated for the model dependency but not executed in this review.

## Repeat the check

Run `node --test tests/*.test.cjs`; serve this directory on loopback; open `/#play`. Keep a seed while changing size/noise; compare depths with radius squared, turn noise off and verify out-of-transit brightness 1. Use arrows/Enter, repeat selection and verify it does not repeatedly award the same experiment. Save, inspect keys/units/assumptions, regenerate with the saved parameters and compare all samples. Test invalid seed and unavailable provider separately. Inspect the active worker's cache policy without entering a real personal key into test evidence.

This branch is a reviewed prototype improvement, not independent science or production acceptance. GitHub Pages keeps its previous edition until the owner promotes this source.
