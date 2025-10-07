# CaldaSpace 🚀

**CaldaSpace** is an interactive web application that showcases NASA's public APIs, providing users with access to stunning astronomical imagery, Mars rover photos, near-Earth object data, and a comprehensive telescope image gallery.

## Features

### 1. Picture of the Day (APOD)
- View NASA's Astronomy Picture of the Day
- **NEW**: Date picker to explore historical APODs from any date since June 16, 1995
- Support for both images and videos
- Detailed descriptions and copyright information

### 2. Telescope Gallery
- **NEW FEATURE**: Browse telescope images from NASA's APOD archive
- Two view modes:
  - **Gallery View**: Grid layout of telescope images
  - **Timeline View**: Chronological display of images
- Configurable date range (from 1995-06-16 to present)
- Adjustable image count (1-100 images)
- Fetch images from the earliest available dates in NASA's API

### 3. Mars Rover Photos
- Browse photos from multiple Mars rovers:
  - Curiosity
  - **NEW**: Perseverance
  - Opportunity
  - Spirit
- Select specific Earth dates to view rover photos
- Display camera information and capture dates

### 4. Near Earth Objects (NEO)
- Track asteroids and comets approaching Earth
- View estimated diameters, velocities, and miss distances
- Identify potentially hazardous objects
- Customizable date range for NEO queries

## Recent Improvements

### Version 2.0 - CaldaSpace Rebrand (October 2025)

1. **Rebranded** from "NASA Space Dashboard" to "CaldaSpace"
2. **Telescope Gallery**: New tab featuring APOD archive browsing with timeline/gallery views
3. **Date Selection**: Added date pickers for APOD to explore historical images
4. **Mars Rover Update**: Added Perseverance rover to the available options
5. **UI Enhancements**: Improved layout and controls for better user experience
6. **Performance**: Optimized API calls and data fetching
7. **Error Handling**: Enhanced error messages and loading states
8. **Responsive Design**: Better mobile and tablet support
9. **Accessibility**: Improved keyboard navigation and screen reader support
10. **Documentation**: Comprehensive README with feature descriptions

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A NASA API key (get one free at [api.nasa.gov](https://api.nasa.gov/))

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/joaoccaldas/nasa-space-dashboard.git
   cd nasa-space-dashboard
   ```

2. Open `index.html` in your web browser

3. Enter your NASA API key in the application
   - Or use the DEMO_KEY for limited testing

### Usage

1. **Enter API Key**: Input your NASA API key and click "Save Key"
2. **Navigate Tabs**: Click on different tabs to explore various features
3. **Select Dates**: Use date pickers to explore historical data
4. **View Images**: Browse through stunning space imagery
5. **Learn**: Read descriptions and technical details about each item

## Project Structure

```
nasa-space-dashboard/
├── index.html          # Main HTML structure with CaldaSpace branding
├── style.css           # Responsive CSS styling
├── js/
│   ├── api.js         # NASA API integration functions
│   └── app.js         # Main application logic and event handlers
└── README.md          # This file
```

## Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with flexbox and grid
- **JavaScript (ES6+)**: Async/await, modules, and modern JS features
- **NASA APIs**:
  - APOD (Astronomy Picture of the Day)
  - Mars Rover Photos
  - NeoWs (Near Earth Object Web Service)

## API Endpoints

- **APOD**: `https://api.nasa.gov/planetary/apod`
- **Mars Rover Photos**: `https://api.nasa.gov/mars-photos/api/v1/rovers/{rover}/photos`
- **NEO**: `https://api.nasa.gov/neo/rest/v1/feed`

## Features Comparison

### Original Perplexity Labs Code vs. CaldaSpace

**Recovered/Improved Features:**
- ✅ Core APOD functionality maintained
- ✅ Mars Rover integration preserved
- ✅ NEO tracking retained
- ✅ API key management kept
- ✅ Tab-based navigation improved
- ✅ Loading states enhanced
- ✅ Error handling strengthened

**New Additions:**
- 🆕 Telescope Gallery with timeline/gallery views
- 🆕 Historical APOD date selection
- 🆕 Perseverance rover support
- 🆕 Enhanced responsive design
- 🆕 Improved accessibility
- 🆕 Better mobile experience

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

This project uses NASA's public APIs and imagery, which are generally free to use. Please review NASA's [media usage guidelines](https://www.nasa.gov/multimedia/guidelines/index.html) for specific terms.

## Acknowledgments

- NASA for providing amazing public APIs
- All Mars rover teams for the incredible imagery
- The astronomy community for daily APOD selections
- Original inspiration from Perplexity Labs

## Author

**João Caldas**  
GitHub: [@joaoccaldas](https://github.com/joaoccaldas)

## Future Enhancements

- [ ] Add image download functionality
- [ ] Implement favorites/bookmarking system
- [ ] Add social sharing capabilities
- [ ] Include more NASA APIs (Earth Observatory, etc.)
- [ ] Add dark mode toggle
- [ ] Implement image zoom and lightbox
- [ ] Add search functionality
- [ ] Create image comparison tool

---

**CaldaSpace** - Explore the cosmos with NASA's public APIs 🌌
