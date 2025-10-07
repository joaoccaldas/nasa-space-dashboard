// CaldaSpace - Main Application Logic (Improved)
import { 
    fetchAPOD, 
    fetchMarsPhotos, 
    fetchNearEarthObjects, 
    fetchNASAAPI, 
    validateAPODDate, 
    validateAPIKey, 
    APOD_START_DATE, 
    testAPIConnection 
} from './api.js';

// API Key Management
let API_KEY = localStorage.getItem('nasa_api_key') || 'DEMO_KEY';

// DOM Elements - with safe checking
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const apiStatus = document.getElementById('apiStatus');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// APOD elements
const apodDateInput = document.getElementById('apodDate');
const apodLoadBtn = document.getElementById('fetchApodDate');

// Telescope Gallery elements
const telescopeStartDate = document.getElementById('telescopeStartDate');
const telescopeEndDate = document.getElementById('telescopeEndDate');
const telescopeImageCount = document.getElementById('imageCount');
const telescopeViewMode = document.getElementById('viewMode');
const telescopeLoadBtn = document.getElementById('fetchTelescopeImages');
const telescopeContent = document.getElementById('telescopeContent');
const telescopeLoading = document.getElementById('telescopeLoading');

// Debug logging
console.log('CaldaSpace: Application starting...');

