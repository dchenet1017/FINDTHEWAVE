import { useMemo, useState } from 'react'
import { Calendar, MapPin } from 'lucide-react'
import { MapContainer } from '@/components/map/MapContainer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Badge } from '@/components/ui/Badge'
import { useCheckInLocations } from '@/hooks/usePassport'
import { formatDate } from '@/lib/utils'
import type { CheckInLocation } from '@/services/user.service'
import { CheckInMapMarkers } from './CheckInMapMarkers'

function CheckInMapContent({
  locations,
  mapCenter,
  onLocationSelect,
}: {
  locations: CheckInLocation[]
  mapCenter?: [number, number]
  onLocationSelect: (loc: CheckInLocation) => void
}) {
  return (
    <MapContainer
      initialCenter={mapCenter}
      initialZoom={12}
      showControls={true}
      showUserLocation={false}
      interactive={true}
    >
      {(map) => {
        if (!map) return null
        return <CheckInMapMarkers map={map} locations={locations} onLocationSelect={onLocationSelect} />
      }}
    </MapContainer>
  )
}

interface CheckInMapProps {
  className?: string
}

export function CheckInMap({ className }: CheckInMapProps) {
  const { data: locations = [], isLoading } = useCheckInLocations()
  const [dateRange, setDateRange] = useState<[number, number]>([0, 100])
  const [selectedLocation, setSelectedLocation] = useState<CheckInLocation | null>(null)

  // Filter locations by date range
  const filteredLocations = useMemo(() => {
    if (locations.length === 0) return []
    const sorted = [...locations].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    const minDate = new Date(sorted[0].createdAt).getTime()
    const maxDate = new Date(sorted[sorted.length - 1].createdAt).getTime()
    const range = maxDate - minDate

    if (range === 0) return sorted

    const startTime = minDate + (range * dateRange[0]) / 100
    const endTime = minDate + (range * dateRange[1]) / 100

    return sorted.filter((loc) => {
      const time = new Date(loc.createdAt).getTime()
      return time >= startTime && time <= endTime
    })
  }, [locations, dateRange])

  // Calculate center from locations
  const mapCenter = useMemo(() => {
    if (filteredLocations.length === 0) return undefined
    const avgLat =
      filteredLocations.reduce((sum, loc) => sum + loc.latitude, 0) / filteredLocations.length
    const avgLng =
      filteredLocations.reduce((sum, loc) => sum + loc.longitude, 0) / filteredLocations.length
    return [avgLng, avgLat] as [number, number]
  }, [filteredLocations])

  if (isLoading) {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm text-gray-200">Your Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] bg-dark-bg rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (locations.length === 0) {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm text-gray-200">Your Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] bg-dark-bg rounded-lg flex flex-col items-center justify-center">
            <MapPin className="h-12 w-12 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">No check-ins yet</p>
            <p className="text-xs text-gray-500 mt-1">Your journey will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-gray-200 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Your Journey
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {filteredLocations.length} stamps
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline slider */}
        {locations.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Timeline
              </span>
              <span>
                {filteredLocations.length > 0 && formatDate(filteredLocations[0].createdAt)} -{' '}
                {filteredLocations.length > 0 &&
                  formatDate(filteredLocations[filteredLocations.length - 1].createdAt)}
              </span>
            </div>
            <Slider
              value={dateRange}
              onValueChange={(val) => setDateRange([val[0], val[1]])}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        )}

        {/* Map */}
        <div className="h-[400px] rounded-lg overflow-hidden border border-gray-800">
          <CheckInMapContent
            locations={filteredLocations}
            mapCenter={mapCenter}
            onLocationSelect={setSelectedLocation}
          />
        </div>

        {/* Selected location info */}
        {selectedLocation && (
          <div className="bg-dark-bg rounded-lg p-3 border border-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white text-sm">{selectedLocation.businessName}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(selectedLocation.createdAt)}
                </p>
                <Badge variant="outline" className="text-[10px] mt-2">
                  {selectedLocation.businessType}
                </Badge>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-gray-400 hover:text-white text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
