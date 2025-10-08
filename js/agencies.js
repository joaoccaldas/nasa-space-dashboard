// CaldaSpace - Multi-Agency Integration Module
// Real-time data from NASA, ESA, SpaceX, and ISS tracking

// API Endpoints for various space agencies
const AGENCY_APIS = {
    ISS: {
        position: 'http://api.open-notify.org/iss-now.json',
        people: 'http://api.open-notify.org/astros.json',
        passes: 'http://api.open-notify.org/iss-pass.json'
    },
    SPACEX: {
        launches: 'https://api.spacexdata.com/v4/launches',
        rockets: 'https://api.spacexdata.com/v4/rockets',
        starlink: 'https://api.spacexdata.com/v4/starlink',
        company: 'https://api.spacexdata.com/v4/company'
    },
    ESA: {
        // Note: ESA doesn't have a public REST API, using mock data
        missions: 'mock',
        news: 'mock'
    },
    SATELLITES: {
        tracking: 'https://api.n2yo.com/rest/v1/satellite',
        tle: 'https://celestrak.com/NORAD/elements'
    }
};

/**
 * Fetch current ISS position and crew information
 * @returns {Promise<Object>} ISS data with position and crew
 */
export async function fetchISSData() {
    console.log('Fetching ISS real-time data...');
    
    try {
        // Fetch ISS position
        const positionResponse = await fetch(AGENCY_APIS.ISS.position);
        const positionData = await positionResponse.json();
        
        // Fetch people in space
        const peopleResponse = await fetch(AGENCY_APIS.ISS.people);
        const peopleData = await peopleResponse.json();
        
        // Calculate ISS 3D position for visualization
        const lat = positionData.iss_position.latitude;
        const lon = positionData.iss_position.longitude;
        const altitude = 408; // ISS average altitude in km
        
        // Convert to 3D coordinates (Earth radius = 6371 km)
        const earthRadius = 6371;
        const totalRadius = earthRadius + altitude;
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180;
        
        const x = totalRadius * Math.cos(latRad) * Math.cos(lonRad);
        const y = totalRadius * Math.cos(latRad) * Math.sin(lonRad);
        const z = totalRadius * Math.sin(latRad);
        
        const enhancedISSData = {
            position: {
                latitude: parseFloat(lat),
                longitude: parseFloat(lon),
                altitude: altitude,
                timestamp: positionData.timestamp
            },
            position3D: {
                x: x / 100, // Scale for Three.js scene
                y: y / 100,
                z: z / 100
            },
            crew: peopleData.people.filter(person => person.craft === 'ISS'),
            totalPeopleInSpace: peopleData.number,
            velocity: 27600, // km/h approximate
            orbitalPeriod: 93, // minutes
            sourceLinks: {
                iss_tracker: 'https://www.nasa.gov/live/',
                crew_info: 'https://www.nasa.gov/audience/forstudents/5-8/features/nasa-knows/who-is-on-iss.html',
                live_stream: 'https://www.nasa.gov/live/'
            }
        };
        
        console.log('ISS data fetched successfully');
        return enhancedISSData;
        
    } catch (error) {
        console.error('Error fetching ISS data:', error);
        return getMockISSData();
    }
}

/**
 * Fetch SpaceX launch and mission data
 * @param {number} limit - Number of launches to fetch
 * @returns {Promise<Object>} SpaceX data
 */
