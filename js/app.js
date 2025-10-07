// CaldaSpace - Enhanced Main Application Logic
// Advanced space exploration with clickable source links, 3D visualizations, and comprehensive data

import { 
    fetchAPOD, 
    fetchRandomAPOD,
    fetchMarsPhotos, 
    fetchLatestMarsPhotos,
    fetchNearEarthObjects, 
    fetchComet3ITrajectory,
    fetchNASAAPI, 
    validateAPODDate, 
    validateAPIKey, 
    APOD_START_DATE, 
    testAPIConnection,
    getLatestAPODDate,
    getLatestMarsDate
} from './api.js';

import NEO3DVisualizer from './neo3d.js';

// Application state
let API_KEY = localStorage.getItem('nasa_api_key') || 'DEMO_KEY';
let neo3DVisualizer = null;

// DOM Elements - with comprehensive checking
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const testApiKeyBtn = document.getElementById('testApiKey');
const apiStatus = document.getElementById('apiStatus');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// APOD elements
const apodDateInput = document.getElementById('apodDate');
const apodLoadBtn = document.getElementById('fetchApodDate');
const randomApodBtn = document.getElementById('randomApod');

// Telescope Gallery elements
const telescopeStartDate = document.getElementById('telescopeStartDate');
const telescopeEndDate = document.getElementById('telescopeEndDate');
const telescopeImageCount = document.getElementById('imageCount');
const telescopeViewMode = document.getElementById('viewMode');
const telescopeLoadBtn = document.getElementById('fetchTelescopeImages');
const telescopeContent = document.getElementById('telescopeContent');
const telescopeLoading = document.getElementById('telescopeLoading');

// Mars elements
const marsLatestBtn = document.getElementById('marsLatestPhotos');

// NEO 3D elements
const show3DCheckbox = document.getElementById('show3D');
const showOrbitsCheckbox = document.getElementById('showOrbits');
const showComet3ICheckbox = document.getElementById('showComet3I');
const animationSpeedSlider = document.getElementById('animationSpeed');
const resetViewBtn = document.getElementById('resetView');
const neoMaxDistanceInput = document.getElementById('neoMaxDistance');

console.log('CaldaSpace: Enhanced application starting...');

