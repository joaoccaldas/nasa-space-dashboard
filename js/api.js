// NASA API Module - Functions for interacting with NASA's public APIs

const NASA_API_BASE_URL = 'https://api.nasa.gov';

/**
 * Fetch Astronomy Picture of the Day (APOD)
 * @param {string} apiKey - NASA API key
 * @param {string} date - Optional date in YYYY-MM-DD format
 * @returns {Promise<Object>} APOD data
 */
export async function fetchAPOD(apiKey, date = '') {
    try {
        let url = `${NASA_API_BASE_URL}/planetary/apod?api_key=${apiKey}`;
        if (date) {
            url += `&date=${date}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching APOD:', error);
        throw error;
    }
}

/**
 * Fetch Mars Rover Photos
 * @param {string} apiKey - NASA API key
 * @param {string} rover - Rover name (curiosity, opportunity, spirit)
 * @param {string} earthDate - Earth date in YYYY-MM-DD format
 * @returns {Promise<Object>} Mars rover photos data
 */
export async function fetchMarsPhotos(apiKey, rover = 'curiosity', earthDate) {
    try {
        const url = `${NASA_API_BASE_URL}/mars-photos/api/v1/rovers/${rover}/photos?earth_date=${earthDate}&api_key=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching Mars photos:', error);
        throw error;
    }
}

/**
 * Fetch Near Earth Objects (NEO)
 * @param {string} apiKey - NASA API key
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object>} NEO data
 */
export async function fetchNearEarthObjects(apiKey, startDate, endDate) {
    try {
        const url = `${NASA_API_BASE_URL}/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching NEO data:', error);
        throw error;
    }
}

/**
 * Fetch Earth Polychromatic Imaging Camera (EPIC) images
 * @param {string} apiKey - NASA API key
 * @returns {Promise<Object>} EPIC data
 */
export async function fetchEPIC(apiKey) {
    try {
        const url = `${NASA_API_BASE_URL}/EPIC/api/natural?api_key=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching EPIC data:', error);
        throw error;
    }
}

/**
 * Generic fetch function for NASA APIs
 * @param {string} endpoint - API endpoint
 * @param {string} apiKey - NASA API key
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} API response data
 */
export async function fetchNASAAPI(endpoint, apiKey, params = {}) {
    try {
        const queryParams = new URLSearchParams({
            api_key: apiKey,
            ...params
        });
        
        const url = `${NASA_API_BASE_URL}${endpoint}?${queryParams.toString()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching NASA API (${endpoint}):`, error);
        throw error;
    }
}

/**
 * Validate API key by making a test request
 * @param {string} apiKey - NASA API key to validate
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
export async function validateAPIKey(apiKey) {
    try {
        const response = await fetchAPOD(apiKey);
        return response !== null;
    } catch (error) {
        return false;
    }
}
