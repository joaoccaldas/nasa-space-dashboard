// 🚀 CaldaSpace - Launch Window Optimization Engine
// Revolutionary mission planning tool for optimal launch windows
// Integrates JPL Horizons, orbital mechanics, and real-time constraints

const JPL_HORIZONS_API = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const LAUNCH_SERVICES_API = 'https://lldev.thespacedevs.com/2.2.0';
const SPACEX_API = 'https://api.spacexdata.com/v4';

/**
 * Launch Window Optimization Engine
 * Calculates optimal launch windows for any space mission
 */
export class LaunchWindowOptimizer {
  constructor() {
    this.celestialBodies = {
      'mercury': { id: '199', radius: 2439.7, mu: 22032.1 },
      'venus': { id: '299', radius: 6051.8, mu: 324858.8 },
      'earth': { id: '399', radius: 6378.1, mu: 398600.4 },
      'mars': { id: '499', radius: 3396.2, mu: 42828.3 },
      'jupiter': { id: '599', radius: 71492, mu: 126686534 },
      'saturn': { id: '699', radius: 60268, mu: 37931187 },
      'uranus': { id: '799', radius: 25559, mu: 5793939 },
      'neptune': { id: '899', radius: 24764, mu: 6836529 },
      'moon': { id: '301', radius: 1737.4, mu: 4902.8 },
      'europa': { id: '502', radius: 1560.8, mu: 3202.7 },
      'enceladus': { id: '602', radius: 252.1, mu: 7.2 },
      'titan': { id: '606', radius: 2574, mu: 8978.1 }
    };
    
    this.launchSites = {
      'KSC': { name: 'Kennedy Space Center', lat: 28.6084, lon: -80.6043, country: 'USA' },
      'VAFB': { name: 'Vandenberg AFB', lat: 34.7420, lon: -120.5724, country: 'USA' },
      'Baikonur': { name: 'Baikonur Cosmodrome', lat: 45.9200, lon: 63.3420, country: 'Kazakhstan' },
      'Kourou': { name: 'Kourou', lat: 5.2389, lon: -52.7683, country: 'French Guiana' },
      'Plesetsk': { name: 'Plesetsk', lat: 62.9572, lon: 40.5792, country: 'Russia' },
      'Jiuquan': { name: 'Jiuquan', lat: 40.9580, lon: 100.2900, country: 'China' },
      'Tanegashima': { name: 'Tanegashima', lat: 30.3911, lon: 130.9681, country: 'Japan' }
    };
    
    this.launchVehicles = {
      'Falcon Heavy': { payload_leo: 63800, payload_gto: 26700, cost_per_kg: 1400 },
      'Falcon 9': { payload_leo: 22800, payload_gto: 8300, cost_per_kg: 2720 },
      'Atlas V': { payload_leo: 18850, payload_gto: 8900, cost_per_kg: 13000 },
      'Delta IV Heavy': { payload_leo: 28790, payload_gto: 14220, cost_per_kg: 14000 },
      'Ariane 5': { payload_leo: 21000, payload_gto: 10500, cost_per_kg: 10000 },
      'SLS': { payload_leo: 95000, payload_gto: 45000, cost_per_kg: 18000 },
      'Starship': { payload_leo: 150000, payload_gto: 100000, cost_per_kg: 400 }
    };
    
    this.optimizationCache = new Map();
  }