// Helper: get today in UTC (YYYY-MM-DD)
function getTodayUTC() {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Helper: create clickable image with source attribution
function createClickableImage(src, alt, sourceLinks, title = '', description = '') {
    return `
        <div class="clickable-image-container">
            <img src="${src}" alt="${alt}" class="clickable-image" 
                 onclick="window.showImageSource('${encodeURIComponent(JSON.stringify(sourceLinks))}', '${encodeURIComponent(title)}', '${encodeURIComponent(description)}')" 
                 style="cursor: pointer; border-radius: 8px;" 
                 title="Click to view source and high-resolution version" />
            <div class="image-attribution">
                <small>🔗 Click image for source & high-res</small>
            </div>
        </div>
    `;
}

// Global function to show image source modal
window.showImageSource = function(encodedSourceLinks, encodedTitle, encodedDescription) {
    try {
        const sourceLinks = JSON.parse(decodeURIComponent(encodedSourceLinks));
        const title = decodeURIComponent(encodedTitle);
        const description = decodeURIComponent(encodedDescription);
        
        const modal = document.getElementById('sourceModal');
        const modalTitle = document.getElementById('sourceModalTitle');
        const modalContent = document.getElementById('sourceModalContent');
        
        modalTitle.textContent = title || 'Source Information';
        
        let linksHTML = '<div class="source-links-grid">';
        
        if (sourceLinks.original_page) {
            linksHTML += `<a href="${sourceLinks.original_page}" target="_blank" rel="noopener" class="source-link primary">
                <strong>🔗 View Original NASA Page</strong>
            </a>`;
        }
        
        if (sourceLinks.hd_image) {
            linksHTML += `<a href="${sourceLinks.hd_image}" target="_blank" rel="noopener" class="source-link">
                🖼️ High Resolution Image
            </a>`;
        }
        
        if (sourceLinks.original_image) {
            linksHTML += `<a href="${sourceLinks.original_image}" target="_blank" rel="noopener" class="source-link">
                🖼️ Original Image
            </a>`;
        }
        
        if (sourceLinks.jpl_ssd) {
            linksHTML += `<a href="${sourceLinks.jpl_ssd}" target="_blank" rel="noopener" class="source-link">
                🔭 JPL Small-Body Database
            </a>`;
        }
        
        if (sourceLinks.nasa_api_docs) {
            linksHTML += `<a href="${sourceLinks.nasa_api_docs}" target="_blank" rel="noopener" class="source-link">
                📚 NASA API Documentation
            </a>`;
        }
        
        if (sourceLinks.rover_specific) {
            linksHTML += `<a href="${sourceLinks.rover_specific}" target="_blank" rel="noopener" class="source-link">
                🤖 Rover Mission Page
            </a>`;
        }
        
        linksHTML += '</div>';
        
        if (description) {
            linksHTML += `<div class="source-description"><p>${description}</p></div>`;
        }
        
        modalContent.innerHTML = linksHTML;
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error showing image source:', error);
        alert('Error loading source information');
    }
};

// Initialize Application
function init() {
    console.log('CaldaSpace: Initializing enhanced application...');
    
    try {
        // Load saved API key
        if (apiKeyInput) {
            apiKeyInput.value = API_KEY;
        }

        // Show API status
        if (API_KEY === 'DEMO_KEY') {
            showAPIStatus('Using DEMO_KEY (30/hr, 50/day). Add your own key for higher limits.', 'warning');
        }

        // Set intelligent defaults for date inputs
        setupDefaultDates();

        // Set up event listeners
        setupEventListeners();

        // Initialize 3D visualizer
        if (document.getElementById('neo3DCanvas')) {
            setTimeout(() => {
                neo3DVisualizer = new NEO3DVisualizer('neo3DCanvas');
                setup3DControls();
            }, 100);
        }

        // Test API in background
        setTimeout(async () => {
            try {
                const test = await testAPIConnection(API_KEY);
                if (test.success) {
                    showAPIStatus(`Connected to NASA API (${test.responseTime}ms)`, 'success');
                } else {
                    showAPIStatus(`API check: ${test.message}`, 'warning');
                }
            } catch (error) {
                console.error('API test failed:', error);
            }
        }, 500);

        // Load initial content with latest dates
        loadInitialContent();
        
        console.log('CaldaSpace: Enhanced initialization complete');
    } catch (error) {
        console.error('CaldaSpace: Initialization error:', error);
        showAPIStatus('Application initialization failed. Please refresh the page.', 'error');
    }
}

function setupDefaultDates() {
    const todayUTC = getTodayUTC();
    const latestAPOD = getLatestAPODDate();
    const latestMars = getLatestMarsDate();
    
    // APOD date - set to latest available
    if (apodDateInput) {
        apodDateInput.min = APOD_START_DATE;
        apodDateInput.max = latestAPOD;
        apodDateInput.value = latestAPOD;
    }

    // Mars date - set to latest available with data
    const marsDate = document.getElementById('marsDate');
    if (marsDate) {
        marsDate.max = latestMars;
        marsDate.value = latestMars;
    }

    // Telescope dates
    if (telescopeEndDate) {
        telescopeEndDate.max = latestAPOD;
        telescopeEndDate.value = latestAPOD;
    }
    if (telescopeStartDate) {
        telescopeStartDate.min = APOD_START_DATE;
        // Set start date to 30 days ago for good range
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
        const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];
        telescopeStartDate.value = startDateStr;
    }

    // NEO dates - set to last 7 days for good data
    const neoStartDate = document.getElementById('neoStartDate');
    const neoEndDate = document.getElementById('neoEndDate');
    if (neoStartDate && neoEndDate) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
        neoStartDate.value = sevenDaysAgo.toISOString().split('T')[0];
        neoEndDate.value = todayUTC;
        neoStartDate.max = todayUTC;
        neoEndDate.max = todayUTC;
    }
}

function loadInitialContent() {
    // Load today's APOD by default
    if (apodDateInput?.value) {
        loadAPOD(apodDateInput.value);
    }
}