// Helper: get today in UTC (YYYY-MM-DD)
function getTodayUTC() {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Initialize Application
function init() {
    console.log('CaldaSpace: Initializing application...');
    
    try {
        // Load saved API key
        if (apiKeyInput) {
            apiKeyInput.value = API_KEY;
        }

        // DEMO_KEY info banner
        if (API_KEY === 'DEMO_KEY') {
            showAPIStatus('Using DEMO_KEY (30/hr, 50/day). Add your own key for higher limits.', 'warning');
        }

        // Set defaults for date inputs using UTC to avoid timezone issues
        const todayUTC = getTodayUTC();

        if (apodDateInput) {
            apodDateInput.min = APOD_START_DATE;
            apodDateInput.max = todayUTC;
            if (!apodDateInput.value || apodDateInput.value > todayUTC) {
                apodDateInput.value = todayUTC;
            }
        }

        const marsDate = document.getElementById('marsDate');
        if (marsDate) {
            marsDate.max = todayUTC;
            if (!marsDate.value || marsDate.value > todayUTC) {
                marsDate.value = todayUTC;
            }
        }

        if (telescopeEndDate) {
            telescopeEndDate.max = todayUTC;
            if (!telescopeEndDate.value || telescopeEndDate.value > todayUTC) {
                telescopeEndDate.value = todayUTC;
            }
        }
        if (telescopeStartDate) {
            telescopeStartDate.min = APOD_START_DATE;
        }

        // Also cap NEO date pickers to today UTC if present
        const neoStartDate = document.getElementById('neoStartDate');
        const neoEndDate = document.getElementById('neoEndDate');
        if (neoStartDate) neoStartDate.max = todayUTC;
        if (neoEndDate) {
            neoEndDate.max = todayUTC;
            if (!neoEndDate.value || neoEndDate.value > todayUTC) {
                neoEndDate.value = todayUTC;
            }
        }

        // Set up event listeners
        setupEventListeners();

        // Test API status in background
        setTimeout(async () => {
            try {
                const test = await testAPIConnection(API_KEY);
                if (!test.success) {
                    showAPIStatus(`API check: ${test.message}`, 'warning');
                }
            } catch (error) {
                console.error('API test failed:', error);
            }
        }, 0);

        // Load initial APOD data
        if (apodDateInput?.value) {
            loadAPOD(apodDateInput.value);
        }
        
        console.log('CaldaSpace: Initialization complete');
    } catch (error) {
        console.error('CaldaSpace: Initialization error:', error);
        showAPIStatus('Application initialization failed. Please refresh the page.', 'error');
    }
}

// Event Listeners Setup
function setupEventListeners() {
    console.log('CaldaSpace: Setting up event listeners...');
    
    try {
        // API Key Save
        if (saveApiKeyBtn) {
            saveApiKeyBtn.addEventListener('click', saveAPIKey);
        }

        // Tab switching
        tabButtons.forEach(button => {
            button.addEventListener('click', () => switchTab(button.dataset.tab));
        });

        // APOD controls: change on date change and on button click
        if (apodDateInput) {
            apodDateInput.addEventListener('change', () => {
                if (apodDateInput.value) {
                    loadAPOD(apodDateInput.value);
                }
            });
        }
        if (apodLoadBtn) {
            apodLoadBtn.addEventListener('click', () => {
                if (apodDateInput?.value) {
                    loadAPOD(apodDateInput.value);
                }
            });
        }

        // Mars Rover Controls
        const fetchMarsBtn = document.getElementById('fetchMarsPhotos');
        if (fetchMarsBtn) {
            fetchMarsBtn.addEventListener('click', loadMarsPhotos);
        }

        // NEO Controls
        const fetchNeoBtn = document.getElementById('fetchNeoData');
        if (fetchNeoBtn) {
            fetchNeoBtn.addEventListener('click', loadNEOData);
        }

        // Telescope controls
        if (telescopeLoadBtn) {
            telescopeLoadBtn.addEventListener('click', loadTelescopeImages);
        }
        
        console.log('CaldaSpace: Event listeners set up successfully');
    } catch (error) {
        console.error('CaldaSpace: Error setting up event listeners:', error);
    }
}

// Save API Key
function saveAPIKey() {
    try {
        const key = apiKeyInput.value.trim();
        if (key) {
            API_KEY = key;
            localStorage.setItem('nasa_api_key', key);
            showAPIStatus('API Key saved successfully!', 'success');
            console.log('CaldaSpace: API key saved');
        } else {
            showAPIStatus('Please enter a valid API key', 'error');
        }
    } catch (error) {
        console.error('CaldaSpace: Error saving API key:', error);
        showAPIStatus('Error saving API key', 'error');
    }
}

// Show API Status Message
function showAPIStatus(message, type) {
    if (apiStatus) {
        apiStatus.textContent = message;
        apiStatus.className = `api-status ${type}`;
        setTimeout(() => {
            apiStatus.textContent = '';
            apiStatus.className = 'api-status';
        }, 4000);
    }
}

// Tab Switching
function switchTab(tabName) {
    try {
        console.log(`CaldaSpace: Switching to tab: ${tabName}`);
        
        // Hide all tabs
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all buttons
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Add active class to clicked button
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    } catch (error) {
        console.error('CaldaSpace: Error switching tabs:', error);
    }
}

// Load APOD (Astronomy Picture of the Day)
async function loadAPOD(date) {
    const loading = document.getElementById('apodLoading');
    const content = document.getElementById('apodContent');
    
    if (!loading || !content) {
        console.error('CaldaSpace: APOD elements not found');
        return;
    }

    console.log(`CaldaSpace: Loading APOD for date: ${date}`);

    // Validate API key before calling
    const keyValidation = validateAPIKey(API_KEY);
    if (!keyValidation.valid) {
        content.innerHTML = `<div class="error-message">${keyValidation.warning}</div>`;
        return;
    }
    if (keyValidation.warning) {
        showAPIStatus(keyValidation.warning, 'warning');
    }

    // Validate date before API call
    const { valid, date: cleanDate, error } = validateAPODDate(date);
    if (!valid) {
        content.innerHTML = `<div class="error-message">Error: ${error}</div>`;
        return;
    }

    try {
        loading.classList.add('show');
        content.innerHTML = '';
        
        const data = await fetchAPOD(API_KEY, cleanDate || '');
        loading.classList.remove('show');
        
        if (data) {
            displayAPOD(data);
            console.log('CaldaSpace: APOD loaded successfully');
        } else {
            content.innerHTML = '<div class="error-message">Failed to load APOD data. Please check your API key.</div>';
        }
    } catch (error) {
        console.error('CaldaSpace: Error loading APOD:', error);
        loading.classList.remove('show');
        content.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

// Display APOD Data
function displayAPOD(data) {
    const content = document.getElementById('apodContent');
    if (!content) return;
    
    const isVideo = data.media_type === 'video';
    const mediaElement = isVideo
        ? `<iframe src="${data.url}" frameborder="0" allowfullscreen style="width: 100%; aspect-ratio: 16/9; border-radius: 8px;"></iframe>`
        : `<img src="${data.url}" alt="${data.title}" style="width: 100%; height: auto; border-radius: 8px;"/>`;
    
    content.innerHTML = `
        <div class="content-card">
            ${mediaElement}
            <h3>${data.title || 'Astronomy Picture of the Day'}</h3>
            <div><strong>Date:</strong> ${data.date}</div>
            <p>${data.explanation || ''}</p>
            ${data.copyright ? `<div><strong>©</strong> ${data.copyright}</div>` : ''}
        </div>
    `;
}

// Load Mars Rover Photos
async function loadMarsPhotos() {
    const loading = document.getElementById('marsLoading');
    const content = document.getElementById('marsContent');
    const roverSelect = document.getElementById('roverSelect');
    const marsDate = document.getElementById('marsDate');
    
    if (!loading || !content || !roverSelect || !marsDate) {
        console.error('CaldaSpace: Mars elements not found');
        return;
    }

    const rover = roverSelect.value;
    const date = marsDate.value;
    
    if (!date) {
        showAPIStatus('Please select a date', 'error');
        return;
    }

    console.log(`CaldaSpace: Loading Mars photos for ${rover} on ${date}`);

    try {
        loading.classList.add('show');
        content.innerHTML = '';
        
        const data = await fetchMarsPhotos(API_KEY, rover, date);
        loading.classList.remove('show');
        
        if (data && data.photos && data.photos.length > 0) {
            displayMarsPhotos(data.photos);
            console.log(`CaldaSpace: Loaded ${data.photos.length} Mars photos`);
        } else {
            content.innerHTML = '<div class="no-data">No photos found for this date. Try another date.</div>';
        }
    } catch (error) {
        console.error('CaldaSpace: Error loading Mars photos:', error);
        loading.classList.remove('show');
        content.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

// Display Mars Photos
function displayMarsPhotos(photos) {
    const content = document.getElementById('marsContent');
    if (!content) return;
    
    content.innerHTML = photos.slice(0, 20).map(photo => `
        <div class="photo-item">
            <img src="${photo.img_src}" alt="Mars photo from ${photo.rover.name}" loading="lazy"/>
            <div class="photo-info">
                <div><strong>Camera:</strong> ${photo.camera.full_name}</div>
                <div><strong>Date:</strong> ${photo.earth_date}</div>
                <div><strong>Sol:</strong> ${photo.sol}</div>
            </div>
        </div>
    `).join('');
}

// Load Near Earth Objects Data
async function loadNEOData() {
    const loading = document.getElementById('neoLoading');
    const content = document.getElementById('neoContent');
    const startDate = document.getElementById('neoStartDate');
    const endDate = document.getElementById('neoEndDate');
    
    if (!loading || !content || !startDate || !endDate) {
        console.error('CaldaSpace: NEO elements not found');
        return;
    }

    const start = startDate.value;
    const end = endDate.value;
    
    if (!start || !end) {
        showAPIStatus('Please select both start and end dates', 'error');
        return;
    }

    console.log(`CaldaSpace: Loading NEO data from ${start} to ${end}`);

    try {
        loading.classList.add('show');
        content.innerHTML = '';
        
        const data = await fetchNearEarthObjects(API_KEY, start, end);
        loading.classList.remove('show');
        
        if (data && data.near_earth_objects) {
            displayNEOData(data.near_earth_objects);
            console.log('CaldaSpace: NEO data loaded successfully');
        } else {
            content.innerHTML = '<div class="no-data">No NEO data found for this date range.</div>';
        }
    } catch (error) {
        console.error('CaldaSpace: Error loading NEO data:', error);
        loading.classList.remove('show');
        content.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

// Display NEO Data
function displayNEOData(neoData) {
    const content = document.getElementById('neoContent');
    if (!content) return;
    
    let html = '';
    let count = 0;
    
    for (const date in neoData) {
        const objects = neoData[date];
        objects.forEach(neo => {
            if (count < 50) {
                const hazardous = neo.is_potentially_hazardous_asteroid;
                const diameter = neo.estimated_diameter.meters;
                const approach = neo.close_approach_data[0];
                
                html += `
                    <div class="neo-item ${hazardous ? 'hazardous' : ''}">
                        <div class="neo-header">
                            <h4>${neo.name}</h4>
                            <span class="hazard-badge ${hazardous ? 'danger' : 'safe'}">
                                ${hazardous ? '⚠️ Hazardous' : '✅ Safe'}
                            </span>
                        </div>
                        <div class="neo-details">
                            <div><strong>Date:</strong> ${date}</div>
                            <div><strong>Diameter:</strong> ${diameter.estimated_diameter_min.toFixed(0)} - ${diameter.estimated_diameter_max.toFixed(0)} meters</div>
                            <div><strong>Velocity:</strong> ${parseFloat(approach.relative_velocity.kilometers_per_hour).toLocaleString()} km/h</div>
                            <div><strong>Miss Distance:</strong> ${parseFloat(approach.miss_distance.kilometers).toLocaleString()} km</div>
                        </div>
                    </div>
                `;
                count++;
            }
        });
    }
    
    content.innerHTML = html || '<div class="no-data">No objects found.</div>';
}

// Telescope Gallery: Fetch APOD range as gallery and allow dataset selection
async function loadTelescopeImages() {
    if (!telescopeContent || !telescopeLoading) {
        console.error('CaldaSpace: Telescope elements not found');
        return;
    }
    
    const start = telescopeStartDate?.value || APOD_START_DATE;
    const end = telescopeEndDate?.value;
    const count = Math.min(Math.max(parseInt(telescopeImageCount?.value || '20', 10), 1), 100);
    const mode = telescopeViewMode?.value || 'gallery';
    
    console.log(`CaldaSpace: Loading ${count} telescope images from ${start} to ${end} in ${mode} mode`);
    
    try {
        telescopeLoading.classList.add('show');
        telescopeContent.innerHTML = '';
        
        // Strategy: Use APOD endpoint with start_date and end_date, then slice to count
        let items = [];
        
        if (start && end) {
            const params = { start_date: start, end_date: end };
            const apods = await fetchNASAAPI('/planetary/apod', API_KEY, params);
            items = Array.isArray(apods) ? apods.filter(i => i.media_type === 'image') : [];
            items = items.slice(0, count);
        } else {
            const apods = await fetchNASAAPI('/planetary/apod', API_KEY, { count });
            items = Array.isArray(apods) ? apods.filter(i => i.media_type === 'image') : [];
        }
        
        telescopeLoading.classList.remove('show');
        
        if (!items.length) {
            telescopeContent.innerHTML = '<div class="no-data">No telescope images found for the selected range.</div>';
            return;
        }
        
        if (mode === 'timeline') {
            items.sort((a, b) => new Date(a.date) - new Date(b.date));
            telescopeContent.innerHTML = items.map(item => `
                <div class="content-card">
                    <div class="timeline-date">${item.date} — ${item.title}</div>
                    <img src="${item.url}" alt="${item.title}" loading="lazy"/>
                    ${item.explanation ? `<p class="timeline-desc">${item.explanation.substring(0, 200)}...</p>` : ''}
                </div>
            `).join('');
        } else {
            // gallery
            telescopeContent.innerHTML = items.map(item => `
                <div class="photo-item">
                    <img src="${item.url}" alt="${item.title}" loading="lazy"/>
                    <div class="photo-info">
                        <div class="photo-title">${item.title}</div>
                        <div class="photo-date">${item.date}</div>
                    </div>
                </div>
            `).join('');
        }
        
        console.log(`CaldaSpace: Loaded ${items.length} telescope images in ${mode} mode`);
        
    } catch (error) {
        console.error('CaldaSpace: Error loading telescope images:', error);
        telescopeLoading.classList.remove('show');
        telescopeContent.innerHTML = `<div class="error-message">Error loading images: ${error.message}</div>`;
    }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('CaldaSpace: Global error:', event.error);
});

console.log('CaldaSpace: Module loaded successfully');
