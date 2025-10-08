// CaldaSpace - NASA News Integration Module
// Real-time space news from NASA RSS feeds and space agencies

const NASA_RSS_FEEDS = {
    'general': 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    'missions': 'https://www.nasa.gov/rss/dyn/mission_pages.rss',
    'jwst': 'https://www.nasa.gov/rss/dyn/webb.rss',
    'mars': 'https://www.nasa.gov/rss/dyn/mars.rss',
    'iss': 'https://www.nasa.gov/rss/dyn/space_station.rss',
    'artemis': 'https://www.nasa.gov/rss/dyn/artemis.rss'
};

const RSS_TO_JSON_SERVICE = 'https://api.rss2json.com/v1/api.json';

/**
 * Robustly extract image from RSS item
 * @param {object} item - RSS item object
 * @returns {string|null} Image URL or null
 */
function extractImageFromRSSItem(item) {
    // Try thumbnail first
    if (item.thumbnail) {
        return item.thumbnail;
    }
    
    // Try enclosure link
    if (item.enclosure && item.enclosure.link) {
        return item.enclosure.link;
    }
    
    // Try media:content
    if (item['media:content'] && item['media:content'].url) {
        return item['media:content'].url;
    }
    
    // Try to extract image from description HTML
    if (item.description) {
        const imgMatch = item.description.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
            return imgMatch[1];
        }
    }
    
    // Try to extract image from content HTML
    if (item.content) {
        const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
            return imgMatch[1];
        }
    }
    
    return null;
}

/**
 * Fetch latest NASA news from RSS feeds
 * @param {string} category - News category (general, missions, jwst, mars, iss, artemis)
 * @param {number} count - Number of articles to fetch
 * @returns {Promise<array>} News articles
 */