export async function fetchSpaceXData(limit = 10) {
    console.log('Fetching SpaceX data...');
    
    try {
        // Fetch recent launches
        const launchesResponse = await fetch(`${AGENCY_APIS.SPACEX.launches}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: {},
                options: {
                    sort: { date_utc: -1 },
                    limit: limit,
                    populate: ['rocket', 'crew', 'payloads']
                }
            })
        });
        
        const launchesData = await launchesResponse.json();
        
        // Fetch company info
        const companyResponse = await fetch(AGENCY_APIS.SPACEX.company);
        const companyData = await companyResponse.json();
        
        const enhancedSpaceXData = {
            recentLaunches: launchesData.docs.map(launch => ({
                id: launch.id,
                name: launch.name,
                date: launch.date_utc,
                success: launch.success,
                rocket: launch.rocket?.name || 'Unknown',
                mission: launch.details || 'Mission details unavailable',
                patch: launch.links?.patch?.small,
                webcast: launch.links?.webcast,
                article: launch.links?.article,
                sourceLinks: {
                    spacex_page: `https://www.spacex.com/launches/${launch.id}`,
                    webcast: launch.links?.webcast,
                    article: launch.links?.article
                }
            })),
            company: {
                name: companyData.name,
                founder: companyData.founder,
                founded: companyData.founded,
                employees: companyData.employees,
                vehicles: companyData.vehicles,
                launch_sites: companyData.launch_sites,
                valuation: companyData.valuation
            },
            sourceLinks: {
                spacex_main: 'https://www.spacex.com/',
                api_docs: 'https://docs.spacexdata.com/'
            }
        };
        
        console.log(`Fetched ${enhancedSpaceXData.recentLaunches.length} SpaceX launches`);
        return enhancedSpaceXData;
        
    } catch (error) {
        console.error('Error fetching SpaceX data:', error);
        return getMockSpaceXData();
    }
}

/**
 * Fetch ESA (European Space Agency) mission data
 * @returns {Promise<Object>} ESA mission information
 */
export async function fetchESAData() {
    console.log('Fetching ESA data...');
    
    // ESA doesn't have a public REST API, so using curated data
    return {
        activeMissions: [
            {
                name: 'Gaia',
                description: 'Creating the most accurate 3D map of the Milky Way',
                status: 'Active',
                launchDate: '2013-12-19',
                missionType: 'Astronomy',
                url: 'https://www.esa.int/Science_Exploration/Space_Science/Gaia'
            },
            {
                name: 'BepiColombo',
                description: 'Joint mission to Mercury with JAXA',
                status: 'En Route',
                launchDate: '2018-10-20',
                missionType: 'Planetary',
                url: 'https://www.esa.int/Science_Exploration/Space_Science/BepiColombo'
            },
            {
                name: 'Solar Orbiter',
                description: 'Studying the Sun from unprecedented close distances',
                status: 'Active',
                launchDate: '2020-02-10',
                missionType: 'Solar Physics',
                url: 'https://www.esa.int/Science_Exploration/Space_Science/Solar_Orbiter'
            },
            {
                name: 'Euclid',
                description: 'Investigating dark matter and dark energy',
                status: 'Active',
                launchDate: '2023-07-01',
                missionType: 'Cosmology',
                url: 'https://www.esa.int/Science_Exploration/Space_Science/Euclid'
            },
            {
                name: 'JUICE',
                description: 'JUpiter ICy moons Explorer',
                status: 'En Route',
                launchDate: '2023-04-14',
                missionType: 'Outer Planets',
                url: 'https://www.esa.int/Science_Exploration/Space_Science/JUICE'
            }
        ],
        upcomingMissions: [
            {
                name: 'PLATO',
                description: 'PLAnetary Transits and Oscillations of stars',
                plannedLaunch: '2026',
                missionType: 'Exoplanets',
                url: 'https://www.esa.int/Science_Exploration/Space_Science/PLATO'
            },
            {
                name: 'Ariel',
                description: 'Atmospheric Remote-sensing Infrared Exoplanet Large-survey',
                plannedLaunch: '2029',
                missionType: 'Exoplanets',
                url: 'https://www.esa.int/Science_Exploration/Space_Science/Ariel'
            }
        ],
        sourceLinks: {
            esa_main: 'https://www.esa.int/',
            science_missions: 'https://www.esa.int/Science_Exploration',
            mission_status: 'https://www.esa.int/Science_Exploration/Space_Science'
        }
    };
}

/**
 * Get comprehensive space agency status
 * @returns {Promise<Object>} Multi-agency data summary
 */
