// CaldaSpace - Revolutionary Space Exploration Application
// Production-ready integration of NASA data with revolutionary features
// Includes: Exoplanet Discovery Game, Solar Weather Predictor, Mars 3D Reconstruction, Launch Optimizer, Comet Tracker

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
  getLatestMarsDate,
} from './api.js';
import NEO3DVisualizer from './neo3d.js';
import {
  fetchEnhancedTelescopeData,
  getAvailableMissions,
  getTelescopeStats,
  searchTelescopeObservations,
  TELESCOPE_MISSIONS,
} from './telescope.js';
import {
  fetchNASANews,
  fetchAggregatedSpaceNews,
  formatNewsDate,
  getCategoryEmoji,
} from './news.js';
import {
  fetchAgencyStatus,
  getAvailableAgencies,
} from './agencies.js';
import {
  fetchSpaceWeatherData,
  getSolarWindData,
  getGeomagneticData,
} from './space-weather.js';

// Import revolutionary new features
import { 
  createExoplanetGame, 
  ExoplanetUtils 
} from './exoplanet-discovery.js';
import { 
  createSolarWeatherPredictor, 
  SpaceWeatherUtils 
} from './solar-weather-predictor.js';
import { 
  createMars3DReconstructor, 
  MarsTerrainUtils 
} from './mars-3d-reconstructor.js';
import { 
  createLaunchOptimizer, 
  LaunchOptimizerUtils 
} from './launch-optimizer.js';
import { 
  createComet3IAtlasTracker, 
  CometObservationUtils 
} from './comet-atlas-tracker.js';

// Utility functions
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const safeText = (v) => (v == null ? '' : String(v));

// Application state management
const state = {
  apiKey: (window.NASA_API_KEY || localStorage.getItem('NASA_API_KEY') || 'DEMO_KEY').trim(),
  currentTab: 'apod',
  newsCategory: 'general',
  newsItems: [],
  neoVisualizer: null,
  lastUpdateTime: null,
  telescopeData: {},
  agencyData: {},
  
  // Revolutionary features state
  exoplanetGame: null,
  solarWeatherPredictor: null,
  mars3DReconstructor: null,
  launchOptimizer: null,
  cometTracker: null
};

// Enhanced loading and error handling
function setLoading(el, isLoading, message = 'Loading...') {
  if (!el) return;
  el.toggleAttribute('aria-busy', !!isLoading);
  el.classList.toggle('is-loading', !!isLoading);
  if (isLoading) {
    el.innerHTML = `<div class="loading">${safeText(message)}</div>`;
  }
}

function handleError(sectionEl, err, userMsg = 'Something went wrong loading data.') {
  console.error('Application Error:', err);
  if (!sectionEl) return;
  const errorHtml = `
    <div class="error-message">
      <h4>⚠️ ${safeText(userMsg)}</h4>
      <p>Error details: ${safeText(err.message || err)}</p>
      <button onclick="location.reload()" class="retry-btn">🔄 Retry</button>
    </div>
  `;
  sectionEl.innerHTML = errorHtml;
}

// Enhanced API key management
function ensureApiKey() {
  const input = $('#apiKeyInput');
  if (input && input.value.trim()) {
    state.apiKey = input.value.trim();
  }
  if (!state.apiKey || state.apiKey === '') {
    const fromEnv = (window.NASA_API_KEY || '').trim();
    state.apiKey = fromEnv || 'DEMO_KEY';
  }
  localStorage.setItem('NASA_API_KEY', state.apiKey);
  updateAPIKeyStatus();
}

function updateAPIKeyStatus() {
  const statusEl = $('#apiStatus');
  if (statusEl) {
    if (state.apiKey === 'DEMO_KEY') {
      statusEl.innerHTML = '⚠️ Using DEMO_KEY (limited rate)';
      statusEl.className = 'api-status demo';
    } else {
      statusEl.innerHTML = '✅ API key configured';
      statusEl.className = 'api-status active';
    }
  }
}

// Enhanced tab management
function initTabNavigation() {
  const tabBtns = $$('.tab-btn');
  const tabContents = $$('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetTab = btn.dataset.tab;
      
      // Update button states
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update content visibility
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab) {
          content.classList.add('active');
          state.currentTab = targetTab;
        }
      });
      
      // Initialize revolutionary features when their tabs are opened
      await initializeTabFeature(targetTab);
    });
  });
}

