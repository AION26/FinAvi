"use client"

import { useEffect, useState } from "react"
import { MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

import FlightMap from "@/components/flight-map"
import { mockNearbyAirplanes } from "@/lib/mock-data"
import { fetchFlightDataByCallsign } from "@/lib/fetchFlightData"
import { getWeatherRisk } from "@/lib/getWeatherRisk"
import { getOverallFlightRisk, getConflictRiskAtCurrentPosition } from "@/lib/flightutils"

import type { FlightData } from "@/types/FlightData"

import FlightSummary from "@/components/flight/FlightSummary"
import WeatherCard from "@/components/flight/WeatherCard"
import EmptyState from "@/components/flight/EmptyState"
import PerformanceMetrics from "@/components/flight/PerformanceMetrics"
import RiskAssessment from "@/components/flight/RiskAssessment"
import RecentFlights from "@/components/flight/RecentFlights"
import { ConflictZone } from "@/types/ConflictZone"

interface WeatherData {
  temperature: number
  condition: string
  windSpeed: number
  humidity: number
}


export default function FlightTracker() {
  const [flightNumber, setFlightNumber] = useState("")
  const [crisisMode, setCrisisMode] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null)
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 0,
    condition: "Clear",
    windSpeed: 0,
    humidity: 0,
  })
  const [showNearbyAirplanes, setShowNearbyAirplanes] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [riskData, setRiskData] = useState<{
    weatherRisk: number
    warZoneRisk: number
    overallRisk: number
    nearestConflict: ConflictZone | null
  }>({
    weatherRisk: 4,
    warZoneRisk: 2,
    overallRisk: 3,
    nearestConflict: null,
  })
  const [recentFlights, setRecentFlights] = useState<FlightData[]>([])

  const handleTrackFlight = async () => {
    if (!flightNumber.trim()) return

    setIsTracking(true)

    try {
      const flightData = await fetchFlightDataByCallsign(flightNumber)
      console.log("Fetched flight data:", flightData)

      if (!flightData) {
        alert("Flight not found")
        setIsTracking(false)
        return
      }

      setSelectedFlight(flightData)
      setRecentFlights(prev => [flightData, ...prev.slice(0, 4)])

      await updateRiskScores(
        flightData.currentPosition,
        flightData.origin.coordinates,
        flightData.destination.coordinates
      )
    } catch (error) {
      console.error("Error tracking flight:", error)
      setIsTracking(false)
    }
  }

  const updateRiskScores = async (
    position: [number, number],
    origin: [number, number],
    destination: [number, number]
  ) => {
    const [lat, lon] = position

    try {
      const weatherData = await getWeatherRisk(lat, lon)
      const weatherRisk = weatherData.score

      const {
        overallRiskScore,
        airportRisk,
        pathRisk,
        currentRisk,
      } = await getOverallFlightRisk(origin, destination, position)

      const { nearbyConflicts } = await getConflictRiskAtCurrentPosition(position)

      const nearestConflict =
        nearbyConflicts.length > 0
          ? nearbyConflicts.sort(
              (a, b) =>
                haversineDistance(position, a.position) -
                haversineDistance(position, b.position)
            )[0]
          : null

      setRiskData({
        weatherRisk,
        warZoneRisk: Math.round(
          (airportRisk + pathRisk + (currentRisk ?? 0)) / 3
        ),
        overallRisk: Math.round((weatherRisk + overallRiskScore) / 2),
        nearestConflict,
      })

      setWeather({
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        windSpeed: weatherData.windSpeed,
        humidity: weatherData.humidity || 0,
      })
    } catch (error) {
      console.error("Error updating risk scores:", error)
    }
  }

  const updateFlightAndRisk = async (newFlight: FlightData) => {
    setSelectedFlight(prev => ({
      ...newFlight,
      path: [...(prev?.path || []), newFlight.currentPosition],
    }))

    await updateRiskScores(
      newFlight.currentPosition,
      newFlight.origin.coordinates,
      newFlight.destination.coordinates
    )
  }

  const moveFlight = (flight: FlightData): FlightData => {
    const [lat, lon] = flight.currentPosition
    const speedMps = (flight.speed * 1609.34) / 3600 // mph to m/s
    const moveDistance = speedMps * 6 // 6 sec interval
    const R = 6371e3 // Earth radius in meters

    const delta = moveDistance / R
    const headingRad = (flight.heading * Math.PI) / 180
    const latRad = (lat * Math.PI) / 180
    const lonRad = (lon * Math.PI) / 180

    const newLat = Math.asin(
      Math.sin(latRad) * Math.cos(delta) +
        Math.cos(latRad) * Math.sin(delta) * Math.cos(headingRad)
    )
    const newLon =
      lonRad +
      Math.atan2(
        Math.sin(headingRad) * Math.sin(delta) * Math.cos(latRad),
        Math.cos(delta) - Math.sin(latRad) * Math.sin(newLat)
      )

    return {
      ...flight,
      currentPosition: [(newLat * 180) / Math.PI, (newLon * 180) / Math.PI],
      path: [...flight.path, [(newLat * 180) / Math.PI, (newLon * 180) / Math.PI]],
    }
  }

  function haversineDistance(
    [lat1, lon1]: [number, number],
    [lat2, lon2]: [number, number]
  ): number {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (isTracking && selectedFlight) {
      intervalId = setInterval(async () => {
        try {
          const liveData = await fetchFlightDataByCallsign(
            selectedFlight.flightNumber
          )
          if (liveData) {
            await updateFlightAndRisk(liveData)
          } else {
            setSelectedFlight(prev => {
              if (!prev) return null

              const moved = moveFlight(prev)

              updateRiskScores(
                moved.currentPosition,
                moved.origin.coordinates,
                moved.destination.coordinates
              )

              return moved
            })
          }
        } catch (error) {
          console.error("Error updating flight data:", error)
        }
      }, 6000)
    }

    return () => clearInterval(intervalId)
  }, [isTracking, selectedFlight?.flightNumber])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        crisisMode={crisisMode}
        setCrisisMode={setCrisisMode}
        flightNumber={flightNumber}
        setFlightNumber={setFlightNumber}
        onTrack={handleTrackFlight}
        isTracking={isTracking}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {selectedFlight ? (
          <>
            {/* Overview */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Flight Path Visualization
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="nearby-airplanes"
                      checked={showNearbyAirplanes}
                      onCheckedChange={setShowNearbyAirplanes}
                    />
                    <Label htmlFor="nearby-airplanes" className="text-sm text-gray-600">
                      Show nearby traffic
                    </Label>
                  </div>
                </div>
                <Card className="h-[500px] shadow-sm border border-gray-200">
                  <FlightMap
                    flight={selectedFlight}
                    nearbyAirplanes={showNearbyAirplanes ? mockNearbyAirplanes : []}
                    isTracking={isTracking}
                  />
                </Card>
              </div>
              <div className="space-y-4">
                <FlightSummary flight={selectedFlight} />
                <PerformanceMetrics flight={selectedFlight} />
              </div>
            </section>

            {/* Risk + Weather */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <WeatherCard weather={weather} city={selectedFlight.origin.city} />
              <div className="lg:col-span-2">
                <RiskAssessment
                  riskData={riskData}
                  flightNumber={selectedFlight.flightNumber}
                />
              </div>
            </section>

            {/* Conflict Zone Alert */}
            {riskData.nearestConflict && (
              <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-sm text-yellow-800">
                ⚠️ Nearest Conflict Zone: <strong>{riskData.nearestConflict.location}</strong>
                <br />
                <span className="text-xs italic">
                  Type: {riskData.nearestConflict.type} • Notes:{" "}
                  {riskData.nearestConflict.notes}
                </span>
              </div>
            )}

            <RecentFlights
              recentFlights={recentFlights}
              onSelect={(flight) => {
                setSelectedFlight(flight)
                setIsTracking(true)
              }}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </main>

      <Footer crisisMode={crisisMode} />
    </div>
  )
}