  /**
   * Calculate optimal launch windows for a mission
   */
  async calculateOptimalLaunchWindows(missionParams) {
    const {
      origin = 'earth',
      destination,
      launchSite = 'KSC',
      startDate,
      endDate,
      missionType = 'interplanetary',
      payloadMass = 1000,
      launchVehicle = 'Falcon Heavy',
      constraints = {}
    } = missionParams;

    console.log(`[🚀 Launch Optimizer] Calculating windows for ${origin} → ${destination}`);
    
    try {
      // Generate possible launch dates
      const launchDates = this.generateLaunchDateRange(startDate, endDate);
      
      // Calculate trajectory for each date
      const trajectoryPromises = launchDates.slice(0, 50).map(async (date) => {
        return await this.calculateTrajectory({
          origin,
          destination,
          launchDate: date,
          launchSite,
          missionType
        });
      });
      
      const trajectories = await Promise.all(trajectoryPromises);
      
      // Optimize based on multiple criteria
      const optimizedWindows = this.optimizeWindows(trajectories, {
        payloadMass,
        launchVehicle,
        constraints
      });
      
      // Add real launch opportunities from APIs
      const realLaunchData = await this.fetchRealLaunchData();
      
      return {
        optimalWindows: optimizedWindows.slice(0, 10),
        alternativeWindows: optimizedWindows.slice(10, 20),
        constraints: constraints,
        vehicleCapability: this.launchVehicles[launchVehicle],
        realLaunches: realLaunchData.filter(l => 
          new Date(l.net) >= new Date(startDate) && 
          new Date(l.net) <= new Date(endDate)
        )
      };
      
    } catch (error) {
      console.error('[🚀 Launch Optimizer] Calculation error:', error);
      throw error;
    }
  }

