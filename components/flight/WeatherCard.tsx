import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CloudSun } from "lucide-react"
import {InfoRow} from "@/components/shared/InfoRow"

interface Props {
  weather: {
    temperature: number
    condition: string
    windSpeed: number
    humidity: number
  }
  city: string
}

export default function WeatherCard({ weather, city }: Props) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CloudSun className="h-4 w-4 text-blue-600" />
          Current Weather
        </CardTitle>
        <CardDescription className="text-xs">
          Along flight path near {city}
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
  )
}
