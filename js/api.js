// CaldaSpace Enhanced API Module - Advanced NASA API interactions with source attribution
const NASA_API_BASE_URL = 'https://api.nasa.gov';
const JPL_HORIZONS_API = 'https://ssd-api.jpl.nasa.gov/horizons_file.api';
const APOD_START_DATE = '1995-06-16';

/**
 * Enhanced date validation for APOD API
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {object} { valid: boolean, date: string|null, error: string|null }
 */
function validateAPODDate(date) {
    if (!date) {
        return { valid: true, date: null, error: null };
    }

    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!dateRegex.test(date)) {
        return { 
            valid: false, 
            date: null, 
            error: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2024-03-15)' 
        };
    }

    const inputDate = new Date(date + 'T00:00:00Z');
    const startDate = new Date(APOD_START_DATE + 'T00:00:00Z');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (isNaN(inputDate.getTime())) {
        return { 
            valid: false, 
            date: null, 
            error: 'Invalid date. Please check the day/month combination' 
        };
    }

    if (inputDate < startDate) {
        return { 
            valid: false, 
            date: null, 
            error: `Date cannot be before ${APOD_START_DATE} (when APOD service started)` 
        };
    }

    if (inputDate > today) {
        return { 
            valid: false, 
            date: null, 
            error: 'No APOD available for future dates. Please pick a valid date.' 
        };
    }

    return { valid: true, date: date, error: null };
}

/**
 * Get the latest available date with APOD data
 * @returns {string} Latest date in YYYY-MM-DD format
 */
export function getLatestAPODDate() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const y = today.getUTCFullYear();
    const m = String(today.getUTCMonth() + 1).padStart(2, '0');
    const d = String(today.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Get the latest available date for Mars rover photos
 * @returns {string} Latest date in YYYY-MM-DD format
 */
export function getLatestMarsDate() {
    // Mars rovers have delay in data availability
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 2); // 2 days ago to account for processing delay
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Validate API key format
 * @param {string} apiKey - NASA API key
 * @returns {object} { valid: boolean, warning: string|null }
 */
function validateAPIKey(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
        return { 
            valid: false, 
            warning: 'API key is required. Get a free key at https://api.nasa.gov/' 
        };
    }

    if (apiKey === 'DEMO_KEY') {
        return { 
            valid: true, 
            warning: 'Using DEMO_KEY: Limited to 30 requests per hour and 50 per day. Get a free personal key at https://api.nasa.gov/ for higher limits' 
        };
    }

    return { valid: true, warning: null };
}

/**
 * Enhanced error parsing with more user-friendly messages
 * @param {Response} response - Fetch API response
 * @param {object} data - Response JSON data (if available)
 * @returns {string} User-friendly error message
 */
function parseAPIError(response, data = null) {
    const status = response.status;

    switch (status) {
        case 400:
            return data?.msg || data?.error?.message || 'Bad request. Please check your parameters and date format (YYYY-MM-DD)';
        case 403:
            return 'Access forbidden. Your API key may be invalid or suspended. Get a new key at https://api.nasa.gov/';
        case 404:
            return 'No data found for the requested parameters. Try different dates or parameters.';
        case 429:
            return 'Rate limit exceeded. DEMO_KEY allows 30 requests/hour, 50/day. Wait or get a personal API key at https://api.nasa.gov/ for higher limits';
        case 500:
        case 502:
        case 503:
        case 504:
            return 'NASA API is temporarily unavailable. Please try again in a few moments';
        default:
            return data?.msg || data?.error?.message || `API error (Status ${status}). Please try again later`;
    }
}

/**
 * Create source attribution links for NASA data
 * @param {object} data - API response data
 * @param {string} apiType - Type of API (apod, mars, neo, etc.)
 * @returns {object} Enhanced data with source links
 */
