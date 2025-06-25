"use client"

import { useEffect, useState } from "react"
import { Search, Plane, MapPin, Gauge, CloudSun, Shield, History, TrendingUp, Zap, Compass, Clock, ArrowRight, Signal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import FlightMap from "@/components/flight-map"
import { mockNearbyAirplanes } from "@/lib/mock-data"
import { fetchFlightDataByCallsign } from "@/lib/fetchFlightData"
import { FlightData } from "@/types/FlightData"
import { getWeatherRisk } from "@/lib/getWeatherRisk"

interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  humidity: number;
}

interface RiskIndicatorProps {
  title: string;
  score: number;
  description: string;
  severity: "low" | "medium" | "high";
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

// Helper Components
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className="text-sm font-semibold text-gray-900">{value}</span>
  </div>
);

const RiskIndicator = ({ title, score, description, severity }: RiskIndicatorProps) => {
  const severityClasses = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800"
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge className={`${severityClasses[severity]} text-xs`}>
          {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </Badge>
      </div>
      <Progress 
        value={score * 10} 
        className="h-2"
        indicatorClassName={severityClasses[severity].split(' ')[0]}
      />
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
};

const MetricCard = ({ icon, label, value }: MetricCardProps) => (
  <div className="flex items-center space-x-3">
    <div className="bg-blue-50 p-2 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  </div>
);

export default function FlightTracker() {
  const [flightNumber, setFlightNumber] = useState("")
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null)
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 0,
    condition: "Clear",
    windSpeed: 0,
    humidity: 0
  })
  const [showNearbyAirplanes, setShowNearbyAirplanes] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [riskData, setRiskData] = useState({
    weatherRisk: 4,
    warZoneRisk: 2,
    overallRisk: 3,
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
      await updateRiskScores(flightData.currentPosition)
    } catch (error) {
      console.error("Error tracking flight:", error)
      setIsTracking(false)
    }
  }

  const updateRiskScores = async (position: [number, number]) => {
    const [lat, lon] = position

    try {
      const weatherData = await getWeatherRisk(lat, lon)
      const weatherRisk = weatherData.score
      const warZoneRisk = Math.floor(Math.random() * 5) + 1
      const overallRisk = Math.round((weatherRisk + warZoneRisk) / 2)

      setRiskData({
        weatherRisk,
        warZoneRisk,
        overallRisk,
      })

      setWeather({
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        windSpeed: weatherData.windSpeed,
        humidity: weatherData.humidity || 0,
      })
    } catch (error) {
      console.error("Error fetching weather risk:", error)
    }
  }

  const updateFlightAndRisk = async (newFlight: FlightData) => {
    if (!selectedFlight) return
    
    setSelectedFlight({
      ...newFlight,
      path: [
        ...selectedFlight.path,
        newFlight.currentPosition
      ],
    })
    await updateRiskScores(newFlight.currentPosition)
  }

  const moveFlight = (flight: FlightData): FlightData => {
    const [lat, lon] = flight.currentPosition
    const speedMps = (flight.speed * 1609.34) / 3600 // Convert mph to m/s
    const moveDistance = speedMps * 6 // in meters over 6 seconds
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

    const finalLat = (newLat * 180) / Math.PI
    const finalLon = (newLon * 180) / Math.PI

    return {
      ...flight,
      currentPosition: [finalLat, finalLon],
      path: [
        ...flight.path,
        [finalLat, finalLon],
      ],
    }
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout
    
    if (isTracking && selectedFlight) {
      intervalId = setInterval(async () => {
        try {
          const liveData = await fetchFlightDataByCallsign(selectedFlight.flightNumber)
          if (liveData) {
            await updateFlightAndRisk(liveData)
          } else {
            // Simulate movement if no new data
            setSelectedFlight(prev => prev ? moveFlight(prev) : null)
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Branding */}
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FlightTracker Pro</h1>
                <p className="text-xs text-gray-500">Real-time aviation monitoring</p>
              </div>
            </div>
            
            {/* Search */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full md:w-auto">
              <div className="relative flex-1 min-w-[250px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400 h-4 w-4" />
                </div>
                <Input
                  type="text"
                  placeholder="Enter flight number (e.g., AA123) or airline"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="pl-10 h-full"
                  onKeyDown={(e) => e.key === "Enter" && handleTrackFlight()}
                />
              </div>
              <Button 
                onClick={handleTrackFlight} 
                className="bg-blue-600 hover:bg-blue-700 h-full py-2"
                disabled={isTracking}
              >
                {isTracking ? "Tracking..." : "Track Flight"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {selectedFlight ? (
          <>
            {/* Flight Overview Section */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Map */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
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

              {/* Flight Summary */}
              <div className="space-y-4">
                <Card className="border border-gray-200">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Plane className="h-4 w-4 text-blue-600" />
                      Flight Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <InfoRow 
                      label="Flight Number" 
                      value={
                        <Badge variant="secondary" className="font-mono">
                          {selectedFlight.flightNumber}
                        </Badge>
                      } 
                    />
                    
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-500">Route</Label>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          <span className="font-bold">{selectedFlight.origin.code}</span>
                          <span className="text-gray-500 ml-1">({selectedFlight.origin.city})</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                        <div className="text-sm font-medium">
                          <span className="font-bold">{selectedFlight.destination.code}</span>
                          <span className="text-gray-500 ml-1">({selectedFlight.destination.city})</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 space-y-2">
                      <InfoRow 
                        label="Airline" 
                        value={
                          <span className="text-sm">
                            {selectedFlight.airline.name} 
                            <span className="text-gray-500 ml-1">({selectedFlight.airline.callsign})</span>
                          </span>
                        } 
                      />
                      <InfoRow label="Aircraft" value={selectedFlight.aircraft} />
                      <InfoRow 
                        label="Status" 
                        value={
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {selectedFlight.status}
                          </Badge>
                        } 
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card className="border border-gray-200">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-blue-600" />
                      Flight Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard 
                        icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
                        label="Altitude"
                        value={`${selectedFlight.altitude.toLocaleString()} ft`}
                      />
                      <MetricCard 
                        icon={<Zap className="h-4 w-4 text-blue-600" />}
                        label="Speed"
                        value={`${selectedFlight.speed} mph`}
                      />
                      <MetricCard 
                        icon={<Compass className="h-4 w-4 text-blue-600" />}
                        label="Heading"
                        value={`${selectedFlight.heading}°`}
                      />
                      <MetricCard 
                        icon={<Clock className="h-4 w-4 text-blue-600" />}
                        label="Duration"
                        value="2h 45m remaining"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Weather and Risk Section */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weather Card */}
              <Card className="border border-gray-200">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CloudSun className="h-4 w-4 text-blue-600" />
                    Current Weather
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Along flight path near {selectedFlight.origin.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-3xl font-light">{weather.temperature}°C</div>
                    <div className="text-sm text-gray-500 capitalize">{weather.condition}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoRow label="Wind" value={`${weather.windSpeed} km/h`} />
                    <InfoRow label="Humidity" value={`${weather.humidity}%`} />
                    <InfoRow label="Pressure" value="1012 hPa" />
                    <InfoRow label="Visibility" value="10 km" />
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <div className="lg:col-span-2">
                <Card className="border border-gray-200 h-full">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Safety Assessment
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Real-time risk evaluation for flight {selectedFlight.flightNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <RiskIndicator 
                        title="Weather Risk"
                        score={riskData.weatherRisk}
                        description="Current weather conditions"
                        severity={riskData.weatherRisk > 7 ? "high" : riskData.weatherRisk > 4 ? "medium" : "low"}
                      />
                      <RiskIndicator 
                        title="Airspace Risk"
                        score={riskData.warZoneRisk}
                        description="Geopolitical factors"
                        severity={riskData.warZoneRisk > 7 ? "high" : riskData.warZoneRisk > 4 ? "medium" : "low"}
                      />
                      <RiskIndicator 
                        title="Technical Risk"
                        score={3}
                        description="Aircraft status"
                        severity="low"
                      />
                    </div>
                    
                    {/* Overall Risk */}
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">Overall Flight Safety</h3>
                        <Badge 
                          variant={riskData.overallRisk > 7 ? "destructive" : riskData.overallRisk > 4 ? "warning" : "default"}
                          className="text-xs"
                        >
                          {riskData.overallRisk > 7 ? "Elevated Risk" : riskData.overallRisk > 4 ? "Moderate Risk" : "Low Risk"}
                        </Badge>
                      </div>
                      <Progress 
                        value={riskData.overallRisk * 10} 
                        className="h-2"
                        indicatorClassName={
                          riskData.overallRisk > 7 ? "bg-red-500" : 
                          riskData.overallRisk > 4 ? "bg-yellow-500" : "bg-green-500"
                        }
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {riskData.overallRisk > 7 
                          ? "Exercise caution - multiple risk factors present" 
                          : riskData.overallRisk > 4 
                            ? "Standard risk level - monitor conditions" 
                            : "Minimal risk - normal operations"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Recent Flights Section */}
            {recentFlights.length > 0 && (
              <section>
                <Card className="border border-gray-200">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <History className="h-4 w-4 text-blue-600" />
                      Recently Tracked Flights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      {recentFlights.map((flight, index) => (
                        <Button 
                          key={index} 
                          variant="outline" 
                          className="flex flex-col items-center justify-center h-20 gap-1"
                          onClick={() => {
                            setSelectedFlight(flight)
                            setIsTracking(true)
                          }}
                        >
                          <span className="font-mono text-sm">{flight.flightNumber}</span>
                          <span className="text-xs text-gray-500">
                            {flight.origin.code} → {flight.destination.code}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-96">
            <Plane className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-500">No flight selected</h2>
            <p className="text-gray-400 mt-2">Enter a flight number to begin tracking</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>© {new Date().getFullYear()} FlightTracker Pro</span>
              <span>•</span>
              <span>Data updates every 6 seconds</span>
            </div>
            <div className="mt-2 md:mt-0">
              <span className="flex items-center">
                <Signal className="h-3 w-3 text-green-500 mr-1" />
                System status: Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}