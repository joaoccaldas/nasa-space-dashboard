// CaldaSpace - Space Weather Monitoring Module
// Real-time solar activity, geomagnetic storms, and aurora predictions

const SPACE_WEATHER_APIS = {
    NOAA: {
        solar_wind: 'https://services.swpc.noaa.gov/products/solar-wind/plasma-2-hour.json',
        geomagnetic: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
        solar_flares: 'https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json',
        aurora_forecast: 'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json'
    },
    NASA: {
        donki_api: 'https://api.nasa.gov/DONKI',
        solar_events: '/FLR', // Solar Flare events
        cme_events: '/CME', // Coronal Mass Ejection events
        geomagnetic_events: '/GST' // Geomagnetic Storm events
    }
};

/**
 * Fetch current space weather conditions
 * @param {string} apiKey - NASA API key
 * @returns {Promise<Object>} Space weather data
 */
export async function fetchSpaceWeatherData(apiKey = 'DEMO_KEY') {
    console.log('Fetching space weather data...');
    
    try {
        // Fetch multiple space weather data sources in parallel
        const [solarWindData, geomagneticData, solarFlareData, auroraData] = await Promise.allSettled([
            fetchSolarWindData(),
            fetchGeomagneticData(),
            fetchSolarFlareData(apiKey),
            fetchAuroraForecast()
        ]);
        
        return {
            solarWind: solarWindData.status === 'fulfilled' ? solarWindData.value : getMockSolarWindData(),
            geomagnetic: geomagneticData.status === 'fulfilled' ? geomagneticData.value : getMockGeomagneticData(),
            solarFlares: solarFlareData.status === 'fulfilled' ? solarFlareData.value : getMockSolarFlareData(),
            aurora: auroraData.status === 'fulfilled' ? auroraData.value : getMockAuroraData(),
            timestamp: new Date().toISOString(),
            status: {
                solarWind: solarWindData.status === 'fulfilled',
                geomagnetic: geomagneticData.status === 'fulfilled',
                solarFlares: solarFlareData.status === 'fulfilled',
                aurora: auroraData.status === 'fulfilled'
            }
        };
        
    } catch (error) {
        console.error('Error fetching space weather data:', error);
        return getMockSpaceWeatherData();
    }
}

/**
 * Fetch solar wind data from NOAA
 * @returns {Promise<Object>} Solar wind conditions
 */
async function fetchSolarWindData() {
    try {
        const response = await fetch(SPACE_WEATHER_APIS.NOAA.solar_wind);
        const data = await response.json();
        
        // Get latest data point
        const latest = data[data.length - 1];
        
        return {
            speed: parseFloat(latest[1]), // km/s
            density: parseFloat(latest[2]), // protons/cm³
            temperature: parseFloat(latest[3]), // K
            timestamp: latest[0],
            condition: getSolarWindCondition(parseFloat(latest[1]))
        };
        
    } catch (error) {
        console.error('Error fetching solar wind data:', error);
        throw error;
    }
}

/**
 * Fetch geomagnetic data from NOAA
 * @returns {Promise<Object>} Geomagnetic conditions
 */
async function fetchGeomagneticData() {
    try {
        const response = await fetch(SPACE_WEATHER_APIS.NOAA.geomagnetic);
        const data = await response.json();
        
        // Get latest K-index
        const latest = data[data.length - 1];
        const kIndex = parseFloat(latest[1]);
        
        return {
            kIndex: kIndex,
            timestamp: latest[0],
            condition: getGeomagneticCondition(kIndex),
            stormLevel: getStormLevel(kIndex)
        };
        
    } catch (error) {
        console.error('Error fetching geomagnetic data:', error);
        throw error;
    }
}

/**
 * Fetch solar flare data from NASA DONKI
 * @param {string} apiKey - NASA API key
 * @returns {Promise<Array>} Recent solar flare events
 */
