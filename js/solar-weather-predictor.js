// ⚡ CaldaSpace - Solar Weather Impact Predictor
// Real-time space weather forecasting with critical infrastructure alerts
// Data from NOAA Space Weather Prediction Center + NASA DONKI

const NOAA_SWPC_API = 'https://services.swpc.noaa.gov/json';
const NASA_DONKI_API = 'https://api.nasa.gov/DONKI';
const AURORA_FORECAST_API = 'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json';

/**
 * Solar Weather Impact Prediction System
 * Predicts impacts on satellites, power grids, GPS, and communications
 */
export class SolarWeatherPredictor {
  constructor() {
    this.weatherData = {
      currentConditions: null,
      forecast: [],
      alerts: [],
      impacts: {
        satellites: 'normal',
        gps: 'normal',
        powerGrids: 'normal',
        communications: 'normal',
        aviation: 'normal'
      },
      auroraForecast: null
    };
    
    this.alertThresholds = {
      geomagneticStorm: {
        G1: { kp: 5, description: 'Minor storm' },
        G2: { kp: 6, description: 'Moderate storm' },
        G3: { kp: 7, description: 'Strong storm' },
        G4: { kp: 8, description: 'Severe storm' },
        G5: { kp: 9, description: 'Extreme storm' }
      },
      solarRadiation: {
        S1: { flux: 10, description: 'Minor radiation storm' },
        S2: { flux: 100, description: 'Moderate radiation storm' },
        S3: { flux: 1000, description: 'Strong radiation storm' },
        S4: { flux: 10000, description: 'Severe radiation storm' },
        S5: { flux: 100000, description: 'Extreme radiation storm' }
      },
      radioBlackout: {
        R1: { xray: 1e-5, description: 'Minor radio blackout' },
        R2: { xray: 5e-5, description: 'Moderate radio blackout' },
        R3: { xray: 1e-4, description: 'Strong radio blackout' },
        R4: { xray: 5e-4, description: 'Severe radio blackout' },
        R5: { xray: 1e-3, description: 'Extreme radio blackout' }
      }
    };
    
    this.lastUpdate = null;
  }

  /**
   * Fetch comprehensive solar weather data
   */
  async fetchSolarWeatherData(apiKey = 'DEMO_KEY') {
    try {
      console.log('[⚡ Solar Weather] Fetching comprehensive space weather data...');
      
      const [current, forecast, donki, aurora] = await Promise.allSettled([
        this.fetchCurrentConditions(),
        this.fetchSpaceWeatherForecast(),
        this.fetchNASADONKIEvents(apiKey),
        this.fetchAuroraForecast()
      ]);
      
      // Process results
      if (current.status === 'fulfilled') {
        this.weatherData.currentConditions = current.value;
      }
      
      if (forecast.status === 'fulfilled') {
        this.weatherData.forecast = forecast.value;
      }
      
      if (donki.status === 'fulfilled') {
        this.processNASAEvents(donki.value);
      }
      
      if (aurora.status === 'fulfilled') {
        this.weatherData.auroraForecast = aurora.value;
      }
      
      // Analyze impacts
      this.analyzeInfrastructureImpacts();
      
      // Generate alerts
      this.generateAlerts();
      
      this.lastUpdate = new Date().toISOString();
      
      console.log('[⚡ Solar Weather] Data updated successfully');
      return this.weatherData;
      
    } catch (error) {
      console.error('[⚡ Solar Weather] Error fetching data:', error);
      throw error;
    }
  }

