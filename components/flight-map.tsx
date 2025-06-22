"use client"

import { useEffect, useRef } from "react"
import { FlightData } from "@/types/FlightData"

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
        mapInstanceRef.current = L.map(mapRef.current).setView(flight.currentPosition, 6)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapInstanceRef.current)

        // Construct full path from origin to current to destination
        const fullPath: [number, number][] = [
          flight.origin.coordinates,
          flight.currentPosition,
          flight.destination.coordinates,
        ]

        const pathLine = L.polyline(fullPath, {
          color: "#2563eb",
          weight: 3,
          opacity: 0.7,
          dashArray: "10, 5",
        }).addTo(mapInstanceRef.current)
        flightPathRef.current = pathLine

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

        // Custom ✈️ icon
        const airplaneIcon = L.divIcon({
          html: `<div style="transform: rotate(${flight.heading}deg); color: #2563eb; font-size: 20px;">✈️</div>`,
          className: "custom-airplane-icon",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        })

        // Current flight position marker
        const currentMarker = L.marker(flight.currentPosition, { icon: airplaneIcon })
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

        airplaneMarkerRef.current = currentMarker

        // Fit to bounds
        mapInstanceRef.current.fitBounds(pathLine.getBounds(), { padding: [20, 20] })
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [flight])

  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return

    const updateNearbyAirplanes = async () => {
      const L = (await import("leaflet")).default

      // Clear existing nearby airplanes
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer.options && layer.options.isNearbyAirplane) {
          mapInstanceRef.current.removeLayer(layer)
        }
      })

      // Add nearby airplane markers
      nearbyAirplanes.forEach((airplane) => {
        const nearbyIcon = L.divIcon({
          html: `<div style="color: #6b7280; font-size: 16px;">✈️</div>`,
          className: "custom-nearby-airplane-icon",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        L.marker(airplane.position, {
          icon: nearbyIcon,
          isNearbyAirplane: true,
        } as any)
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold">${airplane.flightNumber}</h3>
              <p><strong>Altitude:</strong> ${airplane.altitude.toLocaleString()} ft</p>
            </div>
          `)
      })
    }

    updateNearbyAirplanes()
  }, [nearbyAirplanes])

  useEffect(() => {
    if (!mapInstanceRef.current || !airplaneMarkerRef.current) return

    const L = require("leaflet")

    const { currentPosition, heading } = flight
    airplaneMarkerRef.current.setLatLng(currentPosition)

    const iconHtml = `<div style="transform: rotate(${heading}deg); color: #2563eb; font-size: 20px;">✈️</div>`
    const newIcon = L.divIcon({
      html: iconHtml,
      className: "custom-airplane-icon",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })
    airplaneMarkerRef.current.setIcon(newIcon)

    mapInstanceRef.current.whenReady(() => {
      mapInstanceRef.current?.panTo(currentPosition, {
        animate: true,
        duration: 1,
        easeLinearity: 0.25,
      })
    })

    // Extend flight path dynamically
    if (flightPathRef.current) {
      const latlngs = flightPathRef.current.getLatLngs()
      const last = latlngs[latlngs.length - 1]
      const newPoint = L.latLng(currentPosition[0], currentPosition[1])

      if (!last || newPoint.distanceTo(last) > 100) {
        latlngs.push(newPoint)
        flightPathRef.current.setLatLngs(latlngs)
      }
    }
  }, [flight.currentPosition])

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
