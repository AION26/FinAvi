// types/ConflictZone.ts

export interface ConflictZone {
  id: string
  date: string // ISO format (e.g., "2024-01-15")
  type: string // e.g., "War Zone", "No-Fly Zone"
  location: string // Human-readable location name
  notes?: string // Optional field for extra context
  position: [number, number] // [latitude, longitude]
}
