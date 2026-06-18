# CaldaSpace feature history and merger assessment

## Legacy NASA dashboard

The original dashboard focused on direct NASA data utilities:

- Astronomy Picture of the Day
- Historical APOD date picker
- Telescope gallery with gallery and timeline views
- Mars rover photos for Curiosity, Perseverance, Opportunity and Spirit
- Near-Earth Object date-range queries
- NASA API-key management
- Technical image and camera metadata

## Family Hub / CaldaSpace 2.0

The family-product merger preserved current APOD, NASA image search and NEO monitoring, but replaced several specialist archive tools with a simpler five-area family flow.

### Added

- Home, Discover, Learn, Observe and Play architecture
- Family profiles, XP, ranks, streaks and achievement patches
- Saved discoveries
- Daily family missions
- Current space-news feed
- Two learning depths and read-aloud
- Evidence-labelled theory cards
- Orbit quiz and transit simulation
- 3I/ATLAS historical observatory
- Offline, loading, retry and trust states
- PWA shell and privacy-first local storage

### Lost or reduced

- Historical APOD date selection
- Telescope timeline/gallery workflow
- Direct Mars Rover Photos API workflow
- User-supplied NASA API-key controls
- Custom NEO date-range controls
- Some technical metadata density

The product became easier and more family-oriented, but less useful as an archive and specialist NASA-data browser.

## Living Universe / CaldaSpace 3.0

The second merger added animation and interaction without intentionally removing product features.

### Added

- Ambient star field and comet movement
- Route transitions and section atmospheres
- Scroll reveals and card depth
- Animated progress and reward effects
- More dynamic Discover, Learn, Observe and Play environments

### Side effects

- Mobile hierarchy became less disciplined
- The offline notice could obscure content
- The wordmark split incorrectly on narrow screens
- The bottom navigation became visually heavy
- Canvas animation still looked illustrative rather than genuinely spatial

## Professional 3D / CaldaSpace 3.1

This release keeps the family features and Living Universe motion while restoring important archive capabilities.

### Restored

- Historical APOD time machine
- Seven-day APOD gallery
- Rover image gallery using NASA Images
- Local NASA API-key management

The retired legacy rover endpoint is not restored. The new Rover Gallery uses NASA Images so the experience does not depend on a retired service.

### Added

- Procedural Three.js planet, rings, atmosphere, moon and satellite
- Procedural Three.js 3I/ATLAS comet, particle tail, orbital paths and radar ring
- Pointer-responsive 3D camera movement
- Mobile wordmark, title, offline-status and navigation fixes
- Compact network-status feedback suitable for in-app browsers
- Progressive fallback when WebGL or the external Three.js module is unavailable

## Current product position

CaldaSpace now combines the strongest parts of both directions:

1. Family learning and progression
2. Live and historical NASA discovery
3. Real browser-based 3D presentation
4. Transparent evidence and simulation labels
5. Mobile-first interaction without requiring an account