function addSourceLinks(data, apiType) {
    const sourceData = { ...data };
    
    switch (apiType) {
        case 'apod':
            sourceData.sourceLinks = {
                nasa_apod: 'https://apod.nasa.gov/apod/',
                original_page: data.date ? `https://apod.nasa.gov/apod/ap${data.date.replace(/-/g, '').substring(2)}.html` : null,
                hd_image: data.hdurl || data.url,
                nasa_api_docs: 'https://api.nasa.gov/#apod'
            };
            break;
        case 'mars':
            sourceData.sourceLinks = {
                mars_rover_page: `https://mars.nasa.gov/msl/`,
                rover_specific: `https://mars.nasa.gov/${data.rover?.name?.toLowerCase()}/`,
                original_image: data.img_src,
                nasa_api_docs: 'https://api.nasa.gov/#MarsPhotos'
            };
            break;
        case 'neo':
            sourceData.sourceLinks = {
                jpl_ssd: `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(data.name)}`,
                neo_database: 'https://cneos.jpl.nasa.gov/',
                nasa_api_docs: 'https://api.nasa.gov/#NeoWS'
            };
            break;
        default:
            sourceData.sourceLinks = {
                nasa_main: 'https://www.nasa.gov/',
                api_docs: 'https://api.nasa.gov/'
            };
    }
    
    return sourceData;
}

/**
 * Enhanced APOD fetch with source links
 * @param {string} apiKey - NASA API key
 * @param {string} date - Optional date in YYYY-MM-DD format
 * @returns {Promise<object>} Enhanced APOD data with source links
 */
