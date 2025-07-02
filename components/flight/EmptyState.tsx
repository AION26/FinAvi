import { Plane } from "lucide-react"

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <Plane className="h-16 w-16 text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-500">No flight selected</h2>
      <p className="text-gray-400 mt-2">Enter a flight number to begin tracking</p>
    </div>
  )
}