  /**
   * Fetch current space weather conditions from NOAA
   */
  async fetchCurrentConditions() {
    try {
      const [kpIndex, solarWind, xrayFlux] = await Promise.all([
        fetch(`${NOAA_SWPC_API}/planetary_k_index_1m.json`).then(r => r.json()),
        fetch(`${NOAA_SWPC_API}/rtsw-mag-1m.json`).then(r => r.json()),
        fetch(`${NOAA_SWPC_API}/goes-xray-flux-primary-1m.json`).then(r => r.json())
      ]);
      
      const latest = {
        kpIndex: kpIndex?.[kpIndex.length - 1]?.kp_index || 0,
        solarWind: {
          speed: solarWind?.[solarWind.length - 1]?.speed || 400,
          density: solarWind?.[solarWind.length - 1]?.density || 5,
          magneticField: solarWind?.[solarWind.length - 1]?.bt || 5
        },
        xrayFlux: {
          short: xrayFlux?.[xrayFlux.length - 1]?.flux || 1e-8,
          long: xrayFlux?.[xrayFlux.length - 1]?.flux || 1e-8
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('[⚡ Solar Weather] Current conditions:', latest);
      return latest;
      
    } catch (error) {
      console.warn('[⚡ Solar Weather] Using simulated current conditions');
      return this.generateSimulatedConditions();
    }
  }

  /**
   * Fetch 3-day space weather forecast
   */
  async fetchSpaceWeatherForecast() {
    try {
      const response = await fetch(`${NOAA_SWPC_API}/3-day-forecast.json`);
      const data = await response.json();
      
      const forecast = data.map(day => ({
        date: day.DateStamp,
        kpIndex: {
          predicted: day.KpIndex || 3,
          confidence: 0.8
        },
        geomagneticActivity: day.GeomagneticActivity || 'Quiet',
        solarRadiation: day.SolarRadiation || 'Normal',
        radioBlackout: day.RadioBlackout || 'None'
      }));
      
      console.log(`[⚡ Solar Weather] Loaded ${forecast.length}-day forecast`);
      return forecast;
      
    } catch (error) {
      console.warn('[⚡ Solar Weather] Using simulated forecast');
      return this.generateSimulatedForecast();
    }
  }

  /**
   * Fetch NASA DONKI space weather events
   */
  async fetchNASADONKIEvents(apiKey) {
    try {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const [flares, cme, gst] = await Promise.all([
        fetch(`${NASA_DONKI_API}/FLR?startDate=${startDate}&endDate=${endDate}&api_key=${apiKey}`).then(r => r.json()),
        fetch(`${NASA_DONKI_API}/CME?startDate=${startDate}&endDate=${endDate}&api_key=${apiKey}`).then(r => r.json()),
        fetch(`${NASA_DONKI_API}/GST?startDate=${startDate}&endDate=${endDate}&api_key=${apiKey}`).then(r => r.json())
      ]);
      
      return {
        solarFlares: Array.isArray(flares) ? flares : [],
        coronalMassEjections: Array.isArray(cme) ? cme : [],
        geomagneticStorms: Array.isArray(gst) ? gst : []
      };
      
    } catch (error) {
      console.warn('[⚡ Solar Weather] DONKI API unavailable, using simulated events');
      return this.generateSimulatedDONKIEvents();
    }
  }

  /**
   * Fetch aurora forecast data
   */
  async fetchAuroraForecast() {
    try {
      const response = await fetch(AURORA_FORECAST_API);
      const data = await response.json();
      
      return {
        timestamp: data.Forecast_Time,
        coordinates: data.coordinates,
        auroralActivity: data.aurora,
        viewingLocations: this.calculateAuroraViewingLocations(data)
      };
      
    } catch (error) {
      console.warn('[⚡ Solar Weather] Aurora forecast unavailable');
      return null;
    }
  }

  /**
   * Process NASA DONKI events for impact analysis
   */
  processNASAEvents(events) {
    const processed = [];
    
    // Process solar flares
    events.solarFlares?.forEach(flare => {
      processed.push({
        type: 'Solar Flare',
        class: flare.classType,
        peakTime: flare.peakTime,
        source: flare.sourceLocation,
        impact: this.assessFlareImpact(flare.classType),
        description: `${flare.classType} solar flare from ${flare.sourceLocation}`
      });
    });
    
    // Process CMEs
    events.coronalMassEjections?.forEach(cme => {
      const arrivalTime = cme.cmeAnalyses?.[0]?.estimatedShockArrivalTime;
      processed.push({
        type: 'Coronal Mass Ejection',
        speed: cme.cmeAnalyses?.[0]?.speed || 500,
        arrivalTime: arrivalTime,
        impact: this.assessCMEImpact(cme.cmeAnalyses?.[0]?.speed),
        description: `CME with speed ${cme.cmeAnalyses?.[0]?.speed} km/s`
      });
    });
    
    // Process geomagnetic storms
    events.geomagneticStorms?.forEach(storm => {
      processed.push({
        type: 'Geomagnetic Storm',
        startTime: storm.startTime,
        kpIndex: storm.allKpIndex?.[0]?.kpIndex,
        impact: this.assessGeomagneticImpact(storm.allKpIndex?.[0]?.kpIndex),
        description: `Kp ${storm.allKpIndex?.[0]?.kpIndex} geomagnetic storm`
      });
    });
    
    this.weatherData.events = processed;
  }

  /**
   * Analyze infrastructure impacts based on space weather conditions
   */
  analyzeInfrastructureImpacts() {
    const current = this.weatherData.currentConditions;
    if (!current) return;
    
    const kp = current.kpIndex;
    const solarWind = current.solarWind;
    const xray = current.xrayFlux.short;
    
    // Satellite impacts
    if (kp >= 6 || solarWind.speed > 600) {
      this.weatherData.impacts.satellites = kp >= 8 ? 'severe' : 'moderate';
    } else {
      this.weatherData.impacts.satellites = 'normal';
    }
    
    // GPS impacts
    if (kp >= 5 || xray > 1e-5) {
      this.weatherData.impacts.gps = kp >= 7 ? 'severe' : 'moderate';
    } else {
      this.weatherData.impacts.gps = 'normal';
    }
    
    // Power grid impacts
    if (kp >= 7) {
      this.weatherData.impacts.powerGrids = kp >= 9 ? 'severe' : 'moderate';
    } else {
      this.weatherData.impacts.powerGrids = 'normal';
    }
    
    // Communications impacts
    if (xray > 1e-5 || kp >= 6) {
      this.weatherData.impacts.communications = xray > 1e-4 ? 'severe' : 'moderate';
    } else {
      this.weatherData.impacts.communications = 'normal';
    }
    
    // Aviation impacts
    if (xray > 5e-5 || kp >= 6) {
      this.weatherData.impacts.aviation = xray > 1e-4 ? 'severe' : 'moderate';
    } else {
      this.weatherData.impacts.aviation = 'normal';
    }
  }

  /**
   * Generate critical alerts based on space weather conditions
   */
  generateAlerts() {
    const alerts = [];
    const current = this.weatherData.currentConditions;
    const impacts = this.weatherData.impacts;
    
    // Geomagnetic storm alerts
    if (current?.kpIndex >= 5) {
      const severity = this.getGeomagneticSeverity(current.kpIndex);
      alerts.push({
        type: 'Geomagnetic Storm',
        severity: severity.level,
        title: `${severity.level} Geomagnetic Storm in Progress`,
        message: `Kp index ${current.kpIndex}. ${severity.description}. Impacts: ${this.getImpactSummary()}`,
        timestamp: new Date().toISOString(),
        priority: severity.level === 'G5' ? 'critical' : severity.level === 'G4' ? 'high' : 'medium',
        affectedSystems: this.getAffectedSystems()
      });
    }
    
    // Solar radiation alerts
    if (current?.xrayFlux.short > 1e-5) {
      const severity = this.getRadiationSeverity(current.xrayFlux.short);
      alerts.push({
        type: 'Solar Radiation Storm',
        severity: severity.level,
        title: `${severity.level} Solar Radiation Storm`,
        message: `X-ray flux ${current.xrayFlux.short.toExponential(2)}. Radio blackouts possible.`,
        timestamp: new Date().toISOString(),
        priority: severity.level.includes('5') ? 'critical' : 'high',
        affectedSystems: ['communications', 'aviation', 'satellites']
      });
    }
    
    // Infrastructure impact alerts
    Object.entries(impacts).forEach(([system, impact]) => {
      if (impact === 'severe') {
        alerts.push({
          type: 'Infrastructure Impact',
          severity: 'High',
          title: `Severe Impact on ${system.charAt(0).toUpperCase() + system.slice(1)}`,
          message: this.getSystemImpactMessage(system, impact),
          timestamp: new Date().toISOString(),
          priority: 'high',
          affectedSystems: [system]
        });
      }
    });
    
    // Aurora visibility alerts
    if (current?.kpIndex >= 6 && this.weatherData.auroraForecast) {
      alerts.push({
        type: 'Aurora Alert',
        severity: 'Info',
        title: 'Enhanced Aurora Activity',
        message: `Aurora may be visible at lower latitudes due to Kp ${current.kpIndex} conditions.`,
        timestamp: new Date().toISOString(),
        priority: 'low',
        affectedSystems: []
      });
    }
    
    this.weatherData.alerts = alerts;
    
    if (alerts.length > 0) {
      console.log(`[⚡ Solar Weather] Generated ${alerts.length} alerts:`, alerts);
    }
  }

  /**
   * Get affected systems based on current conditions
   */
  getAffectedSystems() {
    return Object.entries(this.weatherData.impacts)
      .filter(([_, impact]) => impact !== 'normal')
      .map(([system, _]) => system);
  }

  /**
   * Get impact summary string
   */
  getImpactSummary() {
    const affected = this.getAffectedSystems();
    if (affected.length === 0) return 'No major impacts expected';
    return `Potential impacts on ${affected.join(', ')}`;
  }

  /**
   * Get system-specific impact message
   */
  getSystemImpactMessage(system, impact) {
    const messages = {
      satellites: 'Satellite operations may experience anomalies. Consider postponing sensitive operations.',
      gps: 'GPS accuracy may be degraded. Use alternative navigation methods for critical operations.',
      powerGrids: 'Power grid instabilities possible. Utility operators should monitor closely.',
      communications: 'HF radio communications may be degraded or blocked.',
      aviation: 'Airline operations may experience navigation and communication issues.'
    };
    
    return messages[system] || `${system} may be affected by current space weather conditions.`;
  }

  /**
   * Calculate aurora viewing locations
   */
  calculateAuroraViewingLocations(auroraData) {
    // Simplified calculation - in reality would use complex magnetic models
    const kp = this.weatherData.currentConditions?.kpIndex || 3;
    
    const locations = [];
    
    // Estimate aurora visibility based on Kp index
    const latitudeThresholds = {
      3: 67, 4: 65, 5: 62, 6: 60, 7: 57, 8: 54, 9: 50
    };
    
    const threshold = latitudeThresholds[Math.floor(kp)] || 67;
    
    if (kp >= 5) {
      locations.push('Northern Canada', 'Alaska', 'Northern Scandinavia', 'Northern Russia');
    }
    if (kp >= 6) {
      locations.push('Southern Canada', 'Northern US States', 'Scotland', 'Southern Scandinavia');
    }
    if (kp >= 7) {
      locations.push('Northern US', 'Central Europe', 'Northern Asia');
    }
    if (kp >= 8) {
      locations.push('US Midwest', 'Southern Europe', 'Central Asia');
    }
    
    return {
      threshold: threshold,
      locations: locations,
      visibility: kp >= 5 ? 'possible' : 'unlikely'
    };
  }

  /**
   * Assessment helper functions
   */
  assessFlareImpact(flareClass) {
    if (flareClass?.startsWith('X')) return 'high';
    if (flareClass?.startsWith('M')) return 'moderate';
    return 'low';
  }

  assessCMEImpact(speed) {
    if (speed > 1000) return 'high';
    if (speed > 600) return 'moderate';
    return 'low';
  }

  assessGeomagneticImpact(kp) {
    if (kp >= 8) return 'severe';
    if (kp >= 6) return 'moderate';
    return 'low';
  }

  getGeomagneticSeverity(kp) {
    if (kp >= 9) return { level: 'G5', description: 'Extreme geomagnetic storm' };
    if (kp >= 8) return { level: 'G4', description: 'Severe geomagnetic storm' };
    if (kp >= 7) return { level: 'G3', description: 'Strong geomagnetic storm' };
    if (kp >= 6) return { level: 'G2', description: 'Moderate geomagnetic storm' };
    if (kp >= 5) return { level: 'G1', description: 'Minor geomagnetic storm' };
    return { level: 'G0', description: 'Quiet conditions' };
  }

  getRadiationSeverity(xrayFlux) {
    if (xrayFlux >= 1e-3) return { level: 'R5', description: 'Extreme radio blackout' };
    if (xrayFlux >= 5e-4) return { level: 'R4', description: 'Severe radio blackout' };
    if (xrayFlux >= 1e-4) return { level: 'R3', description: 'Strong radio blackout' };
    if (xrayFlux >= 5e-5) return { level: 'R2', description: 'Moderate radio blackout' };
    if (xrayFlux >= 1e-5) return { level: 'R1', description: 'Minor radio blackout' };
    return { level: 'R0', description: 'No blackout' };
  }

  /**
   * Generate simulated data for when APIs are unavailable
   */
  generateSimulatedConditions() {
    return {
      kpIndex: Math.floor(Math.random() * 9) + 1,
      solarWind: {
        speed: Math.random() * 400 + 300,
        density: Math.random() * 10 + 2,
        magneticField: Math.random() * 20 + 2
      },
      xrayFlux: {
        short: Math.pow(10, -8 + Math.random() * 4),
        long: Math.pow(10, -8 + Math.random() * 4)
      },
      timestamp: new Date().toISOString()
    };
  }

  generateSimulatedForecast() {
    const forecast = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        kpIndex: {
          predicted: Math.floor(Math.random() * 7) + 1,
          confidence: 0.6 + Math.random() * 0.3
        },
        geomagneticActivity: ['Quiet', 'Unsettled', 'Active', 'Minor Storm'][Math.floor(Math.random() * 4)],
        solarRadiation: 'Normal',
        radioBlackout: 'None'
      });
    }
    return forecast;
  }

  generateSimulatedDONKIEvents() {
    return {
      solarFlares: [],
      coronalMassEjections: [],
      geomagneticStorms: []
    };
  }

  /**
   * Get formatted weather summary for display
   */
  getWeatherSummary() {
    const current = this.weatherData.currentConditions;
    const impacts = this.weatherData.impacts;
    const alerts = this.weatherData.alerts;
    
    return {
      currentConditions: {
        kpIndex: current?.kpIndex || 0,
        condition: this.getGeomagneticSeverity(current?.kpIndex || 0).description,
        solarWindSpeed: current?.solarWind.speed || 400,
        xrayFlux: current?.xrayFlux.short || 1e-8
      },
      impacts: impacts,
      alertCount: alerts.length,
      criticalAlerts: alerts.filter(a => a.priority === 'critical').length,
      lastUpdate: this.lastUpdate
    };
  }

  /**
   * Export alert data for external systems
   */
  exportAlertData() {
    return {
      alerts: this.weatherData.alerts,
      impacts: this.weatherData.impacts,
      currentConditions: this.weatherData.currentConditions,
      forecast: this.weatherData.forecast,
      exportTime: new Date().toISOString()
    };
  }
}

