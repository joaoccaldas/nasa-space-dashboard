// CaldaSpace - Ultimate Space Exploration Application
// Comprehensive integration of NASA, ESA, SpaceX, ISS, and telescope data with 3D visualizations

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

import {
    fetchEnhancedTelescopeData,
    getAvailableMissions,
    getTelescopeStats,
    TELESCOPE_MISSIONS
} from './telescope.js';

import {
    fetchNASANews,
    fetchAggregatedSpaceNews,
    formatNewsDate,
    getCategoryEmoji
} from './news.js';

import {
    fetchISSData,
    fetchSpaceXData,
    fetchESAData,
    fetchMultiAgencyStatus,
    createISS3DObject,
    formatAgencyData
} from './agencies.js';

// Application state
let API_KEY = localStorage.getItem('nasa_api_key') || 'DEMO_KEY';
let neo3DVisualizer = null;
let currentNewsCategory = 'general';
let currentTelescope = 'HST';

// DOM Elements
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const testApiKeyBtn = document.getElementById('testApiKey');
const apiStatus = document.getElementById('apiStatus');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// News elements
const newsCategory = document.getElementById('newsCategory');
const refreshNewsBtn = document.getElementById('refreshNews');
const newsLoading = document.getElementById('newsLoading');
const newsContent = document.getElementById('newsContent');

// Agency elements
const agencyLoading = document.getElementById('agencyLoading');
const agencyStatus = document.getElementById('agencyStatus');

// APOD elements
const apodDateInput = document.getElementById('apodDate');
const apodLoadBtn = document.getElementById('fetchApodDate');
const randomApodBtn = document.getElementById('randomApod');

// Telescope elements
const telescopeSelect = document.getElementById('telescopeSelect');
const telescopeStartDate = document.getElementById('telescopeStartDate');
const telescopeEndDate = document.getElementById('telescopeEndDate');
const telescopeImageCount = document.getElementById('imageCount');
const telescopeViewMode = document.getElementById('viewMode');
const telescopeLoadBtn = document.getElementById('fetchTelescopeImages');
const telescopeLoading = document.getElementById('telescopeLoading');
const telescopeContent = document.getElementById('telescopeContent');

// Mars elements
const marsLatestBtn = document.getElementById('marsLatestPhotos');

// NEO 3D elements
const show3DCheckbox = document.getElementById('show3D');
const showOrbitsCheckbox = document.getElementById('showOrbits');
const showComet3ICheckbox = document.getElementById('showComet3I');
const animationSpeedSlider = document.getElementById('animationSpeed');
const resetViewBtn = document.getElementById('resetView');

console.log('CaldaSpace: Ultimate Application starting...');

