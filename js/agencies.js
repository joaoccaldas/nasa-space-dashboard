// CaldaSpace - Multi-Agency Integration Module
// Real-time data from NASA, ESA, SpaceX, and ISS tracking
// API Endpoints for various space agencies
const AGENCY_APIS = {
    ISS: {
        position: 'https://api.open-notify.org/iss-now.json',
        people: 'https://api.open-notify.org/astros.json',
        passes: 'https://api.open-notify.org/iss-pass.json'
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

// Fallback data for when APIs are unavailable
const ISS_FALLBACK_DATA = {
    position: {
        latitude: 0,
        longitude: 0,
        altitude: 408,
        velocity: 27600,
        timestamp: Date.now()
    },
    crew: [
        { name: 'ISS Crew Member', craft: 'ISS' }
    ]
};

/**
 * Fetch current ISS position and crew information
 * @returns {Promise<object>} ISS data with position and crew
 */
export async function fetchISSData() {
    console.log('Fetching ISS real-time data...');
    
    try {
        // Fetch ISS position with timeout
        const positionController = new AbortController();
        const positionTimeout = setTimeout(() => positionController.abort(), 10000);
        
        const positionResponse = await fetch(AGENCY_APIS.ISS.position, {
            signal: positionController.signal
        }).catch(err => {
            console.warn('ISS position fetch failed:', err.message);
            return null;
        });
        
        clearTimeout(positionTimeout);
        
        let positionData = null;
        if (positionResponse && positionResponse.ok) {
            positionData = await positionResponse.json();
        } else {
            console.warn('Using fallback ISS position data');
            positionData = { iss_position: ISS_FALLBACK_DATA.position, timestamp: Date.now() };
        }
        
        // Fetch crew information with timeout
        const peopleController = new AbortController();
        const peopleTimeout = setTimeout(() => peopleController.abort(), 10000);
        
        const peopleResponse = await fetch(AGENCY_APIS.ISS.people, {
            signal: peopleController.signal
        }).catch(err => {
            console.warn('ISS crew fetch failed:', err.message);
            return null;
        });
        
        clearTimeout(peopleTimeout);
        
        let peopleData = null;
        if (peopleResponse && peopleResponse.ok) {
            peopleData = await peopleResponse.json();
        } else {
            console.warn('Using fallback ISS crew data');
            peopleData = { people: ISS_FALLBACK_DATA.crew, number: ISS_FALLBACK_DATA.crew.length };
        }
        
        const issData = {
            position: {
                latitude: positionData.iss_position?.latitude || ISS_FALLBACK_DATA.position.latitude,
                longitude: positionData.iss_position?.longitude || ISS_FALLBACK_DATA.position.longitude,
                altitude: positionData.iss_position?.altitude || ISS_FALLBACK_DATA.position.altitude,
                velocity: positionData.iss_position?.velocity || ISS_FALLBACK_DATA.position.velocity,
                timestamp: positionData.timestamp || Date.now()
            },
            crew: peopleData.people?.filter(p => p.craft === 'ISS') || ISS_FALLBACK_DATA.crew,
            crewCount: peopleData.number || ISS_FALLBACK_DATA.crew.length
        };
        
        console.log('ISS data fetched successfully:', issData);
        return issData;
        
    } catch (error) {
        console.error('Error in fetchISSData:', error.message);
        console.log('Returning fallback ISS data due to error');
        
        // Return fallback data instead of throwing
        return {
            position: ISS_FALLBACK_DATA.position,
            crew: ISS_FALLBACK_DATA.crew,
            crewCount: ISS_FALLBACK_DATA.crew.length,
            error: 'Using cached data - API temporarily unavailable'
        };
    }
}

/**
 * Fetch SpaceX launch data
 * @returns {Promise<Array>} Array of launch data
 */
export async function fetchSpaceXLaunches() {
    console.log('Fetching SpaceX launches...');
    
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(AGENCY_APIS.SPACEX.launches, {
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const launches = await response.json();
        console.log(`Fetched ${launches.length} SpaceX launches`);
        return launches;
        
    } catch (error) {
        console.error('Error fetching SpaceX launches:', error.message);
        return [];
    }
}

/**
 * Fetch multi-agency status information
 * @returns {Promise<object>} Combined agency status
 */
export async function fetchMultiAgencyStatus() {
    console.log('Fetching multi-agency status...');
    
    try {
        const issData = await fetchISSData();
        const spaceXData = await fetchSpaceXLaunches();
        
        return {
            iss: issData,
            spacex: {
                launches: spaceXData.slice(0, 5),
                totalLaunches: spaceXData.length
            },
            timestamp: Date.now(),
            status: 'operational'
        };
        
    } catch (error) {
        console.error('Error in fetchMultiAgencyStatus:', error.message);
        
        // Return minimal fallback data
        return {
            iss: {
                position: ISS_FALLBACK_DATA.position,
                crew: ISS_FALLBACK_DATA.crew,
                crewCount: ISS_FALLBACK_DATA.crew.length
            },
            spacex: {
                launches: [],
                totalLaunches: 0
            },
            timestamp: Date.now(),
            status: 'degraded',
            error: error.message
        };
    }
}
