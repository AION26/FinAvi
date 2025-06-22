export const mockFlightData = {
  flightNumber: "AA123",
  currentPosition: [40.7128, -74.006] as [number, number], // New York
  origin: "JFK - New York",
  destination: "LAX - Los Angeles",
  altitude: 35000,
  speed: 550,
  heading: 245,
  aircraft: "Boeing 737-800",
  status: "En Route",
  path: [
    [40.6413, -73.7781], // JFK Airport
    [40.2, -75.0], // Philadelphia area
    [39.1, -76.8], // Baltimore area
    [38.9, -77.0], // Washington DC area
    [37.5, -79.0], // Virginia
    [36.0, -82.0], // Tennessee
    [35.2, -85.9], // Alabama
    [34.7, -89.5], // Mississippi
    [32.8, -96.8], // Dallas area
    [35.0, -101.8], // Texas Panhandle
    [35.2, -106.6], // Albuquerque area
    [36.1, -115.1], // Las Vegas area
    [34.5, -117.9], // San Bernardino area
    [33.9425, -118.4081], // LAX Airport
  ] as [number, number][],
}

export const mockNearbyAirplanes = [
  {
    id: "1",
    position: [40.8128, -73.906] as [number, number],
    flightNumber: "DL456",
    altitude: 33000,
  },
  {
    id: "2",
    position: [40.6128, -74.106] as [number, number],
    flightNumber: "UA789",
    altitude: 37000,
  },
  {
    id: "3",
    position: [40.9128, -73.806] as [number, number],
    flightNumber: "SW321",
    altitude: 31000,
  },
]

export const mockRiskData = {
  weatherRisk: 3,
  warZoneRisk: 1,
  overallRisk: 2,
}