// Initialize specific tab features
async function initializeTabFeature(tabName) {
  try {
    switch (tabName) {
      case 'exoplanet-game':
        if (!state.exoplanetGame) {
          const canvas = $('#exoplanetGameCanvas');
          if (canvas) {
            state.exoplanetGame = createExoplanetGame(canvas);
            setupExoplanetGameListeners();
            console.log('🎮 Exoplanet Discovery Game initialized');
          }
        }
        break;
        
      case 'mars-3d':
        if (!state.mars3DReconstructor) {
          const canvas = $('#mars3DCanvas');
          if (canvas && window.THREE) {
            state.mars3DReconstructor = createMars3DReconstructor(canvas);
            setupMars3DListeners();
            console.log('🔴 Mars 3D Reconstructor initialized');
          }
        }
        break;
        
      case 'launch-optimizer':
        if (!state.launchOptimizer) {
          state.launchOptimizer = createLaunchOptimizer();
          setupLaunchOptimizerListeners();
          console.log('🚀 Launch Optimizer initialized');
        }
        break;
        
      case 'comet-tracker':
        if (!state.cometTracker) {
          const canvas = $('#cometTrajectoryCanvas');
          state.cometTracker = createComet3IAtlasTracker(canvas);
          setupCometTrackerListeners();
          console.log('☄️ Comet Tracker initialized');
        }
        break;
        
      case 'telescopes':
        if (!state.telescopeData[tabName]) {
          await loadTelescopeData();
        }
        break;
    }
  } catch (error) {
    console.error(`Error initializing ${tabName}:`, error);
  }
}

// Setup listeners for revolutionary features
function setupExoplanetGameListeners() {
  $('#startExoplanetGame')?.addEventListener('click', async () => {
    try {
      const gameData = await state.exoplanetGame.startNewRound();
      updateGameStats();
    } catch (error) {
      console.error('Error starting exoplanet game:', error);
    }
  });
  
  $('#exportDiscoveries')?.addEventListener('click', () => {
    const discoveries = state.exoplanetGame.exportDiscoveries();
    downloadJSON(discoveries, 'exoplanet_discoveries.json');
  });
  
  // Listen for game feedback events
  window.addEventListener('exoplanetGameFeedback', (event) => {
    const { message, type, gameState } = event.detail;
    showGameFeedback(message, type);
    updateGameStats(gameState);
  });
}

function setupMars3DListeners() {
  $('#generateTerrain')?.addEventListener('click', async () => {
    const loading = $('#mars3DLoading');
    setLoading(loading, true, 'Generating 3D Mars terrain...');
    
    try {
      const rover = $('#marsRoverSelect')?.value || 'perseverance';
      const region = $('#terrainRegion')?.value || 'jezero';
      
      const marsData = await state.mars3DReconstructor.fetchMarsData(state.apiKey);
      await state.mars3DReconstructor.generateTerrainMesh(region);
      state.mars3DReconstructor.startAnimation();
      
      updateTerrainAnalysis(state.mars3DReconstructor.getTerrainAnalysis());
      
    } catch (error) {
      console.error('Error generating terrain:', error);
      handleError($('#mars3DCanvas').parentElement, error, 'Failed to generate Mars terrain');
    } finally {
      setLoading(loading, false);
    }
  });
  
  $('#exportTerrainModel')?.addEventListener('click', () => {
    const model = state.mars3DReconstructor.exportTerrainModel();
    downloadJSON(model, 'mars_terrain_model.json');
  });
  
  $('#fetchMarsWeather')?.addEventListener('click', async () => {
    try {
      const weatherData = await state.mars3DReconstructor.fetchMarsWeather(state.apiKey);
      updateMarsWeatherDisplay(weatherData);
    } catch (error) {
      console.error('Error fetching Mars weather:', error);
    }
  });
}

function setupLaunchOptimizerListeners() {
  $('#calculateLaunchWindows')?.addEventListener('click', async () => {
    const loading = $('#launchLoading');
    setLoading(loading, true, 'Calculating optimal launch windows...');
    
    try {
      const missionParams = {
        origin: $('#launchOrigin')?.value || 'earth',
        destination: $('#launchDestination')?.value || 'mars',
        launchSite: $('#launchSiteSelect')?.value || 'KSC',
        startDate: $('#launchStartDate')?.value || '2025-01-01',
        endDate: $('#launchEndDate')?.value || '2025-12-31',
        payloadMass: parseInt($('#payloadMass')?.value) || 1000,
        launchVehicle: $('#launchVehicleSelect')?.value || 'Falcon Heavy',
        constraints: {
          maxFlightTime: parseInt($('#maxFlightTime')?.value) || 1000
        }
      };
      
      const results = await state.launchOptimizer.calculateOptimalLaunchWindows(missionParams);
      displayLaunchResults(results, missionParams);
      
    } catch (error) {
      console.error('Error calculating launch windows:', error);
      handleError($('#launchResults'), error, 'Failed to calculate launch windows');
    } finally {
      setLoading(loading, false);
    }
  });
  
  $('#exportLaunchData')?.addEventListener('click', () => {
    // Export will be implemented based on last calculated results
    console.log('Export launch data functionality');
  });
}

