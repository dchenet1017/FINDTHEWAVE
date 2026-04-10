import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Badge } from '@/components/ui/Badge'
import { MapContainer } from '@/components/map/MapContainer'
import { MapMarker } from '@/components/map/MapMarker'
import { BusinessMarkerLayer } from '@/components/map/BusinessMarkerLayer'
import { EarningsHeatmap } from '@/components/map/EarningsHeatmap'
import { LocationEditModal } from '@/components/waveleader/LocationEditModal'
import { OpportunitiesList } from '@/components/waveleader/OpportunitiesList'
import {
  useServiceArea,
  useUpdateServiceArea,
  useBusinessesInArea,
  useBookingLocations,
  useEarningsHeatmap,
} from '@/hooks/useServiceArea'
import { createCircleGeoJSON, formatDistance } from '@/lib/mapbox'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import type { Business } from '../../../../shared/types/business'
import type { Map as MapboxMap } from 'mapbox-gl'

type Tab = 'service' | 'opportunities' | 'bookings' | 'earnings'

export default function WaveLeaderMapPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [tab, setTab] = useState<Tab>('service')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [localCenter, setLocalCenter] = useState<[number, number] | null>(null)
  const [localRadius, setLocalRadius] = useState(10)
  const [localAddress, setLocalAddress] = useState('')
  const [selected, setSelected] = useState<Business | null>(null)
  const [heatmapVisible, setHeatmapVisible] = useState(false)
  const [earningsPeriod, setEarningsPeriod] = useState<'week' | 'month' | 'all'>('week')
  const mapRef = useRef<MapboxMap | null>(null)

  const { data: serviceArea } = useServiceArea()
  const updateServiceArea = useUpdateServiceArea()
  const { data: businesses = [] } = useBusinessesInArea(
    localCenter ?? serviceArea?.center,
    localRadius ?? serviceArea?.radius ?? 10
  )
  const { data: bookingLocations = [] } = useBookingLocations(earningsPeriod)
  const { data: earningsHeatmapData = [] } = useEarningsHeatmap(earningsPeriod)

  useEffect(() => {
    if (serviceArea) {
      setLocalCenter(serviceArea.center)
      setLocalRadius(serviceArea.radius)
      setLocalAddress(serviceArea.address || '')
    } else {
      setLocalCenter([-73.9857, 40.7484])
      setLocalRadius(10)
    }
  }, [serviceArea])

  const circleSource = useMemo(() => {
    if (!localCenter) return null
    const circle = createCircleGeoJSON(localCenter, localRadius)
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: circle,
    }
  }, [localCenter, localRadius])

  const updateCircle = useCallback(
    (map: MapboxMap) => {
      if (!map || !circleSource) return
      const sourceId = 'service-area-circle'
      const source = map.getSource(sourceId)
      if (source) {
        ;(source as mapboxgl.GeoJSONSource).setData(circleSource)
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: circleSource,
        })
        map.addLayer({
          id: 'service-area-fill',
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': '#6C5CE7',
            'fill-opacity': 0.2,
            'fill-outline-color': '#6C5CE7',
          },
        })
      }
    },
    [circleSource]
  )

  useEffect(() => {
    if (mapRef.current && circleSource) {
      updateCircle(mapRef.current)
    }
  }, [circleSource, updateCircle])

  const handleSaveServiceArea = () => {
    if (!localCenter) return
    updateServiceArea.mutate({
      center: localCenter,
      radius: localRadius,
    })
  }

  const handleLocationSave = (center: [number, number], address: string) => {
    setLocalCenter(center)
    setLocalAddress(address)
    setShowLocationModal(false)
  }

  const filteredBusinesses = useMemo(() => businesses as Business[], [businesses])
  const markers = useMemo(
    () =>
      filteredBusinesses.map((b) => ({
        id: b.id,
        latitude: (b as any).latitude ?? (b as any).location?.latitude,
        longitude: (b as any).longitude ?? (b as any).location?.longitude,
        type: b.type,
        name: b.name,
        isVerified: b.isVerified,
      })),
    [filteredBusinesses]
  )

  const earningsHeatmapPoints = useMemo(
    () =>
      earningsHeatmapData.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        weight: p.weight,
      })),
    [earningsHeatmapData]
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex overflow-hidden rounded-lg border border-gray-800">
      {/* Collapsible Sidebar */}
      <div
        className={`flex flex-col bg-dark-card border-r border-gray-800 transition-all duration-200 ${
          sidebarCollapsed ? 'w-12' : 'w-[360px]'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {!sidebarCollapsed && (
            <h2 className="text-lg font-semibold text-white">Service Area</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto p-4">
            {/* Tab buttons */}
            <div className="flex gap-1 mb-4">
              {(
                [
                  ['service', 'Service Area'],
                  ['opportunities', 'Opportunities'],
                  ['bookings', 'My Bookings'],
                  ['earnings', 'Earnings'],
                ] as [Tab, string][]
              ).map(([t, label]) => (
                <Button
                  key={t}
                  size="sm"
                  variant={tab === t ? 'default' : 'ghost'}
                  onClick={() => setTab(t)}
                >
                  {label}
                </Button>
              ))}
            </div>

            {tab === 'service' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">
                    Your Service Area
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {localAddress || 'Set your location'}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Radius</span>
                    <Badge variant="secondary" className="text-[11px]">
                      {localRadius} mi
                    </Badge>
                  </div>
                  <Slider
                    value={[localRadius]}
                    min={1}
                    max={25}
                    step={1}
                    onValueChange={([v]) => setLocalRadius(v)}
                  />
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowLocationModal(true)}
                    >
                      Edit Location
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleSaveServiceArea}
                      disabled={updateServiceArea.isPending}
                    >
                      Save Changes
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    {filteredBusinesses.length} businesses in your area
                  </p>
                </div>
              </div>
            )}

            {tab === 'opportunities' && (
              <div>
                <h3 className="text-sm font-medium text-white mb-3">
                  Opportunities
                </h3>
                <OpportunitiesList />
              </div>
            )}

            {tab === 'bookings' && (
              <div>
                <h3 className="text-sm font-medium text-white mb-3">
                  My Bookings
                </h3>
                {bookingLocations.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No upcoming bookings to display
                  </p>
                ) : (
                  <div className="space-y-2">
                    {bookingLocations.slice(0, 5).map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-lg border border-gray-800"
                      >
                        <p className="font-medium text-white text-sm">
                          {b.clientName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {b.date} at {b.time}
                        </p>
                        {b.distance != null && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {formatDistance(b.distance)} from you
                          </p>
                        )}
                        <Button size="sm" variant="ghost" className="mt-2 p-0 h-auto text-xs">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'earnings' && (
              <div>
                <h3 className="text-sm font-medium text-white mb-3">
                  Earnings Zones
                </h3>
                <div className="flex gap-2 mb-3">
                  {(['week', 'month', 'all'] as const).map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={earningsPeriod === p ? 'default' : 'ghost'}
                      onClick={() => setEarningsPeriod(p)}
                    >
                      {p === 'week' && 'Week'}
                      {p === 'month' && 'Month'}
                      {p === 'all' && 'All Time'}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="heatmap-toggle"
                    checked={heatmapVisible}
                    onChange={(e) => setHeatmapVisible(e.target.checked)}
                    className="rounded border-gray-600"
                  />
                  <label htmlFor="heatmap-toggle" className="text-sm text-gray-400">
                    Show earnings heatmap
                  </label>
                </div>
                {earningsHeatmapData.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No earnings data for this period
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    {earningsHeatmapData.length} data points
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          initialCenter={localCenter ?? undefined}
          initialZoom={12}
          showControls
          showUserLocation={false}
          onMapLoad={(map) => {
            mapRef.current = map
            if (localCenter) {
              map.flyTo({ center: localCenter, zoom: 12 })
            }
            updateCircle(map)
          }}
          className="h-full w-full"
        >
          {(map) => (
            <>
              {localCenter && (
                <MapMarker
                  map={map}
                  position={localCenter}
                  type="WAVELEADER"
                  isSelected
                />
              )}
              <BusinessMarkerLayer
                map={map}
                businesses={filteredBusinesses}
                selectedId={selected?.id}
                onBusinessClick={(b) => setSelected(b as Business)}
              />
              <EarningsHeatmap
                map={map}
                points={earningsHeatmapPoints}
                visible={heatmapVisible}
              />
            </>
          )}
        </MapContainer>
      </div>

      <LocationEditModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        currentCenter={localCenter ?? [-73.9857, 40.7484]}
        currentAddress={localAddress}
        onSave={handleLocationSave}
      />
    </div>
  )
}
