import { useMemo, useState } from 'react'
import { Menu, X, Loader2, MapPin, ShieldCheck, List } from 'lucide-react'
import { MapContainer } from '@/components/map/MapContainer'
import { MapMarker } from '@/components/map/MapMarker'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { cn, formatDistance } from '@/lib/utils'
import { useMapBusinesses } from '@/hooks/useBusinesses'
import { useMapStore } from '@/store/mapStore'
import { useActiveOfferVenues } from '@/hooks/useActiveOfferVenues'
import type { Business } from '../../../../shared/types/business'
import type { MapBounds } from '@/services/business.service'

const BUSINESS_TYPES = [
  { label: 'All types', value: '' },
  { label: 'Bar', value: 'BAR' },
  { label: 'Restaurant', value: 'RESTAURANT' },
  { label: 'Entertainment', value: 'ENTERTAINMENT' },
  { label: 'Fitness', value: 'FITNESS' },
  { label: 'Wellness', value: 'WELLNESS' },
  { label: 'Hotel', value: 'HOTEL' },
  { label: 'Other', value: 'OTHER' },
]

export default function MapPage() {
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  // Venues running a live Go Out offer get the 🕺 badge
  const { activeVenueIds } = useActiveOfferVenues()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')

  const { filters, setFilters } = useMapStore()

  const { data: businessesData, isFetching } = useMapBusinesses(bounds)
  const businesses: Business[] = Array.isArray(businessesData) ? businessesData : []

  const getCoords = (b: Business) => {
    const lat = (b as any).latitude ?? (b as any).location?.latitude
    const lng = (b as any).longitude ?? (b as any).location?.longitude
    return {
      lat: lat !== undefined ? Number(lat) : undefined,
      lng: lng !== undefined ? Number(lng) : undefined,
    }
  }

  const getCity = (b: Business) =>
    (b as any).city ?? (b as any).location?.city ?? ''

  const getDistanceVal = (b: Business) => {
    const d = (b as any).distance
    return d === undefined || d === null ? undefined : Number(d)
  }

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b: Business) => {
      const typeMatch = filters.type && filters.type !== 'all' ? b.type === filters.type : true
      const verifiedMatch = filters.showVerifiedOnly ? b.isVerified : true
      const searchText = filters.search.toLowerCase()
      const city = getCity(b).toLowerCase()
      const searchMatch = searchText
        ? (b.name?.toLowerCase() || '').includes(searchText)
          || (b.description?.toLowerCase() || '').includes(searchText)
          || city.includes(searchText)
        : true
      return typeMatch && verifiedMatch && searchMatch
    })
  }, [businesses, filters])

  const handleMapLoad = (map: any) => {
    setMapInstance(map)
    const b = map.getBounds()
    setBounds({
      ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng },
      sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
    })
  }

  const handleMoveEnd = (map: any) => {
    const b = map.getBounds()
    setBounds({
      ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng },
      sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
    })
  }

  const handleSelectBusiness = (business: Business) => {
    setSelectedBusiness(business)
    const { lat, lng } = getCoords(business)
    if (mapInstance && lat !== undefined && lng !== undefined) {
      mapInstance.flyTo({
        center: [lng, lat],
        zoom: 14,
        essential: true,
      })
    }
  }

  return (
    <div className="flex h-screen bg-dark-bg text-white">
      {/* Sidebar */}
      <div
        className={cn(
          'relative z-20 flex-shrink-0 border-r border-gray-800 bg-dark-card transition-all duration-200',
          sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h2 className="text-lg font-semibold">Discover</h2>
          <button
            className="p-2 text-gray-400 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <Input
            placeholder="Search businesses"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
          />

          <Select
            value={(filters.type as string) || 'all'}
            onValueChange={(val) => setFilters({ type: val || 'all' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Verified only</span>
            <Switch
              checked={filters.showVerifiedOnly}
              onCheckedChange={(checked) => setFilters({ showVerifiedOnly: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Promotions only</span>
            <Switch
              checked={filters.showPromotionsOnly}
              onCheckedChange={(checked) => setFilters({ showPromotionsOnly: checked })}
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Badge variant="secondary" className="text-xs">
              {filteredBusinesses.length} businesses
            </Badge>
            {isFetching && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating
              </div>
            )}
          </div>

          <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {filteredBusinesses.map((biz) => (
              <Card
                key={biz.id}
                className={cn(
                  'bg-dark-bg border-gray-800 hover:border-primary/60 transition-colors cursor-pointer',
                  selectedBusiness?.id === biz.id && 'border-primary'
                )}
                onClick={() => handleSelectBusiness(biz)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{biz.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {biz.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {biz.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{getCity(biz) || 'Unknown'}</span>
                    {getDistanceVal(biz) !== undefined && (
                      <span className="text-primary">
                        {formatDistance(getDistanceVal(biz)!)}
                      </span>
                    )}
                    {biz.isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredBusinesses.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">
                No businesses in view. Try moving the map or adjusting filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="relative flex-1">
        {/* Mobile header */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2 lg:hidden">
          <Button variant="secondary" size="icon" onClick={() => setSidebarOpen((s) => !s)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Badge variant="secondary" className="text-xs">
            {filteredBusinesses.length} businesses
          </Badge>
        </div>

        {/* Loading indicator */}
        {isFetching && (
          <div className="absolute top-3 right-3 z-30 flex items-center gap-2 rounded-md bg-dark-card border border-gray-800 px-3 py-2 text-xs text-gray-300">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Updating map…
          </div>
        )}

        {/* View mode toggle */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-dark-card border border-gray-800 px-2 py-1 shadow-lg">
          <Button
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('map')}
          >
            Map
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>

        {viewMode === 'map' ? (
          <MapContainer onMapLoad={handleMapLoad} onMoveEnd={handleMoveEnd} interactive>
            {(map) => (
              <>
                {filteredBusinesses.map((biz) => {
                  const { lat, lng } = getCoords(biz)
                  if (lat === undefined || lng === undefined || Number.isNaN(lat) || Number.isNaN(lng)) return null
                  return (
                    <MapMarker
                      key={biz.id}
                      map={map}
                      position={[lng, lat]}
                      type={biz.type as any}
                      isSelected={selectedBusiness?.id === biz.id}
                      hasActiveOffer={activeVenueIds.has(biz.id)}
                      label={biz.name}
                      onClick={() => handleSelectBusiness(biz)}
                    >
                      <div className="text-white text-sm space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{biz.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {biz.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {biz.description || 'No description provided.'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span>{getCity(biz) || 'Unknown'}</span>
                          {getDistanceVal(biz) !== undefined && (
                            <span className="text-primary">
                              {formatDistance(getDistanceVal(biz)!)}
                            </span>
                          )}
                        </div>
                        {biz.isVerified && (
                          <div className="flex items-center gap-1 text-xs text-success">
                            <ShieldCheck className="h-3 w-3" />
                            Verified
                          </div>
                        )}
                      </div>
                    </MapMarker>
                  )
                })}
              </>
            )}
          </MapContainer>
        ) : (
          <div className="h-full overflow-y-auto p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBusinesses.map((biz) => (
              <Card
                key={biz.id}
                className="bg-dark-card border-gray-800 hover:border-primary/60 transition-colors"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{biz.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {biz.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {biz.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{getCity(biz) || 'Unknown'}</span>
                    {getDistanceVal(biz) !== undefined && (
                      <span className="text-primary">
                        {formatDistance(getDistanceVal(biz)!)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    {biz.isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => handleSelectBusiness(biz)}>
                      View on map
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredBusinesses.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center col-span-full">
                No businesses to show.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