export async function fetchMultiAgencyStatus() {
    console.log('Fetching multi-agency status...');
    
    try {
        const [issData, spacexData, esaData] = await Promise.allSettled([
            fetchISSData(),
            fetchSpaceXData(5),
            fetchESAData()
        ]);
        
        return {
            iss: issData.status === 'fulfilled' ? issData.value : getMockISSData(),
            spacex: spacexData.status === 'fulfilled' ? spacexData.value : getMockSpaceXData(),
            esa: esaData.status === 'fulfilled' ? esaData.value : null,
            lastUpdated: new Date().toISOString(),
            status: {
                iss: issData.status === 'fulfilled',
                spacex: spacexData.status === 'fulfilled', 
                esa: esaData.status === 'fulfilled'
            }
        };
        
    } catch (error) {
        console.error('Error fetching multi-agency data:', error);
        return {
            error: 'Failed to fetch agency data',
            message: error.message
        };
    }
}

/**
 * Mock ISS data for fallback
 * @returns {Object} Mock ISS information
 */
function getMockISSData() {
    const mockLat = (Math.random() - 0.5) * 180;
    const mockLon = (Math.random() - 0.5) * 360;
    const altitude = 408;
    
    return {
        position: {
            latitude: mockLat,
            longitude: mockLon,
            altitude: altitude,
            timestamp: Math.floor(Date.now() / 1000)
        },
        position3D: {
            x: Math.cos(mockLat * Math.PI / 180) * Math.cos(mockLon * Math.PI / 180) * 70,
            y: Math.cos(mockLat * Math.PI / 180) * Math.sin(mockLon * Math.PI / 180) * 70,
            z: Math.sin(mockLat * Math.PI / 180) * 70
        },
        crew: [
            { name: 'NASA Astronaut 1', craft: 'ISS' },
            { name: 'ESA Astronaut 1', craft: 'ISS' },
            { name: 'Roscosmos Cosmonaut 1', craft: 'ISS' }
        ],
        totalPeopleInSpace: 7,
        velocity: 27600,
        orbitalPeriod: 93,
        sourceLinks: {
            iss_tracker: 'https://www.nasa.gov/live/',
            crew_info: 'https://www.nasa.gov/audience/forstudents/5-8/features/nasa-knows/who-is-on-iss.html'
        }
    };
}

/**
 * Mock SpaceX data for fallback
 * @returns {Object} Mock SpaceX information
 */
function getMockSpaceXData() {
    return {
        recentLaunches: [
            {
                id: 'mock_1',
                name: 'Starlink 6-25',
                date: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
                success: true,
                rocket: 'Falcon 9',
                mission: 'Starlink satellite deployment mission',
                sourceLinks: {
                    spacex_page: 'https://www.spacex.com/launches/'
                }
            },
            {
                id: 'mock_2', 
                name: 'Crew-8 Dragon',
                date: new Date(Date.now() - 86400000 * 7).toISOString(), // 1 week ago
                success: true,
                rocket: 'Falcon Heavy',
                mission: 'Crew rotation mission to International Space Station',
                sourceLinks: {
                    spacex_page: 'https://www.spacex.com/launches/'
                }
            }
        ],
        company: {
            name: 'Space Exploration Technologies Corp.',
            founder: 'Elon Musk',
            founded: 2002,
            employees: 12000,
            vehicles: 4,
            launch_sites: 3,
            valuation: 180000000000
        },
        sourceLinks: {
            spacex_main: 'https://www.spacex.com/',
            api_docs: 'https://docs.spacexdata.com/'
        }
    };
}

/**
 * Calculate ISS pass predictions for a given location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} alt - Altitude in meters
 * @returns {Promise<Array>} Pass prediction data
 */
