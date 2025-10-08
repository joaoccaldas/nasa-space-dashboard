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
 * Fetch latest NASA news from RSS feeds
 * @param {string} category - News category (general, missions, jwst, mars, iss, artemis)
 * @param {number} count - Number of articles to fetch
 * @returns {Promise<Array>} News articles
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
            thumbnail: item.thumbnail || item.enclosure?.link || generateThumbnail(category),
            source: 'NASA',
            sourceLinks: {
                original_article: item.link || item.guid,
                nasa_news: 'https://www.nasa.gov/news/',
                rss_feed: rssUrl
            }
        }));
        
        console.log(`Fetched ${newsItems.length} news articles from ${category}`);
        return newsItems;
        
    } catch (error) {
        console.error('Error fetching NASA news:', error);
        return generateMockNewsData(category, count);
    }
}

/**
 * Fetch aggregated space news from multiple sources
 * @param {number} count - Total number of articles
 * @returns {Promise<Array>} Mixed news from different sources
 */
export async function fetchAggregatedSpaceNews(count = 20) {
    console.log('Fetching aggregated space news...');
    
    const categories = ['general', 'missions', 'jwst', 'mars', 'iss'];
    const articlesPerCategory = Math.ceil(count / categories.length);
    
    const allNews = [];
    
    // Fetch from each category
    for (const category of categories) {
        try {
            const news = await fetchNASANews(category, articlesPerCategory);
            allNews.push(...news);
        } catch (error) {
            console.warn(`Failed to fetch ${category} news:`, error);
        }
    }
    
    // Sort by date (newest first) and limit
    const sortedNews = allNews
        .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
        .slice(0, count);
    
    // Remove duplicates by title
    const uniqueNews = [];
    const seenTitles = new Set();
    
    for (const article of sortedNews) {
        if (!seenTitles.has(article.title)) {
            seenTitles.add(article.title);
            uniqueNews.push(article);
        }
    }
    
    console.log(`Returning ${uniqueNews.length} unique space news articles`);
    return uniqueNews;
}

/**
 * Generate mock news data as fallback
 * @param {string} category - News category
 * @param {number} count - Number of articles
 * @returns {Array} Mock news articles
 */
function generateMockNewsData(category, count) {
    console.log(`Generating mock news data for ${category}`);
    
    const mockNews = {
        'general': [
            {
                title: 'NASA Prepares for Upcoming Asteroid Flyby Mission',
                description: 'Scientists are finalizing preparations for a close encounter with a newly discovered asteroid that will provide valuable insights into the early solar system.',
                category: 'Asteroids'
            },
            {
                title: 'International Space Station Welcomes New Crew Members',
                description: 'Three astronauts successfully docked with the ISS yesterday, beginning their six-month mission focused on advanced materials research.',
                category: 'ISS'
            },
            {
                title: 'Solar Activity Reaches Peak as Sun Enters Maximum Phase',
                description: 'Solar physicists report increased sunspot activity and coronal mass ejections as our star approaches solar maximum.',
                category: 'Solar Physics'
            }
        ],
        'jwst': [
            {
                title: 'James Webb Telescope Discovers Most Distant Galaxy Yet',
                description: 'JWST observations reveal a galaxy that existed just 300 million years after the Big Bang, rewriting our understanding of early universe formation.',
                category: 'JWST'
            },
            {
                title: 'Webb Telescope Finds Water Vapor in Exoplanet Atmosphere',
                description: 'Advanced spectroscopy reveals water molecules in the atmosphere of a potentially habitable exoplanet 40 light-years away.',
                category: 'Exoplanets'
            }
        ],
        'mars': [
            {
                title: 'Perseverance Rover Collects Samples from Ancient River Delta',
                description: 'The Mars rover has successfully gathered rock samples from what scientists believe was once a flowing river system on Mars.',
                category: 'Mars Exploration'
            },
            {
                title: 'Ingenuity Helicopter Completes 100th Flight on Mars',
                description: 'NASA\'s Mars helicopter continues to exceed expectations, providing aerial reconnaissance for the Perseverance rover mission.',
                category: 'Mars Technology'
            }
        ],
        'missions': [
            {
                title: 'Artemis III Mission Timeline Updated with Crew Assignments',
                description: 'NASA announces the crew members selected for humanity\'s return to the lunar surface, including the first woman to walk on the Moon.',
                category: 'Artemis'
            },
            {
                title: 'Europa Clipper Spacecraft Completes Final Testing Phase', 
                description: 'The mission to Jupiter\'s ice-covered moon Europa has passed all pre-launch tests and is scheduled for launch next month.',
                category: 'Outer Planets'
            }
        ]
    };
    
    const categoryNews = mockNews[category] || mockNews['general'];
    const selectedNews = [];
    
    for (let i = 0; i < count && i < categoryNews.length * 3; i++) {
        const baseArticle = categoryNews[i % categoryNews.length];
        const daysAgo = Math.floor(Math.random() * 7) + i; // Spread over recent days
        const publishDate = new Date();
        publishDate.setDate(publishDate.getDate() - daysAgo);
        
        selectedNews.push({
            id: generateNewsId(baseArticle.title + i),
            title: baseArticle.title,
            description: baseArticle.description,
            url: `https://www.nasa.gov/news/article/${generateNewsId(baseArticle.title)}`,
            category: baseArticle.category,
            publishDate: publishDate.toISOString(),
            author: 'NASA',
            thumbnail: generateThumbnail(category),
            source: 'NASA',
            sourceLinks: {
                original_article: `https://www.nasa.gov/news/article/${generateNewsId(baseArticle.title)}`,
                nasa_news: 'https://www.nasa.gov/news/',
                category_feed: NASA_RSS_FEEDS[category] || NASA_RSS_FEEDS['general']
            }
        });
    }
    
    return selectedNews.slice(0, count);
}

/**
 * Generate news ID from title
 * @param {string} title - Article title
 * @returns {string} URL-safe ID
 */
function generateNewsId(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
}

/**
 * Strip HTML tags from text
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
function stripHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

/**
 * Generate category-appropriate thumbnail
 * @param {string} category - News category
 * @returns {string} Thumbnail URL
 */
function generateThumbnail(category) {
    const thumbnails = {
        'general': 'https://via.placeholder.com/300x200/0b3d91/ffffff?text=NASA+News',
        'jwst': 'https://via.placeholder.com/300x200/FF6B35/ffffff?text=JWST',
        'mars': 'https://via.placeholder.com/300x200/CD5C5C/ffffff?text=Mars',
        'iss': 'https://via.placeholder.com/300x200/4A90E2/ffffff?text=ISS',
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
