# CaldaSpace 2.0 test report

Date: 2026-06-18

## Automated interaction suite

Result: **35/35 passed**

Coverage includes routing, active views, APOD, news, mobile navigation, NASA image search, saved library, learning filters, XP, theory cards, NEO cards, quiz, keyboard transit input, achievements, profiles, skip link, headings, dialogs, alt attributes, manifest linkage and desktop/mobile navigation switching.

## Responsive layout audit

| Viewport | Horizontal overflow | Visible targets below 40px |
|---:|---:|---:|
| 320 × 720 | 0px | 0 |
| 390 × 844 | 0px | 0 |
| 768 × 1024 | 0px | 0 |
| 1440 × 1000 | 0px | 0 |

## Syntax checks

- Application JavaScript: passed
- Data JavaScript: passed
- Service worker: passed

## Limitation

Local API behavior was validated using deterministic responses and production fallbacks. Public post-deployment checks must confirm the real third-party endpoints.
