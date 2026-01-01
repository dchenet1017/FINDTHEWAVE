import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { MapContainer } from '@/components/map/MapContainer'
import { BusinessMarkerLayer } from '@/components/map/BusinessMarkerLayer'
import { CheckInButton } from '@/components/map/CheckInButton'
import { useMapBusinesses } from '@/hooks/useBusinesses'
import type { MapBounds } from '@/services/business.service'
import type { Business } from '../../../../shared/types/business'
import { getCurrentPosition } from '@/lib/mapbox'
import { MapPin } from 'lucide-react'

type Tab = 'explore' | 'myplaces' | 'waveleaders' | 'events'

export default function UserMapPage() {
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [tab, setTab] = useState<Tab>('explore')
  const [showFavorites, setShowFavorites] = useState(false)
  const [showVisited, setShowVisited] = useState(false)
  const [radius, setRadius] = useState(10)

  useEffect(() => {
    getCurrentPosition()
      .then((pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }))
      .catch(() => setUserLocation(null))
  }, [])

  const { data: mapData, isFetching } = useMapBusinesses(bounds)
  const businesses: Business[] = Array.isArray(mapData) ? mapData : []

  const filtered = useMemo(() => {
    return businesses.filter((b: any) => {
      if (showFavorites) return b.isVerified // placeholder for favorites
      if (showVisited) return b.isVerified // placeholder for visited
      return true
    })
  }, [businesses, showFavorites, showVisited])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Explore Map</h1>
          <p className="text-sm text-gray-400">Discover places, WaveLeaders, and events around you.</p>
        </div>
        <div className="flex items-center gap-2">
          {(['explore', 'myplaces', 'waveleaders', 'events'] as Tab[]).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={tab === t ? 'default' : 'ghost'}
              onClick={() => setTab(t)}
            >
              {t === 'explore' && 'Explore'}
              {t === 'myplaces' && 'My Places'}
              {t === 'waveleaders' && 'WaveLeaders'}
              {t === 'events' && 'Events'}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="bg-dark-card border-gray-800 lg:col-span-3">
          <CardContent className="p-0">
            <div className="relative h-[70vh] rounded-lg overflow-hidden">
              <div className="absolute top-3 left-3 z-20 space-y-3 rounded-md bg-dark-bg/90 border border-gray-800 p-3 shadow-lg w-56">
                <div className="text-xs text-gray-300 font-semibold">Filters</div>
                <div className="space-y-1 text-sm text-gray-200">
                  <div className="flex items-center justify-between">
                    <span>Favorites only</span>
                    <Switch checked={showFavorites} onCheckedChange={(v) => setShowFavorites(Boolean(v))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Been here</span>
                    <Switch checked={showVisited} onCheckedChange={(v) => setShowVisited(Boolean(v))} />
                  </div>
                  <div className="text-xs text-gray-400 pt-2">Radius: {radius} mi</div>
                  <Slider value={[radius]} min={1} max={25} step={1} onValueChange={(v) => setRadius(v[0])} />
                </div>
              </div>

              <MapContainer
                onMapLoad={(map) => {
                  const b = map.getBounds()
                  setBounds({
                    ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng },
                    sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
                  })
                }}
                onMoveEnd={(map) => {
                  const b = map.getBounds()
                  setBounds({
                    ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng },
                    sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
                  })
                }}
                showControls
                initialZoom={12}
                showUserLocation
              >
                {(map) =>
                  map && (
                    <BusinessMarkerLayer
                      map={map}
                      businesses={filtered}
                      selectedId={selectedBusiness?.id}
                      onBusinessClick={(biz) => setSelectedBusiness(biz as any)}
                    />
                  )
                }
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="bg-dark-card border-gray-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white text-sm">Places in view</p>
                <Badge variant="secondary" className="text-[11px]">
                  {filtered.length}
                </Badge>
              </div>
              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                {filtered.map((biz) => (
                  <button
                    key={biz.id}
                    onClick={() => setSelectedBusiness(biz)}
                    className="w-full text-left rounded-md border border-gray-800 bg-dark-bg px-3 py-2 text-sm text-gray-200 hover:border-primary/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{biz.name}</span>
                      <Badge variant="outline" className="text-[11px]">
                        {biz.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{(biz as any).city || (biz as any).location?.city || 'Unknown'}</span>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-xs text-gray-500">No places match filters.</p>}
              </div>
            </CardContent>
          </Card>

          {selectedBusiness && (
            <Card className="bg-dark-card border-primary/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{selectedBusiness.name}</p>
                    <p className="text-xs text-gray-400">
                      {selectedBusiness.type} • {(selectedBusiness as any).city || (selectedBusiness as any).location?.city || 'Unknown'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[11px]">
                    {selectedBusiness.approvalStatus}
                  </Badge>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">
                  {selectedBusiness.description || 'No description provided.'}
                </p>
                <CheckInButton business={selectedBusiness} userLocation={userLocation} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

