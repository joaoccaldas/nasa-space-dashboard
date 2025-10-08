// 🚀 CaldaSpace - Perplexity-Style Professional Space Dashboard
// Fixed state management and reusable components

// ===== UTILITY FUNCTIONS =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const safeText = (v) => (v == null ? '' : String(v));

// ===== APPLICATION STATE MANAGEMENT =====
const state = {
  apiKey: localStorage.getItem('NASA_API_KEY') || 'DEMO_KEY',
  currentTab: 'apod',
  isLoading: new Set(), // Track what's currently loading
  cache: new Map(), // Cache API responses
  
  // Feature states - properly track each feature
  features: {
    exoplanetGame: {
      isInitialized: false,
      score: 0,
      planetsDiscovered: 0,
      accuracy: 100,
      isPlaying: false
    },
    mars3D: {
      isInitialized: false,
      currentRover: 'curiosity',
      terrainGenerated: false
    },
    launchOptimizer: {
      isInitialized: false,
      hasResults: false,
      lastCalculation: null
    },
    cometTracker: {
      isInitialized: false,
      isTracking: false,
      lastUpdate: null
    },
    solarWeather: {
      isInitialized: false,
      lastUpdate: null,
      criticalAlerts: []
    }
  }
};

// ===== LOADING STATE MANAGEMENT =====
function setLoading(elementId, isLoading, message = 'Loading...') {
  const el = $(elementId);
  if (!el) return;
  
  if (isLoading) {
    state.isLoading.add(elementId);
    el.innerHTML = `<div class="loading">${message}</div>`;
    el.style.display = 'block';
  } else {
    state.isLoading.delete(elementId);
    el.style.display = 'none';
  }
}

function isElementLoading(elementId) {
  return state.isLoading.has(elementId);
}

// ===== BUTTON STATE MANAGEMENT =====
function setButtonLoading(buttonId, isLoading, loadingText = 'Loading...') {
  const btn = $(buttonId);
  if (!btn) return;
  
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
    btn.classList.add('loading');
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent.replace('Loading...', '').trim();
    btn.disabled = false;
    btn.classList.remove('loading');
  }
}

// ===== ERROR HANDLING =====
function handleError(container, error, userMsg = 'Something went wrong') {
  console.error('Error:', error);
  const el = typeof container === 'string' ? $(container) : container;
  if (!el) return;
  
  el.innerHTML = `
    <div class="error-message">
      <h4>⚠️ ${userMsg}</h4>
      <p>${error.message || error}</p>
      <button class="btn btn-primary" onclick="location.reload()">🔄 Retry</button>
    </div>
  `;
}

// ===== ENHANCED API FUNCTIONS =====
async function fetchNASAData(endpoint, params = {}, useCache = true) {
  const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
  
  // Check cache first
  if (useCache && state.cache.has(cacheKey)) {
    const cached = state.cache.get(cacheKey);
    if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
      return cached.data;
    }
  }
  
  const baseUrl = 'https://api.nasa.gov/';
  const url = new URL(endpoint, baseUrl);
  
  // Add API key
  url.searchParams.append('api_key', state.apiKey);
  
  // Add other parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Cache the response
  if (useCache) {
    state.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }
  
  return data;
}

// ===== ENHANCED API KEY MANAGEMENT =====
function updateAPIKeyStatus() {
  const statusEl = $('#apiStatus');
  if (!statusEl) return;
  
  if (state.apiKey === 'DEMO_KEY') {
    statusEl.innerHTML = '⚠️ Using DEMO_KEY (limited requests)';
    statusEl.className = 'api-status demo';
  } else {
    statusEl.innerHTML = '✅ Custom API key configured';
    statusEl.className = 'api-status active';
  }
}

async function testAPIConnection() {
  try {
    await fetchNASAData('planetary/apod', { date: '2025-01-01' }, false);
    return true;
  } catch (error) {
    throw new Error('API connection failed: ' + error.message);
  }
}