export async function fetchISSPasses(lat, lon, alt = 0) {
    try {
        const url = `${AGENCY_APIS.ISS.passes}?lat=${lat}&lon=${lon}&alt=${alt}&n=5`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.message === 'success' && data.response) {
            return data.response.map(pass => ({
                duration: pass.duration,
                risetime: pass.risetime,
                riseDate: new Date(pass.risetime * 1000).toLocaleString(),
                visibility: 'Good' // Simplified for demo
            }));
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching ISS passes:', error);
        return [];
    }
}

/**
 * Create ISS 3D visualization object
 * @param {Object} issData - ISS position data
 * @returns {Object} 3D visualization data
 */
export function createISS3DObject(issData) {
    return {
        type: 'ISS',
        position: issData.position3D,
        metadata: {
            crew: issData.crew.length,
            altitude: `${issData.position.altitude} km`,
            velocity: `${issData.velocity.toLocaleString()} km/h`,
            period: `${issData.orbitalPeriod} minutes`
        },
        visual: {
            color: 0x00ff00,
            size: 8,
            shape: 'station', // Special ISS model
            glow: true
        }
    };
}

/**
 * Fetch satellite constellation data (Starlink, etc.)
 * @param {string} constellation - Constellation name
 * @returns {Promise<Array>} Satellite data
 */
export async function fetchSatelliteConstellation(constellation = 'starlink') {
    console.log(`Fetching ${constellation} constellation data...`);
    
    try {
        if (constellation.toLowerCase() === 'starlink') {
            const response = await fetch(`${AGENCY_APIS.SPACEX.starlink}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: { spaceTrack: { OBJECT_TYPE: 'PAYLOAD' } },
                    options: { limit: 100 }
                })
            });
            
            const data = await response.json();
            
            return data.docs.map(sat => ({
                id: sat.spaceTrack.OBJECT_ID,
                name: sat.spaceTrack.OBJECT_NAME,
                latitude: sat.latitude,
                longitude: sat.longitude,
                altitude: sat.height_km,
                velocity: sat.velocity_kms,
                launchDate: sat.spaceTrack.LAUNCH_DATE
            }));
        }
        
        return [];
        
    } catch (error) {
        console.error(`Error fetching ${constellation} data:`, error);
        return [];
    }
}

/**
 * Format agency data for display
 * @param {Object} agencyData - Raw agency data
 * @param {string} agency - Agency name
 * @returns {Object} Formatted display data
 */
export function formatAgencyData(agencyData, agency) {
    const formatters = {
        'ISS': (data) => ({
            title: `🛰️ ISS Live Position`,
            subtitle: `${data.crew.length} crew members aboard`,
            details: [
                `Latitude: ${data.position.latitude.toFixed(4)}°`,
                `Longitude: ${data.position.longitude.toFixed(4)}°`,
                `Altitude: ${data.position.altitude} km`,
                `Speed: ${data.velocity.toLocaleString()} km/h`
            ],
            status: 'Active',
            lastUpdate: new Date(data.position.timestamp * 1000).toLocaleString()
        }),
        'SPACEX': (data) => ({
            title: `🚀 SpaceX Recent Activity`,
            subtitle: `${data.recentLaunches.length} recent launches`,
            details: [
                `Founded: ${data.company.founded}`,
                `Employees: ${data.company.employees.toLocaleString()}`,
                `Vehicles: ${data.company.vehicles}`,
                `Launch Sites: ${data.company.launch_sites}`
            ],
            status: 'Active',
            lastUpdate: new Date().toLocaleString()
        }),
        'ESA': (data) => ({
            title: `🌍 ESA Active Missions`,
            subtitle: `${data.activeMissions.length} missions in progress`,
            details: [
                `Active Missions: ${data.activeMissions.length}`,
                `Upcoming: ${data.upcomingMissions.length}`,
                'Focus: Space Science & Exploration'
            ],
            status: 'Active',
            lastUpdate: new Date().toLocaleString()
        })
    };
    
    const formatter = formatters[agency.toUpperCase()];
    return formatter ? formatter(agencyData) : agencyData;
}

export { AGENCY_APIS, TELESCOPE_MISSIONS };
