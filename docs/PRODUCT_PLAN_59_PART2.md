# CaldaSpace 2.0: 59-improvement product plan

All items below are implemented in the 2.0 release candidate unless explicitly marked for live post-deployment verification. “Test” refers to the automated local smoke and layout suites in `tests/`.

| # | Improvement | Where | Why | How | Validation |
|---:|---|---|---|---|---|
| 31 | Search suggestions and request cancellation | Discover | Fast repeated searches should not race or overload APIs | Suggested chips, 80-character limit and AbortController | Interaction/code test |
| 32 | Saved discovery library | Discover/header | A family needs continuity and reasons to return | Per-profile local saved collection and modal library | Save/remove tests |
| 33 | Current space news feed | Home | Daily relevance increases return value | Spaceflight News API with official NASA/ESA/JPL fallbacks | Mock feed test; live verification pending |
| 34 | Source and freshness metadata | APOD, news, NEO and media | Scientific trust requires provenance | Source links, dates, live/cached/fallback labels and update times | Content review |
| 35 | Near-Earth object watch | Observe | Live orbital data makes space feel immediate | NASA NeoWs feed with size, speed and lunar-distance context | Mock NEO test |
| 36 | Interstellar object observatory | Observe | Preserve and improve the 3I/ATLAS project value | Reusable historical profile with explicit non-live warning | Content review |
| 37 | Filterable knowledge library | Learn | Families need manageable topic exploration | Universe, Solar System, Life and Missions filters | Filter interaction test |
| 38 | Evidence-labelled theory lab | Learn | Exciting ideas must not blur fact and speculation | Four-level evidence labels and visual meter | Six-card render test |
| 39 | Multiple local family profiles | Profile dialog | Different family members need independent progress | Up to eight browser-local profiles | Add/switch test |
| 40 | Mission-patch avatars | Profile dialog/header | Identity should feel playful without requiring photos | Eight text/emoji patch options | Profile UI test |
| 41 | Daily streak | Home progress | Gentle continuity encourages return visits | Consecutive-day local calculation | State/code test |
| 42 | XP and rank progression | Global | Learning and play need a coherent reward language | XP events and five rank thresholds | Quiz/learn/save tests |
| 43 | Achievement patches | Play | Milestones create visible progress | Eight rule-based badges evaluated from local state | Achievement render test |
| 44 | Daily family mission | Home | Shared offline conversation is the core family value | Deterministic daily mission, accept/complete flow and XP reward | Interaction/code review |
| 45 | Expanded daily quiz | Play | A larger pool reduces repetition | Eight sourced science questions with explanations | Correct-answer test |
| 46 | Accessible transit game | Play | The strongest game concept should work for more users | Pointer, keyboard and button controls plus explicit simulated label | Keyboard response test |
| 47 | Crew progress dashboard | Home | Progress needs a visible home, not hidden numbers | Rank ring, saved count, quiz wins and badge count | Render/state tests |
| 48 | External text sanitisation | Data rendering | Remote text must not become executable HTML | Text nodes for external content and constrained templates | No inline handler check/code review |
| 49 | URL protocol validation | External links and images | Malformed or unsafe schemes must be rejected | HTTP/HTTPS allow function before assignment | Code review |
| 50 | Timeouts, aborts and bounded queries | Network layer | Slow APIs should not freeze the experience | 12-second timeout, search abort and query length limit | Code review |
| 51 | Local-only privacy disclosure | Profile dialog | Families should understand where their data goes | Plain-language local-storage notice | Content check |
| 52 | No analytics or trackers | Global | A family app does not need behavioural surveillance | No analytics SDKs, cookies or fingerprinting | Source audit |
| 53 | Offline state awareness | Global | Network loss should be understandable | Network banner and cached/fallback wording | Offline render test |
| 54 | Data freshness and cache expiry | Data layer | Stale information must not masquerade as live | Separate 30-minute, 6-hour, 12-hour and 24-hour cache windows | Code review |
| 55 | Installable PWA manifest | PWA | Families should add the app to home screens | Manifest, app identity, shortcuts and a scalable maskable app icon | Manifest and asset checks |
| 56 | Offline application shell | Service worker | Core learning and saved content should open offline | Versioned shell cache and network fallback | Service-worker syntax test |
| 57 | Performance-conscious media | Images and sections | Mobile data and rendering cost must stay controlled | Lazy decoding, content visibility, SVG assets and no framework bundle | Layout/source audit |
| 58 | Search and sharing metadata | Document head | Links should look credible and be discoverable | Description, Open Graph, Twitter and JSON-LD WebApplication data | Head markup check |
| 59 | Repeatable test and deployment documentation | `tests/` and `docs/` | Quality must survive future changes | 35 interaction checks, four-width layout audit, test report and release log | Both suites pass |
