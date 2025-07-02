import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Shield } from "lucide-react"
import RiskIndicator from "@/components/shared/RiskIndicator"

interface Props {
  riskData: {
    weatherRisk: number
    warZoneRisk: number
    overallRisk: number
  }
  flightNumber: string
}

export default function RiskAssessment({ riskData, flightNumber }: Props) {
  const getSeverity = (score: number) =>
    score > 7 ? "high" : score > 4 ? "medium" : "low"

  const getBadgeVariant = (score: number) =>
    score > 7 ? "destructive" : score > 4 ? "warning" : "default"

  const getRiskText = (score: number) =>
    score > 7
      ? "Exercise caution - multiple risk factors present"
      : score > 4
      ? "Standard risk level - monitor conditions"
      : "Minimal risk - normal operations"

  return (
    <Card className="border border-gray-200 h-full">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          Safety Assessment
        </CardTitle>
        <CardDescription className="text-xs">
          Real-time risk evaluation for flight {flightNumber}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RiskIndicator
            title="Weather Risk"
            score={riskData.weatherRisk}
            description="Current weather conditions"
            severity={getSeverity(riskData.weatherRisk)}
          />
          <RiskIndicator
            title="Airspace Risk"
            score={riskData.warZoneRisk}
            description="Geopolitical factors"
            severity={getSeverity(riskData.warZoneRisk)}
          />
          <RiskIndicator
            title="Technical Risk"
            score={3}
            description="Aircraft status"
            severity="low"
          />
        </div>
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Overall Flight Safety</h3>
            <Badge variant={getBadgeVariant(riskData.overallRisk)} className="text-xs">
              {riskData.overallRisk > 7
                ? "Elevated Risk"
                : riskData.overallRisk > 4
                ? "Moderate Risk"
                : "Low Risk"}
            </Badge>
          </div>
          <Progress
            value={riskData.overallRisk * 10}
            className="h-2"
            indicatorClassName={
              riskData.overallRisk > 7
                ? "bg-red-500"
                : riskData.overallRisk > 4
                ? "bg-yellow-500"
                : "bg-green-500"
            }
          />
          <p className="text-xs text-gray-500 mt-2">{getRiskText(riskData.overallRisk)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