function setupCometTrackerListeners() {
  $('#initializeTracking')?.addEventListener('click', async () => {
    const loading = $('#cometLoading');
    setLoading(loading, true, 'Initializing comet tracking...');
    
    try {
      await state.cometTracker.initializeTracking();
      updateCometTrackingDisplay();
      state.cometTracker.visualizeTrajectory();
      
    } catch (error) {
      console.error('Error initializing comet tracking:', error);
      handleError($('#cometTrajectoryCanvas').parentElement, error, 'Failed to initialize comet tracking');
    } finally {
      setLoading(loading, false);
    }
  });
  
  $('#generateObservationPlan')?.addEventListener('click', () => {
    const location = $('#observerLocation')?.value || 'Stockholm';
    const report = state.cometTracker.generateObservationReport(location, 7);
    displayObservationReport(report);
  });
  
  $('#exportEphemeris')?.addEventListener('click', () => {
    const ephemeris = state.cometTracker.cometData.ephemeris;
    downloadJSON(ephemeris, 'comet_3i_atlas_ephemeris.json');
  });
}

// Initialize solar weather predictor
async function initializeSolarWeatherPredictor() {
  if (!state.solarWeatherPredictor) {
    state.solarWeatherPredictor = createSolarWeatherPredictor();
    setupSolarWeatherListeners();
    
    // Load initial weather data
    try {
      await loadSolarWeatherData();
    } catch (error) {
      console.warn('Could not load initial solar weather data:', error);
    }
  }
}

function setupSolarWeatherListeners() {
  $('#fetchWeatherData')?.addEventListener('click', async () => {
    await loadSolarWeatherData();
  });
  
  $('#exportWeatherAlerts')?.addEventListener('click', () => {
    const alertData = state.solarWeatherPredictor.exportAlertData();
    downloadJSON(alertData, 'space_weather_alerts.json');
  });
}

async function loadSolarWeatherData() {
  const loading = $('#weatherLoading');
  setLoading(loading, true, 'Loading space weather data...');
  
  try {
    const weatherData = await state.solarWeatherPredictor.fetchSolarWeatherData(state.apiKey);
    displaySolarWeatherData(weatherData);
    
    // Check for critical alerts
    const criticalAlerts = weatherData.alerts.filter(a => a.priority === 'critical');
    if (criticalAlerts.length > 0) {
      showCriticalSpaceWeatherAlert(criticalAlerts[0]);
    }
    
  } catch (error) {
    console.error('Error loading solar weather data:', error);
    handleError($('#weatherContent'), error, 'Failed to load space weather data');
  } finally {
    setLoading(loading, false);
  }
}

// Enhanced initialization
async function init() {
  console.log('🚀 Initializing Revolutionary CaldaSpace...');
  
  try {
    // Initialize API key
    ensureApiKey();
    
    // Test API connectivity
    if (state.apiKey && state.apiKey !== 'DEMO_KEY') {
      try {
        await testAPIConnection?.(state.apiKey);
        console.log('✅ API connection successful');
      } catch (err) {
        console.warn('⚠️ API connectivity check failed:', err);
      }
    }
    
    // Initialize navigation
    initTabNavigation();
    
    // Initialize solar weather predictor (always active)
    await initializeSolarWeatherPredictor();
    
    // Auto-load initial content
    await loadInitialContent();
    
    // Set up periodic updates
    setupPeriodicUpdates();
    
    // Bind all event listeners
    bindEvents();
    
    console.log('✅ Revolutionary CaldaSpace initialized successfully');
    
  } catch (err) {
    console.error('❌ Initialization failed:', err);
    const container = $('.container');
    if (container) {
      handleError(container, err, 'Failed to initialize CaldaSpace');
    }
  }
}

async function loadInitialContent() {
  // Load APOD by default
  await loadAPOD();
  
  // Load latest space news
  await loadNews();
  
  // Load agency status
  await loadAgencyStatus();
}

// Enhanced APOD loading
async function loadAPOD(date = null) {
  const container = $('#apodContent');
  const loading = $('#apodLoading');
  
  setLoading(loading, true, 'Loading Astronomy Picture of the Day...');
  
  try {
    ensureApiKey();
    
    let data;
    if (date) {
      const validDate = validateAPODDate(date, APOD_START_DATE);
      data = await fetchAPOD(validDate, state.apiKey);
    } else {
      const latestDate = await getLatestAPODDate?.();
      data = await fetchAPOD(latestDate || undefined, state.apiKey);
    }
    
    renderAPOD(container, data);
    
  } catch (err) {
    handleError(container, err, 'Failed to load Astronomy Picture of the Day');
  } finally {
    setLoading(loading, false);
  }
}

