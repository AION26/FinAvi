"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { FlightData } from "@/types/FlightData"
import conflict_data from "@/public/conflict_data.json"
import { weathercodeToDescription } from "@/lib/weather"

import L from "leaflet"

interface NearbyAirplane {
  id: string
  position: [number, number]
  flightNumber: string
  altitude: number
}

interface ConflictZone {
  id: string;
  position: [number, number];
  date: string;
  type: string;
  location: string;
  notes: string;
}

interface FlightMapProps {
  flight: FlightData
  nearbyAirplanes: NearbyAirplane[]
  isTracking: boolean
}

export default function FlightMap({ flight, nearbyAirplanes, isTracking }: FlightMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const airplaneMarkerRef = useRef<L.Marker | null>(null)
  const flightPathRef = useRef<L.Polyline | null>(null)
  const conflictMarkersRef = useRef<L.CircleMarker[]>([])
  const nearbyMarkersRef = useRef<L.Marker[]>([])
  const animationRef = useRef<number | null>(null)
  const [userZoomed, setUserZoomed] = useState(false)
  const lastZoomRef = useRef<number>(6)

  // Memoized animate function
  const animateAirplane = useCallback((marker: L.Marker, heading: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    let angle = 0
    const amplitude = 1.5
    const frequency = 0.05

    const animate = () => {
      angle += frequency
      const wobble = Math.sin(angle) * amplitude
      const iconHtml = `<div style="transform: rotate(${heading + wobble}deg); color: #2563eb; font-size: 28px;">✈️</div>`
      const newIcon = L.divIcon({
        html: iconHtml,
        className: "custom-airplane-icon",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })
      marker.setIcon(newIcon)
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
  }, [])

  // Initialize conflict zones
  const initializeConflictZones = useCallback(() => {
    if (!mapInstanceRef.current) return

    // Clear existing conflict markers
    conflictMarkersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker)
    })
    conflictMarkersRef.current = []

    // Use data from conflict_data.json
    const conflictData: ConflictZone[] = conflict_data as ConflictZone[]

    // Add conflict markers as red dots
    conflictData.forEach(conflict => {
      const marker = L.circleMarker(conflict.position, {
        radius: 6,
        fillColor: "#dc2626",
        color: "#991b1b",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(mapInstanceRef.current!)

      const popupContent = `
        <div class="p-2 text-sm max-w-xs">
          <strong>ID:</strong> ${conflict.id}<br>
          <strong>Date:</strong> ${conflict.date}<br>
          <strong>Type:</strong> ${conflict.type}<br>
          <strong>Location:</strong> ${conflict.location}<br>
          <strong>Notes:</strong> ${conflict.notes}
        </div>
      `

      marker.bindPopup(popupContent)
      conflictMarkersRef.current.push(marker)
    })
  }, [])

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || mapInstanceRef.current) return

    const initMap = async () => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      mapInstanceRef.current = L.map(mapRef.current!).setView(flight.currentPosition, lastZoomRef.current)

      // Add base tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current)

      // Track zoom events
      mapInstanceRef.current.on('zoomend', () => {
        lastZoomRef.current = mapInstanceRef.current!.getZoom()
        setUserZoomed(true)
      })

      // Initialize conflict zones
      initializeConflictZones()

      // Create initial flight path
      const fullPath: L.LatLngExpression[] = [
        flight.origin.coordinates,
        flight.currentPosition,
        flight.destination.coordinates,
      ]

      flightPathRef.current = L.polyline(fullPath, {
        color: "#2563eb",
        weight: 3,
        opacity: 0.7,
        dashArray: "10, 5",
      }).addTo(mapInstanceRef.current)

      // Origin marker
      L.marker(flight.origin.coordinates)
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">Origin</h3>
            <p>${flight.origin.name} (${flight.origin.code})</p>
            <p>${flight.origin.city}, ${flight.origin.country}</p>
          </div>
        `)

      // Destination marker
      L.marker(flight.destination.coordinates)
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">Destination</h3>
            <p>${flight.destination.name} (${flight.destination.code})</p>
            <p>${flight.destination.city}, ${flight.destination.country}</p>
          </div>
        `)

      // Current flight position marker
      const airplaneIcon = L.divIcon({
        html: `<div style="transform: rotate(${flight.heading}deg); color: #2563eb; font-size: 28px;">✈️</div>`,
        className: "custom-airplane-icon",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })

      airplaneMarkerRef.current = L.marker(flight.currentPosition, { icon: airplaneIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${flight.flightNumber}</h3>
            <p><strong>Altitude:</strong> ${flight.altitude.toLocaleString()} ft</p>
            <p><strong>Speed:</strong> ${flight.speed} mph</p>
            <p><strong>Heading:</strong> ${flight.heading}°</p>
            <p><strong>Aircraft:</strong> ${flight.aircraft}</p>
          </div>
        `)

      animateAirplane(airplaneMarkerRef.current, flight.heading)

      if (!userZoomed) {
        mapInstanceRef.current.fitBounds(flightPathRef.current.getBounds(), { padding: [20, 20] })
      }
    }

    initMap()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [animateAirplane, userZoomed, initializeConflictZones, flight])

  useEffect(() => {
  const fetchWeatherAndUpdatePopup = async () => {
    const [lat, lon] = flight.currentPosition
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,cloud_cover,weathercode`

    const res = await fetch(weatherUrl)
    const data = await res.json()
    const weather = data.current

    if (!weather || !airplaneMarkerRef.current) return

    const popupHtml = `
      <div class="text-sm max-w-xs">
        <strong>🌤 Weather Conditions</strong><br/>
        Temp: ${weather.temperature_2m}°C<br/>
        Wind: ${weather.wind_speed_10m} km/h (${weather.wind_direction_10m}°)<br/>
        Cloud Cover: ${weather.cloud_cover}%<br/>
        Condition: ${weathercodeToDescription(weather.weathercode)}
      </div>
    `

    airplaneMarkerRef.current.bindPopup(popupHtml).openPopup()
  }

  if (isTracking && flight.currentPosition) {
    fetchWeatherAndUpdatePopup()
  }
}, [flight.currentPosition, isTracking])


  // Update flight position without refreshing the entire map
  useEffect(() => {
    if (!airplaneMarkerRef.current || !flightPathRef.current || !mapInstanceRef.current) return

    // Update airplane position
    airplaneMarkerRef.current.setLatLng(flight.currentPosition)
    
    // Update flight path
    const newPath = [
      flight.origin.coordinates,
      flight.currentPosition,
      flight.destination.coordinates
    ]
    flightPathRef.current.setLatLngs(newPath)

    // Update airplane animation with new heading
    animateAirplane(airplaneMarkerRef.current, flight.heading)

    // Auto-center if tracking is enabled and user hasn't manually zoomed
    if (isTracking && !userZoomed) {
      mapInstanceRef.current.setView(flight.currentPosition, lastZoomRef.current)
    }
  }, [flight.currentPosition, flight.heading, isTracking, userZoomed, animateAirplane])

  // Update nearby airplanes
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Clear existing nearby markers
    nearbyMarkersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker)
    })
    nearbyMarkersRef.current = []

    // Add new nearby airplane markers
    nearbyAirplanes.forEach(airplane => {
      const nearbyIcon = L.divIcon({
        html: `<div style="color: #059669; font-size: 24px;">✈️</div>`,
        className: "custom-nearby-icon",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      const marker = L.marker(airplane.position, { icon: nearbyIcon })
        .addTo(mapInstanceRef.current!)
        .bindPopup(`
          <div class="p-2 text-sm">
            <h3 class="font-bold">${airplane.flightNumber}</h3>
            <p><strong>Altitude:</strong> ${airplane.altitude.toLocaleString()} ft</p>
            <p><strong>Distance:</strong> ${Math.round(
              mapInstanceRef.current!.distance(flight.currentPosition, airplane.position) / 1000
            )} km</p>
          </div>
        `)

      nearbyMarkersRef.current.push(marker)
    })
  }, [nearbyAirplanes, flight.currentPosition])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {!isTracking && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading flight data...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-2 text-xs text-gray-600">
        <p>🔵 Flight Path</p>
        <p>✈️ Current Position</p>
        <p className="text-red-500">🔴 Conflict Zone</p>
        {nearbyAirplanes.length > 0 && <p>✈️ Nearby Aircraft</p>}
      </div>
    </div>
  )
} 