// Helper functions
function getTodayUTC() {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

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
        
        if (sourceLinks.original_image || sourceLinks.data_url) {
            linksHTML += `<a href="${sourceLinks.original_image || sourceLinks.data_url}" target="_blank" rel="noopener" class="source-link">
                🖼️ Original Image
            </a>`;
        }
        
        if (sourceLinks.fits_download) {
            linksHTML += `<a href="${sourceLinks.fits_download}" target="_blank" rel="noopener" class="source-link">
                📊 FITS Data Download
            </a>`;
        }
        
        if (sourceLinks.mast_portal) {
            linksHTML += `<a href="${sourceLinks.mast_portal}" target="_blank" rel="noopener" class="source-link">
                🔭 MAST Archive Portal
            </a>`;
        }
        
        if (sourceLinks.mission_page) {
            linksHTML += `<a href="${sourceLinks.mission_page}" target="_blank" rel="noopener" class="source-link">
                🚀 Mission Homepage
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

// Global function to show news article
window.showNewsArticle = function(articleData) {
    try {
        const modal = document.getElementById('newsModal');
        const modalTitle = document.getElementById('newsModalTitle');
        const modalContent = document.getElementById('newsModalContent');
        
        modalTitle.textContent = articleData.title;
        
        modalContent.innerHTML = `
            <div class="news-article-content">
                ${articleData.thumbnail ? `<img src="${articleData.thumbnail}" alt="${articleData.title}" class="news-image" />` : ''}
                <div class="news-meta">
                    <span class="news-category">${getCategoryEmoji(articleData.category)} ${articleData.category}</span>
                    <span class="news-date">${formatNewsDate(articleData.publishDate)}</span>
                    <span class="news-source">by ${articleData.author || 'NASA'}</span>
                </div>
                <div class="news-description">
                    <p>${articleData.description}</p>
                </div>
                <div class="news-actions">
                    <a href="${articleData.url}" target="_blank" rel="noopener" class="source-link primary">
                        🔗 Read Full Article
                    </a>
                    ${articleData.sourceLinks?.nasa_news ? `
                        <a href="${articleData.sourceLinks.nasa_news}" target="_blank" rel="noopener" class="source-link">
                            📰 More NASA News
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error showing news article:', error);
    }
};

// Global function to show agency details
window.showAgencyDetails = function(agencyName, agencyData) {
    try {
        const modal = document.getElementById('agencyModal');
        const modalTitle = document.getElementById('agencyModalTitle');
        const modalContent = document.getElementById('agencyModalContent');
        
        modalTitle.textContent = `${agencyName} Details`;
        
        let content = '';
        
        if (agencyName === 'ISS') {
            content = `
                <div class="agency-details">
                    <h4>🛰️ International Space Station - Live Data</h4>
                    <div class="iss-position">
                        <h5>Current Position</h5>
                        <p><strong>Latitude:</strong> ${agencyData.position.latitude.toFixed(4)}°</p>
                        <p><strong>Longitude:</strong> ${agencyData.position.longitude.toFixed(4)}°</p>
                        <p><strong>Altitude:</strong> ${agencyData.position.altitude} km</p>
                        <p><strong>Velocity:</strong> ${agencyData.velocity.toLocaleString()} km/h</p>
                    </div>
                    <div class="iss-crew">
                        <h5>Current Crew (${agencyData.crew.length} people)</h5>
                        ${agencyData.crew.map(person => `<p>• ${person.name}</p>`).join('')}
                    </div>
                    <div class="iss-links">
                        <a href="${agencyData.sourceLinks.iss_tracker}" target="_blank" class="source-link">📹 NASA Live Stream</a>
                        <a href="${agencyData.sourceLinks.crew_info}" target="_blank" class="source-link">👨‍🚀 Crew Information</a>
                    </div>
                </div>
            `;
        } else if (agencyName === 'SpaceX') {
            content = `
                <div class="agency-details">
                    <h4>🚀 SpaceX Recent Activity</h4>
                    <div class="spacex-company">
                        <h5>Company Information</h5>
                        <p><strong>Founded:</strong> ${agencyData.company.founded}</p>
                        <p><strong>Founder:</strong> ${agencyData.company.founder}</p>
                        <p><strong>Employees:</strong> ${agencyData.company.employees.toLocaleString()}</p>
                        <p><strong>Valuation:</strong> $${(agencyData.company.valuation / 1e9).toFixed(1)}B</p>
                    </div>
                    <div class="spacex-launches">
                        <h5>Recent Launches</h5>
                        ${agencyData.recentLaunches.slice(0, 3).map(launch => `
                            <div class="launch-item">
                                <p><strong>${launch.name}</strong></p>
                                <p>Rocket: ${launch.rocket} | ${launch.success ? '✅ Success' : '❌ Failed'}</p>
                                <p>Date: ${new Date(launch.date).toLocaleDateString()}</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="spacex-links">
                        <a href="${agencyData.sourceLinks.spacex_main}" target="_blank" class="source-link">🚀 SpaceX Website</a>
                    </div>
                </div>
            `;
        } else if (agencyName === 'ESA') {
            content = `
                <div class="agency-details">
                    <h4>🌍 European Space Agency Missions</h4>
                    <div class="esa-missions">
                        <h5>Active Missions (${agencyData.activeMissions.length})</h5>
                        ${agencyData.activeMissions.slice(0, 5).map(mission => `
                            <div class="mission-item">
                                <p><strong>${mission.name}</strong> (${mission.status})</p>
                                <p>${mission.description}</p>
                                <p>Type: ${mission.missionType} | Launched: ${mission.launchDate}</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="esa-links">
                        <a href="${agencyData.sourceLinks.esa_main}" target="_blank" class="source-link">🌍 ESA Website</a>
                        <a href="${agencyData.sourceLinks.science_missions}" target="_blank" class="source-link">🔭 Science Missions</a>
                    </div>
                </div>
            `;
        }
        
        modalContent.innerHTML = content;
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error showing agency details:', error);
    }
};

// Initialize Application
function init() {
    console.log('CaldaSpace: Initializing ultimate application...');
    
    try {
        // Load saved API key
        if (apiKeyInput) {
            apiKeyInput.value = API_KEY;
        }

        // Show initial API status
        if (API_KEY === 'DEMO_KEY') {
            showAPIStatus('Using DEMO_KEY (30/hr, 50/day). Add your own key for higher limits.', 'warning');
        }

        // Set intelligent defaults for date inputs
        setupDefaultDates();

        // Set up event listeners
        setupEventListeners();

        // Initialize 3D visualizer with better error handling
        setTimeout(() => {
            try {
                if (document.getElementById('neo3DCanvas')) {
                    console.log('Initializing 3D NEO Visualizer...');
                    neo3DVisualizer = new NEO3DVisualizer('neo3DCanvas');
                    setup3DControls();
                }
            } catch (error) {
                console.error('3D Visualizer initialization failed:', error);
            }
        }, 500);

        // Load initial content
        loadInitialContent();
        
        console.log('CaldaSpace: Ultimate initialization complete');
    } catch (error) {
        console.error('CaldaSpace: Initialization error:', error);
        showAPIStatus('Application initialization failed. Please refresh the page.', 'error');
    }
}

function setupDefaultDates() {
    const todayUTC = getTodayUTC();
    const latestAPOD = getLatestAPODDate();
    const latestMars = getLatestMarsDate();
    
    // APOD date
    if (apodDateInput) {
        apodDateInput.min = APOD_START_DATE;
        apodDateInput.max = latestAPOD;
        apodDateInput.value = latestAPOD;
    }

    // Mars date
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
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
        const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];
        telescopeStartDate.value = startDateStr;
    }

    // NEO dates
    const neoStartDate = document.getElementById('neoStartDate');
    const neoEndDate = document.getElementById('neoEndDate');
    if (neoStartDate && neoEndDate) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
        neoStartDate.value = sevenDaysAgo.toISOString().split('T')[0];
        neoEndDate.value = todayUTC;
    }
}

function loadInitialContent() {
    // Load today's APOD by default
    if (apodDateInput?.value) {
        setTimeout(() => loadAPOD(apodDateInput.value), 1000);
    }
    
    // Load latest space news
    setTimeout(() => loadNews('general'), 1500);
    
    // Load multi-agency status
    setTimeout(() => loadAgencyStatus(), 2000);
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

        // News controls
        if (newsCategory) {
            newsCategory.addEventListener('change', (e) => {
                currentNewsCategory = e.target.value;
                loadNews(currentNewsCategory);
            });
        }
        if (refreshNewsBtn) {
            refreshNewsBtn.addEventListener('click', () => loadNews(currentNewsCategory));
        }

        // APOD controls
        if (apodDateInput) {
            apodDateInput.addEventListener('change', () => {
                if (apodDateInput.value) {
                    loadAPOD(apodDateInput.value);
                }
            });
        }
        if (randomApodBtn) {
            randomApodBtn.addEventListener('click', loadRandomAPOD);
        }

        // Telescope controls
        if (telescopeSelect) {
            telescopeSelect.addEventListener('change', (e) => {
                currentTelescope = e.target.value;
            });
        }
        if (telescopeLoadBtn) {
            telescopeLoadBtn.addEventListener('click', loadTelescopeImages);
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
        
        console.log('CaldaSpace: Enhanced event listeners set up successfully');
    } catch (error) {
        console.error('CaldaSpace: Error setting up event listeners:', error);
    }
}

function setup3DControls() {
    if (!neo3DVisualizer) return;
    
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
            setTimeout(() => testAPIKey(), 500);
        } else {
            showAPIStatus('Please enter a valid API key', 'error');
        }
    } catch (error) {
        console.error('Error saving API key:', error);
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
        console.log(`Switching to tab: ${tabName}`);
        
        tabContents.forEach(content => content.classList.remove('active'));
        tabButtons.forEach(button => button.classList.remove('active'));
        
        const selectedTab = document.getElementById(tabName);
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (selectedTab) selectedTab.classList.add('active');
        if (activeButton) activeButton.classList.add('active');
        
        // Auto-load content for specific tabs
        if (tabName === 'neo' && neo3DVisualizer) {
            setTimeout(() => {
                const fetchNeoBtn = document.getElementById('fetchNeoData');
                if (fetchNeoBtn) fetchNeoBtn.click();
            }, 500);
        }
        
    } catch (error) {
        console.error('Error switching tabs:', error);
    }
}

// Enhanced news loading
async function loadNews(category) {
    if (!newsLoading || !newsContent) return;
    
    console.log(`Loading ${category} news...`);
    
    try {
        newsLoading.classList.add('show');
        newsContent.innerHTML = '';
        
        const articles = await fetchAggregatedSpaceNews(12);
        
        newsLoading.classList.remove('show');
        
        if (articles && articles.length > 0) {
            displayNewsGrid(articles);
        } else {
            newsContent.innerHTML = '<div class="no-data">No news articles available at the moment.</div>';
        }
        
    } catch (error) {
        console.error('Error loading news:', error);
        newsLoading.classList.remove('show');
        newsContent.innerHTML = `<div class="error-message">Error loading news: ${error.message}</div>`;
    }
}

function displayNewsGrid(articles) {
    if (!newsContent) return;
    
    newsContent.innerHTML = articles.map(article => `
        <div class="news-card" onclick="showNewsArticle(${encodeURIComponent(JSON.stringify(article))})" style="cursor: pointer;">
            <div class="news-image">
                <img src="${article.thumbnail}" alt="${article.title}" loading="lazy" />
                <div class="news-category-badge">
                    ${getCategoryEmoji(article.category)} ${article.category}
                </div>
            </div>
            <div class="news-content">
                <h3 class="news-title">${article.title}</h3>
                <p class="news-description">${article.description.substring(0, 150)}...</p>
                <div class="news-meta">
                    <span class="news-date">${formatNewsDate(article.publishDate)}</span>
                    <span class="news-source">by ${article.author}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Enhanced agency status loading
async function loadAgencyStatus() {
    if (!agencyLoading || !agencyStatus) return;
    
    console.log('Loading multi-agency status...');
    
    try {
        agencyLoading.style.display = 'block';
        agencyStatus.innerHTML = '';
        
        const agencyData = await fetchMultiAgencyStatus();
        
        agencyLoading.style.display = 'none';
        
        if (agencyData && !agencyData.error) {
            displayAgencyStatus(agencyData);
            
            // Add ISS to 3D visualization if available
            if (neo3DVisualizer && agencyData.iss) {
                const iss3DObject = createISS3DObject(agencyData.iss);
                // This would need to be implemented in the 3D visualizer
            }
        } else {
            agencyStatus.innerHTML = '<div class="error-message">Unable to load agency status data</div>';
        }
        
    } catch (error) {
        console.error('Error loading agency status:', error);
        agencyLoading.style.display = 'none';
        agencyStatus.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

function displayAgencyStatus(data) {
    if (!agencyStatus) return;
    
    const agencies = [
        { name: 'ISS', data: data.iss, icon: '🛰️' },
        { name: 'SpaceX', data: data.spacex, icon: '🚀' },
        { name: 'ESA', data: data.esa, icon: '🌍' }
    ];
    
    agencyStatus.innerHTML = agencies.map(agency => {
        if (!agency.data) return '';
        
        const formatted = formatAgencyData(agency.data, agency.name);
        
        return `
            <div class="agency-card" onclick="showAgencyDetails('${agency.name}', ${encodeURIComponent(JSON.stringify(agency.data))})" 
                 style="cursor: pointer;">
                <div class="agency-header">
                    <span class="agency-icon">${agency.icon}</span>
                    <h3>${formatted.title}</h3>
                </div>
                <div class="agency-content">
                    <p class="agency-subtitle">${formatted.subtitle}</p>
                    <div class="agency-details">
                        ${formatted.details.slice(0, 3).map(detail => `<div>${detail}</div>`).join('')}
                    </div>
                    <div class="agency-status">
                        <span class="status-indicator ${formatted.status.toLowerCase()}"></span>
                        Status: ${formatted.status}
                    </div>
                </div>
                <div class="agency-footer">
                    <small>Last updated: ${formatted.lastUpdate}</small>
                </div>
            </div>
        `;
    }).join('');
}

// Enhanced APOD loading (keep existing function but with better error handling)
async function loadAPOD(date) {
    const loading = document.getElementById('apodLoading');
    const content = document.getElementById('apodContent');
    
    if (!loading || !content) return;

    console.log(`Loading APOD for date: ${date}`);

    try {
        loading.classList.add('show');
        content.innerHTML = '';
        
        const data = await fetchAPOD(API_KEY, date);
        loading.classList.remove('show');
        
        if (data) {
            displayEnhancedAPOD(data);
        } else {
            content.innerHTML = '<div class="error-message">Failed to load APOD data. Please check your API key.</div>';
        }
    } catch (error) {
        console.error('Error loading APOD:', error);
        loading.classList.remove('show');
        content.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

async function loadRandomAPOD() {
    try {
        showAPIStatus('Loading random APOD...', 'warning');
        const data = await fetchRandomAPOD(API_KEY);
        
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

// Enhanced telescope loading
async function loadTelescopeImages() {
    if (!telescopeContent || !telescopeLoading) return;
    
    const start = telescopeStartDate?.value;
    const end = telescopeEndDate?.value;
    const count = Math.min(Math.max(parseInt(telescopeImageCount?.value || '25', 10), 1), 100);
    const mode = telescopeViewMode?.value || 'gallery';
    
    console.log(`Loading ${count} ${currentTelescope} images from ${start} to ${end} in ${mode} mode`);
    
    try {
        telescopeLoading.classList.add('show');
        telescopeContent.innerHTML = '';
        
        const telescopeData = await fetchEnhancedTelescopeData({
            mission: currentTelescope,
            startDate: start,
            endDate: end,
            count: count
        });
        
        telescopeLoading.classList.remove('show');
        
        if (telescopeData && telescopeData.length > 0) {
            displayEnhancedTelescopeImages(telescopeData, mode);
        } else {
            telescopeContent.innerHTML = '<div class="no-data">No telescope images found for the selected criteria.</div>';
        }
        
    } catch (error) {
        console.error('Error loading telescope images:', error);
        telescopeLoading.classList.remove('show');
        telescopeContent.innerHTML = `<div class="error-message">Error loading images: ${error.message}</div>`;
    }
}

function displayEnhancedTelescopeImages(items, mode) {
    if (!telescopeContent) return;
    
    if (mode === 'timeline') {
        items.sort((a, b) => new Date(a.observation_date) - new Date(b.observation_date));
        telescopeContent.className = 'photo-grid timeline-view';
        telescopeContent.innerHTML = items.map(item => `
            <div class="content-card timeline-item">
                <div class="timeline-date">${item.observation_date} — ${item.title}</div>
                ${createClickableImage(item.preview_url, item.title, item.sourceLinks, item.title, Object.entries(item.metadata).slice(0, 3).map(([k,v]) => `${k}: ${v}`).join(' | '))}
                <div class="telescope-metadata">
                    <p><strong>Mission:</strong> ${item.mission} | <strong>Instrument:</strong> ${item.instrument}</p>
                    <p><strong>Target:</strong> ${item.target}</p>
                </div>
            </div>
        `).join('');
    } else {
        telescopeContent.className = mode === 'advanced' ? 'photo-grid advanced-grid' : 'photo-grid';
        telescopeContent.innerHTML = items.map(item => `
            <div class="photo-item enhanced telescope-item">
                ${createClickableImage(item.preview_url, item.title, item.sourceLinks, item.title, `${item.mission} observation of ${item.target}`)}
                <div class="photo-info">
                    <div class="photo-title">${item.title}</div>
                    <div class="photo-details">
                        <div><strong>Mission:</strong> ${item.mission}</div>
                        <div><strong>Instrument:</strong> ${item.instrument}</div>
                        <div><strong>Date:</strong> ${item.observation_date}</div>
                        <div><strong>Target:</strong> ${item.target}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Mars photos and NEO functions (keeping existing enhanced versions)
async function loadMarsPhotos() {
    const loading = document.getElementById('marsLoading');
    const content = document.getElementById('marsContent');
    const roverSelect = document.getElementById('roverSelect');
    const marsDate = document.getElementById('marsDate');
    
    if (!loading || !content || !roverSelect || !marsDate) return;

    const rover = roverSelect.value;
    const date = marsDate.value;
    
    if (!date) {
        showAPIStatus('Please select a date', 'error');
        return;
    }

    console.log(`Loading Mars photos for ${rover} on ${date}`);

    try {
        loading.classList.add('show');
        content.innerHTML = '';
        
        const data = await fetchMarsPhotos(API_KEY, rover, date);
        loading.classList.remove('show');
        
        if (data && data.photos && data.photos.length > 0) {
            displayEnhancedMarsPhotos(data.photos);
        } else {
            content.innerHTML = '<div class="no-data">No photos found for this date. Try the "Latest Photos" button or select a different date.</div>';
        }
    } catch (error) {
        console.error('Error loading Mars photos:', error);
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
    
    if (!loading || !content || !startDate || !endDate) return;

    const start = startDate.value;
    const end = endDate.value;
    
    if (!start || !end) {
        showAPIStatus('Please select both start and end dates', 'error');
        return;
    }

    console.log(`Loading NEO data from ${start} to ${end}`);

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
            
            console.log('NEO data loaded successfully');
        } else {
            content.innerHTML = '<div class="no-data">No NEO data found for this date range.</div>';
        }
    } catch (error) {
        console.error('Error loading NEO data:', error);
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

// Global helper for 3D NEO selection
window.selectNEOIn3D = function(neoId) {
    if (neo3DVisualizer) {
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
    console.log(`CaldaSpace: Ultimate application loaded in ${loadTime.toFixed(2)}ms`);
});

console.log('CaldaSpace: Ultimate module loaded successfully');
