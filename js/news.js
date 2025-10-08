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
 * Fetch and parse NASA news from RSS feeds
 * @param {string} category - News category
 * @param {number} count - Number of items to fetch
 * @returns {Promise<Array>} Formatted news items
 */
export async function fetchNASANews(category = 'general', count = 10) {
    try {
        const rssUrl = NASA_RSS_FEEDS[category] || NASA_RSS_FEEDS['general'];
        const apiUrl = `${RSS_TO_JSON_SERVICE}?rss_url=${encodeURIComponent(rssUrl)}&count=${count}&api_key=YOUR_API_KEY`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch news: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            console.warn('No news items found');
            return [];
        }
        
        // Process and format news items
        return data.items.map(item => ({
            id: item.guid || item.link,
            title: item.title || 'Untitled',
            description: item.description?.replace(/<[^>]*>/g, '').substring(0, 200) + '...' || 'No description available',
            link: item.link || '#',
            pubDate: item.pubDate || new Date().toISOString(),
            image: extractImageFromRSSItem(item) || getFallbackThumbnail(category),
            category: detectNewsCategory(item.title, item.description)
        }));
    } catch (error) {
        console.error('Error fetching NASA news:', error);
        return [];
    }
}
/**
 * Detect news category from title and description
 * @param {string} title - News title
 * @param {string} description - News description
 * @returns {string} Detected category
 */
function detectNewsCategory(title = '', description = '') {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('james webb') || text.includes('jwst')) return 'JWST';
    if (text.includes('mars') || text.includes('perseverance') || text.includes('curiosity')) return 'Mars';
    if (text.includes('space station') || text.includes('iss')) return 'ISS';
    if (text.includes('artemis') || text.includes('moon') || text.includes('lunar')) return 'Artemis';
    if (text.includes('asteroid')) return 'Asteroids';
    if (text.includes('sun') || text.includes('solar')) return 'Solar Physics';
    if (text.includes('exoplanet')) return 'Exoplanets';
    if (text.includes('jupiter') || text.includes('saturn') || text.includes('neptune') || text.includes('uranus')) return 'Outer Planets';
    if (text.includes('mission') || text.includes('launch')) return 'Missions';
    
    return 'General';
}
/**
 * Get fallback thumbnail for news category
 * @param {string} category - News category
 * @returns {string} Placeholder image URL
 */
function getFallbackThumbnail(category) {
    const thumbnails = {
        'general': 'https://via.placeholder.com/300x200/000080/ffffff?text=NASA+News',
        'jwst': 'https://via.placeholder.com/300x200/8B0000/ffffff?text=JWST',
        'mars': 'https://via.placeholder.com/300x200/CD5C5C/ffffff?text=Mars',
        'iss': 'https://via.placeholder.com/300x200/4682B4/ffffff?text=ISS',
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
// Export alias for backwards compatibility
export { fetchNASANews as fetchAggregatedSpaceNews };
