"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { FlightData } from "@/types/FlightData"
import conflict_data from "@/public/newdata25.json"
import { weathercodeToDescription } from "@/lib/weather"
import * as L from "leaflet"
import "leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "leaflet.geodesic"

// Enhanced Leaflet type declarations
declare module 'leaflet' {
  interface GeodesicOptions extends PolylineOptions {
    steps?: number;
  }

  class Geodesic extends Polyline {
    constructor(latlngs?: LatLngExpression[], options?: GeodesicOptions);
    getBounds(): LatLngBounds;
  }

  function geodesic(latlngs: LatLngExpression[], options?: GeodesicOptions): Geodesic;
}

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
  // Refs
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const airplaneMarkerRef = useRef<L.Marker | null>(null)
  const flightPathRef = useRef<L.Geodesic | null>(null)
  const nearbyMarkersRef = useRef<L.Marker[]>([])
  const animationRef = useRef<number | null>(null)
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)
  
  // State
  const [userZoomed, setUserZoomed] = useState(false)
  const lastZoomRef = useRef<number>(6)
  const visibleConflictRef = useRef<ConflictZone[]>([])

  // Helper function to calculate bounds from points
  const calculateBounds = useCallback((points: L.LatLngExpression[]) => {
    return points.reduce((bounds, point) => {
      return bounds.extend(point)
    }, L.latLngBounds(points[0], points[0]))
  }, [])

  // Airplane animation
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
      const iconHtml = `
        <div style="transform: rotate(${heading + wobble}deg); color: #2563eb; font-size: 28px;">
          ✈️
        </div>
      `
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

    // Clear existing layers if they exist
    if (clusterGroupRef.current) {
      mapInstanceRef.current.removeLayer(clusterGroupRef.current)
      clusterGroupRef.current = null
    }

    const markers = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 60,
      chunkedLoading: true,
      chunkInterval: 200,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        return L.divIcon({
          html: `
            <div style="
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
            ">
              ${count}
            </div>
          `,
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
          html: `
            <div style="
              width: 12px;
              height: 12px;
              background-color: #dc2626;
              border-radius: 50%;
              border: 1px solid #991b1b;
            "></div>
          `,
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

  // Update visible conflicts on zoom
  const updateVisibleConflicts = useCallback(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current) return
    const zoom = mapInstanceRef.current.getZoom()
    const options = clusterGroupRef.current.options as L.MarkerClusterGroupOptions
    options.maxClusterRadius = zoom > 8 ? 40 : 80
    clusterGroupRef.current.refreshClusters()
  }, [])

  // Initialize nearby airplane markers
  const initializeNearbyAirplanes = useCallback(() => {
    if (!mapInstanceRef.current) return

    // Clear existing markers
    nearbyMarkersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker)
    })
    nearbyMarkersRef.current = []

    nearbyAirplanes.forEach(airplane => {
      const marker = L.marker(airplane.position, {
        icon: L.divIcon({
          html: `
            <div style="
              transform: rotate(90deg);
              color: #4b5563;
              font-size: 24px;
              opacity: 0.8;
            ">
              ✈️
            </div>
          `,
          className: "nearby-airplane-icon",
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      })

      const popupContent = `
        <div class="p-2 text-sm">
          <strong>Flight:</strong> ${airplane.flightNumber}<br>
          <strong>Altitude:</strong> ${airplane.altitude.toLocaleString()} ft
        </div>
      `
      marker.bindPopup(popupContent)
      marker.addTo(mapInstanceRef.current!)
      nearbyMarkersRef.current.push(marker)
    })
  }, [nearbyAirplanes])

  // Main map initialization effect
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || mapInstanceRef.current) return

    const initMap = () => {
      try {
        // Configure default icons
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })

        // Initialize map
        mapInstanceRef.current = L.map(mapRef.current!, {
          zoomControl: false,
          preferCanvas: true
        }).setView(flight.currentPosition, lastZoomRef.current)

        // Add base layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(mapInstanceRef.current)

        // Add zoom control with position
        L.control.zoom({
          position: 'topright'
        }).addTo(mapInstanceRef.current)

        // Set up event handlers
        mapInstanceRef.current.on('zoomend', () => {
          lastZoomRef.current = mapInstanceRef.current!.getZoom()
          setUserZoomed(true)
          updateVisibleConflicts()
        })

        // Initialize layers
        initializeConflictZones()
        initializeNearbyAirplanes()

        // Create flight path
        const fullPath: L.LatLngExpression[] = [
          flight.origin.coordinates,
          flight.currentPosition,
          flight.destination.coordinates,
        ]

        flightPathRef.current = L.geodesic([fullPath], {
          weight: 3,
          opacity: 0.8,
          color: "#2563eb",
          steps: 50,
          dashArray: "10, 5",
        })
        flightPathRef.current.addTo(mapInstanceRef.current)

        // Add origin marker
        L.marker(flight.origin.coordinates)
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold">Origin</h3>
              <p>${flight.origin.name} (${flight.origin.code})</p>
              <p>${flight.origin.city}, ${flight.origin.country}</p>
            </div>
          `)

        // Add destination marker
        L.marker(flight.destination.coordinates)
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold">Destination</h3>
              <p>${flight.destination.name} (${flight.destination.code})</p>
              <p>${flight.destination.city}, ${flight.destination.country}</p>
            </div>
          `)

        // Add airplane marker
        const airplaneIcon = L.divIcon({
          html: `
            <div style="transform: rotate(${flight.heading}deg); color: #2563eb; font-size: 28px;">
              ✈️
            </div>
          `,
          className: "custom-airplane-icon",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })

        airplaneMarkerRef.current = L.marker(flight.currentPosition, { 
          icon: airplaneIcon,
          zIndexOffset: 1000 // Ensure airplane is always on top
        })
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

        // Fit bounds to flight path if user hasn't zoomed manually
        if (!userZoomed && mapInstanceRef.current) {
          try {
            const bounds = flightPathRef.current?.getBounds() || calculateBounds(fullPath)
            mapInstanceRef.current.fitBounds(bounds, { 
              padding: [50, 50],
              maxZoom: 8
            })
          } catch (e) {
            console.error("Error fitting bounds:", e)
            const fallbackBounds = calculateBounds(fullPath)
            mapInstanceRef.current.fitBounds(fallbackBounds, { 
              padding: [50, 50],
              maxZoom: 8
            })
          }
        }
      } catch (error) {
        console.error("Map initialization error:", error)
      }
    }

    initMap()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off()
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [animateAirplane, calculateBounds, flight, initializeConflictZones, initializeNearbyAirplanes, updateVisibleConflicts, userZoomed])

  // Update nearby airplanes when they change
  useEffect(() => {
    if (mapInstanceRef.current) {
      initializeNearbyAirplanes()
    }
  }, [initializeNearbyAirplanes, nearbyAirplanes])

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

      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-2 text-xs text-gray-600 shadow-md">
        <p><span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span> Flight Path</p>
        <p><span className="text-blue-500 text-lg">✈️</span> Current Position</p>
        <p><span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span> Conflict Zone</p>
        {nearbyAirplanes.length > 0 && <p><span className="text-gray-500 text-lg">✈️</span> Nearby Aircraft</p>}
      </div>
    </div>
  )
}