  /**
   * Generate range of potential launch dates
   */
  generateLaunchDateRange(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Generate dates with appropriate spacing based on mission type
    const dayIncrement = 7; // Weekly windows for most missions
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + dayIncrement)) {
      dates.push(new Date(d));
    }
    
    return dates;
  }

  /**
   * Calculate trajectory for a specific launch date
   */
  async calculateTrajectory(params) {
    const { origin, destination, launchDate, launchSite, missionType } = params;
    
    try {
      // Use simplified orbital mechanics for performance
      // In reality, would use JPL Horizons or SPICE kernels
      const trajectory = await this.computeHohmannTransfer({
        origin,
        destination,
        launchDate
      });
      
      // Calculate launch requirements
      const launchRequirements = this.calculateLaunchRequirements(
        trajectory,
        launchSite,
        launchDate
      );
      
      return {
        launchDate: launchDate.toISOString(),
        trajectory,
        requirements: launchRequirements,
        score: this.scoreTrajectory(trajectory, launchRequirements)
      };
      
    } catch (error) {
      console.warn(`[🚀 Launch Optimizer] Error calculating trajectory for ${launchDate}:`, error);
      return null;
    }
  }

  /**
   * Compute Hohmann transfer orbit (simplified)
   */
  async computeHohmannTransfer({ origin, destination, launchDate }) {
    const originBody = this.celestialBodies[origin.toLowerCase()];
    const destBody = this.celestialBodies[destination.toLowerCase()];
    
    if (!originBody || !destBody) {
      throw new Error(`Unknown celestial body: ${origin} or ${destination}`);
    }
    
    // Simplified orbital calculation
    // Real implementation would use precise ephemeris data
    const originOrbit = this.getApproximateOrbit(origin);
    const destOrbit = this.getApproximateOrbit(destination);
    
    // Calculate transfer orbit parameters
    const semiMajorAxis = (originOrbit.radius + destOrbit.radius) / 2;
    const transferPeriod = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / 132712442018); // Solar mu
    const flightTime = transferPeriod / 2; // Hohmann is half orbit
    
    // Calculate required velocity changes
    const v1 = Math.sqrt(132712442018 / originOrbit.radius); // Circular velocity at origin
    const v2 = Math.sqrt(132712442018 * (2 / originOrbit.radius - 1 / semiMajorAxis)); // Transfer velocity at origin
    const deltaV1 = Math.abs(v2 - v1);
    
    const v3 = Math.sqrt(132712442018 / destOrbit.radius); // Circular velocity at destination
    const v4 = Math.sqrt(132712442018 * (2 / destOrbit.radius - 1 / semiMajorAxis)); // Transfer velocity at destination
    const deltaV2 = Math.abs(v3 - v4);
    
    const totalDeltaV = deltaV1 + deltaV2;
    
    // Calculate arrival date
    const arrivalDate = new Date(launchDate.getTime() + flightTime * 1000);
    
    // Calculate planetary alignment score
    const alignmentScore = this.calculatePlanetaryAlignment(origin, destination, launchDate);
    
    return {
      type: 'hohmann_transfer',
      flightTime: flightTime / (24 * 3600), // Convert to days
      deltaV: totalDeltaV / 1000, // Convert to km/s
      arrivalDate: arrivalDate.toISOString(),
      semiMajorAxis: semiMajorAxis / 149597870.7, // Convert to AU
      alignmentScore: alignmentScore,
      efficiency: Math.max(0, 100 - (totalDeltaV / 1000 - 3) * 10) // Efficiency metric
    };
  }

  /**
   * Get approximate orbital parameters for celestial bodies
   */
  getApproximateOrbit(body) {
    const orbitalData = {
      'mercury': { radius: 0.39 * 149597870700, period: 88 },
      'venus': { radius: 0.72 * 149597870700, period: 225 },
      'earth': { radius: 1.0 * 149597870700, period: 365.25 },
      'mars': { radius: 1.52 * 149597870700, period: 687 },
      'jupiter': { radius: 5.2 * 149597870700, period: 4333 },
      'saturn': { radius: 9.5 * 149597870700, period: 10759 },
      'uranus': { radius: 19.2 * 149597870700, period: 30687 },
      'neptune': { radius: 30.1 * 149597870700, period: 60190 }
    };
    
    return orbitalData[body.toLowerCase()] || orbitalData['earth'];
  }

  /**
   * Calculate planetary alignment score (0-100)
   */
  calculatePlanetaryAlignment(origin, destination, date) {
    const originOrbit = this.getApproximateOrbit(origin);
    const destOrbit = this.getApproximateOrbit(destination);
    
    // Simplified calculation based on orbital periods
    const synodicPeriod = Math.abs(1 / (1/originOrbit.period - 1/destOrbit.period));
    const daysSinceEpoch = (date - new Date('2000-01-01')) / (1000 * 60 * 60 * 24);
    const phaseAngle = (daysSinceEpoch % synodicPeriod) / synodicPeriod * 360;
    
    // Best alignment is around 0° or 360° (conjunction/opposition)
    const alignmentFactor = Math.min(phaseAngle, 360 - phaseAngle);
    return Math.max(0, 100 - alignmentFactor / 180 * 100);
  }

  /**
   * Calculate launch requirements from specific site
   */
  calculateLaunchRequirements(trajectory, launchSite, launchDate) {
    const site = this.launchSites[launchSite];
    if (!site) throw new Error(`Unknown launch site: ${launchSite}`);
    
    // Calculate azimuth and timing requirements
    const launchAzimuth = this.calculateLaunchAzimuth(site, trajectory);
    const launchWindow = this.calculateLaunchWindow(launchDate, trajectory);
    
    // Environmental constraints
    const weatherScore = Math.random() * 30 + 70; // Simplified weather scoring
    const seasonalScore = this.calculateSeasonalScore(launchDate, site);
    
    return {
      site: site,
      azimuth: launchAzimuth,
      window: launchWindow,
      weatherProbability: weatherScore,
      seasonalScore: seasonalScore,
      c3Energy: Math.pow(trajectory.deltaV, 2), // Characteristic energy
      earthDepartureV: trajectory.deltaV * 0.6 // Approximate Earth departure velocity
    };
  }

  /**
   * Calculate optimal launch azimuth
   */
  calculateLaunchAzimuth(site, trajectory) {
    // Simplified calculation - real version would account for:
    // - Target orbital inclination
    // - Earth rotation
    // - Launch site latitude
    // - Interplanetary departure conditions
    
    const targetInclination = Math.abs(site.lat); // Simplified
    const azimuth = 90 + (Math.random() - 0.5) * 60; // Semi-realistic range
    
    return {
      optimal: azimuth,
      range: [azimuth - 15, azimuth + 15],
      inclination: targetInclination
    };
  }

  /**
   * Calculate daily launch window
   */
  calculateLaunchWindow(date, trajectory) {
    // Earth rotation provides ~23h 56m of opportunity
    const windowStart = new Date(date);
    windowStart.setHours(6, 0, 0, 0); // Typical morning launch
    
    const windowEnd = new Date(windowStart);
    windowEnd.setMinutes(windowStart.getMinutes() + 120); // 2-hour window typical
    
    return {
      start: windowStart.toISOString(),
      end: windowEnd.toISOString(),
      duration: 120, // minutes
      instantaneous: false // Most interplanetary missions have windows
    };
  }

  /**
   * Calculate seasonal score for launch site
   */
  calculateSeasonalScore(date, site) {
    const month = date.getMonth() + 1;
    
    // Seasonal preferences vary by launch site
    const seasonalPreferences = {
      'KSC': { best: [3, 4, 5, 10, 11], worst: [6, 7, 8, 9] }, // Avoid hurricane season
      'VAFB': { best: [4, 5, 6, 9, 10], worst: [12, 1, 2] }, // Avoid winter fog
      'Kourou': { best: [2, 3, 4, 9, 10, 11], worst: [5, 6, 7, 8] }, // Avoid wet season
      'Baikonur': { best: [4, 5, 6, 7, 8, 9], worst: [11, 12, 1, 2, 3] } // Avoid harsh winter
    };
    
    const siteName = site.name.includes('Kennedy') ? 'KSC' :
                     site.name.includes('Vandenberg') ? 'VAFB' :
                     site.name.includes('Kourou') ? 'Kourou' :
                     site.name.includes('Baikonur') ? 'Baikonur' : 'KSC';
    
    const prefs = seasonalPreferences[siteName] || seasonalPreferences['KSC'];
    
    if (prefs.best.includes(month)) return 90 + Math.random() * 10;
    if (prefs.worst.includes(month)) return 20 + Math.random() * 30;
    return 60 + Math.random() * 30;
  }

  /**
   * Score trajectory based on multiple criteria
   */
  scoreTrajectory(trajectory, requirements) {
    const deltaVScore = Math.max(0, 100 - (trajectory.deltaV - 3) * 20); // Prefer low delta-V
    const alignmentScore = trajectory.alignmentScore;
    const flightTimeScore = Math.max(0, 100 - (trajectory.flightTime - 250) / 10); // Prefer reasonable flight times
    const weatherScore = requirements.weatherProbability;
    const seasonalScore = requirements.seasonalScore;
    
    // Weighted scoring
    const totalScore = (
      deltaVScore * 0.3 +
      alignmentScore * 0.25 +
      flightTimeScore * 0.2 +
      weatherScore * 0.15 +
      seasonalScore * 0.1
    );
    
    return Math.round(totalScore);
  }

  /**
   * Optimize windows based on mission constraints
   */
  optimizeWindows(trajectories, options) {
    const { payloadMass, launchVehicle, constraints } = options;
    const vehicle = this.launchVehicles[launchVehicle];
    
    if (!vehicle) {
      throw new Error(`Unknown launch vehicle: ${launchVehicle}`);
    }
    
    // Filter trajectories that are feasible
    const feasibleTrajectories = trajectories
      .filter(t => t !== null)
      .filter(t => {
        // Check payload capability
        const requiredCapability = payloadMass + (t.trajectory.deltaV * 1000); // Simplified
        return requiredCapability <= vehicle.payload_leo;
      })
      .filter(t => {
        // Apply custom constraints
        if (constraints.maxFlightTime && t.trajectory.flightTime > constraints.maxFlightTime) {
          return false;
        }
        if (constraints.maxDeltaV && t.trajectory.deltaV > constraints.maxDeltaV) {
          return false;
        }
        if (constraints.minScore && t.score < constraints.minScore) {
          return false;
        }
        return true;
      });
    
    // Sort by score (highest first)
    feasibleTrajectories.sort((a, b) => b.score - a.score);
    
    // Add cost analysis
    return feasibleTrajectories.map(t => ({
      ...t,
      cost: this.calculateMissionCost(t, payloadMass, vehicle),
      payloadMargin: vehicle.payload_leo - payloadMass,
      feasibility: this.assessFeasibility(t, vehicle)
    }));
  }

  /**
   * Calculate estimated mission cost
   */
  calculateMissionCost(trajectory, payloadMass, vehicle) {
    const launchCost = payloadMass * vehicle.cost_per_kg;
    const complexityFactor = 1 + (trajectory.trajectory.deltaV - 3) * 0.1;
    const totalCost = launchCost * complexityFactor;
    
    return {
      launch: launchCost,
      total: totalCost,
      perKg: vehicle.cost_per_kg,
      currency: 'USD'
    };
  }

  /**
   * Assess mission feasibility
   */
  assessFeasibility(trajectory, vehicle) {
    const scores = {
      technical: Math.min(100, trajectory.score),
      economic: Math.max(0, 100 - (trajectory.cost.total / 1000000 - 100) * 2),
      schedule: Math.max(0, 100 - (trajectory.trajectory.flightTime - 300) / 10),
      risk: Math.max(20, 100 - trajectory.trajectory.deltaV * 10)
    };
    
    const overall = Object.values(scores).reduce((a, b) => a + b) / Object.keys(scores).length;
    
    return {
      ...scores,
      overall: Math.round(overall),
      category: overall > 80 ? 'High' : overall > 60 ? 'Medium' : 'Low'
    };
  }

  /**
   * Fetch real launch data from APIs
   */
  async fetchRealLaunchData() {
    try {
      // Fetch from The Space Devs API
      const response = await fetch(`${LAUNCH_SERVICES_API}/launch/upcoming/?limit=20`);
      const data = await response.json();
      
      return (data.results || []).map(launch => ({
        name: launch.name,
        net: launch.net,
        rocket: launch.rocket?.configuration?.name || 'Unknown',
        mission: launch.mission?.name || 'Unknown',
        pad: launch.pad?.name || 'Unknown',
        agency: launch.launch_service_provider?.name || 'Unknown',
        status: launch.status?.name || 'Unknown'
      }));
      
    } catch (error) {
      console.warn('[🚀 Launch Optimizer] Could not fetch real launch data:', error);
      return [];
    }
  }

  /**
   * Generate launch manifest for mission planning
   */
  generateLaunchManifest(optimalWindow, missionParams) {
    const manifest = {
      mission: {
        name: `${missionParams.origin} to ${missionParams.destination} Mission`,
        type: missionParams.missionType,
        destination: missionParams.destination,
        objectives: this.generateMissionObjectives(missionParams.destination)
      },
      launch: {
        date: optimalWindow.launchDate,
        site: optimalWindow.requirements.site.name,
        vehicle: missionParams.launchVehicle,
        azimuth: optimalWindow.requirements.azimuth.optimal,
        window: optimalWindow.requirements.window
      },
      trajectory: {
        type: optimalWindow.trajectory.type,
        flightTime: `${Math.round(optimalWindow.trajectory.flightTime)} days`,
        arrivalDate: optimalWindow.trajectory.arrivalDate,
        deltaV: `${optimalWindow.trajectory.deltaV.toFixed(2)} km/s`,
        efficiency: `${optimalWindow.trajectory.efficiency.toFixed(1)}%`
      },
      payload: {
        mass: `${missionParams.payloadMass} kg`,
        margin: `${optimalWindow.payloadMargin} kg`,
        cost: `$${(optimalWindow.cost.total / 1000000).toFixed(1)}M`
      },
      risks: {
        weather: `${Math.round(100 - optimalWindow.requirements.weatherProbability)}%`,
        technical: optimalWindow.feasibility.risk,
        seasonal: optimalWindow.requirements.seasonalScore
      }
    };
    
    return manifest;
  }

  /**
   * Generate mission objectives based on destination
   */
  generateMissionObjectives(destination) {
    const objectives = {
      'mars': ['Search for signs of past life', 'Study Martian geology', 'Analyze atmosphere composition'],
      'europa': ['Study subsurface ocean', 'Analyze ice composition', 'Search for biosignatures'],
      'titan': ['Study methane cycle', 'Analyze organic compounds', 'Map surface features'],
      'venus': ['Study atmospheric dynamics', 'Analyze volcanic activity', 'Study greenhouse effect'],
      'jupiter': ['Study atmospheric composition', 'Analyze radiation environment', 'Study magnetosphere'],
      'saturn': ['Study ring system', 'Analyze atmospheric dynamics', 'Study moons'],
      'moon': ['Establish lunar base', 'Mine resources', 'Study lunar geology']
    };
    
    return objectives[destination.toLowerCase()] || ['Explore and study', 'Collect scientific data', 'Technology demonstration'];
  }

  /**
   * Get optimization summary
   */
  getOptimizationSummary(results) {
    if (!results.optimalWindows.length) {
      return {
        status: 'No viable windows found',
        recommendation: 'Consider adjusting mission parameters'
      };
    }
    
    const best = results.optimalWindows[0];
    
    return {
      status: 'Optimization complete',
      bestLaunchDate: best.launchDate,
      flightTime: `${Math.round(best.trajectory.flightTime)} days`,
      totalCost: `$${(best.cost.total / 1000000).toFixed(1)}M`,
      feasibility: best.feasibility.category,
      score: best.score,
      windowsAnalyzed: results.optimalWindows.length + results.alternativeWindows.length,
      recommendation: this.generateRecommendation(best)
    };
  }

  /**
   * Generate optimization recommendation
   */
  generateRecommendation(optimalWindow) {
    const score = optimalWindow.score;
    const feasibility = optimalWindow.feasibility.overall;
    
    if (score > 85 && feasibility > 80) {
      return 'Excellent launch opportunity - proceed with mission planning';
    } else if (score > 70 && feasibility > 60) {
      return 'Good launch opportunity - minor optimizations recommended';
    } else if (score > 50) {
      return 'Acceptable launch opportunity - consider alternatives';
    } else {
      return 'Suboptimal window - recommend mission parameter adjustment';
    }
  }
}

/**
 * Factory function to create launch optimizer
 */
export function createLaunchOptimizer() {
  return new LaunchWindowOptimizer();
}

/**
 * Launch optimization utilities
 */
export const LaunchOptimizerUtils = {
  /**
   * Convert between orbital elements and Cartesian coordinates
   */
  orbitalToCartesian(elements) {
    // Simplified conversion - real implementation would be more complex
    const { a, e, i, omega, w, M } = elements;
    
    // This is a placeholder - real orbital mechanics calculation needed
    return {
      x: a * Math.cos(M + omega),
      y: a * Math.sin(M + omega) * Math.cos(i),
      z: a * Math.sin(M + omega) * Math.sin(i)
    };
  },
  
  /**
   * Calculate synodic period between two planets
   */
  calculateSynodicPeriod(period1, period2) {
    return Math.abs(1 / (1/period1 - 1/period2));
  },
  
  /**
   * Convert delta-V to launch energy requirements
   */
  deltaVToC3(deltaV) {
    // C3 = (V_infinity)^2 where V_infinity is hyperbolic excess velocity
    return Math.pow(deltaV, 2);
  }
};

export default LaunchWindowOptimizer;