// ===== ENHANCED TAB MANAGEMENT =====
function initTabNavigation() {
  const tabBtns = $$('.tab-btn');
  const tabContents = $$('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetTab = btn.dataset.tab;
      
      // Prevent switching if already active
      if (btn.classList.contains('active')) return;
      
      // Update active states
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      btn.classList.add('active');
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add('active');
        state.currentTab = targetTab;
        
        // Initialize tab-specific features if needed
        await initializeTabFeature(targetTab);
      }
    });
  });
}

// ===== FEATURE INITIALIZATION =====
async function initializeTabFeature(tabName) {
  const feature = state.features[tabName.replace('-', '')];
  
  switch (tabName) {
    case 'exoplanet-game':
      if (!feature?.isInitialized) {
        initExoplanetGame();
        state.features.exoplanetGame.isInitialized = true;
      }
      break;
      
    case 'mars-3d':
      if (!feature?.isInitialized) {
        initMars3D();
        state.features.mars3D.isInitialized = true;
      }
      break;
      
    case 'launch-optimizer':
      if (!feature?.isInitialized) {
        initLaunchOptimizer();
        state.features.launchOptimizer.isInitialized = true;
      }
      break;
      
    case 'comet-tracker':
      if (!feature?.isInitialized) {
        initCometTracker();
        state.features.cometTracker.isInitialized = true;
      }
      break;
      
    case 'telescopes':
      await loadTelescopeData();
      break;
  }
}

// ===== ENHANCED APOD FUNCTIONS =====
async function loadAPOD(date = null) {
  if (isElementLoading('#apodLoading')) return;
  
  setLoading('#apodLoading', true, 'Loading Astronomy Picture of the Day...');
  
  try {
    const params = date ? { date } : {};
    const data = await fetchNASAData('planetary/apod', params);
    renderAPOD('#apodContent', data);
  } catch (error) {
    handleError('#apodContent', error, 'Failed to load APOD');
  } finally {
    setLoading('#apodLoading', false);
  }
}

function renderAPOD(containerId, data) {
  const container = $(containerId);
  if (!container || !data) return;
  
  const media = data.media_type === 'video'
    ? `<iframe src="${data.url}" title="APOD video" class="card-image" allowfullscreen></iframe>`
    : `<img src="${data.hdurl || data.url}" alt="${data.title}" class="card-image" onclick="openImageModal(this)"/>`;
  
  container.innerHTML = `
    <div class="content-card">
      ${media}
      <div class="card-content">
        <h3 class="card-title">${data.title}</h3>
        <div class="card-meta">
          <span>🗺️ ${data.date}</span>
          ${data.copyright ? `<span>📷 ${data.copyright}</span>` : ''}
        </div>
        <p class="card-description">${data.explanation}</p>
        <div class="mt-4">
          <a href="${data.hdurl || data.url}" target="_blank" class="btn btn-primary">🔗 View Full Resolution</a>
        </div>
      </div>
    </div>
  `;
}

// ===== ENHANCED REVOLUTIONARY FEATURES =====

// Exoplanet Discovery Game
function initExoplanetGame() {
  console.log('🎮 Initializing Exoplanet Game...');
  updateGameStats();
  
  const canvas = $('#exoplanetGameCanvas');
  if (canvas) {
    setupGameCanvas(canvas);
  }
}

function setupGameCanvas(canvas) {
  canvas.width = canvas.offsetWidth;
  canvas.height = 400;
  
  const ctx = canvas.getContext('2d');
  
  // Set up click handling for the game
  canvas.addEventListener('click', (e) => {
    if (!state.features.exoplanetGame.isPlaying) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Simple game logic - detect clicks near transit points
    const detectionRadius = 30;
    const transitPoints = [150, 350, 550]; // Mock transit positions
    
    for (const point of transitPoints) {
      if (Math.abs(x - point) < detectionRadius) {
        handleExoplanetDetection(true);
        return;
      }
    }
    
    handleExoplanetDetection(false);
  });
  
  // Initial canvas draw
  drawGameCanvas(ctx, canvas.width, canvas.height);
}

