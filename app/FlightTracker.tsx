"use client"

import { useEffect, useState } from "react"
import { Search, Plane, MapPin, Gauge, Navigation, Wind } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import FlightMap from "@/components/flight-map"
import { mockNearbyAirplanes } from "@/lib/mock-data"
import { fetchFlightDataByCallsign } from "@/lib/fetchFlightData"
import { FlightData } from "@/types/FlightData"

export default function FlightTracker() {
  const [flightNumber, setFlightNumber] = useState("")
  const [selectedFlight, setSelectedFlight] = useState<FlightData>({
    flightNumber: "",
    currentPosition: [0, 0],
    origin: {
      code: "",
      name: "",
      city: "",
      country: "",
      coordinates: [0, 0],
    },
    destination: {
      code: "",
      name: "",
      city: "",
      country: "",
      coordinates: [0, 0],
    },
    airline: {
      name: "",
      code: "",
      callsign: "",
    },
    altitude: 0,
    speed: 0,
    heading: 0,
    aircraft: "",
    status: "Unknown",
    path: [],
  })

  const [showNearbyAirplanes, setShowNearbyAirplanes] = useState(false)
  const [isTracking, setIsTracking] = useState(true)
  const [riskData, setRiskData] = useState({
    weatherRisk: 4,
    warZoneRisk: 2,
    overallRisk: 3,
  })

  const handleTrackFlight = async () => {
    if (!flightNumber.trim()) return

    setIsTracking(true)

    const flightData = await fetchFlightDataByCallsign(flightNumber)
    console.log("Fetched flight data:", flightData)

    if (!flightData) {
      alert("Flight not found")
      setIsTracking(false)
      return
    }

    setSelectedFlight(flightData)

    const weatherRisk = Math.floor(Math.random() * 10) + 1
    const warZoneRisk = Math.floor(Math.random() * 5) + 1
    const overallRisk = Math.round((weatherRisk + warZoneRisk) / 2)

    setRiskData({
      weatherRisk,
      warZoneRisk,
      overallRisk,
    })
  }

  const updateFlightAndRisk = async (newF: FlightData) => {
    setSelectedFlight(newF)
    const weatherRisk = Math.floor(Math.random() * 10) + 1
    const warZoneRisk = Math.floor(Math.random() * 5) + 1
    const overallRisk = Math.round((weatherRisk + warZoneRisk) / 2)

    setRiskData({
      weatherRisk,
      warZoneRisk,
      overallRisk,
    })
  }

  const getRiskColor = (score: number) => {
    if (score <= 3) return "text-green-600"
    if (score <= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getRiskLevel = (score: number) => {
    if (score <= 3) return "Low"
    if (score <= 6) return "Medium"
    return "High"
  }

  useEffect(() => {
    let intervalId: number
    if (isTracking && selectedFlight.flightNumber) {
      intervalId = window.setInterval(async () => {
        const newData = await fetchFlightDataByCallsign(selectedFlight.flightNumber)
        if (newData) updateFlightAndRisk(newData)
      }, 6000)
    }
    return () => clearInterval(intervalId)
  }, [isTracking, selectedFlight.flightNumber])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Plane className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">FlightTracker</h1>
            </div>
            <div className="flex items-center space-x-2 max-w-md w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Enter flight number (e.g., AA123)"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && handleTrackFlight()}
                />
              </div>
              <Button onClick={handleTrackFlight} className="bg-blue-600 hover:bg-blue-700">
                Track Flight
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="h-[600px]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Live Flight Tracking</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="nearby-airplanes"
                      checked={showNearbyAirplanes}
                      onCheckedChange={setShowNearbyAirplanes}
                    />
                    <Label htmlFor="nearby-airplanes" className="text-sm">
                      Show nearby airplanes
                    </Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[520px]">
                <FlightMap
                  flight={selectedFlight}
                  nearbyAirplanes={showNearbyAirplanes ? mockNearbyAirplanes : []}
                  isTracking={isTracking}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plane className="h-5 w-5" />
                  <span>Flight Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Flight Number</span>
                  <Badge variant="outline">{selectedFlight.flightNumber}</Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Route</span>
                  <span className="text-sm">
                    {selectedFlight.origin.code} ({selectedFlight.origin.city}) →{" "}
                    {selectedFlight.destination.code} ({selectedFlight.destination.city})
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Airline</span>
                  <Badge variant="outline">
                    {selectedFlight.airline.name} ({selectedFlight.airline.callsign})
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Aircraft</span>
                  <span className="text-sm">{selectedFlight.aircraft}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <Badge className="bg-green-100 text-green-800">{selectedFlight.status}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gauge className="h-5 w-5" />
                  <span>Live Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Altitude</span>
                  <span className="text-lg font-semibold">{selectedFlight.altitude.toLocaleString()} ft</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Speed</span>
                  <span className="text-lg font-semibold">{selectedFlight.speed} mph</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Heading</span>
                  <span className="text-lg font-semibold">{selectedFlight.heading}°</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full" />
                <span>Flight Risk Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Weather Risk */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <h3 className="font-semibold text-gray-900">Weather Risk</h3>
                    <Badge className={getRiskColor(riskData.weatherRisk)}>
                      {getRiskLevel(riskData.weatherRisk)}
                    </Badge>
                  </div>
                  <Progress value={riskData.weatherRisk * 10} className="h-2" />
                  <p className="text-sm text-gray-600">Score: {riskData.weatherRisk}/10</p>
                  <p className="text-xs text-gray-500">
                    Based on current weather conditions along the flight path
                  </p>
                </div>

                {/* War Zone Risk */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <h3 className="font-semibold text-gray-900">War Zone Risk</h3>
                    <Badge className={getRiskColor(riskData.warZoneRisk)}>
                      {getRiskLevel(riskData.warZoneRisk)}
                    </Badge>
                  </div>
                  <Progress value={riskData.warZoneRisk * 10} className="h-2" />
                  <p className="text-sm text-gray-600">Score: {riskData.warZoneRisk}/10</p>
                  <p className="text-xs text-gray-500">
                    Based on geopolitical situation in flight regions
                  </p>
                </div>

                {/* Overall Risk */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <h3 className="font-semibold text-gray-900">Overall Risk Score</h3>
                    <Badge className={`${getRiskColor(riskData.overallRisk)} text-lg px-3 py-1`}>
                      {riskData.overallRisk}/10
                    </Badge>
                  </div>
                  <Progress value={riskData.overallRisk * 10} className="h-3" />
                  <p className="text-sm font-semibold text-gray-700">
                    Risk Level: {getRiskLevel(riskData.overallRisk)}
                  </p>
                  <p className="text-xs text-gray-500">Composite score based on all risk factors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
