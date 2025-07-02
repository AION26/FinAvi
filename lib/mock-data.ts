export const mockFlightData = {
  flightNumber: "AA123",
  currentPosition: [40.7128, -74.006] as [number, number], // New York

  origin: {
    code: "JFK",
    name: "John F. Kennedy International Airport",
    city: "New York",
    country: "USA",
    coordinates: [40.6413, -73.7781],
  },

  destination: {
    code: "LAX",
    name: "Los Angeles International Airport",
    city: "Los Angeles",
    country: "USA",
    coordinates: [33.9425, -118.4081],
  },

  altitude: 35000,
  speed: 550,
  heading: 245,
  aircraft: "Boeing 737-800",
  status: "En Route",

  path: [
    [40.6413, -73.7781],
    [40.2, -75.0],
    [39.1, -76.8],
    [38.9, -77.0],
    [37.5, -79.0],
    [36.0, -82.0],
    [35.2, -85.9],
    [34.7, -89.5],
    [32.8, -96.8],
    [35.0, -101.8],
    [35.2, -106.6],
    [36.1, -115.1],
    [34.5, -117.9],
    [33.9425, -118.4081],
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