export async function fetchNASANews(category = 'general', count = 10) {
    console.log(`Fetching NASA news from ${category} category`);
    
    try {
        const rssUrl = NASA_RSS_FEEDS[category] || NASA_RSS_FEEDS['general'];
        const apiUrl = `${RSS_TO_JSON_SERVICE}?rss_url=${encodeURIComponent(rssUrl)}&api_key=YOUR_API_KEY_HERE&count=${count}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            console.warn('RSS service unavailable, using mock news data');
            return generateMockNewsData(category, count);
        }
        
        const data = await response.json();
        
        if (data.status !== 'ok' || !data.items) {
            console.warn('Invalid RSS response, using mock data');
            return generateMockNewsData(category, count);
        }
        
        // Process and enhance news items
        const newsItems = data.items.slice(0, count).map(item => ({
            id: generateNewsId(item.title),
            title: item.title,
            description: item.description ? stripHTML(item.description) : item.content ? stripHTML(item.content) : 'Click to read more...',
            url: item.link || item.guid,
            category: category,
            publishDate: item.pubDate,
            author: item.author || 'NASA',
            thumbnail: extractImageFromRSSItem(item) || generateThumbnail(category),
            source: 'NASA',
            sourceLinks: {
                original_article: item.link || item.guid,
                news_image: extractImageFromRSSItem(item)
            }
        }));
        
        return newsItems;
        
    } catch (error) {
        console.error('Error fetching NASA news:', error);
        return generateMockNewsData(category, count);
    }
}

/**
 * Generate a unique ID for a news item
 * @param {string} title - News title
 * @returns {string} Unique ID
 */
function generateNewsId(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50) + '-' + Date.now();
}

/**
 * Strip HTML tags from text
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
function stripHTML(html) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

/**
 * Generate mock news data for testing/fallback
 * @param {string} category - News category
 * @param {number} count - Number of items
 * @returns {array} Mock news data
 */
function generateMockNewsData(category, count) {
    const mockNews = [
        {
            id: 'jwst-deep-field-1',
            title: 'JWST Captures Stunning Deep Field Image',
            description: 'The James Webb Space Telescope has revealed the deepest infrared view of the universe to date.',
            url: 'https://www.nasa.gov/jwst',
            category: 'jwst',
            publishDate: new Date().toISOString(),
            author: 'NASA JWST Team',
            thumbnail: 'https://via.placeholder.com/300x200/1e1b4b/ffffff?text=JWST',
            source: 'NASA',
            sourceLinks: { original_article: 'https://www.nasa.gov/jwst' }
        },
        {
            id: 'mars-perseverance-2',
            title: 'Perseverance Rover Discovers Organic Molecules',
            description: 'NASA\'s Perseverance rover has found intriguing organic compounds in Martian rock samples.',
            url: 'https://www.nasa.gov/mars',
            category: 'mars',
            publishDate: new Date().toISOString(),
            author: 'NASA Mars Team',
            thumbnail: 'https://via.placeholder.com/300x200/dc2626/ffffff?text=Mars',
            source: 'NASA',
            sourceLinks: { original_article: 'https://www.nasa.gov/mars' }
        },
        {
            id: 'artemis-launch-3',
            title: 'Artemis Mission Prepares for Moon Landing',
            description: 'NASA is preparing the Artemis III mission that will land astronauts on the Moon.',
            url: 'https://www.nasa.gov/artemis',
            category: 'artemis',
            publishDate: new Date().toISOString(),
            author: 'NASA Artemis Team',
            thumbnail: 'https://via.placeholder.com/300x200/FFD700/ffffff?text=Artemis',
            source: 'NASA',
            sourceLinks: { original_article: 'https://www.nasa.gov/artemis' }
        },
        {
            id: 'iss-experiment-4',
            title: 'ISS Conducts Groundbreaking Microgravity Experiments',
            description: 'Astronauts aboard the International Space Station are conducting vital research.',
            url: 'https://www.nasa.gov/iss',
            category: 'iss',
            publishDate: new Date().toISOString(),
            author: 'NASA ISS Team',
            thumbnail: 'https://via.placeholder.com/300x200/059669/ffffff?text=ISS',
            source: 'NASA',
            sourceLinks: { original_article: 'https://www.nasa.gov/iss' }
        },
        {
            id: 'general-discovery-5',
            title: 'NASA Announces New Space Exploration Initiative',
            description: 'Breaking news from NASA about the future of space exploration.',
            url: 'https://www.nasa.gov',
            category: 'general',
            publishDate: new Date().toISOString(),
            author: 'NASA',
            thumbnail: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=NASA+News',
            source: 'NASA',
            sourceLinks: { original_article: 'https://www.nasa.gov' }
        }
    ];
    
    return mockNews
        .filter(item => category === 'general' || item.category === category)
        .slice(0, count);
}

/**
 * Generate category-specific placeholder thumbnail
 * @param {string} category - News category
 * @returns {string} Placeholder image URL
 */
function generateThumbnail(category) {
    const thumbnails = {
        'general': 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=NASA+News',
        'jwst': 'https://via.placeholder.com/300x200/1e1b4b/ffffff?text=JWST',
        'mars': 'https://via.placeholder.com/300x200/dc2626/ffffff?text=Mars',
        'iss': 'https://via.placeholder.com/300x200/059669/ffffff?text=ISS',
        'missions': 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Missions',
        'artemis': 'https://via.placeholder.com/300x200/FFD700/ffffff?text=Artemis'
    };
    
    return thumbnails[category] || thumbnails['general'];
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatNewsDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Get news category emoji
 * @param {string} category - News category
 * @returns {string} Appropriate emoji
 */
export function getCategoryEmoji(category) {
    const emojis = {
        'JWST': '🔭',
        'Mars': '🔴',
        'Mars Exploration': '🔴',
        'Mars Technology': '🪐',
        'ISS': '🛰️',
        'Artemis': '🌙',
        'Asteroids': '☄️',
        'Solar Physics': '☀️',
        'Exoplanets': '🌌',
        'Outer Planets': '🪐',
        'Missions': '🚀',
        'default': '🌌'
    };
    
    return emojis[category] || emojis['default'];
}

export { NASA_RSS_FEEDS };
