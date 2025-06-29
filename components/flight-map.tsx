"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { FlightData } from "@/types/FlightData"
import conflict_data from "@/public/newdata25.json"
import { weathercodeToDescription } from "@/lib/weather"
import L from "leaflet"
import "leaflet.markercluster/dist/leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "leaflet.geodesic"

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
  const flightPathRef = useRef<any>(null)
  const nearbyMarkersRef = useRef<L.Marker[]>([])
  const animationRef = useRef<number | null>(null)
  const [userZoomed, setUserZoomed] = useState(false)
  const lastZoomRef = useRef<number>(6)
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)
  const visibleConflictRef = useRef<ConflictZone[]>([])

  const animateAirplane = useCallback((marker: L.Marker, heading: number) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)

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

  const initializeConflictZones = useCallback(() => {
    if (!mapInstanceRef.current) return
    if (clusterGroupRef.current) clusterGroupRef.current.clearLayers()

    const markers = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 60,
      chunkedLoading: true,
      chunkInterval: 200,
      iconCreateFunction: cluster => {
        const count = cluster.getChildCount()
        return L.divIcon({
          html: `<div style="
            width: 40px;
            height: 40px;
            background-color: rgba(220, 38, 38, 0.7);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            border: 2px solid rgba(153, 27, 27, 0.8);
          ">${count}</div>`,
          className: "custom-cluster",
          iconSize: [40, 40]
        })
      }
    })

    const conflictData: ConflictZone[] = conflict_data as ConflictZone[]
    visibleConflictRef.current = conflictData

    conflictData.forEach(conflict => {
      const marker = L.marker(conflict.position, {
        icon: L.divIcon({
          html: `<div style="
            width: 12px;
            height: 12px;
            background-color: #dc2626;
            border-radius: 50%;
            border: 1px solid #991b1b;
          "></div>`,
          className: "conflict-marker",
          iconSize: [12, 12]
        })
      })

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
      markers.addLayer(marker)
    })

    mapInstanceRef.current.addLayer(markers)
    clusterGroupRef.current = markers
    mapInstanceRef.current.on('moveend', updateVisibleConflicts)
  }, [])

  const updateVisibleConflicts = useCallback(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current) return
    const zoom = mapInstanceRef.current.getZoom()
    const options = clusterGroupRef.current.options as L.MarkerClusterGroupOptions
    options.maxClusterRadius = zoom > 8 ? 40 : 80
    clusterGroupRef.current.refreshClusters()
  }, [])

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

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current)

      mapInstanceRef.current.on('zoomend', () => {
        lastZoomRef.current = mapInstanceRef.current!.getZoom()
        setUserZoomed(true)
        updateVisibleConflicts()
      })

      initializeConflictZones()

      const fullPath: L.LatLngExpression[] = [
        flight.origin.coordinates,
        flight.currentPosition,
        flight.destination.coordinates,
      ]

      flightPathRef.current = (L as any).geodesic([fullPath], {
        weight: 3,
        opacity: 0.8,
        color: "#2563eb",
        steps: 50,
        dashArray: "10, 5",
      }).addTo(mapInstanceRef.current)

      L.marker(flight.origin.coordinates)
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">Origin</h3>
            <p>${flight.origin.name} (${flight.origin.code})</p>
            <p>${flight.origin.city}, ${flight.origin.country}</p>
          </div>
        `)

      L.marker(flight.destination.coordinates)
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">Destination</h3>
            <p>${flight.destination.name} (${flight.destination.code})</p>
            <p>${flight.destination.city}, ${flight.destination.country}</p>
          </div>
        `)

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
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('moveend', updateVisibleConflicts)
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [animateAirplane, userZoomed, initializeConflictZones, flight, updateVisibleConflicts])

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
