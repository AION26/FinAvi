"use client"
import { Plane, Search, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export default function Header({
  flightNumber,
  setFlightNumber,
  onTrack,
  isTracking
}: {
  crisisMode: boolean;
  setCrisisMode: (val: boolean) => void;
  flightNumber: string;
  setFlightNumber: (val: string) => void;
  onTrack: () => void;
  isTracking: boolean;
}) {
  const [crisisMode, setCrisisMode] = useState(false)
  const [selectedCrisisFlight, setSelectedCrisisFlight] = useState("HU1234")

  // Transition effect
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("transitioning-crisis", crisisMode)
    if (crisisMode) {
      setFlightNumber(selectedCrisisFlight)
      setTimeout(() => onTrack(), 600)
    }
  }, [crisisMode, selectedCrisisFlight])

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b transition-all duration-700 shadow-md",
      crisisMode ? "bg-red-600 border-red-800 text-white" : "bg-white text-gray-900"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-700">
          {/* Branding + Toggle */}
          <div className="flex items-center justify-between w-full md:w-auto space-x-4">
            <div className={cn("p-2 rounded-lg transition-all duration-500", crisisMode ? "bg-red-800 animate-pulse" : "bg-blue-600")}>
              {crisisMode ? (
                <AlertTriangle className="h-6 w-6 text-white animate-ping-slow" />
              ) : (
                <Plane className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h1 className={cn("text-xl font-bold transition-all", crisisMode ? "text-white" : "text-gray-900")}>
                {crisisMode ? "AeroRisk 360" : "FlightTracker Pro"}
              </h1>
              <p className={cn("text-xs transition-all", crisisMode ? "text-red-200" : "text-gray-500")}>
                {crisisMode ? "Coordinating critical aid operations" : "Real-time aviation monitoring"}
              </p>
            </div>
            {/* Crisis Toggle */}
            <div className="flex items-center space-x-2">
              <Switch id="crisis-mode" checked={crisisMode} onCheckedChange={setCrisisMode} />
              <label htmlFor="crisis-mode" className={cn("text-sm font-medium", crisisMode ? "text-white" : "text-gray-700")}>
                Crisis Mode
              </label>
            </div>
          </div>

          {/* Flight Input or Simulation Selector */}
          {!crisisMode ? (
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full md:w-auto">
              <div className="relative flex-1 min-w-[250px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400 h-4 w-4" />
                </div>
                <Input
                  type="text"
                  placeholder="Enter flight number (e.g., AA123)"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="pl-10 h-full"
                  onKeyDown={(e) => e.key === "Enter" && onTrack()}
                />
              </div>
              <Button
                onClick={onTrack}
                className="bg-blue-600 hover:bg-blue-700 h-full py-2"
                disabled={isTracking}
              >
                {isTracking ? "Tracking..." : "Track Flight"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">🛰️ Simulating:</span>
              <Select value={selectedCrisisFlight} onValueChange={setSelectedCrisisFlight}>
                <SelectTrigger className="w-[180px] bg-red-700 text-white border-white">
                  <SelectValue placeholder="Select Flight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HU1234">HU1234 – Gaza Strip Emergency</SelectItem>
                  <SelectItem value="MSF-475">MSF-475 – South Sudan Medevac</SelectItem>
                  <SelectItem value="UN-AID92">UN-AID92 – Sudan Supply Drop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
