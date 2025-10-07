// CaldaSpace - Main Application Logic (Improved)
import { fetchAPOD, fetchMarsPhotos, fetchNearEarthObjects, fetchNASAAPI, validateAPODDate, validateAPIKey, APOD_START_DATE, testAPIConnection } from './api.js';

// API Key Management
let API_KEY = localStorage.getItem('nasa_api_key') || 'DEMO_KEY';

// DOM Elements
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

// Initialize Application
function init() {
  // Load saved API key
  if (apiKeyInput) {
    apiKeyInput.value = API_KEY;
  }

  // DEMO_KEY info banner
  if (API_KEY === 'DEMO_KEY') {
    showAPIStatus('Using DEMO_KEY (30/hr, 50/day). Add your own key for higher limits.', 'warning');
  }

  // Set defaults for date inputs
  const today = new Date().toISOString().split('T')[0];
  const apodMax = today;
  if (apodDateInput) {
    apodDateInput.min = APOD_START_DATE;
    apodDateInput.max = apodMax;
    if (!apodDateInput.value) apodDateInput.value = apodMax;
  }

  const marsDate = document.getElementById('marsDate');
  if (marsDate) {
    marsDate.max = today;
    if (!marsDate.value) marsDate.value = today;
  }
  if (telescopeEndDate) {
    telescopeEndDate.max = today;
    if (!telescopeEndDate.value) telescopeEndDate.value = today;
  }
  if (telescopeStartDate) {
    telescopeStartDate.min = APOD_START_DATE;
  }

  // Set up event listeners
  setupEventListeners();

  // Test API status in background
  setTimeout(async () => {
    const test = await testAPIConnection(API_KEY);
    if (!test.success) showAPIStatus(`API check: ${test.message}`, 'warning');
  }, 0);

  // Load initial APOD data
  loadAPOD(apodDateInput?.value);
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
  // APOD controls: change on date change and on button click
  if (apodDateInput) {
    apodDateInput.addEventListener('change', () => loadAPOD(apodDateInput.value));
  }
  if (apodLoadBtn) {
    apodLoadBtn.addEventListener('click', () => loadAPOD(apodDateInput?.value));
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
    }, 4000);
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
}

// Load APOD (Astronomy Picture of the Day)
async function loadAPOD(date) {
  const loading = document.getElementById('apodLoading');
  const content = document.getElementById('apodContent');
  if (!loading || !content) return;

  // Validate API key before calling
  const keyValidation = validateAPIKey(API_KEY);
  if (!keyValidation.valid) {
    content.innerHTML = keyValidation.warning;
    return;
  }
  if (keyValidation.warning) showAPIStatus(keyValidation.warning, 'warning');

  // Validate date before API call
  const { valid, date: cleanDate, error } = validateAPODDate(date);
  if (!valid) {
    content.innerHTML = `Error: ${error}`;
    return;
  }

  try {
    loading.classList.add('show');
    content.innerHTML = '';
    const data = await fetchAPOD(API_KEY, cleanDate || '');
    loading.classList.remove('show');
    if (data) {
      displayAPOD(data);
    } else {
      content.innerHTML = 'Failed to load APOD data. Please check your API key.';
    }
  } catch (error) {
    loading.classList.remove('show');
    content.innerHTML = `Error: ${error.message}`;
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
      <div>Date: ${data.date}</div>
      <p>${data.explanation || ''}</p>
      ${data.copyright ? `<div>© ${data.copyright}</div>` : ''}
    </div>
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
      content.innerHTML = 'No photos found for this date. Try another date.';
    }
  } catch (error) {
    loading.classList.remove('show');
    content.innerHTML = `Error: ${error.message}`;
  }
}

// Display Mars Photos
function displayMarsPhotos(photos) {
  const content = document.getElementById('marsContent');
  if (!content) return;
  content.innerHTML = photos.slice(0, 20).map(photo => `
    <div class="photo-item">
      <img src="${photo.img_src}" alt="Mars photo from ${photo.rover.name}"/>
      <div class="photo-info">
        <div>Camera: ${photo.camera.full_name}</div>
        <div>Date: ${photo.earth_date}</div>
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
      content.innerHTML = 'No NEO data found for this date range.';
    }
  } catch (error) {
    loading.classList.remove('show');
    content.innerHTML = `Error: ${error.message}`;
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
        html += `
          <div class="neo-item ${hazardous ? 'hazardous' : ''}">
            <div>${neo.name}</div>
            <div>Date: ${date}</div>
            <div>Estimated Diameter: ${neo.estimated_diameter.meters.estimated_diameter_min.toFixed(2)} - ${neo.estimated_diameter.meters.estimated_diameter_max.toFixed(2)} meters</div>
            <div>Relative Velocity: ${parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_hour).toFixed(2)} km/h</div>
            <div>Miss Distance: ${parseFloat(neo.close_approach_data[0].miss_distance.kilometers).toFixed(2)} km</div>
            <div>Potentially Hazardous: ${hazardous ? 'Yes' : 'No'}</div>
          </div>
        `;
        count++;
      }
    });
  }
  content.innerHTML = html || 'No objects found.';
}

// Telescope Gallery: Fetch APOD range as gallery and allow dataset selection
// Available datasets: APOD (default)
async function loadTelescopeImages() {
  if (!telescopeContent || !telescopeLoading) return;
  const start = telescopeStartDate?.value || APOD_START_DATE;
  const end = telescopeEndDate?.value;
  const count = Math.min(Math.max(parseInt(telescopeImageCount?.value || '20', 10), 1), 100);
  const mode = telescopeViewMode?.value || 'gallery';
  try {
    telescopeLoading.classList.add('show');
    telescopeContent.innerHTML = '';
    // Strategy: Use APOD endpoint with start_date and end_date, then slice to count
    // If both start and end provided, fetch range. Else, use count with APOD 'count' param.
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
      telescopeContent.innerHTML = 'No telescope images found for the selected range.';
      return;
    }
    if (mode === 'timeline') {
      items.sort((a, b) => new Date(a.date) - new Date(b.date));
      telescopeContent.innerHTML = items.map(item => `
        <div class="content-card">
          <div>${item.date} — ${item.title}</div>
          <img src="${item.url}" alt="${item.title}"/>
          ${item.explanation ? `<p>${item.explanation}</p>` : ''}
        </div>
      `).join('');
    } else {
      // gallery
      telescopeContent.innerHTML = items.map(item => `
        <div class="photo-item">
          <img src="${item.url}" alt="${item.title}"/>
          <div class="photo-info">${item.title} — ${item.date}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    telescopeLoading.classList.remove('show');
    telescopeContent.innerHTML = `Error loading images: ${error.message}`;
  }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
