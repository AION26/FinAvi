export interface AirportInfo {
  code: string
  name: string
  city: string
  country: string
  coordinates: [number, number]
}

export interface FlightData {
  flightNumber: string
  currentPosition: [number, number]
  origin: AirportInfo
  destination: AirportInfo
  airline: {
    name: string
    code: string
    callsign: string
  }
  altitude: number
  speed: number
  heading: number
  aircraft: string
  status: string
  path: [number, number][]
}

