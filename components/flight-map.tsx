"use client"

import { useEffect, useRef } from "react"
import { useMap } from "react-leaflet"

interface FlightData {
  flightNumber: string
  currentPosition: [number, number]
  origin: string
  destination: string
  altitude: number
  speed: number
  heading: number
  aircraft: string
  status: string
  path: [number, number][]
}

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

    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      const L = (await import("leaflet")).default

      // Fix for default markers
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      if (mapRef.current && !mapInstanceRef.current) {
        // Initialize map
        mapInstanceRef.current = L.map(mapRef.current).setView(flight.currentPosition, 6)

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapInstanceRef.current)

        // Create custom airplane icon
        const airplaneIcon = L.divIcon({
          html: `<div style="transform: rotate(${flight.heading}deg); color: #2563eb; font-size: 20px;">✈️</div>`,
          className: "custom-airplane-icon",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        })

        // Add flight path
        const pathLine = L.polyline(flight.path, {
          color: "#2563eb",
          weight: 3,
          opacity: 0.7,
          dashArray: "10, 5",
        }).addTo(mapInstanceRef.current)
        flightPathRef.current = pathLine // <-- store path polyline

        // Add flight icons along the path
        const pathLength = flight.path.length
        const iconSpacing = Math.max(1, Math.floor(pathLength / 5)) // Show ~5 icons max

        flight.path.forEach((position, index) => {
          if (index % iconSpacing === 0 && index !== 0 && index !== pathLength - 1) {
            // Calculate heading for this segment
            let segmentHeading = 0
            if (index < pathLength - 1) {
              const current = flight.path[index]
              const next = flight.path[index + 1]
              segmentHeading = (Math.atan2(next[1] - current[1], next[0] - current[0]) * 180) / Math.PI + 90
            }

            const pathIcon = L.divIcon({
              html: `<div style="transform: rotate(${segmentHeading}deg); color: #60a5fa; font-size: 14px; opacity: 0.7;">✈️</div>`,
              className: "custom-path-icon",
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })

            L.marker(position, { icon: pathIcon })
              .addTo(mapInstanceRef.current)
              .bindPopup(`
                <div class="p-2">
                  <h3 class="font-bold">Flight Path Point</h3>
                  <p><strong>Position:</strong> ${index + 1} of ${pathLength}</p>
                  <p><strong>Coordinates:</strong> ${position[0].toFixed(4)}, ${position[1].toFixed(4)}</p>
                </div>
              `)
          }
        })

        // Add current position marker
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
        airplaneMarkerRef.current = currentMarker // <-- store marker in ref

        // Add origin and destination markers
        L.marker([flight.path[0][0], flight.path[0][1]])
          .addTo(mapInstanceRef.current)
          .bindPopup(`<div class="p-2"><h3 class="font-bold">Origin</h3><p>${flight.origin}</p></div>`)

        L.marker([flight.path[flight.path.length - 1][0], flight.path[flight.path.length - 1][1]])
          .addTo(mapInstanceRef.current)
          .bindPopup(`<div class="p-2"><h3 class="font-bold">Destination</h3><p>${flight.destination}</p></div>`)

        // Fit map to show the entire path
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

      // Clear existing nearby airplane markers
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer.options && layer.options.isNearbyAirplane) {
          mapInstanceRef.current.removeLayer(layer)
        }
      })

      // Add nearby airplanes if enabled
      if (nearbyAirplanes.length > 0) {
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
    }

    updateNearbyAirplanes()
  }, [nearbyAirplanes])

  useEffect(() => {
  if (!mapInstanceRef.current || !airplaneMarkerRef.current) return

  const L = require("leaflet") // Already imported dynamically before

  const { currentPosition, heading } = flight

  // Animate marker to new position
  airplaneMarkerRef.current.setLatLng(currentPosition)

  // Rotate icon ✈️
  const iconHtml = `<div style="transform: rotate(${heading}deg); color: #2563eb; font-size: 20px;">✈️</div>`
  const newIcon = L.divIcon({
    html: iconHtml,
    className: "custom-airplane-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
  airplaneMarkerRef.current.setIcon(newIcon)

  // Animate map center (pan)
  mapInstanceRef.current.panTo(currentPosition, {
    animate: true,
    duration: 1, // seconds
    easeLinearity: 0.25,
  })

  // Extend flight path
  if (flightPathRef.current) {
    const latlngs = flightPathRef.current.getLatLngs()
    const last = latlngs[latlngs.length - 1]
    const newPoint = L.latLng(currentPosition[0], currentPosition[1])

    // Only add if different enough
    if (!last || newPoint.distanceTo(last) > 100) {
      latlngs.push(newPoint)
      flightPathRef.current.setLatLngs(latlngs)
    }
  }
}, [flight.currentPosition])


  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Loading overlay */}
      {!isTracking && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading flight data...</p>
          </div>
        </div>
      )}

      {/* Map controls info */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-2 text-xs text-gray-600">
        <p>🔵 Current Flight Path</p>
        <p>✈️ Live Position</p>
        {nearbyAirplanes.length > 0 && <p>✈️ Nearby Aircraft</p>}
      </div>
    </div>
  )
}