async function fetchSolarFlareData(apiKey) {
    try {
        // Get events from last 7 days
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const url = `${SPACE_WEATHER_APIS.NASA.donki_api}${SPACE_WEATHER_APIS.NASA.solar_events}?startDate=${startDate}&endDate=${endDate}&api_key=${apiKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('NASA DONKI API error');
        }
        
        const data = await response.json();
        
        return data.slice(0, 10).map(event => ({
            flareID: event.flrID,
            beginTime: event.beginTime,
            peakTime: event.peakTime,
            classType: event.classType,
            sourceLocation: event.sourceLocation,
            activeRegionNum: event.activeRegionNum,
            linkedEvents: event.linkedEvents,
            instruments: event.instruments?.map(inst => inst.displayName)
        }));
        
    } catch (error) {
        console.error('Error fetching solar flare data:', error);
        throw error;
    }
}

/**
 * Fetch aurora forecast data
 * @returns {Promise<Object>} Aurora prediction
 */
async function fetchAuroraForecast() {
    try {
        const response = await fetch(SPACE_WEATHER_APIS.NOAA.aurora_forecast);
        const data = await response.json();
        
        return {
            forecastTime: data.Forecast_Time,
            coordinates: data.coordinates,
            visibility: getAuroraVisibility(data),
            kpIndex: data.kp_index || 3 // Default if not available
        };
        
    } catch (error) {
        console.error('Error fetching aurora forecast:', error);
        throw error;
    }
}

/**
 * Determine solar wind condition based on speed
 * @param {number} speed - Solar wind speed in km/s
 * @returns {string} Condition description
 */
function getSolarWindCondition(speed) {
    if (speed < 300) return 'Slow';
    if (speed < 500) return 'Normal';
    if (speed < 700) return 'Fast';
    return 'Very Fast';
}

/**
 * Determine geomagnetic condition based on K-index
 * @param {number} kIndex - Planetary K-index
 * @returns {string} Condition description
 */
function getGeomagneticCondition(kIndex) {
    if (kIndex < 3) return 'Quiet';
    if (kIndex < 4) return 'Unsettled';
    if (kIndex < 5) return 'Active';
    if (kIndex < 6) return 'Minor Storm';
    if (kIndex < 7) return 'Moderate Storm';
    if (kIndex < 8) return 'Strong Storm';
    if (kIndex < 9) return 'Severe Storm';
    return 'Extreme Storm';
}

/**
 * Determine storm level for visualization
 * @param {number} kIndex - Planetary K-index
 * @returns {string} Storm level
 */
function getStormLevel(kIndex) {
    if (kIndex < 5) return 'normal';
    if (kIndex < 6) return 'minor';
    if (kIndex < 7) return 'moderate';
    if (kIndex < 8) return 'strong';
    return 'severe';
}

/**
 * Determine aurora visibility potential
 * @param {Object} auroraData - Aurora forecast data
 * @returns {string} Visibility description
 */
function getAuroraVisibility(auroraData) {
    // Simplified aurora visibility calculation
    const kp = auroraData.kp_index || 3;
    
    if (kp < 3) return 'Minimal - High latitudes only';
    if (kp < 5) return 'Moderate - Northern regions';
    if (kp < 7) return 'Good - Mid-latitudes possible';
    return 'Excellent - Visible at lower latitudes';
}

/**
 * Generate mock space weather data for fallback
 * @returns {Object} Mock space weather information
 */
function getMockSpaceWeatherData() {
    console.log('Generating mock space weather data...');
    
    return {
        solarWind: getMockSolarWindData(),
        geomagnetic: getMockGeomagneticData(),
        solarFlares: getMockSolarFlareData(),
        aurora: getMockAuroraData(),
        timestamp: new Date().toISOString(),
        status: {
            solarWind: false,
            geomagnetic: false,
            solarFlares: false,
            aurora: false
        }
    };
}

function getMockSolarWindData() {
    const speed = 300 + Math.random() * 400; // 300-700 km/s
    return {
        speed: speed,
        density: 5 + Math.random() * 10, // 5-15 protons/cm³
        temperature: 100000 + Math.random() * 200000, // 100k-300k K
        timestamp: new Date().toISOString(),
        condition: getSolarWindCondition(speed)
    };
}

function getMockGeomagneticData() {
    const kIndex = Math.random() * 9; // 0-9
    return {
        kIndex: kIndex,
        timestamp: new Date().toISOString(),
        condition: getGeomagneticCondition(kIndex),
        stormLevel: getStormLevel(kIndex)
    };
}

function getMockSolarFlareData() {
    const flareClasses = ['A', 'B', 'C', 'M', 'X'];
    const mockFlares = [];
    
    for (let i = 0; i < 5; i++) {
        const daysAgo = Math.random() * 7;
        const flareTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        const flareClass = flareClasses[Math.floor(Math.random() * flareClasses.length)];
        const magnitude = (Math.random() * 9 + 1).toFixed(1);
        
        mockFlares.push({
            flareID: `FLR-${Date.now()}-${i}`,
            beginTime: flareTime.toISOString(),
            peakTime: new Date(flareTime.getTime() + Math.random() * 3600000).toISOString(),
            classType: `${flareClass}${magnitude}`,
            sourceLocation: `S${Math.floor(Math.random() * 40)}E${Math.floor(Math.random() * 80)}`,
            activeRegionNum: Math.floor(Math.random() * 3000 + 1000),
            linkedEvents: [],
            instruments: ['GOES-16', 'SDO']
        });
    }
    
    return mockFlares;
}

function getMockAuroraData() {
    return {
        forecastTime: new Date().toISOString(),
        coordinates: [], // Simplified for demo
        visibility: getAuroraVisibility({ kp_index: Math.random() * 9 }),
        kpIndex: Math.random() * 9
    };
}

/**
 * Get space weather alert level
 * @param {Object} weatherData - Space weather data
 * @returns {Object} Alert information
 */
export function getSpaceWeatherAlerts(weatherData) {
    const alerts = [];
    
    // Check for high solar wind speeds
    if (weatherData.solarWind.speed > 600) {
        alerts.push({
            type: 'solar_wind',
            level: 'warning',
            message: `High solar wind speed: ${weatherData.solarWind.speed.toFixed(0)} km/s`,
            impact: 'Potential satellite and communication disruptions'
        });
    }
    
    // Check for geomagnetic storms
    if (weatherData.geomagnetic.kIndex >= 5) {
        alerts.push({
            type: 'geomagnetic',
            level: weatherData.geomagnetic.kIndex >= 7 ? 'severe' : 'moderate',
            message: `Geomagnetic storm in progress (K-index: ${weatherData.geomagnetic.kIndex.toFixed(1)})`,
            impact: 'Aurora visible at lower latitudes, possible radio blackouts'
        });
    }
    
    // Check for recent major solar flares
    const majorFlares = weatherData.solarFlares.filter(flare => 
        flare.classType.startsWith('M') || flare.classType.startsWith('X')
    );
    
    if (majorFlares.length > 0) {
        const latestFlare = majorFlares[0];
        alerts.push({
            type: 'solar_flare',
            level: latestFlare.classType.startsWith('X') ? 'severe' : 'moderate',
            message: `Major solar flare detected: ${latestFlare.classType}`,
            impact: 'Possible radio blackouts and satellite interference'
        });
    }
    
    return {
        alertLevel: alerts.length === 0 ? 'normal' : alerts.some(a => a.level === 'severe') ? 'severe' : 'moderate',
        alerts: alerts,
        summary: alerts.length === 0 ? 'No current space weather alerts' : `${alerts.length} active space weather alert(s)`
    };
}

/**
 * Format space weather data for display
 * @param {Object} weatherData - Raw space weather data
 * @returns {Object} Formatted display data
 */
export function formatSpaceWeatherData(weatherData) {
    return {
        solarWind: {
            title: '🌞 Solar Wind',
            speed: `${weatherData.solarWind.speed.toFixed(0)} km/s`,
            density: `${weatherData.solarWind.density.toFixed(1)} p/cm³`,
            temperature: `${(weatherData.solarWind.temperature / 1000).toFixed(0)}k K`,
            condition: weatherData.solarWind.condition,
            status: weatherData.solarWind.condition === 'Very Fast' ? 'warning' : 'normal'
        },
        geomagnetic: {
            title: '🧲 Geomagnetic Field',
            kIndex: weatherData.geomagnetic.kIndex.toFixed(1),
            condition: weatherData.geomagnetic.condition,
            stormLevel: weatherData.geomagnetic.stormLevel,
            status: weatherData.geomagnetic.kIndex >= 5 ? 'warning' : 'normal'
        },
        solarFlares: {
            title: '⚡ Solar Flares (7 days)',
            count: weatherData.solarFlares.length,
            latest: weatherData.solarFlares[0] || null,
            majorFlares: weatherData.solarFlares.filter(f => f.classType.startsWith('M') || f.classType.startsWith('X')).length,
            status: weatherData.solarFlares.some(f => f.classType.startsWith('X')) ? 'severe' : 
                   weatherData.solarFlares.some(f => f.classType.startsWith('M')) ? 'warning' : 'normal'
        },
        aurora: {
            title: '🌌 Aurora Forecast',
            visibility: weatherData.aurora.visibility,
            kpIndex: weatherData.aurora.kpIndex.toFixed(1),
            status: weatherData.aurora.kpIndex >= 5 ? 'good' : 'normal'
        }
    };
}

/**
 * Get space weather impact on technology
 * @param {Object} weatherData - Space weather data
 * @returns {Object} Technology impact assessment
 */
export function getSpaceWeatherImpacts(weatherData) {
    const impacts = {
        satellites: 'Normal',
        communications: 'Normal',
        navigation: 'Normal',
        powerGrids: 'Normal',
        aviation: 'Normal'
    };
    
    // High solar wind impacts
    if (weatherData.solarWind.speed > 600) {
        impacts.satellites = 'Possible drag increase';
        impacts.communications = 'Minor disruptions possible';
    }
    
    // Geomagnetic storm impacts
    if (weatherData.geomagnetic.kIndex >= 5) {
        impacts.satellites = 'Surface charging risk';
        impacts.navigation = 'GPS accuracy reduced';
        impacts.powerGrids = 'Voltage irregularities possible';
        impacts.aviation = 'HF radio blackouts at polar routes';
    }
    
    if (weatherData.geomagnetic.kIndex >= 7) {
        impacts.satellites = 'High risk of anomalies';
        impacts.powerGrids = 'Grid instabilities possible';
        impacts.communications = 'HF radio propagation affected';
    }
    
    return impacts;
}

export { SPACE_WEATHER_APIS };