# CaldaSpace 2.0

**Space, together.**

CaldaSpace is a mobile-first family space app combining live discoveries, trusted explainers, NASA imagery, near-Earth object data, family missions and short science games.

## Live entry point

`https://joaoccaldas.github.io/nasa-space-dashboard/`

## Main areas

- **Home:** APOD, current space news, daily family mission and crew progress
- **Discover:** NASA image search and per-profile saved discoveries
- **Learn:** two explanation depths, topic filters, read aloud and evidence-labelled theories
- **Observe:** Near-Earth object feed, 3I/ATLAS profile and observation guidance
- **Play:** expanded quiz, keyboard-accessible transit lab and achievements

## Privacy

Profiles, XP, streaks, saved discoveries and settings remain in browser storage. The app includes no analytics or advertising trackers.

## Architecture

Static HTML, CSS and JavaScript, deployable directly through GitHub Pages. No custom GitHub Actions workflow is required.

## Quality documentation

- `docs/AUDIT.md`
- `docs/PRODUCT_PLAN_59.md`
- `docs/IMPLEMENTATION_LOG.md`
- `docs/TEST_REPORT.md`
- `tests/playwright_smoke.py`
- `tests/layout_audit.py`