export async function fetchAPOD(apiKey, date = '') {
    const keyValidation = validateAPIKey(apiKey);
    if (!keyValidation.valid) {
        throw new Error(keyValidation.warning);
    }

    if (keyValidation.warning) {
        console.warn(keyValidation.warning);
    }

    const dateValidation = validateAPODDate(date);
    if (!dateValidation.valid) {
        throw new Error(dateValidation.error);
    }

    try {
        let url = `${NASA_API_BASE_URL}/planetary/apod?api_key=${apiKey}`;
        if (dateValidation.date) {
            url += `&date=${dateValidation.date}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            let errorData = null;
            try {
                errorData = await response.json();
            } catch (e) {}
            
            const errorMessage = parseAPIError(response, errorData);
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        return addSourceLinks(data, 'apod');
    } catch (error) {
        if (error.message.includes('date') || 
            error.message.includes('API') || 
            error.message.includes('Rate limit') ||
            error.message.includes('key') ||
            error.message.includes('image')) {
            throw error;
        }
        
        console.error('Error fetching APOD:', error);
        throw new Error('Network error. Please check your internet connection and try again');
    }
}

/**
 * Fetch random APOD from available date range
 * @param {string} apiKey - NASA API key
 * @returns {Promise<object>} Random APOD data
 */
export async function fetchRandomAPOD(apiKey) {
    const startDate = new Date(APOD_START_DATE);
    const endDate = new Date();
    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    const randomDate = new Date(randomTime);
    
    const dateStr = randomDate.toISOString().split('T')[0];
    return fetchAPOD(apiKey, dateStr);
}

/**
 * Enhanced Mars Rover Photos with source links
 * @param {string} apiKey - NASA API key
 * @param {string} rover - Rover name
 * @param {string} earthDate - Earth date in YYYY-MM-DD format
 * @param {number} page - Page number for pagination
 * @returns {Promise<object>} Enhanced Mars rover photos data
 */
export async function fetchMarsPhotos(apiKey, rover = 'curiosity', earthDate, page = 1) {
    const keyValidation = validateAPIKey(apiKey);
    if (!keyValidation.valid) {
        throw new Error(keyValidation.warning);
    }

    if (keyValidation.warning) {
        console.warn(keyValidation.warning);
    }

    try {
        const url = `${NASA_API_BASE_URL}/mars-photos/api/v1/rovers/${rover}/photos?earth_date=${earthDate}&api_key=${apiKey}&page=${page}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            let errorData = null;
            try {
                errorData = await response.json();
            } catch (e) {}
            
            const errorMessage = parseAPIError(response, errorData);
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Add source links to each photo
        if (data.photos) {
            data.photos = data.photos.map(photo => addSourceLinks(photo, 'mars'));
        }
        
        return data;
    } catch (error) {
        if (error.message.includes('API') || error.message.includes('Rate limit')) {
            throw error;
        }
        console.error('Error fetching Mars photos:', error);
        throw new Error('Network error. Please check your internet connection and try again');
    }
}

/**
 * Fetch latest Mars photos for a rover
 * @param {string} apiKey - NASA API key
 * @param {string} rover - Rover name
 * @param {number} count - Number of photos to fetch
 * @returns {Promise<object>} Latest Mars rover photos
 */
export async function fetchLatestMarsPhotos(apiKey, rover = 'curiosity', count = 20) {
    const keyValidation = validateAPIKey(apiKey);
    if (!keyValidation.valid) {
        throw new Error(keyValidation.warning);
    }

    try {
        const url = `${NASA_API_BASE_URL}/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            let errorData = null;
            try {
                errorData = await response.json();
            } catch (e) {}
            
            const errorMessage = parseAPIError(response, errorData);
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Add source links and limit count
        if (data.latest_photos) {
            data.latest_photos = data.latest_photos
                .slice(0, count)
                .map(photo => addSourceLinks(photo, 'mars'));
        }
        
        return data;
    } catch (error) {
        if (error.message.includes('API') || error.message.includes('Rate limit')) {
            throw error;
        }
        console.error('Error fetching latest Mars photos:', error);
        throw new Error('Network error. Please check your internet connection and try again');
    }
}

/**
 * Enhanced Near Earth Objects with 3D visualization data
 * @param {string} apiKey - NASA API key
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<object>} Enhanced NEO data with 3D coordinates
 */
export async function fetchNearEarthObjects(apiKey, startDate, endDate) {
    const keyValidation = validateAPIKey(apiKey);
    if (!keyValidation.valid) {
        throw new Error(keyValidation.warning);
    }

    if (keyValidation.warning) {
        console.warn(keyValidation.warning);
    }

    try {
        const url = `${NASA_API_BASE_URL}/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${apiKey}&detailed=true`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            let errorData = null;
            try {
                errorData = await response.json();
            } catch (e) {}
            
            const errorMessage = parseAPIError(response, errorData);
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Enhance NEO data with 3D coordinates and source links
        if (data.near_earth_objects) {
            for (const date in data.near_earth_objects) {
                data.near_earth_objects[date] = data.near_earth_objects[date].map(neo => {
                    // Add source links
                    const enhancedNeo = addSourceLinks(neo, 'neo');
                    
                    // Add 3D coordinates for visualization
                    if (neo.close_approach_data && neo.close_approach_data.length > 0) {
                        const approach = neo.close_approach_data[0];
                        const distance = parseFloat(approach.miss_distance.astronomical);
                        const velocity = parseFloat(approach.relative_velocity.kilometers_per_second);
                        
                        // Generate approximate orbital position based on approach data
                        const angle = Math.random() * Math.PI * 2; // Random angle for visualization
                        enhancedNeo.position3D = {
                            x: Math.cos(angle) * distance * 100, // Scale for visualization
                            y: Math.sin(angle) * distance * 100,
                            z: (Math.random() - 0.5) * distance * 50, // Some Z variation
                            distance: distance,
                            velocity: velocity
                        };
                    }
                    
                    return enhancedNeo;
                });
            }
        }
        
        return data;
    } catch (error) {
        if (error.message.includes('API') || error.message.includes('Rate limit')) {
            throw error;
        }
        console.error('Error fetching NEO data:', error);
        throw new Error('Network error. Please check your internet connection and try again');
    }
}

/**
 * Fetch comet 3I/Borisov (Oumuamua successor) trajectory data
 * This is a mock implementation as real-time comet data requires specific JPL Horizons queries
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<object>} Comet trajectory data
 */
export async function fetchComet3ITrajectory(startDate, endDate) {
    // Mock trajectory data for 3I/Atlas (interstellar comet)
    // In a real implementation, this would query JPL Horizons API
    return new Promise((resolve) => {
        setTimeout(() => {
            const trajectory = [];
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            
            for (let i = 0; i < days; i += 7) { // Weekly points
                const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
                const t = i / days;
                
                // Hyperbolic trajectory simulation
                const a = 3.5; // Semi-major axis approximation
                const e = 3.2; // Eccentricity (hyperbolic)
                const angle = t * Math.PI * 2;
                
                trajectory.push({
                    date: date.toISOString().split('T')[0],
                    position: {
                        x: a * (e * Math.cos(angle) - 1) * 200,
                        y: a * Math.sqrt(e * e - 1) * Math.sin(angle) * 200,
                        z: (Math.sin(angle * 3) * 50),
                        distance_au: Math.sqrt(Math.pow(a * (e * Math.cos(angle) - 1), 2) + Math.pow(a * Math.sqrt(e * e - 1) * Math.sin(angle), 2))
                    },
                    velocity_kms: 26 + Math.random() * 10 // Approximate velocity
                });
            }
            
            resolve({
                name: '3I/Atlas (Interstellar Comet)',
                type: 'interstellar',
                trajectory: trajectory,
                sourceLinks: {
                    jpl_ssd: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3I',
                    nasa_jpl: 'https://www.jpl.nasa.gov/news/nasa-confirms-interstellar-object',
                    horizons: 'https://ssd.jpl.nasa.gov/horizons/app.html#/'
                }
            });
        }, 500);
    });
}

/**
 * Generic enhanced fetch function for NASA APIs
 * @param {string} endpoint - API endpoint
 * @param {string} apiKey - NASA API key
 * @param {Object} params - Additional query parameters
 * @returns {Promise<object>} API response data
 */
export async function fetchNASAAPI(endpoint, apiKey, params = {}) {
    const keyValidation = validateAPIKey(apiKey);
    if (!keyValidation.valid) {
        throw new Error(keyValidation.warning);
    }

    if (keyValidation.warning) {
        console.warn(keyValidation.warning);
    }

    try {
        const queryParams = new URLSearchParams({
            api_key: apiKey,
            ...params
        });
        
        const url = `${NASA_API_BASE_URL}${endpoint}?${queryParams.toString()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            let errorData = null;
            try {
                errorData = await response.json();
            } catch (e) {}
            
            const errorMessage = parseAPIError(response, errorData);
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        if (error.message.includes('API') || error.message.includes('Rate limit')) {
            throw error;
        }
        console.error(`Error fetching NASA API (${endpoint}):`, error);
        throw new Error('Network error. Please check your internet connection and try again');
    }
}

/**
 * Test if NASA API is accessible and responding
 * @param {string} apiKey - NASA API key to test
 * @returns {Promise<object>} { success: boolean, message: string, responseTime: number }
 */
export async function testAPIConnection(apiKey) {
    const startTime = performance.now();
    try {
        const response = await fetchAPOD(apiKey);
        const responseTime = Math.round(performance.now() - startTime);
        return { 
            success: true, 
            message: `Successfully connected to NASA API (${responseTime}ms)`,
            responseTime: responseTime,
            data: response
        };
    } catch (error) {
        const responseTime = Math.round(performance.now() - startTime);
        return { 
            success: false, 
            message: error.message,
            responseTime: responseTime
        };
    }
}

/**
 * Export validation functions and constants
 */
export { 
    validateAPODDate, 
    validateAPIKey, 
    APOD_START_DATE,
    addSourceLinks,
    parseAPIError
};