// Enhanced telescope data loading
async function loadTelescopeData(objectName = 'M31', mission = 'HST') {
  const container = $('#telescopeContent');
  const loading = $('#telescopeLoading');
  const errorEl = $('#telescopeError');
  
  setLoading(loading, true, 'Loading telescope imagery...');
  errorEl.style.display = 'none';
  
  try {
    const data = await fetchEnhancedTelescopeData({ mission, objectName });
    state.telescopeData[mission] = data;
    renderTelescope(container, data);
    
  } catch (err) {
    console.error('Telescope loading error:', err);
    errorEl.style.display = 'block';
    errorEl.innerHTML = `<p>⚠️ ${err.message}</p>`;
    handleError(container, err, 'Failed to load telescope data');
  } finally {
    setLoading(loading, false);
  }
}

// Enhanced news loading
async function loadNews(category = 'general') {
  const container = $('#newsContent');
  const loading = $('#newsLoading');
  
  setLoading(loading, true, 'Loading latest space news...');
  
  try {
    let items;
    if (category === 'general') {
      items = await fetchNASANews();
    } else {
      items = await fetchAggregatedSpaceNews({ category });
    }
    
    state.newsCategory = category;
    state.newsItems = Array.isArray(items) ? items : [];
    
    renderNews(container, state.newsItems);
    
  } catch (err) {
    handleError(container, err, 'Failed to load space news');
  } finally {
    setLoading(loading, false);
  }
}

// Enhanced agency status loading
async function loadAgencyStatus() {
  const container = $('#agencyStatus');
  const loading = $('#agencyLoading');
  
  setLoading(loading, true, 'Loading agency status...');
  
  try {
    const agencies = getAvailableAgencies();
    const statusData = await fetchAgencyStatus(agencies);
    state.agencyData = statusData;
    
    renderAgencyStatus(container, statusData);
    
  } catch (err) {
    handleError(container, err, 'Failed to load agency status');
  } finally {
    setLoading(loading, false);
  }
}

// Display functions for revolutionary features
function updateGameStats(gameState) {
  if (!gameState && state.exoplanetGame) {
    gameState = state.exoplanetGame.getGameStats();
  }
  
  if (gameState) {
    const scoreEl = $('#gameScore');
    const planetsEl = $('#planetsDiscovered');
    const accuracyEl = $('#accuracyRate');
    
    if (scoreEl) scoreEl.textContent = gameState.score;
    if (planetsEl) planetsEl.textContent = gameState.discoveredPlanets;
    if (accuracyEl) accuracyEl.textContent = `${gameState.accuracy.toFixed(1)}%`;
  }
}

function showGameFeedback(message, type) {
  const feedbackEl = $('#gameFeedback');
  if (feedbackEl) {
    feedbackEl.innerHTML = `<div class="feedback ${type}">${message}</div>`;
    setTimeout(() => {
      feedbackEl.innerHTML = '';
    }, 3000);
  }
}

function updateTerrainAnalysis(analysis) {
  const analysisEl = $('#terrainAnalysis');
  if (analysisEl && analysis) {
    analysisEl.innerHTML = `
      <p><strong>Total Photos:</strong> ${analysis.totalPhotos}</p>
      <p><strong>Active Rovers:</strong> ${analysis.activeRovers}</p>
      <p><strong>Regions Covered:</strong> ${analysis.coverage.regions.join(', ')}</p>
    `;
  }
}

function updateMarsWeatherDisplay(weather) {
  const weatherEl = $('#marsWeatherData');
  if (weatherEl && weather) {
    weatherEl.innerHTML = `
      <p><strong>Sol ${weather.sol}</strong></p>
      <p><strong>Temperature:</strong> ${weather.temperature.high}°C / ${weather.temperature.low}°C</p>
      <p><strong>Wind:</strong> ${weather.windSpeed.toFixed(1)} m/s ${weather.windDirection}</p>
      <p><strong>Pressure:</strong> ${weather.pressure.toFixed(1)} Pa</p>
    `;
  }
}

function displayLaunchResults(results, missionParams) {
  const summaryEl = $('#launchSummary');
  const windowsEl = $('#optimalWindows');
  const costEl = $('#costAnalysis');
  
  if (summaryEl && results.optimalWindows.length > 0) {
    const best = results.optimalWindows[0];
    const summary = state.launchOptimizer.getOptimizationSummary(results);
    
    summaryEl.innerHTML = `
      <h3>Optimization Results</h3>
      <p><strong>Best Launch Date:</strong> ${new Date(best.launchDate).toLocaleDateString()}</p>
      <p><strong>Flight Time:</strong> ${Math.round(best.trajectory.flightTime)} days</p>
      <p><strong>Total Cost:</strong> $${(best.cost.total / 1000000).toFixed(1)}M</p>
      <p><strong>Feasibility:</strong> ${best.feasibility.category}</p>
      <p><strong>Score:</strong> ${best.score}/100</p>
    `;
  }
  
  if (windowsEl && results.optimalWindows.length > 0) {
    const windowsHtml = results.optimalWindows.slice(0, 5).map(window => `
      <div class="launch-window">
        <h4>${new Date(window.launchDate).toLocaleDateString()}</h4>
        <p>Score: ${window.score}/100 | Flight Time: ${Math.round(window.trajectory.flightTime)} days</p>
        <p>Cost: $${(window.cost.total / 1000000).toFixed(1)}M | Feasibility: ${window.feasibility.category}</p>
      </div>
    `).join('');
    
    windowsEl.innerHTML = `<h4>Top Launch Windows</h4>${windowsHtml}`;
  }
}

