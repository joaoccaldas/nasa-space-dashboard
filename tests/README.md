# CaldaSpace tests

Run the interaction suite:

```bash
python tests/playwright_smoke.py
```

Run the responsive layout audit:

```bash
python tests/layout_audit.py
```

Requirements: Python, Playwright for Python and a Chromium executable available at `/usr/bin/chromium`.

For the deterministic transit geometry, replay and cache boundary (no browser dependency):

```sh
node --test tests/*.test.cjs
```

The legacy Python browser scripts need a machine-specific browser setup. Their historical pass reports do not establish this revision passed them; current actual-browser checks are recorded in `docs/TRANSIT_LAB_2026-10-17.md`.
