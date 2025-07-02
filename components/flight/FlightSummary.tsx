import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowRight, Plane } from "lucide-react"
import { InfoRow } from "@/components/shared/InfoRow"
import { FlightData } from "@/types/FlightData"

export default function FlightSummary({ flight }: { flight: FlightData }) {
  return (
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
              {flight.flightNumber}
            </Badge>
          } 
        />
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-500">Route</Label>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              <span className="font-bold">{flight.origin.code}</span>
              <span className="text-gray-500 ml-1">({flight.origin.city})</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
            <div className="text-sm font-medium">
              <span className="font-bold">{flight.destination.code}</span>
              <span className="text-gray-500 ml-1">({flight.destination.city})</span>
            </div>
          </div>
        </div>
        <div className="pt-2 space-y-2">
          <InfoRow 
            label="Airline" 
            value={
              <span className="text-sm">
                {flight.airline.name} 
                <span className="text-gray-500 ml-1">({flight.airline.callsign})</span>
              </span>
            } 
          />
          <InfoRow label="Aircraft" value={flight.aircraft} />
          <InfoRow 
            label="Status" 
            value={
              <Badge className="bg-green-100 text-green-800 text-xs">
                {flight.status}
              </Badge>
            } 
          />
        </div>
      </CardContent>
    </Card>
  )
}