/**
 * Factory function to create solar weather predictor
 */
export function createSolarWeatherPredictor() {
  return new SolarWeatherPredictor();
}

/**
 * Utility functions for space weather
 */
export const SpaceWeatherUtils = {
  /**
   * Convert Kp index to readable description
   */
  kpToDescription(kp) {
    if (kp >= 9) return 'Extreme Storm';
    if (kp >= 8) return 'Severe Storm';
    if (kp >= 7) return 'Strong Storm';
    if (kp >= 6) return 'Moderate Storm';
    if (kp >= 5) return 'Minor Storm';
    if (kp >= 4) return 'Active';
    if (kp >= 2) return 'Unsettled';
    return 'Quiet';
  },
  
  /**
   * Get impact color coding
   */
  getImpactColor(impact) {
    switch (impact) {
      case 'severe': return '#ff4444';
      case 'moderate': return '#ffaa00';
      case 'normal': return '#44ff44';
      default: return '#cccccc';
    }
  },
  
  /**
   * Calculate satellite risk level
   */
  calculateSatelliteRisk(kp, solarWind, xrayFlux) {
    let risk = 0;
    
    if (kp >= 6) risk += 3;
    else if (kp >= 4) risk += 1;
    
    if (solarWind > 600) risk += 2;
    else if (solarWind > 500) risk += 1;
    
    if (xrayFlux > 1e-5) risk += 2;
    
    if (risk >= 5) return 'high';
    if (risk >= 3) return 'moderate';
    return 'low';
  }
};

export default SolarWeatherPredictor;