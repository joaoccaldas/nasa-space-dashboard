# CaldaSpace 2.0: 59-improvement product plan

All items below are implemented in the 2.0 release candidate unless explicitly marked for live post-deployment verification. “Test” refers to the automated local smoke and layout suites in `tests/`.

| # | Improvement | Where | Why | How | Validation |
|---:|---|---|---|---|---|
| 1 | Five-domain information architecture | Global shell | Families need a predictable mental model | Keep Home, Discover, Learn, Observe and Play as permanent top-level routes | Route count and active-view tests |
| 2 | Deep-linkable navigation | Global routing | Shared links and refreshes must preserve location | Hash routing with history updates and hash-change handling | Route interaction tests |
| 3 | Unified sticky app shell | Header and navigation | Orientation should remain available during long pages | Sticky desktop header plus safe-area mobile bottom navigation | Desktop/mobile visibility tests |
| 4 | Contextual section introductions | Every route | Users should know the purpose of each area immediately | One eyebrow, one clear H1 and one concise explanation per route | Five labelled H1 checks |
| 5 | Home quick actions | Home hero | Reduce time to first meaningful action | Direct buttons to Discover and Play | Route tests |
| 6 | Daily discovery centrepiece | Home | A fresh trusted object creates a repeat-use ritual | NASA APOD card with source, date, media handling and fallback | Mock APOD test |
| 7 | Responsive desktop composition | Global | Desktop should feel designed, not stretched mobile | Dedicated 700px and 1020px breakpoints, multi-column panels and desktop nav | 768px and 1440px layout tests |
| 8 | Progressive disclosure | Cards and dialogs | Keep the interface calm while preserving depth | Summaries in cards, detail in dialogs and source links | Dialog and interaction tests |
| 9 | Design-token system | `styles.css` root | Consistency and maintainability require shared values | Central colour, spacing, radius, shadow and layout variables | CSS review |
| 10 | Strong typographic hierarchy | Global typography | Space content needs editorial clarity | Responsive display scale, compact labels and readable body measure | Render review |
| 11 | Original orbital logo | Header and PWA | A recognisable product needs a unique mark | Custom SVG planet and ring asset | Asset existence and render test |
| 12 | Original hero illustration | Home hero | A cinematic first impression communicates ambition | Custom SVG planet, orbital paths and exploration beacons | Mobile/desktop screenshots |
| 13 | Atmospheric star field | Global background | Add depth without distracting motion | Lightweight CSS radial-star texture | Visual review |
| 14 | Consistent card language | All content surfaces | Mixed card styles weaken perceived quality | Shared surfaces, borders, radii and shadow grammar | CSS review |
| 15 | Semantic colour states | Status labels | Users must distinguish data truth at a glance | Separate Live, Verified, Simulated and Mission colours | UI content review |
| 16 | Purposeful micro-interactions | Buttons and cards | Feedback should feel responsive, not noisy | Small lift, brightness and transition effects | Render and reduced-motion checks |
| 17 | Reduced-motion support | Global | Motion-sensitive users need a stable experience | `prefers-reduced-motion` override | CSS audit |
| 18 | Mobile safe-area handling | Header and bottom nav | Modern phones have notches and gesture bars | `env(safe-area-inset-bottom)` spacing | Mobile layout test |
| 19 | Minimum touch targets | Interactive controls | Small targets increase errors, especially for children | 40px automated minimum, 44px design target for primary controls | 320/390/768/1440 target audit |
| 20 | Keyboard navigation | Global | All functions must work without touch or mouse | Native controls, Enter/Space handlers and keyboard canvas controls | Interaction tests |
| 21 | Visible focus states | Global | Keyboard users need location feedback | High-contrast focus ring and offset | CSS audit |
| 22 | Skip-to-content control | Page shell | Repeated navigation should be bypassable | First-focus skip link to main content | Presence test |
| 23 | Semantic landmarks and headings | HTML structure | Assistive technologies require meaningful structure | Header, main, nav, sections, H1/H2 hierarchy | DOM checks |
| 24 | Meaningful image alternatives | All imagery | Visual content needs accessible descriptions | Alt text on content images, empty alt on decorative logo | Missing-alt test |
| 25 | Live status announcements | Loading, game and toast states | Dynamic changes must be communicated | `aria-live` regions for data, feedback and toasts | DOM checks |
| 26 | Loading skeletons | APOD, news and media search | Perceived speed matters during remote API calls | Structured animated placeholders | Render test |
| 27 | Empty, error and retry states | All API surfaces | Failure should preserve trust and recovery | Explicit offline/error copy and retry controls | Mock/fallback path review |
| 28 | APOD caching | Home | Reduce API quota pressure and repeat latency | 12-hour local cache with cached-state label | Code review and mock test |
| 29 | APOD video handling | Home | APOD is not always an image | Responsive iframe for video media type | Code path review |
| 30 | NASA visual search | Discover | Visual exploration is the app’s strongest discovery tool | NASA Images API query and 24-result responsive grid | Mock search test |
