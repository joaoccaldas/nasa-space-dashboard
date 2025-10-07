// NASA Space Dashboard - Main Application Logic
import { fetchAPOD, fetchMarsPhotos, fetchNearEarthObjects } from './api.js';

// API Key Management
let API_KEY = localStorage.getItem('nasa_api_key') || 'DEMO_KEY';

// DOM Elements
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const apiStatus = document.getElementById('apiStatus');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize Application
function init() {
    // Load saved API key
    if (apiKeyInput) {
        apiKeyInput.value = API_KEY;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial APOD data
    loadAPOD();
}

// Event Listeners Setup
function setupEventListeners() {
    // API Key Save
    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', saveAPIKey);
    }
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
    
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
}

// Save API Key
function saveAPIKey() {
    const key = apiKeyInput.value.trim();
    if (key) {
        API_KEY = key;
        localStorage.setItem('nasa_api_key', key);
        showAPIStatus('API Key saved successfully!', 'success');
    } else {
        showAPIStatus('Please enter a valid API key', 'error');
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
        }, 3000);
    }
}

// Tab Switching
function switchTab(tabName) {
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
    
    // Load data for the selected tab if not already loaded
    if (tabName === 'mars') {
        const marsContent = document.getElementById('marsContent');
        if (marsContent && marsContent.children.length === 0) {
            // Set default date to today
            const marsDate = document.getElementById('marsDate');
            if (marsDate && !marsDate.value) {
                marsDate.value = new Date().toISOString().split('T')[0];
            }
        }
    } else if (tabName === 'neo') {
        const neoContent = document.getElementById('neoContent');
        if (neoContent && neoContent.children.length === 0) {
            // Set default dates
            const today = new Date();
            const startDate = document.getElementById('neoStartDate');
            const endDate = document.getElementById('neoEndDate');
            if (startDate && !startDate.value) {
                startDate.value = today.toISOString().split('T')[0];
            }
            if (endDate && !endDate.value) {
                const weekLater = new Date(today);
                weekLater.setDate(weekLater.getDate() + 7);
                endDate.value = weekLater.toISOString().split('T')[0];
            }
        }
    }
}

// Load APOD (Astronomy Picture of the Day)
async function loadAPOD() {
    const loading = document.getElementById('apodLoading');
    const content = document.getElementById('apodContent');
    
    if (!loading || !content) return;
    
    try {
        loading.classList.add('show');
        content.innerHTML = '';
        
        const data = await fetchAPOD(API_KEY);
        
        loading.classList.remove('show');
        
        if (data) {
            displayAPOD(data);
        } else {
            content.innerHTML = '<p>Failed to load APOD data. Please check your API key.</p>';
        }
    } catch (error) {
        loading.classList.remove('show');
        content.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// Display APOD Data
function displayAPOD(data) {
    const content = document.getElementById('apodContent');
    if (!content) return;
    
    const mediaElement = data.media_type === 'video' 
        ? `<iframe src="${data.url}" frameborder="0" allowfullscreen style="width: 100%; height: 500px;"></iframe>`
        : `<img src="${data.url}" alt="${data.title}" />`;
    
    content.innerHTML = `
        ${mediaElement}
        <h3>${data.title}</h3>
        <p><strong>Date:</strong> ${data.date}</p>
        <p>${data.explanation}</p>
        ${data.copyright ? `<p><strong>Copyright:</strong> ${data.copyright}</p>` : ''}
    `;
}

// Load Mars Rover Photos
async function loadMarsPhotos() {
    const loading = document.getElementById('marsLoading');
    const content = document.getElementById('marsContent');
    const roverSelect = document.getElementById('roverSelect');
    const marsDate = document.getElementById('marsDate');
    
    if (!loading || !content || !roverSelect || !marsDate) return;
    
    const rover = roverSelect.value;
    const date = marsDate.value;
    
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    try {
        loading.classList.add('show');
        content.innerHTML = '';
        
        const data = await fetchMarsPhotos(API_KEY, rover, date);
        
        loading.classList.remove('show');
        
        if (data && data.photos && data.photos.length > 0) {
            displayMarsPhotos(data.photos);
        } else {
            content.innerHTML = '<p>No photos found for this date. Try another date.</p>';
        }
    } catch (error) {
        loading.classList.remove('show');
        content.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// Display Mars Photos
function displayMarsPhotos(photos) {
    const content = document.getElementById('marsContent');
    if (!content) return;
    
    content.innerHTML = photos.slice(0, 20).map(photo => `
        <div class="photo-item">
            <img src="${photo.img_src}" alt="Mars photo from ${photo.rover.name}" />
            <div class="photo-info">
                <strong>Camera:</strong> ${photo.camera.full_name}<br/>
                <strong>Date:</strong> ${photo.earth_date}
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
    
    if (!loading || !content || !startDate || !endDate) return;
    
    const start = startDate.value;
    const end = endDate.value;
    
    if (!start || !end) {
        alert('Please select both start and end dates');
        return;
    }
    
    try {
        loading.classList.add('show');
        content.innerHTML = '';
        
        const data = await fetchNearEarthObjects(API_KEY, start, end);
        
        loading.classList.remove('show');
        
        if (data && data.near_earth_objects) {
            displayNEOData(data.near_earth_objects);
        } else {
            content.innerHTML = '<p>No NEO data found for this date range.</p>';
        }
    } catch (error) {
        loading.classList.remove('show');
        content.innerHTML = `<p>Error: ${error.message}</p>`;
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
            if (count < 50) { // Limit to 50 objects
                const hazardous = neo.is_potentially_hazardous_asteroid;
                html += `
                    <div class="neo-item ${hazardous ? 'hazardous' : ''}">
                        <h3>${neo.name}</h3>
                        <p><strong>Date:</strong> ${date}</p>
                        <p><strong>Estimated Diameter:</strong> 
                            ${neo.estimated_diameter.meters.estimated_diameter_min.toFixed(2)} - 
                            ${neo.estimated_diameter.meters.estimated_diameter_max.toFixed(2)} meters</p>
                        <p><strong>Relative Velocity:</strong> 
                            ${parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_hour).toFixed(2)} km/h</p>
                        <p><strong>Miss Distance:</strong> 
                            ${parseFloat(neo.close_approach_data[0].miss_distance.kilometers).toFixed(2)} km</p>
                        <p><strong>Potentially Hazardous:</strong> ${hazardous ? 'Yes' : 'No'}</p>
                    </div>
                `;
                count++;
            }
        });
    }
    
    content.innerHTML = html || '<p>No objects found.</p>';
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
