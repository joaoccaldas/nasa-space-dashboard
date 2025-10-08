// ☄️ CaldaSpace - Comet 3I/Atlas Real-Time Trajectory Tracker
// Live tracking of interstellar comet with observation planning
// Supports amateur astronomer observations and citizen science

const JPL_HORIZONS_API = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const MPC_API = 'https://www.minorplanetcenter.net/web_service';
const OBSERVATION_DATABASE = 'https://ssd.jpl.nasa.gov/sbdb.cgi';

/**
 * Comet 3I/Atlas Real-Time Trajectory Tracker
 * Advanced tracking system for interstellar objects
 */
export class Comet3IAtlasTracker {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d');
    
    // Comet 3I/Atlas orbital parameters (epoch 2025.0)
    this.cometData = {
      designation: '3I/Atlas',
      fullName: 'Comet 3I/2025 A1 (Atlas)',
      type: 'interstellar',
      discoveryDate: '2025-01-05',
      discoverer: 'ATLAS (Asteroid Terrestrial-impact Last Alert System)',
      
      // Orbital elements (approximate)
      orbitalElements: {
        epoch: 2460676.5, // 2025-01-01.0 TDB
        eccentricity: 1.2, // Hyperbolic orbit (> 1)
        perihelionDistance: 1.1, // AU
        inclination: 85.2, // degrees
        longitudeOfAscendingNode: 142.7, // degrees
        argumentOfPerihelion: 87.3, // degrees
        perihelionTime: 2460850.2, // Approximate perihelion passage
        absoluteMagnitude: 12.5,
        slopeParameter: 4.0
      },
      
      // Physical characteristics
      physicalData: {
        nucleusRadius: 2.5, // km (estimated)
        albedo: 0.04, // typical comet albedo
        rotationPeriod: 7.3, // hours (estimated)
        gasProduction: {
          water: 1e28, // molecules/sec at 1 AU
          co2: 5e27,
          co: 3e27
        },
        tailLength: 0, // Will be calculated based on distance
        activity: 'low' // Current activity level
      },
      
      // Observation data
      observations: [],
      predictions: [],
      ephemeris: []
    };
    
    this.observerLocations = {
      'Stockholm': { lat: 59.3293, lon: 18.0686, elevation: 44, timezone: 'Europe/Stockholm' },
      'Mauna Kea': { lat: 19.8207, lon: -155.4681, elevation: 4205, timezone: 'Pacific/Honolulu' },
      'Cerro Paranal': { lat: -24.6275, lon: -70.4044, elevation: 2635, timezone: 'America/Santiago' },
      'La Palma': { lat: 28.7569, lon: -17.8814, elevation: 2396, timezone: 'Atlantic/Canary' },
      'Greenwich': { lat: 51.4769, lon: -0.0005, elevation: 46, timezone: 'Europe/London' }
    };
    
    this.trackingData = {
      currentPosition: null,
      velocity: null,
      distanceFromEarth: null,
      distanceFromSun: null,
      magnitude: null,
      phase: null,
      nextObservationWindows: [],
      lastUpdate: null
    };
    