function updateCometTrackingDisplay() {
  const summary = state.cometTracker.getTrackingSummary();
  
  $('#cometEarthDistance')?.textContent = `${summary.distance.fromEarth?.toFixed(2)} AU`;
  $('#cometSunDistance')?.textContent = `${summary.distance.fromSun?.toFixed(2)} AU`;
  $('#cometMagnitude')?.textContent = summary.magnitude?.toFixed(1);
  $('#cometActivity')?.textContent = summary.activity;
  
  // Update observation windows list
  const windowsList = $('#observationWindowsList');
  if (windowsList && summary.nextObservationWindows.length > 0) {
    const windowsHtml = summary.nextObservationWindows.map(window => `
      <div class="observation-window">
        <p><strong>${window.date}</strong> - ${window.location}</p>
        <p>Magnitude: ${window.magnitude.toFixed(1)} | Quality: ${window.quality}/10</p>
      </div>
    `).join('');
    windowsList.innerHTML = windowsHtml;
  }
}

function displaySolarWeatherData(weatherData) {
  const summaryEl = $('#weatherSummary');
  const impactsEl = $('#infrastructureImpacts');
  const alertsEl = $('#weatherAlerts');
  
  const summary = state.solarWeatherPredictor.getWeatherSummary();
  
  if (summaryEl) {
    summaryEl.innerHTML = `
      <h3>Current Space Weather</h3>
      <div class="weather-stats">
        <div class="stat-card">
          <span class="stat-label">Kp Index:</span>
          <span class="stat-value">${summary.currentConditions.kpIndex}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Condition:</span>
          <span class="stat-value">${summary.currentConditions.condition}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Solar Wind:</span>
          <span class="stat-value">${summary.currentConditions.solarWindSpeed?.toFixed(0)} km/s</span>
        </div>
      </div>
    `;
  }
  
  if (impactsEl) {
    const impactCards = Object.entries(summary.impacts).map(([system, impact]) => {
      const color = SpaceWeatherUtils.getImpactColor(impact);
      return `
        <div class="impact-card" style="border-left: 4px solid ${color}">
          <h4>${system.charAt(0).toUpperCase() + system.slice(1)}</h4>
          <span class="impact-level ${impact}">${impact.toUpperCase()}</span>
        </div>
      `;
    }).join('');
    
    impactsEl.innerHTML = `<h4>Infrastructure Impacts</h4>${impactCards}`;
  }
  
  if (alertsEl && weatherData.alerts.length > 0) {
    const alertCards = weatherData.alerts.slice(0, 3).map(alert => `
      <div class="alert-card ${alert.priority}">
        <h4>${alert.title}</h4>
        <p>${alert.message}</p>
        <small>${new Date(alert.timestamp).toLocaleString()}</small>
      </div>
    `).join('');
    
    alertsEl.innerHTML = `<h4>Active Alerts (${weatherData.alerts.length})</h4>${alertCards}`;
  }
}

function showCriticalSpaceWeatherAlert(alert) {
  // Show critical alert modal
  const modal = $('#weatherModal');
  const title = $('#weatherModalTitle');
  const content = $('#weatherModalContent');
  
  if (modal && title && content) {
    title.textContent = '⚠️ CRITICAL SPACE WEATHER ALERT';
    content.innerHTML = `
      <div class="critical-alert">
        <h3>${alert.title}</h3>
        <p>${alert.message}</p>
        <p><strong>Affected Systems:</strong> ${alert.affectedSystems.join(', ')}</p>
        <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
      </div>
    `;
    modal.style.display = 'block';
  }
}

// Utility functions
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Enhanced rendering functions
function renderAPOD(container, data) {
  if (!container || !data) return;
  
  const media = data.media_type === 'video'
    ? `<iframe src="${safeText(data.url)}" title="APOD video" allowfullscreen loading="lazy" class="apod-media"></iframe>`
    : `<img src="${safeText(data.hdurl || data.url)}" alt="${safeText(data.title)}" loading="lazy" class="apod-image" onclick="openImageModal(this)"/>`;
  
  container.innerHTML = `
    <article class="apod-card">
      <header class="apod-header">
        <h3 class="apod-title">${safeText(data.title)}</h3>
        <time class="apod-date">${safeText(data.date)}</time>
      </header>
      <div class="apod-media-container">
        ${media}
      </div>
      <div class="apod-content">
        <p class="apod-explanation">${safeText(data.explanation)}</p>
        ${data.copyright ? `<p class="apod-copyright">📷 Credit: ${safeText(data.copyright)}</p>` : ''}
      </div>
      <footer class="apod-footer">
        <a href="${safeText(data.hdurl || data.url)}" target="_blank" rel="noopener" class="btn btn-primary">🔗 View Full Resolution</a>
      </footer>
    </article>
  `;
}

