import { Signal, AlertTriangle } from "lucide-react"

export default function Footer({ crisisMode = false }: { crisisMode?: boolean }) {
  return (
    <footer className={`border-t py-4 ${crisisMode ? "bg-red-600 text-white border-red-700" : "bg-white text-gray-500"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm gap-2">
          {/* Left Side */}
          <div className="flex items-center space-x-4">
            <span>© {new Date().getFullYear()} {crisisMode ? "CrisisFlight Command" : "FlightTracker Pro"}</span>
            <span>•</span>
            <span>Data updates every 6 seconds</span>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {crisisMode ? (
              <>
                <AlertTriangle className="h-3 w-3 text-yellow-300 animate-pulse" />
                <span className="font-medium">Crisis Simulation Active</span>
              </>
            ) : (
              <>
                <Signal className="h-3 w-3 text-green-500" />
                <span>System status: Operational</span>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
