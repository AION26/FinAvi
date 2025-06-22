// utils/fetchFlightData.ts
import { setTimeout } from 'timers/promises';

// Simple in-memory cache (for development)
const cache = new Map<string, any>();
const CACHE_TTL = 30000; // 30 seconds

export async function fetchFlightDataByCallsign(
  flightNumber: string, 
  allowPartialMatch = false,
  retryCount = 0
): Promise<any> {
  const normalizedFlightNumber = flightNumber.trim().toUpperCase();
  const cacheKey = `flight-${normalizedFlightNumber}`;

  // Check cache first
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    // Use more specific endpoint (requires registration)
    const res = await fetch(`https://opensky-network.org/api/flights/aircraft?icao24=${normalizedFlightNumber}&begin=${Math.floor(Date.now()/1000)-3600}&end=${Math.floor(Date.now()/1000)}`);

    // Handle rate limits
    if (res.status === 429) {
      if (retryCount < 3) {
        await setTimeout(2000); // Wait 2 seconds
        return fetchFlightDataByCallsign(flightNumber, allowPartialMatch, retryCount + 1);
      }
      throw new Error('API rate limit exceeded');
    }

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();

    // Transform response
    const result = {
      flightNumber: normalizedFlightNumber,
      currentPosition: [data.longitude, data.latitude],
      origin: data.estDepartureAirport || 'Unknown',
      destination: data.estArrivalAirport || 'Unknown',
      altitude: data.baroAltitude || 0,
      speed: data.velocity || 0,
      heading: data.trueTrack || 0,
      aircraft: data.icaoAircraft || 'Unknown',
      status: 'En Route',
      path: data.path?.map((p: any) => [p.longitude, p.latitude]) || []
    };

    // Cache result
    cache.set(cacheKey, { 
      data: result,
      timestamp: Date.now() 
    });

    return result;
  } catch (error) {
    console.error('Flight fetch error:', error);
    throw error;
  }
}