function renderTelescope(container, data) {
  if (!container) return;
  
  if (!data || !data.observations || data.observations.length === 0) {
    container.innerHTML = '<p class="no-data">No telescope observations found.</p>';
    return;
  }
  
  const stats = data.stats || {};
  const observations = data.observations.slice(0, 50);
  
  const statsHtml = `
    <div class="telescope-stats">
      <div class="stat-card">
        <span class="stat-number">${stats.total || 0}</span>
        <span class="stat-label">Total Observations</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">${stats.uniqueTargets || 0}</span>
        <span class="stat-label">Unique Targets</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">${Object.keys(stats.missions || {}).length}</span>
        <span class="stat-label">Missions</span>
      </div>
    </div>
  `;
  
  const observationsHtml = observations.map(obs => `
    <article class="telescope-observation" data-obs-id="${safeText(obs.obs_id)}">
      <header class="obs-header">
        <h4 class="obs-target">${safeText(obs.target)}</h4>
        <span class="obs-mission">${safeText(obs.mission_name)}</span>
      </header>
      <div class="obs-details">
        <div class="obs-meta">
          <span class="obs-instrument">📡 ${safeText(obs.instrument)}</span>
          <span class="obs-date">📅 ${new Date(obs.observation_date).toLocaleDateString()}</span>
          <span class="obs-exposure">⏱️ ${safeText(obs.exposure_time)}s</span>
        </div>
        <div class="obs-location">
          <span class="obs-coords">📍 RA: ${safeText(obs.ra?.toFixed?.(4) || obs.ra)} Dec: ${safeText(obs.dec?.toFixed?.(4) || obs.dec)}</span>
        </div>
      </div>
      ${obs.preview_url ? `<img src="${safeText(obs.preview_url)}" alt="${safeText(obs.target)}" class="obs-preview" loading="lazy"/>` : ''}
      <footer class="obs-footer">
        <button onclick="showObservationDetails('${safeText(obs.obs_id)}')">📊 View Details</button>
      </footer>
    </article>
  `).join('');
  
  container.innerHTML = `
    ${statsHtml}
    <div class="telescope-observations">
      ${observationsHtml}
    </div>
  `;
}

function renderNews(container, newsItems) {
  if (!container) return;
  
  if (!Array.isArray(newsItems) || newsItems.length === 0) {
    container.innerHTML = '<p class="no-data">No news articles found.</p>';
    return;
  }
  
  const newsHtml = newsItems.slice(0, 20).map(article => {
    const title = safeText(article.title || article.headline || 'Untitled');
    const url = safeText(article.url || article.link || '#');
    const source = safeText(article.source || 'NASA');
    const date = safeText(formatNewsDate(article.published_at || article.date));
    const emoji = getCategoryEmoji(article.category || state.newsCategory);
    
    return `
      <article class="news-card" onclick="openNewsModal('${url}', '${title}')">
        <header class="news-header">
          <h3 class="news-title">${emoji} ${title}</h3>
        </header>
        <div class="news-meta">
          <span class="news-source">📰 ${source}</span>
          <span class="news-date">📅 ${date}</span>
        </div>
        <div class="news-actions">
          <button class="btn btn-sm">🔗 Read Article</button>
        </div>
      </article>
    `;
  }).join('');
  
  container.innerHTML = `<div class="news-grid">${newsHtml}</div>`;
}

function renderAgencyStatus(container, agencyData) {
  if (!container || !agencyData) return;
  
  const agencyHtml = Object.entries(agencyData).map(([agency, data]) => {
    const status = data.status || 'unknown';
    const statusEmoji = {
      'operational': '🟢',
      'maintenance': '🟡',
      'offline': '🔴',
      'unknown': '⚪'
    }[status] || '⚪';
    
    return `
      <div class="agency-card" data-agency="${safeText(agency)}">
        <header class="agency-header">
          <h3>${statusEmoji} ${safeText(data.name || agency)}</h3>
          <span class="agency-status ${status}">${safeText(status.toUpperCase())}</span>
        </header>
        <div class="agency-info">
          <p class="agency-description">${safeText(data.description || 'Space exploration agency')}</p>
          ${data.missions ? `<div class="agency-missions"><strong>Active Missions:</strong> ${data.missions.slice(0, 3).join(', ')}</div>` : ''}
          ${data.lastUpdate ? `<div class="agency-update">Last Update: ${new Date(data.lastUpdate).toLocaleString()}</div>` : ''}
        </div>
        <footer class="agency-footer">
          <button onclick="showAgencyDetails('${safeText(agency)}')">📊 View Details</button>
        </footer>
      </div>
    `;
  }).join('');
  
  container.innerHTML = agencyHtml;
}

