import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Gauge, TrendingUp, Zap, Compass, Clock } from "lucide-react"
import MetricCard from "@/components/shared/MetricCard"
import { FlightData } from "@/types/FlightData"

export default function PerformanceMetrics({ flight }: { flight: FlightData }) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Gauge className="h-4 w-4 text-blue-600" />
          Flight Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={<TrendingUp className="h-4 w-4 text-blue-600" />} label="Altitude" value={`${flight.altitude.toLocaleString()} ft`} />
          <MetricCard icon={<Zap className="h-4 w-4 text-blue-600" />} label="Speed" value={`${flight.speed} mph`} />
          <MetricCard icon={<Compass className="h-4 w-4 text-blue-600" />} label="Heading" value={`${flight.heading}°`} />
          <MetricCard icon={<Clock className="h-4 w-4 text-blue-600" />} label="Duration" value="2h 45m remaining" />
        </div>
      </CardContent>
    </Card>
  )
}
