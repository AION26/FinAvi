// flightUtils.ts

export type Conflict = {
  id: string;
  date: string;
  type: string;
  location: string;
  notes: string;
  position: [number, number]; // [lat, lon]
};

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const toDegrees = (rad: number) => (rad * 180) / Math.PI;

const haversineDistance = ([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) => {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Cross-track distance from point C to great-circle path A → B
const crossTrackDistance = (
  point: [number, number],
  pathStart: [number, number],
  pathEnd: [number, number]
): number => {
  const R = 6371;
  const δ13 = haversineDistance(pathStart, point) / R;
  const θ13 = bearing(pathStart, point);
  const θ12 = bearing(pathStart, pathEnd);
  const dXt = Math.asin(Math.sin(δ13) * Math.sin(toRadians(θ13 - θ12))) * R;
  return Math.abs(dXt); // in km
};

const bearing = ([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number => {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (toDegrees(θ) + 360) % 360;
};

async function fetchConflicts(): Promise<Conflict[]> {
  const res = await fetch("/newdata25.json");
  return await res.json();
}

function scoreConflicts(count: number): number {
  if (count >= 6) return 5;
  if (count >= 4) return 4;
  if (count >= 2) return 3;
  if (count >= 1) return 2;
  return 0;
}

// 🛫 AIRPORT risk
export async function getConflictRiskForAirports(
  origin: [number, number],
  destination: [number, number],
  radiusKm: number = 300
): Promise<{ riskScore: number; nearestConflicts: Conflict[] }> {
  const allConflicts = await fetchConflicts();

  const conflictsNear = allConflicts.filter(conflict => {
    const d1 = haversineDistance(origin, conflict.position);
    const d2 = haversineDistance(destination, conflict.position);
    return d1 <= radiusKm || d2 <= radiusKm;
  });

  return {
    riskScore: scoreConflicts(conflictsNear.length),
    nearestConflicts: conflictsNear
  };
}

// ✈️ FLIGHT PATH risk
export async function getConflictRiskForFlightPath(
  origin: [number, number],
  destination: [number, number],
  pathRadiusKm: number = 150
): Promise<{ riskScore: number; pathConflicts: Conflict[] }> {
  const allConflicts = await fetchConflicts();

  const conflictsAlongPath = allConflicts.filter(conflict => {
    const xtd = crossTrackDistance(conflict.position, origin, destination);
    return xtd <= pathRadiusKm;
  });

  return {
    riskScore: scoreConflicts(conflictsAlongPath.length),
    pathConflicts: conflictsAlongPath
  };
}

// 📍 CURRENT POSITION risk
export async function getConflictRiskAtCurrentPosition(
  currentPosition: [number, number],
  radiusKm: number = 300
): Promise<{ riskScore: number; nearbyConflicts: Conflict[] }> {
  const allConflicts = await fetchConflicts();

  const nearbyConflicts = allConflicts.filter(conflict => {
    const d = haversineDistance(currentPosition, conflict.position);
    return d <= radiusKm;
  });

  return {
    riskScore: scoreConflicts(nearbyConflicts.length),
    nearbyConflicts
  };
}

// 🧮 COMPOSITE OVERALL RISK
export async function getOverallFlightRisk(
  origin: [number, number],
  destination: [number, number],
  currentPosition?: [number, number]
): Promise<{
  overallRiskScore: number;
  airportRisk: number;
  pathRisk: number;
  currentRisk?: number;
}> {
  const [airport, path] = await Promise.all([
    getConflictRiskForAirports(origin, destination),
    getConflictRiskForFlightPath(origin, destination),
  ]);

  let current = { riskScore: 0 };
  if (currentPosition) {
    current = await getConflictRiskAtCurrentPosition(currentPosition);
  }

  // Weighted average (can be tweaked)
  const overallRiskScore = Math.round(
    0.4 * airport.riskScore + 0.4 * path.riskScore + 0.2 * current.riskScore
  );

  return {
    overallRiskScore,
    airportRisk: airport.riskScore,
    pathRisk: path.riskScore,
    currentRisk: current.riskScore
  };
}