// Enhanced event binding
function bindEvents() {
  // API Key events
  $('#saveApiKey')?.addEventListener('click', () => {
    ensureApiKey();
    alert('✅ API key saved!');
  });
  
  $('#testApiKey')?.addEventListener('click', async () => {
    const btn = $('#testApiKey');
    const originalText = btn.textContent;
    btn.textContent = 'Testing...';
    try {
      ensureApiKey();
      await testAPIConnection(state.apiKey);
      alert('✅ API connection successful!');
    } catch (err) {
      alert(`❌ API test failed: ${err.message}`);
    } finally {
      btn.textContent = originalText;
    }
  });
  
  // APOD events
  $('#fetchApodDate')?.addEventListener('click', async () => {
    const date = $('#apodDate')?.value;
    await loadAPOD(date);
  });
  
  $('#randomApod')?.addEventListener('click', async () => {
    const container = $('#apodContent');
    const loading = $('#apodLoading');
    setLoading(loading, true);
    try {
      ensureApiKey();
      const data = await fetchRandomAPOD(state.apiKey);
      renderAPOD(container, data);
    } catch (err) {
      handleError(container, err);
    } finally {
      setLoading(loading, false);
    }
  });
  
  // Telescope events
  $('#fetchTelescopeImages')?.addEventListener('click', async () => {
    const mission = $('#telescopeSelect')?.value || 'HST';
    await loadTelescopeData('M31', mission);
  });
  
  // News events
  $('#refreshNews')?.addEventListener('click', async () => {
    const category = $('#newsCategory')?.value || 'general';
    await loadNews(category);
  });
  
  $('#newsCategory')?.addEventListener('change', async (e) => {
    await loadNews(e.target.value);
  });
  
  // Mars events
  $('#fetchMarsPhotos')?.addEventListener('click', async () => {
    const container = $('#marsContent');
    const loading = $('#marsLoading');
    setLoading(loading, true);
    try {
      ensureApiKey();
      const rover = $('#roverSelect')?.value || 'curiosity';
      const date = $('#marsDate')?.value;
      const data = date 
        ? await fetchMarsPhotos({ date, rover, apiKey: state.apiKey })
        : await fetchLatestMarsPhotos({ rover, apiKey: state.apiKey });
      renderMars(container, data);
    } catch (err) {
      handleError(container, err);
    } finally {
      setLoading(loading, false);
    }
  });
  
  $('#marsLatestPhotos')?.addEventListener('click', async () => {
    const container = $('#marsContent');
    const loading = $('#marsLoading');
    setLoading(loading, true);
    try {
      ensureApiKey();
      const rover = $('#roverSelect')?.value || 'curiosity';
      const data = await fetchLatestMarsPhotos({ rover, apiKey: state.apiKey });
      renderMars(container, data);
    } catch (err) {
      handleError(container, err);
    } finally {
      setLoading(loading, false);
    }
  });
  
  // NEO 3D events
  $('#fetchNeoData')?.addEventListener('click', async () => {
    const container = $('#neoContent');
    const loading = $('#neoLoading');
    setLoading(loading, true);
    try {
      ensureApiKey();
      const startDate = $('#neoStartDate')?.value;
      const endDate = $('#neoEndDate')?.value;
      const data = await fetchNearEarthObjects({ 
        start: startDate, 
        end: endDate, 
        apiKey: state.apiKey 
      });
      renderNEO(container, data);
      
      // Initialize 3D visualization if enabled
      if ($('#show3D')?.checked) {
        const canvas = $('#neo3DCanvas');
        if (canvas) {
          state.neoVisualizer?.dispose();
          state.neoVisualizer = new NEO3DVisualizer(canvas);
          state.neoVisualizer.loadData(data);
        }
      }
    } catch (err) {
      handleError(container, err);
    } finally {
      setLoading(loading, false);
    }
  });
  
  $('#resetView')?.addEventListener('click', () => {
    state.neoVisualizer?.resetCamera();
  });
}

// Enhanced Mars rendering
function renderMars(container, payload) {
  if (!container) return;
  
  const photos = Array.isArray(payload?.photos) ? payload.photos : Array.isArray(payload) ? payload : [];
  if (!photos.length) {
    container.innerHTML = '<p class="no-data">No Mars photos found for the selected criteria.</p>';
    return;
  }
  
  const photosHtml = photos.slice(0, 50).map(photo => `
    <article class="mars-photo-card" onclick="openImageModal(this.querySelector('img'))">
      <div class="mars-photo-container">
        <img src="${safeText(photo.img_src)}" 
             alt="Mars ${safeText(photo.rover?.name)} ${safeText(photo.camera?.full_name)}" 
             loading="lazy" 
             class="mars-image"/>
      </div>
      <div class="mars-info">
        <h4 class="mars-title">Sol ${safeText(photo.sol)} • ${safeText(photo.earth_date)}</h4>
        <div class="mars-meta">
          <span class="mars-rover">🤖 ${safeText(photo.rover?.name)}</span>
          <span class="mars-camera">📸 ${safeText(photo.camera?.full_name || photo.camera?.name)}</span>
        </div>
      </div>
    </article>
  `).join('');
  
  container.innerHTML = `<div class="mars-photo-grid">${photosHtml}</div>`;
}