function drawGameCanvas(ctx, width, height) {
  // Clear and set background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);
  
  // Draw stars
  ctx.fillStyle = 'white';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw light curve
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  for (let x = 0; x < width; x++) {
    const baseY = height / 2;
    const noise = Math.sin(x * 0.01) * 10;
    let y = baseY + noise;
    
    // Add transit dips at specific points
    const transitPoints = [150, 350, 550];
    for (const point of transitPoints) {
      if (Math.abs(x - point) < 20) {
        y += 30; // Dip in light curve
      }
    }
    
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  
  // Draw instruction text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '14px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('Click on the dips in the light curve to detect exoplanets!', width / 2, height - 20);
}

function startExoplanetGame() {
  if (state.features.exoplanetGame.isPlaying) {
    // Reset game
    state.features.exoplanetGame.isPlaying = false;
    $('#startExoplanetGame').textContent = 'Start New Round';
    return;
  }
  
  console.log('🚀 Starting exoplanet game...');
  
  state.features.exoplanetGame.isPlaying = true;
  $('#startExoplanetGame').textContent = 'End Round';
  
  // Redraw canvas with new data
  const canvas = $('#exoplanetGameCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    drawGameCanvas(ctx, canvas.width, canvas.height);
  }
  
  showGameFeedback('🎆 Game started! Click on the light curve dips to detect transits.', 'success');
}

function handleExoplanetDetection(isCorrect) {
  const gameState = state.features.exoplanetGame;
  
  if (isCorrect) {
    gameState.score += 100;
    gameState.planetsDiscovered += 1;
    gameState.accuracy = Math.min(100, gameState.accuracy + 2);
    showGameFeedback('✅ Great detection! You found an exoplanet transit!', 'success');
  } else {
    gameState.score = Math.max(0, gameState.score - 25);
    gameState.accuracy = Math.max(0, gameState.accuracy - 5);
    showGameFeedback('❌ No transit detected at that location. Try again!', 'error');
  }
  
  updateGameStats();
}

function updateGameStats() {
  const gameState = state.features.exoplanetGame;
  
  const scoreEl = $('#gameScore');
  const planetsEl = $('#planetsDiscovered');
  const accuracyEl = $('#accuracyRate');
  
  if (scoreEl) scoreEl.textContent = gameState.score;
  if (planetsEl) planetsEl.textContent = gameState.planetsDiscovered;
  if (accuracyEl) accuracyEl.textContent = gameState.accuracy.toFixed(1) + '%';
}

function showGameFeedback(message, type) {
  const feedbackEl = $('#gameFeedback');
  if (feedbackEl) {
    feedbackEl.innerHTML = `<div class="${type}-message">${message}</div>`;
    setTimeout(() => feedbackEl.innerHTML = '', 3000);
  }
}

// Mars 3D Reconstruction
function initMars3D() {
  console.log('🔴 Initializing Mars 3D...');
  const canvas = $('#mars3DCanvas');
  if (canvas) {
    setupMarsCanvas(canvas);
  }
}

function setupMarsCanvas(canvas) {
  canvas.width = canvas.offsetWidth;
  canvas.height = 500;
  
  const ctx = canvas.getContext('2d');
  drawMarsCanvas(ctx, canvas.width, canvas.height);
}

function drawMarsCanvas(ctx, width, height) {
  // Mars surface gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#cd853f');
  gradient.addColorStop(1, '#8b4513');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Draw terrain features
  ctx.fillStyle = '#a0522d';
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * width;
    const y = height * 0.6 + Math.random() * height * 0.4;
    const w = 30 + Math.random() * 60;
    const h = 20 + Math.random() * 40;
    ctx.fillRect(x, y - h, w, h);
  }
  
  // Add some rocks
  ctx.fillStyle = '#654321';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width;
    const y = height * 0.8 + Math.random() * height * 0.2;
    ctx.beginPath();
    ctx.arc(x, y, 5 + Math.random() * 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function generateMarsTerrain() {
  if (isElementLoading('#mars3DLoading')) return;
  
  setButtonLoading('#generateTerrain', true, 'Generating...');
  setLoading('#mars3DLoading', true, 'Reconstructing Mars terrain from rover data...');
  
  // Simulate terrain generation
  setTimeout(() => {
    const canvas = $('#mars3DCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      drawMarsCanvas(ctx, canvas.width, canvas.height);
      
      // Add some "3D" effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    state.features.mars3D.terrainGenerated = true;
    updateTerrainAnalysis();
    setButtonLoading('#generateTerrain', false);
    setLoading('#mars3DLoading', false);
    showSuccess('✅ Mars 3D terrain generated successfully!');
  }, 2000);
}

function updateTerrainAnalysis() {
  const analysisEl = $('#terrainAnalysis');
  if (analysisEl) {
    analysisEl.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">2,847</span>
          <span class="stat-label">Photos Processed</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">4</span>
          <span class="stat-label">Active Rovers</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">1.2M</span>
          <span class="stat-label">3D Points</span>
        </div>
      </div>
    `;
  }
}

// Launch Window Optimizer
function initLaunchOptimizer() {
  console.log('🚀 Initializing Launch Optimizer...');
}

function calculateLaunchWindows() {
  if (isElementLoading('#launchLoading')) return;
  
  setButtonLoading('#calculateLaunchWindows', true, 'Calculating...');
  setLoading('#launchLoading', true, 'Computing orbital mechanics and optimal launch trajectories...');
  
  // Simulate complex calculations
  setTimeout(() => {
    displayLaunchResults();
    state.features.launchOptimizer.hasResults = true;
    state.features.launchOptimizer.lastCalculation = new Date();
    
    setButtonLoading('#calculateLaunchWindows', false);
    setLoading('#launchLoading', false);
    showSuccess('✅ Launch windows calculated successfully!');
  }, 3000);
}

function displayLaunchResults() {
  const summaryEl = $('#launchSummary');
  const windowsEl = $('#optimalWindows');
  
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="feature-card">
        <div class="feature-header">
          <span class="feature-icon">🎯</span>
          <h3 class="feature-title">Optimization Results</h3>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">Mar 15, 2025</span>
            <span class="stat-label">Best Launch Date</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">267</span>
            <span class="stat-label">Flight Days</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">$847M</span>
            <span class="stat-label">Total Cost</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">94.7%</span>
            <span class="stat-label">Success Rate</span>
          </div>
        </div>
      </div>
    `;
  }
  
  if (windowsEl) {
    windowsEl.innerHTML = `
      <div class="feature-card">
        <h4>Top Launch Windows</h4>
        <div class="content-grid">
          <div class="content-card">
            <div class="card-content">
              <h5 class="card-title">March 15, 2025</h5>
              <div class="card-meta">
                <span>Score: 95/100</span>
                <span>267 days</span>
                <span>$847M</span>
              </div>
            </div>
          </div>
          <div class="content-card">
            <div class="card-content">
              <h5 class="card-title">March 22, 2025</h5>
              <div class="card-meta">
                <span>Score: 91/100</span>
                <span>274 days</span>
                <span>$863M</span>
              </div>
            </div>
          </div>
          <div class="content-card">
            <div class="card-content">
              <h5 class="card-title">April 3, 2025</h5>
              <div class="card-meta">
                <span>Score: 88/100</span>
                <span>289 days</span>
                <span>$901M</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Comet Tracker
function initCometTracker() {
  console.log('☄️ Initializing Comet Tracker...');
}

function initializeTracking() {
  if (isElementLoading('#cometLoading') || state.features.cometTracker.isTracking) return;
  
  setButtonLoading('#initializeTracking', true, 'Tracking...');
  setLoading('#cometLoading', true, 'Calculating comet trajectory and observation windows...');
  
  setTimeout(() => {
    updateCometData();
    setupCometCanvas();
    
    state.features.cometTracker.isTracking = true;
    state.features.cometTracker.lastUpdate = new Date();
    
    setButtonLoading('#initializeTracking', false);
    setLoading('#cometLoading', false);
    showSuccess('✅ Comet tracking initialized!');
  }, 2000);
}

function updateCometData() {
  $('#cometEarthDistance').textContent = '4.73 AU';
  $('#cometSunDistance').textContent = '3.21 AU';
  $('#cometMagnitude').textContent = '8.4';
  $('#cometActivity').textContent = 'Medium';
  
  const windowsList = $('#observationWindowsList');
  if (windowsList) {
    windowsList.innerHTML = `
      <div class="content-grid">
        <div class="content-card">
          <div class="card-content">
            <h5 class="card-title">Oct 12, 2025 - Stockholm</h5>
            <div class="card-meta">
              <span>Magnitude: 8.2</span>
              <span>Quality: 8/10</span>
            </div>
          </div>
        </div>
        <div class="content-card">
          <div class="card-content">
            <h5 class="card-title">Oct 15, 2025 - Stockholm</h5>
            <div class="card-meta">
              <span>Magnitude: 8.1</span>
              <span>Quality: 9/10</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

function setupCometCanvas() {
  const canvas = $('#cometTrajectoryCanvas');
  if (!canvas) return;
  
  canvas.width = canvas.offsetWidth;
  canvas.height = 400;
  
  const ctx = canvas.getContext('2d');
  drawCometCanvas(ctx, canvas.width, canvas.height);
}

function drawCometCanvas(ctx, width, height) {
  // Space background
  const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
  gradient.addColorStop(0, '#1e293b');
  gradient.addColorStop(1, '#0f172a');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Draw stars
  ctx.fillStyle = 'white';
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw Sun
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw comet orbit
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.ellipse(width / 2, height / 2, 150, 100, Math.PI / 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Draw comet
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(width * 0.75, height * 0.35, 6, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw comet tail
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width * 0.75, height * 0.35);
  ctx.lineTo(width * 0.65, height * 0.25);
  ctx.stroke();
}

// ===== NEWS AND CONTENT =====
async function loadNews() {
  if (isElementLoading('#newsLoading')) return;
  
  setLoading('#newsLoading', true, 'Loading latest space news...');
  
  try {
    const newsItems = generateMockNews();
    renderNews('#newsContent', newsItems);
  } catch (error) {
    handleError('#newsContent', error, 'Failed to load news');
  } finally {
    setLoading('#newsLoading', false);
  }
}

function generateMockNews() {
  return [
    {
      title: "🚀 Artemis Mission Update: Lunar Base Construction Begins",
      source: "NASA",
      date: "2025-10-08",
      url: "https://www.nasa.gov/artemis"
    },
    {
      title: "🔭 James Webb Discovers New Exoplanet in Habitable Zone",
      source: "NASA",
      date: "2025-10-07",
      url: "https://www.nasa.gov/webb"
    },
    {
      title: "🛸 Mars Sample Return Mission Shows Promising Results",
      source: "NASA",
      date: "2025-10-06",
      url: "https://mars.nasa.gov"
    },
    {
      title: "⚡ Solar Storm Alert: Minor Geomagnetic Activity Expected",
      source: "NOAA",
      date: "2025-10-08",
      url: "https://www.spaceweather.gov"
    }
  ];
}

function renderNews(containerId, newsItems) {
  const container = $(containerId);
  if (!container) return;
  
  const newsHtml = newsItems.map(article => `
    <div class="content-card" onclick="window.open('${article.url}', '_blank')">
      <div class="card-content">
        <h3 class="card-title">${article.title}</h3>
        <div class="card-meta">
          <span>📰 ${article.source}</span>
          <span>🗺️ ${article.date}</span>
        </div>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = `<div class="content-grid">${newsHtml}</div>`;
}

// ===== UTILITY FUNCTIONS =====
function showSuccess(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'success-message';
  alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px; animation: slideIn 0.3s ease;';
  alertDiv.textContent = message;
  
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 4000);
}

function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

function getWeekAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}

// ===== ENHANCED EVENT BINDING =====
function bindAllEvents() {
  console.log('🔧 Binding all event listeners...');
  
  // API Key events
  $('#saveApiKey')?.addEventListener('click', () => {
    const input = $('#apiKeyInput');
    if (input?.value.trim()) {
      state.apiKey = input.value.trim();
      localStorage.setItem('NASA_API_KEY', state.apiKey);
      updateAPIKeyStatus();
      showSuccess('✅ API key saved successfully!');
    }
  });
  
  $('#testApiKey')?.addEventListener('click', async () => {
    if (isElementLoading('#testApiKey')) return;
    
    setButtonLoading('#testApiKey', true, 'Testing...');
    
    try {
      await testAPIConnection();
      showSuccess('✅ API connection successful!');
    } catch (error) {
      handleError(document.body, error, 'API Test Failed');
    } finally {
      setButtonLoading('#testApiKey', false);
    }
  });
  
  // APOD events
  $('#fetchApodDate')?.addEventListener('click', async () => {
    const date = $('#apodDate')?.value;
    await loadAPOD(date);
  });
  
  $('#randomApod')?.addEventListener('click', async () => {
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 365));
    await loadAPOD(randomDate.toISOString().split('T')[0]);
  });
  
  // Revolutionary features events
  $('#startExoplanetGame')?.addEventListener('click', startExoplanetGame);
  $('#generateTerrain')?.addEventListener('click', generateMarsTerrain);
  $('#calculateLaunchWindows')?.addEventListener('click', calculateLaunchWindows);
  $('#initializeTracking')?.addEventListener('click', initializeTracking);
  
  // News events
  $('#refreshNews')?.addEventListener('click', loadNews);
  
  // Modal close events
  $$('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });
  
  $$('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  });
  
  console.log('✅ All event listeners bound successfully!');
}

// ===== MODAL FUNCTIONS =====
window.openImageModal = function(imgElement) {
  const modal = $('#mastModal');
  if (modal && imgElement) {
    const previewImg = $('#previewImage');
    const modalTitle = $('#modalTitle');
    
    if (previewImg) previewImg.src = imgElement.src;
    if (modalTitle) modalTitle.textContent = imgElement.alt || 'Space Image';
    modal.style.display = 'block';
  }
};

// ===== MOCK DATA FUNCTIONS =====
async function loadTelescopeData() {
  if (isElementLoading('#telescopeLoading')) return;
  
  setLoading('#telescopeLoading', true, 'Loading telescope observations...');
  
  setTimeout(() => {
    const observations = [
      { target: 'Andromeda Galaxy (M31)', instrument: 'HST/WFC3', date: '2025-10-01' },
      { target: 'Orion Nebula (M42)', instrument: 'JWST/NIRCam', date: '2025-09-28' },
      { target: 'Whirlpool Galaxy (M51)', instrument: 'HST/ACS', date: '2025-09-25' }
    ];
    
    const container = $('#telescopeContent');
    if (container) {
      const html = observations.map(obs => `
        <div class="content-card">
          <div class="card-content">
            <h3 class="card-title">${obs.target}</h3>
            <div class="card-meta">
              <span>📡 ${obs.instrument}</span>
              <span>🗺️ ${obs.date}</span>
            </div>
          </div>
        </div>
      `).join('');
      container.innerHTML = `<div class="content-grid">${html}</div>`;
    }
    
    setLoading('#telescopeLoading', false);
  }, 1000);
}

// ===== INITIALIZATION =====
async function init() {
  console.log('🚀 Initializing CaldaSpace Revolutionary Dashboard...');
  
  try {
    // Update API key status
    updateAPIKeyStatus();
    
    // Initialize navigation
    initTabNavigation();
    
    // Bind all events
    bindAllEvents();
    
    // Load initial content
    await loadAPOD();
    await loadNews();
    
    // Set default dates
    const today = getCurrentDate();
    if ($('#apodDate')) $('#apodDate').value = today;
    
    console.log('✅ CaldaSpace initialized successfully!');
    showSuccess('🚀 CaldaSpace loaded - All features ready!');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    handleError(document.body, error, 'Failed to initialize CaldaSpace');
  }
}

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}