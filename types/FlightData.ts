// types/FlightData.ts
export interface FlightData {
  flightNumber: string;
  currentPosition: [number, number];
  origin: string;
  destination: string;
  altitude: number;
  speed: number;
  heading: number;
  aircraft: string;
  status: string;
  path: [number, number][];
}