// Enhanced NEO rendering
function renderNEO(container, data) {
  if (!container) return;
  
  const byDate = data?.near_earth_objects || {};
  const dates = Object.keys(byDate).sort();
  
  if (!dates.length) {
    container.innerHTML = '<p class="no-data">No Near Earth Objects found in this date range.</p>';
    return;
  }
  
  let totalObjects = 0;
  const dateHtml = dates.map(date => {
    const objects = byDate[date] || [];
    totalObjects += objects.length;
    
    const objectsHtml = objects.map(obj => `
      <div class="neo-object" data-neo-id="${safeText(obj.id)}">
        <h4 class="neo-name">${safeText(obj.name)}</h4>
        <div class="neo-details">
          <div class="neo-size">
            <span class="neo-label">Estimated Diameter:</span>
            <span class="neo-value">${safeText(obj.estimated_diameter?.meters?.estimated_diameter_min?.toFixed?.(2) || 'Unknown')}m - ${safeText(obj.estimated_diameter?.meters?.estimated_diameter_max?.toFixed?.(2) || 'Unknown')}m</span>
          </div>
          <div class="neo-magnitude">
            <span class="neo-label">Absolute Magnitude:</span>
            <span class="neo-value">${safeText(obj.absolute_magnitude_h)}</span>
          </div>
          <div class="neo-hazardous">
            <span class="neo-label">Potentially Hazardous:</span>
            <span class="neo-value ${obj.is_potentially_hazardous_asteroid ? 'hazardous' : 'safe'}">
              ${obj.is_potentially_hazardous_asteroid ? '⚠️ Yes' : '✅ No'}
            </span>
          </div>
        </div>
        <button onclick="showNEODetails('${safeText(obj.id)}')">📊 View Trajectory</button>
      </div>
    `).join('');
    
    return `
      <section class="neo-date-section">
        <header class="neo-date-header">
          <h3 class="neo-date">${safeText(date)}</h3>
          <span class="neo-count">${objects.length} objects</span>
        </header>
        <div class="neo-objects-grid">
          ${objectsHtml}
        </div>
      </section>
    `;
  }).join('');
  
  container.innerHTML = `
    <div class="neo-summary">
      <h3>📊 Summary: ${totalObjects} Near Earth Objects found</h3>
    </div>
    ${dateHtml}
  `;
}

// Utility functions for modal interactions
window.openImageModal = function(imgElement) {
  const modal = $('#mastModal');
  if (modal && imgElement) {
    $('#previewImage').src = imgElement.src;
    $('#previewImage').alt = imgElement.alt;
    $('#modalTitle').textContent = imgElement.alt || 'Space Image';
    modal.style.display = 'block';
  }
};

window.openNewsModal = function(url, title) {
  window.open(url, '_blank', 'noopener,noreferrer');
};

window.showObservationDetails = function(obsId) {
  console.log('Showing details for observation:', obsId);
  // TODO: Implement detailed observation view
};

window.showAgencyDetails = function(agency) {
  console.log('Showing details for agency:', agency);
  // TODO: Implement detailed agency view
};

window.showNEODetails = function(neoId) {
  console.log('Showing details for NEO:', neoId);
  // TODO: Implement detailed NEO view
};

// Periodic updates
function setupPeriodicUpdates() {
  // Update space weather every 5 minutes
  setInterval(async () => {
    try {
      if (state.solarWeatherPredictor) {
        await loadSolarWeatherData();
        console.log('🔄 Space weather updated');
      }
    } catch (err) {
      console.warn('Failed to update space weather:', err);
    }
  }, 5 * 60 * 1000);
  
  // Update agency status every 10 minutes
  setInterval(async () => {
    try {
      await loadAgencyStatus();
      console.log('🔄 Agency status updated');
    } catch (err) {
      console.warn('Failed to update agency status:', err);
    }
  }, 10 * 60 * 1000);
  
  // Update news every 30 minutes
  setInterval(async () => {
    try {
      await loadNews(state.newsCategory);
      console.log('🔄 News updated');
    } catch (err) {
      console.warn('Failed to update news:', err);
    }
  }, 30 * 60 * 1000);
}

// Initialize application
init().catch((e) => {
  console.error('❌ Revolutionary CaldaSpace initialization failed:', e);
  alert('Failed to initialize CaldaSpace. Please refresh the page.');
});