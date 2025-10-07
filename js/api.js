// NASA API Module - Functions for interacting with NASA's public APIs
// Best practices from: NASA API Docs, GitHub APOD API, StackOverflow
const NASA_API_BASE_URL = 'https://api.nasa.gov';
// APOD service started on June 16, 1995
const APOD_START_DATE = '1995-06-16';

/**
 * Validate and sanitize date for APOD API
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {object} { valid: boolean, date: string|null, error: string|null }
 */
function validateAPODDate(date) {
    if (!date) {
        return { valid: true, date: null, error: null };
    }

    // Validate YYYY-MM-DD format
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

    // Check if date is valid
    if (isNaN(inputDate.getTime())) {
        return { 
            valid: false, 
            date: null, 
            error: 'Invalid date. Please check the day/month combination' 
        };
    }

    // Check if date is before APOD start date
    if (inputDate < startDate) {
        return { 
            valid: false, 
            date: null, 
            error: `Date cannot be before ${APOD_START_DATE} (when APOD service started)` 
        };
    }

    // Check if date is in the future
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

    // Check if using DEMO_KEY
    if (apiKey === 'DEMO_KEY') {
        return { 
            valid: true, 
            warning: 'Using DEMO_KEY: Limited to 30 requests per hour and 50 per day. Get a free personal key at https://api.nasa.gov/ for higher limits' 
        };
    }

    return { valid: true, warning: null };
}

/**
 * Parse API error response for user-friendly messages
 * @param {Response} response - Fetch API response
 * @param {object} data - Response JSON data (if available)
 * @returns {string} User-friendly error message
 */
function parseAPIError(response, data = null) {
    const status = response.status;

    // Handle specific HTTP status codes
    switch (status) {
        case 400:
            return data?.msg || data?.error?.message || 'Bad request. Please check your date format (YYYY-MM-DD) and parameters';
        
        case 403:
            return 'Access forbidden. Your API key may be invalid or suspended. Get a new key at https://api.nasa.gov/';
        
        case 404:
            return 'The image does not exist for this date. Please try a different date.';
        
        case 429:
            return 'Rate limit exceeded. DEMO_KEY allows 30 requests/hour, 50/day. Wait a while or get a personal API key at https://api.nasa.gov/ for higher limits';
        
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
 * Fetch Astronomy Picture of the Day (APOD)
 * @param {string} apiKey - NASA API key
 * @param {string} date - Optional date in YYYY-MM-DD format
 * @returns {Promise<object>} APOD data
 * @throws {Error} User-friendly error with validation or API issues
 */
export async function fetchAPOD(apiKey, date = '') {
    // Validate API key
    const keyValidation = validateAPIKey(apiKey);
    if (!keyValidation.valid) {
        throw new Error(keyValidation.warning);
    }

    // Show DEMO_KEY warning if applicable
    if (keyValidation.warning) {
        console.warn(keyValidation.warning);
    }

    // Validate and sanitize date
    const dateValidation = validateAPODDate(date);
    if (!dateValidation.valid) {
        throw new Error(dateValidation.error);
    }

    try {
        // Build URL with validated parameters
        let url = `${NASA_API_BASE_URL}/planetary/apod?api_key=${apiKey}`;
        if (dateValidation.date) {
            url += `&date=${dateValidation.date}`;
        }
        
        const response = await fetch(url);
        
        // Handle HTTP errors with user-friendly messages
        if (!response.ok) {
            let errorData = null;
            try {
                errorData = await response.json();
            } catch (e) {
                // Response body might not be JSON
            }
            
            const errorMessage = parseAPIError(response, errorData);
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        // Re-throw if it's already a user-friendly error
        if (error.message.includes('date') || 
            error.message.includes('API') || 
            error.message.includes('Rate limit') ||
            error.message.includes('key') ||
            error.message.includes('image')) {
            throw error;
        }
        
        // Handle network errors
        console.error('Error fetching APOD:', error);
        throw new Error('Network error. Please check your internet connection and try again');
    }
}

/**
 * Fetch Mars Rover Photos
 * @param {string} apiKey - NASA API key
 * @param {string} rover - Rover name (curiosity, opportunity, spirit)
 * @param {string} earthDate - Earth date in YYYY-MM-DD format
 * @returns {Promise<object>} Mars rover photos data
 */
export async function fetchMarsPhotos(apiKey, rover = 'curiosity', earthDate) {
    // Validate API key
    const keyValidation = validateAPIKey(apiKey);
    if (!keyValidation.valid) {
        throw new Error(keyValidation.warning);
    }

    if (keyValidation.warning) {
        console.warn(keyValidation.warning);
    }

    try {
        const url = `${NASA_API_BASE_URL}/mars-photos/api/v1/rovers/${rover}/photos?earth_date=${earthDate}&api_key=${apiKey}`;
        
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
        console.error('Error fetching Mars photos:', error);
        throw new Error('Network error. Please check your internet connection and try again');
    }
}

/**
 * Fetch Near Earth Objects (NEO)
 * @param {string} apiKey - NASA API key
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<object>} NEO data
 */
export async function fetchNearEarthObjects(apiKey, startDate, endDate) {
    // Validate API key
    const keyValidation = validateAPIKey(apiKey);
    if (!keyValidation.valid) {
        throw new Error(keyValidation.warning);
    }

    if (keyValidation.warning) {
        console.warn(keyValidation.warning);
    }

    try {
        const url = `${NASA_API_BASE_URL}/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${apiKey}`;
        
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
        console.error('Error fetching NEO data:', error);
        throw new Error('Network error. Please check your internet connection and try again');
    }
}

/**
 * Fetch Earth Polychromatic Imaging Camera (EPIC) images
 * @param {string} apiKey - NASA API key
 * @returns {Promise<object>} EPIC data
 */
export async function fetchEPIC(apiKey) {
    // Validate API key
    const keyValidation = validateAPIKey(apiKey);
    if (!keyValidation.valid) {
        throw new Error(keyValidation.warning);
    }

    if (keyValidation.warning) {
        console.warn(keyValidation.warning);
    }

    try {
        const url = `${NASA_API_BASE_URL}/EPIC/api/natural?api_key=${apiKey}`;
        
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
        console.error('Error fetching EPIC data:', error);
        throw new Error('Network error. Please check your internet connection and try again');
    }
}

/**
 * Generic fetch function for NASA APIs
 * @param {string} endpoint - API endpoint
 * @param {string} apiKey - NASA API key
 * @param {Object} params - Additional query parameters
 * @returns {Promise<object>} API response data
 */
export async function fetchNASAAPI(endpoint, apiKey, params = {}) {
    // Validate API key
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
 * @returns {Promise<object>} { success: boolean, message: string }
 */
export async function testAPIConnection(apiKey) {
    try {
        const response = await fetchAPOD(apiKey);
        return { 
            success: true, 
            message: 'Successfully connected to NASA API' 
        };
    } catch (error) {
        return { 
            success: false, 
            message: error.message 
        };
    }
}

/**
 * Export validation functions for use in app.js
 */
export { validateAPODDate, validateAPIKey, APOD_START_DATE };
