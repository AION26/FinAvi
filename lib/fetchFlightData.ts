interface FlightData {
  flightNumber: string;
  currentPosition: [number, number];
  origin?: {
    code: string;
    name: string;
    city: string;
    country: string;
    coordinates: [number, number];
  };
  destination?: {
    code: string;
    name: string;
    city: string;
    country: string;
    coordinates: [number, number];
  };
  airline?: {
    name: string;
    code: string;
    callsign: string;
  };
  altitude: number;
  speed: number;
  heading: number;
  aircraft: string;
  status: string;
  path: [number, number][];
}

const CACHE_TTL = 30000; // 30 seconds
const cache = new Map<string, { data: FlightData; timestamp: number }>();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchFlightDataByCallsign(
  flightNumber: string,
  retryCount = 0
): Promise<FlightData | null> {
  const normalizedFlightNumber = flightNumber.trim().toUpperCase();
  const cacheKey = `flight-${normalizedFlightNumber}`;

  // Check cache first
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    let routeResponse: any = null;
    let liveResponse: any = null;
    
    // Try to get live data first since it's more critical
    try {
      liveResponse = await fetchLiveData(normalizedFlightNumber, retryCount);
    } catch (liveError) {
      console.error(`Failed to fetch live data for ${normalizedFlightNumber}:`, liveError);
      return null;
    }
    
    // Try to get route info, but don't fail if it doesn't work
    try {
      routeResponse = await fetchRouteInfo(normalizedFlightNumber);
    } catch (routeError) {
      console.warn(`Failed to fetch route info for ${normalizedFlightNumber}, proceeding with live data only`);
    }
    
    // Merge responses
    const result = transformResponses(routeResponse, liveResponse, normalizedFlightNumber);
    
    if (!result) return null;

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error(`Flight fetch error for ${flightNumber}:`, error);
    return null;
  }
}

async function fetchRouteInfo(callsign: string): Promise<any> {
  const response = await fetch(`https://api.adsbdb.com/v0/callsign/${callsign}`);
  if (!response.ok) {
    throw new Error(`ADSBDB API error: ${response.status}`);
  }
  return await response.json();
}

async function fetchLiveData(callsign: string, retryCount: number): Promise<any> {
  try {
    const response = await fetch(`https://api.adsb.lol/v2/callsign/${callsign}`);
    
    if (!response.ok) {
      if (response.status === 429 && retryCount < 3) {
        console.warn(`Rate limit hit. Retrying... (${retryCount + 1})`);
        await delay(2000);
        return fetchLiveData(callsign, retryCount + 1);
      }
      throw new Error(`ADSB.lol API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (retryCount < 3) {
      console.warn(`Retrying API call for ${callsign}... attempt ${retryCount + 1}`);
      await delay(2000);
      return fetchLiveData(callsign, retryCount + 1);
    }
    throw error;
  }
}

function transformResponses(
  routeData: any,
  liveData: any,
  callsign: string
): FlightData | null {
  const aircraftList = Array.isArray(liveData?.ac) ? liveData.ac : [];
  if (aircraftList.length === 0) {
    console.warn(`No live aircraft data found for ${callsign}`);
    return null;
  }

  const flight = aircraftList[0];
  const lat = flight.lat ?? 0;
  const lon = flight.lon ?? 0;

  if (lat === 0 && lon === 0) {
    console.warn(`Invalid aircraft position [0,0] for ${callsign}`);
    return null;
  }

  // Basic flight data that we can always get from live data
  const result: FlightData = {
    flightNumber: callsign,
    currentPosition: [lat, lon],
    altitude: flight.alt_baro ?? 0,
    speed: flight.gs ?? 0,
    heading: flight.track ?? 0,
    aircraft: flight.t ?? 'Unknown',
    status: flight.hex ? 'En Route' : 'Unknown',
    path: [[lon, lat]]
  };

  // Add route info if available
  const route = routeData?.response?.flightroute;
  if (route) {
    if (route.origin) {
      result.origin = {
        code: route.origin.iata_code,
        name: route.origin.name,
        city: route.origin.municipality,
        country: route.origin.country_name,
        coordinates: [route.origin.latitude, route.origin.longitude]
      };
    }
    
    if (route.destination) {
      result.destination = {
        code: route.destination.iata_code,
        name: route.destination.name,
        city: route.destination.municipality,
        country: route.destination.country_name,
        coordinates: [route.destination.latitude, route.destination.longitude]
      };
    }
    
    if (route.airline) {
      result.airline = {
        name: route.airline.name,
        code: route.airline.iata,
        callsign: route.airline.callsign
      };
    }
  }

  return result;
}