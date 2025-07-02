import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { History } from "lucide-react"
import { FlightData } from "@/types/FlightData"

interface Props {
  recentFlights: FlightData[]
  onSelect: (flight: FlightData) => void
}

export default function RecentFlights({ recentFlights, onSelect }: Props) {
  if (recentFlights.length === 0) return null

  return (
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
                onClick={() => onSelect(flight)}
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
  )
}