function setupEventListeners() {
    console.log('CaldaSpace: Setting up enhanced event listeners...');
    
    try {
        // API Key management
        if (saveApiKeyBtn) {
            saveApiKeyBtn.addEventListener('click', saveAPIKey);
        }
        if (testApiKeyBtn) {
            testApiKeyBtn.addEventListener('click', testAPIKey);
        }

        // Tab switching
        tabButtons.forEach(button => {
            button.addEventListener('click', () => switchTab(button.dataset.tab));
        });

        // APOD controls
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
        if (randomApodBtn) {
            randomApodBtn.addEventListener('click', loadRandomAPOD);
        }

        // Mars Rover Controls
        const fetchMarsBtn = document.getElementById('fetchMarsPhotos');
        if (fetchMarsBtn) {
            fetchMarsBtn.addEventListener('click', loadMarsPhotos);
        }
        if (marsLatestBtn) {
            marsLatestBtn.addEventListener('click', loadLatestMarsPhotos);
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
        
        console.log('CaldaSpace: Enhanced event listeners set up successfully');
    } catch (error) {
        console.error('CaldaSpace: Error setting up event listeners:', error);
    }
}

function setup3DControls() {
    if (!neo3DVisualizer) return;
    
    // 3D visualization controls
    if (show3DCheckbox) {
        show3DCheckbox.addEventListener('change', (e) => {
            const canvas = document.getElementById('neo3DCanvas');
            if (canvas) {
                canvas.style.display = e.target.checked ? 'block' : 'none';
            }
        });
    }
    
    if (showOrbitsCheckbox) {
        showOrbitsCheckbox.addEventListener('change', (e) => {
            neo3DVisualizer.toggleOrbits(e.target.checked);
        });
    }
    
    if (showComet3ICheckbox) {
        showComet3ICheckbox.addEventListener('change', async (e) => {
            if (e.target.checked) {
                try {
                    const neoStartDate = document.getElementById('neoStartDate');
                    const neoEndDate = document.getElementById('neoEndDate');
                    const cometData = await fetchComet3ITrajectory(
                        neoStartDate?.value || '2023-01-01',
                        neoEndDate?.value || '2024-01-01'
                    );
                    neo3DVisualizer.addCometTrajectory(cometData);
                } catch (error) {
                    console.error('Error loading comet data:', error);
                    showAPIStatus('Error loading comet trajectory data', 'error');
                }
            } else {
                neo3DVisualizer.toggleComet(false);
            }
        });
    }
    
    if (animationSpeedSlider) {
        animationSpeedSlider.addEventListener('input', (e) => {
            neo3DVisualizer.setAnimationSpeed(parseFloat(e.target.value));
        });
    }
    
    if (resetViewBtn) {
        resetViewBtn.addEventListener('click', () => {
            neo3DVisualizer.resetView();
        });
    }
}

// Enhanced API key management
async function saveAPIKey() {
    try {
        const key = apiKeyInput.value.trim();
        if (key) {
            API_KEY = key;
            localStorage.setItem('nasa_api_key', key);
            showAPIStatus('API Key saved! Testing connection...', 'success');
            
            // Test the new key
            setTimeout(() => testAPIKey(), 500);
            
            console.log('CaldaSpace: API key saved');
        } else {
            showAPIStatus('Please enter a valid API key', 'error');
        }
    } catch (error) {
        console.error('CaldaSpace: Error saving API key:', error);
        showAPIStatus('Error saving API key', 'error');
    }
}

async function testAPIKey() {
    try {
        showAPIStatus('Testing API connection...', 'warning');
        const test = await testAPIConnection(API_KEY);
        
        if (test.success) {
            showAPIStatus(`✅ API connected successfully! (${test.responseTime}ms)`, 'success');
        } else {
            showAPIStatus(`⚠️ API test failed: ${test.message}`, 'error');
        }
    } catch (error) {
        showAPIStatus('Error testing API connection', 'error');
    }
}

function showAPIStatus(message, type) {
    if (apiStatus) {
        apiStatus.textContent = message;
        apiStatus.className = `api-status ${type}`;
        setTimeout(() => {
            apiStatus.textContent = '';
            apiStatus.className = 'api-status';
        }, 6000);
    }
}

function switchTab(tabName) {
    try {
        console.log(`CaldaSpace: Switching to tab: ${tabName}`);
        
        // Hide all tabs and remove active class
        tabContents.forEach(content => content.classList.remove('active'));
        tabButtons.forEach(button => button.classList.remove('active'));
        
        // Show selected tab and activate button
        const selectedTab = document.getElementById(tabName);
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (selectedTab) selectedTab.classList.add('active');
        if (activeButton) activeButton.classList.add('active');
        
        // Load default content for specific tabs
        if (tabName === 'neo' && neo3DVisualizer) {
            // Auto-load NEO data when switching to 3D tab
            setTimeout(() => {
                const fetchNeoBtn = document.getElementById('fetchNeoData');
                if (fetchNeoBtn) fetchNeoBtn.click();
            }, 500);
        }
        
    } catch (error) {
        console.error('CaldaSpace: Error switching tabs:', error);
    }
}

// Enhanced APOD loading with clickable images
async function loadAPOD(date) {
    const loading = document.getElementById('apodLoading');
    const content = document.getElementById('apodContent');
    
    if (!loading || !content) {
        console.error('CaldaSpace: APOD elements not found');
        return;
    }

    console.log(`CaldaSpace: Loading APOD for date: ${date}`);

    const keyValidation = validateAPIKey(API_KEY);
    if (!keyValidation.valid) {
        content.innerHTML = `<div class="error-message">${keyValidation.warning}</div>`;
        return;
    }

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
            displayEnhancedAPOD(data);
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

async function loadRandomAPOD() {
    try {
        showAPIStatus('Loading random APOD...', 'warning');
        const data = await fetchRandomAPOD(API_KEY);
        
        // Update date input to match random APOD
        if (apodDateInput && data.date) {
            apodDateInput.value = data.date;
        }
        
        displayEnhancedAPOD(data);
        showAPIStatus('Random APOD loaded!', 'success');
        
    } catch (error) {
        console.error('Error loading random APOD:', error);
        showAPIStatus('Error loading random APOD', 'error');
    }
}

function displayEnhancedAPOD(data) {
    const content = document.getElementById('apodContent');
    if (!content) return;
    
    const isVideo = data.media_type === 'video';
    
    let mediaElement;
    if (isVideo) {
        mediaElement = `<iframe src="${data.url}" frameborder="0" allowfullscreen 
                               style="width: 100%; aspect-ratio: 16/9; border-radius: 8px;"></iframe>`;
    } else {
        mediaElement = createClickableImage(
            data.url, 
            data.title, 
            data.sourceLinks, 
            data.title, 
            data.explanation?.substring(0, 200) + '...'
        );
    }
    
    content.innerHTML = `
        <div class="content-card enhanced">
            ${mediaElement}
            <div class="apod-info">
                <h3>${data.title || 'Astronomy Picture of the Day'}</h3>
                <div class="apod-meta">
                    <span><strong>Date:</strong> ${data.date}</span>
                    ${data.copyright ? `<span><strong>©</strong> ${data.copyright}</span>` : ''}
                </div>
                <p class="apod-explanation">${data.explanation || ''}</p>
                ${data.sourceLinks ? `
                    <div class="source-quick-links">
                        <a href="${data.sourceLinks.original_page || '#'}" target="_blank" rel="noopener" class="quick-link">
                            🔗 NASA APOD Page
                        </a>
                        ${data.sourceLinks.hd_image ? `
                            <a href="${data.sourceLinks.hd_image}" target="_blank" rel="noopener" class="quick-link">
                                🖼️ HD Image
                            </a>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Enhanced Mars photos loading
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
            displayEnhancedMarsPhotos(data.photos);
            console.log(`CaldaSpace: Loaded ${data.photos.length} Mars photos`);
        } else {
            content.innerHTML = '<div class="no-data">No photos found for this date. Try the "Latest Photos" button or select a different date.</div>';
        }
    } catch (error) {
        console.error('CaldaSpace: Error loading Mars photos:', error);
        loading.classList.remove('show');
        content.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

async function loadLatestMarsPhotos() {
    const loading = document.getElementById('marsLoading');
    const content = document.getElementById('marsContent');
    const roverSelect = document.getElementById('roverSelect');
    
    if (!roverSelect) return;
    
    const rover = roverSelect.value;
    
    try {
        loading?.classList.add('show');
        content.innerHTML = '';
        
        showAPIStatus(`Loading latest ${rover} photos...`, 'warning');
        
        const data = await fetchLatestMarsPhotos(API_KEY, rover, 25);
        loading?.classList.remove('show');
        
        if (data && data.latest_photos && data.latest_photos.length > 0) {
            displayEnhancedMarsPhotos(data.latest_photos);
            showAPIStatus(`Loaded ${data.latest_photos.length} latest ${rover} photos`, 'success');
        } else {
            content.innerHTML = '<div class="no-data">No recent photos available for this rover.</div>';
        }
    } catch (error) {
        console.error('Error loading latest Mars photos:', error);
        loading?.classList.remove('show');
        showAPIStatus('Error loading latest Mars photos', 'error');
    }
}

function displayEnhancedMarsPhotos(photos) {
    const content = document.getElementById('marsContent');
    if (!content) return;
    
    content.innerHTML = photos.slice(0, 25).map(photo => {
        const clickableImg = createClickableImage(
            photo.img_src, 
            `Mars photo from ${photo.rover.name}`, 
            photo.sourceLinks,
            `${photo.rover.name} - Sol ${photo.sol}`,
            `Camera: ${photo.camera.full_name} | Earth Date: ${photo.earth_date}`
        );
        
        return `
            <div class="photo-item enhanced">
                ${clickableImg}
                <div class="photo-info">
                    <div class="photo-title">${photo.rover.name} - Sol ${photo.sol}</div>
                    <div class="photo-details">
                        <div><strong>Camera:</strong> ${photo.camera.full_name}</div>
                        <div><strong>Earth Date:</strong> ${photo.earth_date}</div>
                        <div><strong>Status:</strong> ${photo.rover.status}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Enhanced NEO loading with 3D visualization
async function loadNEOData() {
    const loading = document.getElementById('neoLoading');
    const content = document.getElementById('neoContent');
    const statsDiv = document.getElementById('neoStats');
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
        if (statsDiv) statsDiv.innerHTML = '';
        
        const data = await fetchNearEarthObjects(API_KEY, start, end);
        loading.classList.remove('show');
        
        if (data && data.near_earth_objects) {
            displayEnhancedNEOData(data.near_earth_objects, data);
            
            // Add to 3D visualization if enabled
            if (neo3DVisualizer && show3DCheckbox?.checked) {
                neo3DVisualizer.addNEOData(data);
            }
            
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

function displayEnhancedNEOData(neoData, fullData) {
    const content = document.getElementById('neoContent');
    const statsDiv = document.getElementById('neoStats');
    if (!content) return;
    
    let html = '';
    let count = 0;
    let hazardousCount = 0;
    let totalEstimatedDiameter = 0;
    let maxVelocity = 0;
    
    for (const date in neoData) {
        const objects = neoData[date];
        objects.forEach(neo => {
            if (count < 50) {
                const hazardous = neo.is_potentially_hazardous_asteroid;
                const diameter = neo.estimated_diameter.meters;
                const approach = neo.close_approach_data[0];
                
                if (hazardous) hazardousCount++;
                totalEstimatedDiameter += diameter.estimated_diameter_max;
                const velocity = parseFloat(approach.relative_velocity.kilometers_per_hour);
                if (velocity > maxVelocity) maxVelocity = velocity;
                
                html += `
                    <div class="neo-item enhanced ${hazardous ? 'hazardous' : ''}" 
                         onclick="${neo3DVisualizer ? `selectNEOIn3D('${neo.id}')` : ''}">
                        <div class="neo-header">
                            <h4>${neo.name}</h4>
                            <div class="neo-badges">
                                <span class="hazard-badge ${hazardous ? 'danger' : 'safe'}">
                                    ${hazardous ? '⚠️ Hazardous' : '✅ Safe'}
                                </span>
                                <span class="size-badge">
                                    ${diameter.estimated_diameter_max < 100 ? 'Small' : 
                                      diameter.estimated_diameter_max < 500 ? 'Medium' : 'Large'}
                                </span>
                            </div>
                        </div>
                        <div class="neo-details">
                            <div><strong>Date:</strong> ${date}</div>
                            <div><strong>Diameter:</strong> ${diameter.estimated_diameter_min.toFixed(0)} - ${diameter.estimated_diameter_max.toFixed(0)} m</div>
                            <div><strong>Velocity:</strong> ${velocity.toLocaleString()} km/h</div>
                            <div><strong>Miss Distance:</strong> ${parseFloat(approach.miss_distance.kilometers).toLocaleString()} km</div>
                            <div><strong>Distance (AU):</strong> ${parseFloat(approach.miss_distance.astronomical).toFixed(4)} AU</div>
                        </div>
                        ${neo.sourceLinks ? `
                            <div class="neo-source-links">
                                <a href="${neo.sourceLinks.jpl_ssd}" target="_blank" rel="noopener" class="source-link small">
                                    🔭 JPL Database
                                </a>
                            </div>
                        ` : ''}
                    </div>
                `;
                count++;
            }
        });
    }
    
    // Display statistics
    if (statsDiv && count > 0) {
        const avgDiameter = (totalEstimatedDiameter / count).toFixed(0);
        statsDiv.innerHTML = `
            <div class="neo-statistics">
                <h4>NEO Statistics for Selected Period</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">${count}</span>
                        <span class="stat-label">Total NEOs</span>
                    </div>
                    <div class="stat-item danger">
                        <span class="stat-number">${hazardousCount}</span>
                        <span class="stat-label">Hazardous</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${avgDiameter}m</span>
                        <span class="stat-label">Avg Diameter</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${maxVelocity.toLocaleString()}</span>
                        <span class="stat-label">Max Velocity (km/h)</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    content.innerHTML = html || '<div class="no-data">No objects found.</div>';
}

// Enhanced telescope images with metadata
async function loadTelescopeImages() {
    if (!telescopeContent || !telescopeLoading) {
        console.error('CaldaSpace: Telescope elements not found');
        return;
    }
    
    const start = telescopeStartDate?.value || APOD_START_DATE;
    const end = telescopeEndDate?.value;
    const count = Math.min(Math.max(parseInt(telescopeImageCount?.value || '25', 10), 1), 100);
    const mode = telescopeViewMode?.value || 'gallery';
    
    console.log(`CaldaSpace: Loading ${count} telescope images from ${start} to ${end} in ${mode} mode`);
    
    try {
        telescopeLoading.classList.add('show');
        telescopeContent.innerHTML = '';
        
        let items = [];
        
        if (start && end) {
            const params = { start_date: start, end_date: end, thumbs: true };
            const apods = await fetchNASAAPI('/planetary/apod', API_KEY, params);
            items = Array.isArray(apods) ? apods.filter(i => i.media_type === 'image') : [];
            items = items.slice(0, count);
        } else {
            const apods = await fetchNASAAPI('/planetary/apod', API_KEY, { count, thumbs: true });
            items = Array.isArray(apods) ? apods.filter(i => i.media_type === 'image') : [];
        }
        
        telescopeLoading.classList.remove('show');
        
        if (!items.length) {
            telescopeContent.innerHTML = '<div class="no-data">No telescope images found for the selected range.</div>';
            return;
        }
        
        displayEnhancedTelescopeImages(items, mode);
        
        console.log(`CaldaSpace: Loaded ${items.length} telescope images in ${mode} mode`);
        
    } catch (error) {
        console.error('CaldaSpace: Error loading telescope images:', error);
        telescopeLoading.classList.remove('show');
        telescopeContent.innerHTML = `<div class="error-message">Error loading images: ${error.message}</div>`;
    }
}

function displayEnhancedTelescopeImages(items, mode) {
    if (!telescopeContent) return;
    
    // Add source links to items
    const enhancedItems = items.map(item => ({
        ...item,
        sourceLinks: {
            original_page: `https://apod.nasa.gov/apod/ap${item.date.replace(/-/g, '').substring(2)}.html`,
            hd_image: item.hdurl || item.url,
            nasa_apod: 'https://apod.nasa.gov/apod/',
            nasa_api_docs: 'https://api.nasa.gov/#apod'
        }
    }));
    
    if (mode === 'timeline') {
        enhancedItems.sort((a, b) => new Date(a.date) - new Date(b.date));
        telescopeContent.innerHTML = enhancedItems.map(item => `
            <div class="content-card timeline-item">
                <div class="timeline-date">${item.date} — ${item.title}</div>
                ${createClickableImage(item.url, item.title, item.sourceLinks, item.title, item.explanation?.substring(0, 150) + '...')}
                ${item.explanation ? `<p class="timeline-desc">${item.explanation.substring(0, 200)}...</p>` : ''}
            </div>
        `).join('');
    } else {
        telescopeContent.innerHTML = enhancedItems.map(item => `
            <div class="photo-item enhanced telescope-item">
                ${createClickableImage(item.url, item.title, item.sourceLinks, item.title, item.explanation?.substring(0, 100) + '...')}
                <div class="photo-info">
                    <div class="photo-title">${item.title}</div>
                    <div class="photo-date">${item.date}</div>
                    ${item.copyright ? `<div class="photo-credit">© ${item.copyright}</div>` : ''}
                </div>
            </div>
        `).join('');
    }
}

// Global helper for 3D NEO selection
window.selectNEOIn3D = function(neoId) {
    if (neo3DVisualizer) {
        // Find NEO in 3D scene and select it
        const neoObj = neo3DVisualizer.neoObjects.find(obj => obj.data.id === neoId);
        if (neoObj) {
            neo3DVisualizer.selectNEO(neoObj);
        }
    }
};

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

// Performance monitoring
window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`CaldaSpace: Application loaded in ${loadTime.toFixed(2)}ms`);
});

console.log('CaldaSpace: Enhanced module loaded successfully');