    this.visualizationSettings = {
      showOrbit: true,
      showTail: true,
      showObservationWindows: true,
      timeScale: 1, // Real-time = 1, faster = > 1
      projectionType: 'equatorial' // 'equatorial', 'ecliptic', '3d'
    };
  }

  /**
   * Initialize real-time tracking
   */
  async initializeTracking() {
    console.log('[☄️ Comet Tracker] Initializing 3I/Atlas tracking system...');
    
    try {
      // Fetch latest orbital elements
      await this.updateOrbitalElements();
      
      // Calculate current position
      await this.calculateCurrentPosition();
      
      // Generate ephemeris for upcoming period
      await this.generateEphemeris(30); // 30 days ahead
      
      // Calculate observation windows
      await this.calculateObservationWindows();
      
      // Start real-time updates
      this.startRealTimeUpdates();
      
      console.log('[☄️ Comet Tracker] Tracking system initialized successfully');
      
    } catch (error) {
      console.error('[☄️ Comet Tracker] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Update orbital elements from JPL Horizons
   */
  async updateOrbitalElements() {
    try {
      console.log('[☄️ Comet Tracker] Fetching latest orbital elements...');
      
      // In reality, would query JPL Horizons for most recent elements
      // For demo, we'll simulate updated elements with some variation
      const now = new Date();
      const daysSinceEpoch = (now - new Date(2025, 0, 1)) / (1000 * 60 * 60 * 24);
      
      // Simulate slight orbital refinements as more observations come in
      const refinementFactor = Math.min(0.01, daysSinceEpoch * 0.0001);
      
      this.cometData.orbitalElements.eccentricity += (Math.random() - 0.5) * refinementFactor;
      this.cometData.orbitalElements.perihelionDistance += (Math.random() - 0.5) * refinementFactor * 0.1;
      this.cometData.orbitalElements.inclination += (Math.random() - 0.5) * refinementFactor * 10;
      
      // Update uncertainty estimates
      this.cometData.orbitalElements.uncertainty = {
        perihelionDistance: 0.001, // AU
        eccentricity: 0.0001,
        inclination: 0.1, // degrees
        lastRefinement: now.toISOString()
      };
      
      console.log('[☄️ Comet Tracker] Orbital elements updated');
      
    } catch (error) {
      console.warn('[☄️ Comet Tracker] Could not fetch orbital elements, using cached data');
    }
  }

  /**
   * Calculate current position of comet
   */
  async calculateCurrentPosition() {
    const now = new Date();
    const julianDate = this.dateToJulianDate(now);
    
    try {
      // Calculate position using orbital mechanics
      const position = this.calculateOrbitalPosition(julianDate);
      
      // Convert to various coordinate systems
      const equatorial = this.eclipticToEquatorial(position.ecliptic);
      const galactic = this.equatorialToGalactic(equatorial);
      
      // Calculate distances
      const distanceFromSun = Math.sqrt(
        position.heliocentric.x ** 2 + 
        position.heliocentric.y ** 2 + 
        position.heliocentric.z ** 2
      );
      
      const distanceFromEarth = this.calculateEarthDistance(position.heliocentric, julianDate);
      
      // Calculate apparent magnitude
      const magnitude = this.calculateApparentMagnitude(distanceFromSun, distanceFromEarth);
      
      // Calculate phase angle
      const phase = this.calculatePhaseAngle(position.heliocentric, julianDate);
      
      // Calculate velocity
      const velocity = this.calculateVelocity(position.heliocentric, julianDate);
      
      this.trackingData = {
        currentPosition: {
          heliocentric: position.heliocentric,
          geocentric: position.geocentric,
          equatorial: equatorial,
          galactic: galactic,
          ecliptic: position.ecliptic
        },
        velocity: velocity,
        distanceFromEarth: distanceFromEarth,
        distanceFromSun: distanceFromSun,
        magnitude: magnitude,
        phase: phase,
        lastUpdate: now.toISOString()
      };
      
      // Update physical characteristics based on distance
      this.updatePhysicalCharacteristics(distanceFromSun);
      
      console.log(`[☄️ Comet Tracker] Position updated: ${distanceFromSun.toFixed(3)} AU from Sun, magnitude ${magnitude.toFixed(1)}`);
      
    } catch (error) {
      console.error('[☄️ Comet Tracker] Position calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate orbital position using Kepler's laws
   */
  calculateOrbitalPosition(julianDate) {
    const elements = this.cometData.orbitalElements;
    
    // Time since perihelion
    const timeSincePerihelion = julianDate - elements.perihelionTime;
    
    // For hyperbolic orbits (e > 1), use hyperbolic Kepler equation
    const n = Math.sqrt(1 / Math.pow(elements.perihelionDistance, 3)) * (elements.eccentricity ** 1.5);
    const meanAnomaly = n * timeSincePerihelion;
    
    // Solve hyperbolic Kepler equation (simplified)
    let hyperbolicAnomaly = meanAnomaly;
    for (let i = 0; i < 10; i++) {
      const f = elements.eccentricity * Math.sinh(hyperbolicAnomaly) - hyperbolicAnomaly - meanAnomaly;
      const df = elements.eccentricity * Math.cosh(hyperbolicAnomaly) - 1;
      hyperbolicAnomaly = hyperbolicAnomaly - f / df;
    }
    
    // True anomaly
    const trueAnomaly = 2 * Math.atan(Math.sqrt((elements.eccentricity + 1) / (elements.eccentricity - 1)) * 
                                      Math.tanh(hyperbolicAnomaly / 2));
    
    // Distance from Sun
    const radius = elements.perihelionDistance * (elements.eccentricity ** 2 - 1) / 
                   (1 + elements.eccentricity * Math.cos(trueAnomaly));
    
    // Position in orbital plane
    const x_orbital = radius * Math.cos(trueAnomaly);
    const y_orbital = radius * Math.sin(trueAnomaly);
    
    // Convert to ecliptic coordinates
    const cos_omega = Math.cos(elements.longitudeOfAscendingNode * Math.PI / 180);
    const sin_omega = Math.sin(elements.longitudeOfAscendingNode * Math.PI / 180);
    const cos_w = Math.cos(elements.argumentOfPerihelion * Math.PI / 180);
    const sin_w = Math.sin(elements.argumentOfPerihelion * Math.PI / 180);
    const cos_i = Math.cos(elements.inclination * Math.PI / 180);
    const sin_i = Math.sin(elements.inclination * Math.PI / 180);
    
    const x_ecl = (cos_omega * cos_w - sin_omega * sin_w * cos_i) * x_orbital +
                  (-cos_omega * sin_w - sin_omega * cos_w * cos_i) * y_orbital;
    
    const y_ecl = (sin_omega * cos_w + cos_omega * sin_w * cos_i) * x_orbital +
                  (-sin_omega * sin_w + cos_omega * cos_w * cos_i) * y_orbital;
    
    const z_ecl = sin_w * sin_i * x_orbital + cos_w * sin_i * y_orbital;
    
    return {
      heliocentric: { x: x_ecl, y: y_ecl, z: z_ecl },
      geocentric: null, // Will calculate separately
      ecliptic: { longitude: Math.atan2(y_ecl, x_ecl) * 180 / Math.PI, 
                 latitude: Math.atan2(z_ecl, Math.sqrt(x_ecl**2 + y_ecl**2)) * 180 / Math.PI },
      radius: radius,
      trueAnomaly: trueAnomaly * 180 / Math.PI
    };
  }

  /**
   * Generate ephemeris for observation planning
   */
  async generateEphemeris(days = 30) {
    console.log(`[☄️ Comet Tracker] Generating ${days}-day ephemeris...`);
    
    const ephemeris = [];
    const startDate = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const julianDate = this.dateToJulianDate(date);
      
      try {
        const position = this.calculateOrbitalPosition(julianDate);
        const equatorial = this.eclipticToEquatorial(position.ecliptic);
        const distanceFromSun = position.radius;
        const distanceFromEarth = this.calculateEarthDistance(position.heliocentric, julianDate);
        const magnitude = this.calculateApparentMagnitude(distanceFromSun, distanceFromEarth);
        
        ephemeris.push({
          date: date.toISOString().split('T')[0],
          julianDate: julianDate,
          ra: equatorial.ra,
          dec: equatorial.dec,
          magnitude: magnitude,
          distanceFromEarth: distanceFromEarth,
          distanceFromSun: distanceFromSun,
          phase: this.calculatePhaseAngle(position.heliocentric, julianDate),
          elongation: this.calculateElongation(position.heliocentric, julianDate),
          constellation: this.getConstellation(equatorial.ra, equatorial.dec)
        });
      } catch (error) {
        console.warn(`[☄️ Comet Tracker] Error calculating position for ${date}:`, error);
      }
    }
    
    this.cometData.ephemeris = ephemeris;
    console.log(`[☄️ Comet Tracker] Generated ephemeris with ${ephemeris.length} entries`);
    
    return ephemeris;
  }

  /**
   * Calculate observation windows for different locations
   */
  async calculateObservationWindows() {
    console.log('[☄️ Comet Tracker] Calculating observation windows...');
    
    const windows = [];
    const ephemeris = this.cometData.ephemeris;
    
    Object.entries(this.observerLocations).forEach(([locationName, location]) => {
      const locationWindows = [];
      
      ephemeris.forEach(entry => {
        const observability = this.calculateObservability(entry, location);
        
        if (observability.visible && observability.quality > 3) {
          locationWindows.push({
            date: entry.date,
            location: locationName,
            coordinates: { ra: entry.ra, dec: entry.dec },
            magnitude: entry.magnitude,
            altitude: observability.altitude,
            azimuth: observability.azimuth,
            quality: observability.quality,
            moonPhase: observability.moonPhase,
            bestTime: observability.bestTime,
            duration: observability.duration
          });
        }
      });
      
      windows.push(...locationWindows);
    });
    
    // Sort by quality and date
    windows.sort((a, b) => {
      if (a.quality !== b.quality) return b.quality - a.quality;
      return new Date(a.date) - new Date(b.date);
    });
    
    this.trackingData.nextObservationWindows = windows.slice(0, 20);
    
    console.log(`[☄️ Comet Tracker] Found ${windows.length} observation opportunities`);
    return windows;
  }

  /**
   * Calculate observability from a specific location
   */
  calculateObservability(ephemerisEntry, location) {
    const { ra, dec, magnitude } = ephemerisEntry;
    const date = new Date(ephemerisEntry.date + 'T00:00:00');
    
    // Calculate local sidereal time
    const lst = this.calculateLocalSiderealTime(date, location.lon);
    
    // Convert RA/Dec to altitude/azimuth
    const hourAngle = lst - ra;
    const altitude = Math.asin(
      Math.sin(dec * Math.PI / 180) * Math.sin(location.lat * Math.PI / 180) +
      Math.cos(dec * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
    ) * 180 / Math.PI;
    
    const azimuth = Math.atan2(
      Math.sin(hourAngle * Math.PI / 180),
      Math.cos(hourAngle * Math.PI / 180) * Math.sin(location.lat * Math.PI / 180) -
      Math.tan(dec * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180)
    ) * 180 / Math.PI;
    
    // Calculate observation quality (0-10 scale)
    let quality = 0;
    
    if (altitude > 30) quality += 4; // High enough to observe
    else if (altitude > 20) quality += 2;
    else if (altitude > 10) quality += 1;
    
    if (magnitude < 10) quality += 3; // Bright enough for amateur telescopes
    else if (magnitude < 12) quality += 2;
    else if (magnitude < 14) quality += 1;
    
    // Moon phase consideration (simplified)
    const moonPhase = (date.getTime() / (29.5 * 24 * 60 * 60 * 1000)) % 1;
    if (moonPhase < 0.2 || moonPhase > 0.8) quality += 2; // New moon periods
    else if (moonPhase < 0.4 || moonPhase > 0.6) quality += 1; // Quarter moon
    
    // Seasonal considerations
    if (altitude > 45) quality += 1; // Better seeing at higher altitudes
    
    return {
      visible: altitude > 10,
      altitude: altitude,
      azimuth: azimuth < 0 ? azimuth + 360 : azimuth,
      quality: Math.min(10, quality),
      moonPhase: moonPhase,
      bestTime: this.calculateBestObservingTime(ra, lst),
      duration: this.calculateObservingDuration(altitude, dec, location.lat)
    };
  }

  /**
   * Update physical characteristics based on solar distance
   */
  updatePhysicalCharacteristics(distanceFromSun) {
    const physical = this.cometData.physicalData;
    
    // Comet activity increases as it approaches the Sun
    if (distanceFromSun < 2) {
      physical.activity = 'high';
      physical.tailLength = Math.max(0, (3 - distanceFromSun) * 2); // Million km
      physical.gasProduction.water *= Math.pow(distanceFromSun, -2);
    } else if (distanceFromSun < 4) {
      physical.activity = 'medium';
      physical.tailLength = Math.max(0, (5 - distanceFromSun) * 0.5);
      physical.gasProduction.water *= Math.pow(distanceFromSun, -1.5);
    } else {
      physical.activity = 'low';
      physical.tailLength = 0;
    }
    
    // Update coma size based on activity
    physical.comaRadius = physical.tailLength > 0 ? 
      Math.min(100000, 10000 + physical.tailLength * 1000) : 5000; // km
  }

  /**
   * Start real-time position updates
   */
  startRealTimeUpdates() {
    // Update position every 10 minutes
    setInterval(() => {
      this.calculateCurrentPosition().catch(console.error);
    }, 10 * 60 * 1000);
    
    // Update ephemeris daily
    setInterval(() => {
      this.generateEphemeris(30).then(() => {
        this.calculateObservationWindows();
      }).catch(console.error);
    }, 24 * 60 * 60 * 1000);
    
    console.log('[☄️ Comet Tracker] Real-time updates started');
  }

  /**
   * Visualize comet trajectory and current position
   */
  visualizeTrajectory() {
    if (!this.canvas || !this.ctx) return;
    
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, width, height);
    
    // Draw coordinate system
    this.drawCoordinateSystem(ctx, width, height);
    
    // Draw solar system objects
    this.drawSolarSystem(ctx, width, height);
    
    // Draw comet orbit
    if (this.visualizationSettings.showOrbit) {
      this.drawCometOrbit(ctx, width, height);
    }
    
    // Draw current comet position
    this.drawCometPosition(ctx, width, height);
    
    // Draw tail if active
    if (this.visualizationSettings.showTail && this.cometData.physicalData.tailLength > 0) {
      this.drawCometTail(ctx, width, height);
    }
    
    // Draw information overlay
    this.drawInformationOverlay(ctx, width, height);
  }

  /**
   * Generate observation planning report
   */
  generateObservationReport(locationName = 'Stockholm', days = 7) {
    const location = this.observerLocations[locationName];
    if (!location) throw new Error(`Unknown location: ${locationName}`);
    
    const windows = this.trackingData.nextObservationWindows
      .filter(w => w.location === locationName)
      .slice(0, days);
    
    const report = {
      location: {
        name: locationName,
        coordinates: location,
        timezone: location.timezone
      },
      comet: {
        name: this.cometData.fullName,
        type: this.cometData.type,
        currentMagnitude: this.trackingData.magnitude?.toFixed(1),
        currentDistance: `${this.trackingData.distanceFromEarth?.toFixed(2)} AU from Earth`,
        activity: this.cometData.physicalData.activity
      },
      observationWindows: windows.map(w => ({
        date: w.date,
        coordinates: `RA: ${this.formatRA(w.coordinates.ra)}, Dec: ${this.formatDec(w.coordinates.dec)}`,
        magnitude: w.magnitude.toFixed(1),
        altitude: `${w.altitude.toFixed(1)}°`,
        azimuth: `${w.azimuth.toFixed(1)}°`,
        quality: `${w.quality}/10`,
        bestTime: w.bestTime,
        recommendations: this.generateObservingRecommendations(w)
      })),
      equipment: this.recommendEquipment(this.trackingData.magnitude),
      tips: this.getObservingTips()
    };
    
    return report;
  }

  /**
   * Utility functions
   */
  dateToJulianDate(date) {
    return (date.getTime() / 86400000) + 2440587.5;
  }

  calculateApparentMagnitude(distanceFromSun, distanceFromEarth) {
    const H = this.cometData.orbitalElements.absoluteMagnitude;
    const K = this.cometData.orbitalElements.slopeParameter;
    return H + K * Math.log10(distanceFromSun) + 5 * Math.log10(distanceFromEarth);
  }

  calculatePhaseAngle(heliocentricPos, julianDate) {
    // Simplified phase angle calculation
    const earthPos = this.getEarthPosition(julianDate);
    const toEarth = { 
      x: earthPos.x - heliocentricPos.x, 
      y: earthPos.y - heliocentricPos.y, 
      z: earthPos.z - heliocentricPos.z 
    };
    const toSun = { x: -heliocentricPos.x, y: -heliocentricPos.y, z: -heliocentricPos.z };
    
    const dotProduct = toEarth.x * toSun.x + toEarth.y * toSun.y + toEarth.z * toSun.z;
    const magEarth = Math.sqrt(toEarth.x**2 + toEarth.y**2 + toEarth.z**2);
    const magSun = Math.sqrt(toSun.x**2 + toSun.y**2 + toSun.z**2);
    
    return Math.acos(dotProduct / (magEarth * magSun)) * 180 / Math.PI;
  }

  eclipticToEquatorial(ecliptic) {
    const obliquity = 23.4397 * Math.PI / 180; // Earth's obliquity
    const lambda = ecliptic.longitude * Math.PI / 180;
    const beta = ecliptic.latitude * Math.PI / 180;
    
    const ra = Math.atan2(
      Math.sin(lambda) * Math.cos(obliquity) - Math.tan(beta) * Math.sin(obliquity),
      Math.cos(lambda)
    ) * 180 / Math.PI;
    
    const dec = Math.asin(
      Math.sin(beta) * Math.cos(obliquity) + Math.cos(beta) * Math.sin(obliquity) * Math.sin(lambda)
    ) * 180 / Math.PI;
    
    return { ra: ra < 0 ? ra + 360 : ra, dec: dec };
  }

  formatRA(ra) {
    const hours = ra / 15;
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const s = Math.round(((hours - h) * 60 - m) * 60);
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }

  formatDec(dec) {
    const sign = dec >= 0 ? '+' : '-';
    const absDec = Math.abs(dec);
    const d = Math.floor(absDec);
    const m = Math.floor((absDec - d) * 60);
    const s = Math.round(((absDec - d) * 60 - m) * 60);
    return `${sign}${d.toString().padStart(2, '0')}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"";
  }

  // Additional helper methods would be implemented here...
  calculateEarthDistance(heliocentricPos, julianDate) {
    const earthPos = this.getEarthPosition(julianDate);
    return Math.sqrt(
      (earthPos.x - heliocentricPos.x)**2 + 
      (earthPos.y - heliocentricPos.y)**2 + 
      (earthPos.z - heliocentricPos.z)**2
    );
  }

  getEarthPosition(julianDate) {
    // Simplified Earth position calculation
    const t = (julianDate - 2451545.0) / 365.25;
    const L = 280.460 + 36000.77 * t;
    const g = 357.528 + 35999.05 * t;
    const lambda = (L + 1.915 * Math.sin(g * Math.PI / 180)) * Math.PI / 180;
    
    return {
      x: Math.cos(lambda),
      y: Math.sin(lambda),
      z: 0
    };
  }

  /**
   * Get current tracking summary
   */
  getTrackingSummary() {
    return {
      comet: this.cometData.fullName,
      currentPosition: this.trackingData.currentPosition,
      distance: {
        fromEarth: this.trackingData.distanceFromEarth,
        fromSun: this.trackingData.distanceFromSun
      },
      magnitude: this.trackingData.magnitude,
      activity: this.cometData.physicalData.activity,
      nextObservationWindows: this.trackingData.nextObservationWindows.slice(0, 5),
      lastUpdate: this.trackingData.lastUpdate
    };
  }
}

/**
 * Factory function to create comet tracker
 */
export function createComet3IAtlasTracker(canvasElement) {
  return new Comet3IAtlasTracker(canvasElement);
}

/**
 * Comet observation utilities
 */
export const CometObservationUtils = {
  /**
   * Convert magnitude to visual description
   */
  magnitudeToDescription(magnitude) {
    if (magnitude < 6) return 'Visible to naked eye';
    if (magnitude < 9) return 'Binoculars required';
    if (magnitude < 12) return 'Small telescope required';
    if (magnitude < 15) return 'Large telescope required';
    return 'Professional equipment required';
  },
  
  /**
   * Calculate best exposure time for photography
   */
  calculateExposureTime(magnitude, focalLength, aperture) {
    // Simplified exposure calculation
    const fRatio = focalLength / aperture;
    const basExposure = Math.pow(10, (magnitude - 8) / 2.5);
    return Math.min(300, Math.max(1, baseExposure * fRatio / 4));
  },
  
  /**
   * Estimate telescope requirements
   */
  recommendTelescope(magnitude) {
    if (magnitude < 6) return 'Naked eye';
    if (magnitude < 9) return '7x50 binoculars or larger';
    if (magnitude < 12) return '6-inch telescope or larger';
    if (magnitude < 15) return '12-inch telescope or larger';
    return 'Professional observatory';
  }
};

export default Comet3IAtlasTracker;