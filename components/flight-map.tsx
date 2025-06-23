"use client"

import { useEffect, useRef, useState } from "react"
import { FlightData } from "@/types/FlightData"
import L from "leaflet"

interface NearbyAirplane {
  id: string
  position: [number, number]
  flightNumber: string
  altitude: number
}

interface FlightMapProps {
  flight: FlightData
  nearbyAirplanes: NearbyAirplane[]
  isTracking: boolean
}

export default function FlightMap({ flight, nearbyAirplanes, isTracking }: FlightMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const airplaneMarkerRef = useRef<any>(null)
  const flightPathRef = useRef<any>(null)
  const animationRef = useRef<number | null>(null)
  const lastZoomRef = useRef<number>(6)
  const [userZoomed, setUserZoomed] = useState(false)

  const [ghostData, setGhostData] = useState({
    lastPosition: flight.currentPosition,
    lastTimestamp: Date.now(),
  })

  const toRadians = (deg: number) => (deg * Math.PI) / 180

  const moveGhostMarker = () => {
    const marker = airplaneMarkerRef.current
    const map = mapInstanceRef.current
    if (!marker || !map) return

    const { lastPosition, lastTimestamp } = ghostData
    const now = Date.now()
    const deltaT = (now - lastTimestamp) / 1000 // seconds since last update

    const distance = (flight.speed * 1609.34) * (deltaT / 3600) // meters
    const R = 6371e3 // Earth's radius in meters

    const [lat, lon] = lastPosition
    const headingRad = toRadians(flight.heading)

    const φ1 = toRadians(lat)
    const λ1 = toRadians(lon)

    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(distance / R) +
      Math.cos(φ1) * Math.sin(distance / R) * Math.cos(headingRad))

    const λ2 = λ1 + Math.atan2(
      Math.sin(headingRad) * Math.sin(distance / R) * Math.cos(φ1),
      Math.cos(distance / R) - Math.sin(φ1) * Math.sin(φ2)
    )

    const newLat = φ2 * 180 / Math.PI
    const newLon = λ2 * 180 / Math.PI

    const newLatLng: [number, number] = [newLat, newLon]
    marker.setLatLng(newLatLng)

    if (!userZoomed) {
      map.panTo(newLatLng, { animate: false })
    }

    animationRef.current = requestAnimationFrame(moveGhostMarker)
  }

  const startGhostTracking = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    animationRef.current = requestAnimationFrame(moveGhostMarker)
  }

  const stopGhostTracking = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  // Initialize map and first-time setup
  useEffect(() => {
    if (typeof window === "undefined") return

    const initMap = async () => {
      const L = (await import("leaflet")).default

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      if (mapRef.current && !mapInstanceRef.current) {
        const map = L.map(mapRef.current).setView(flight.currentPosition, lastZoomRef.current)
        mapInstanceRef.current = map

        map.on("zoomend", () => {
          lastZoomRef.current = map.getZoom()
          setUserZoomed(true)
        })

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map)

        const pathLine = L.polyline([flight.origin.coordinates, flight.currentPosition, flight.destination.coordinates], {
          color: "#2563eb",
          weight: 3,
          opacity: 0.7,
          dashArray: "10, 5",
        }).addTo(map)

        flightPathRef.current = pathLine

        // Add origin and destination markers
        L.marker(flight.origin.coordinates).addTo(map).bindPopup(`${flight.origin.name} (${flight.origin.code})`)
        L.marker(flight.destination.coordinates).addTo(map).bindPopup(`${flight.destination.name} (${flight.destination.code})`)

        const airplaneIcon = L.divIcon({
          html: `<div style="transform: rotate(${flight.heading}deg); font-size: 28px;">✈️</div>`,
          className: "custom-airplane-icon",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })

        const currentMarker = L.marker(flight.currentPosition, { icon: airplaneIcon }).addTo(map)
        airplaneMarkerRef.current = currentMarker

        setGhostData({ lastPosition: flight.currentPosition, lastTimestamp: Date.now() })
        startGhostTracking()

        if (!userZoomed) map.fitBounds(pathLine.getBounds(), { padding: [20, 20] })
      }
    }

    initMap()

    return () => {
      stopGhostTracking()
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // When flight data is updated from server
  useEffect(() => {
    if (!flight.currentPosition) return
    setGhostData({ lastPosition: flight.currentPosition, lastTimestamp: Date.now() })
  }, [flight.currentPosition])

  // Update nearby airplanes
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return

    const L = require("leaflet")

    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer.options?.isNearbyAirplane) {
        mapInstanceRef.current.removeLayer(layer)
      }
    })

    nearbyAirplanes.forEach((plane) => {
      const nearbyIcon = L.divIcon({
        html: `<div style="color: #6b7280; font-size: 16px;">✈️</div>`,
        className: "custom-nearby-airplane-icon",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      L.marker(plane.position, {
        icon: nearbyIcon,
        isNearbyAirplane: true,
      } as any)
        .addTo(mapInstanceRef.current)
        .bindPopup(`<strong>${plane.flightNumber}</strong><br/>Altitude: ${plane.altitude.toLocaleString()} ft`)
    })
  }, [nearbyAirplanes])

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
        {nearbyAirplanes.length > 0 && <p>✈️ Nearby Aircraft</p>}
      </div>
    </div>
  )
}
