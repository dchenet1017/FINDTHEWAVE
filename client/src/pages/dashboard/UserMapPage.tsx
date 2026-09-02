import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Loader2, Heart, MapPin, Layers, MapPinned } from 'lucide-react'
import { MapContainer } from '@/components/map/MapContainer'
import { BusinessMarkerLayer } from '@/components/map/BusinessMarkerLayer'
import { BusinessPopup } from '@/components/map/BusinessPopup'
import { WaveLeaderMarkerLayer } from '@/components/map/WaveLeaderMarkerLayer'
import { WaveLeaderPopup } from '@/components/map/WaveLeaderPopup'
import { CrawlMarkerLayer } from '@/components/map/CrawlMarkerLayer'
import { UserMapSidebar } from '@/components/map/UserMapSidebar'
import { FavoriteButton } from '@/components/map/FavoriteButton'
import { CheckInButton } from '@/components/map/CheckInButton'
import { GoOutButton } from '@/components/goout/GoOutButton'
import { OffersInbox } from '@/components/goout/OffersInbox'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/Switch'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { useMapBusinesses } from '@/hooks/useBusinesses'
import { useNearbyWaveLeaders } from '@/hooks/useWaveLeaders'
import { useNearbyCrawls } from '@/hooks/useCrawls'
import { useMapStore } from '@/store/mapStore'
import { useFavorites } from '@/hooks/useUserFavorites'
import { useActiveOfferVenues } from '@/hooks/useActiveOfferVenues'
import { getCurrentPosition } from '@/lib/mapbox'
import type { Business } from '../../../../shared/types/business'
import type { MapBounds } from '@/services/business.service'
import type { Crawl } from '@/types/crawl'

export default function UserMapPage() {
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Layer toggles
  const [showFavorites, setShowFavorites] = useState(true)
  const [showCheckIns, setShowCheckIns] = useState(false)
  const [showWaveLeaders, setShowWaveLeaders] = useState(false)
  const [showEvents, setShowEvents] = useState(false)
  const [showCrawls, setShowCrawls] = useState(false)
  const [selectedWaveLeader, setSelectedWaveLeader] = useState<any>(null)
  const [selectedCrawl, setSelectedCrawl] = useState<Crawl | null>(null)

  const { filters, setFilters } = useMapStore()
  const { data: businessesData, isFetching } = useMapBusinesses(bounds)
  const { data: favorites = [] } = useFavorites()
  // Venues running a live Go Out offer get the 🕺 badge
  const { activeVenueIds } = useActiveOfferVenues()
  const businesses: Business[] = Array.isArray(businessesData) ? businessesData : []

  const centerForWaveLeaders = userLocation
    ? { lat: userLocation.lat, lng: userLocation.lng }
    : bounds
      ? {
          lat: (bounds.ne.lat + bounds.sw.lat) / 2,
          lng: (bounds.ne.lng + bounds.sw.lng) / 2,
        }
      : null
  const { data: waveLeaders = [], isLoading: waveLeadersLoading } = useNearbyWaveLeaders(
    centerForWaveLeaders?.lat,
    centerForWaveLeaders?.lng,
    25,
    showWaveLeaders
  )
  const { data: crawlsData } = useNearbyCrawls(
    centerForWaveLeaders?.lat,
    centerForWaveLeaders?.lng,
    25,
    showCrawls
  )
  const crawls = crawlsData?.items ?? []

  useEffect(() => {
    getCurrentPosition()
      .then((pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }))
      .catch(() => setUserLocation(null))
  }, [])

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
    const lat = (business as any).latitude ?? (business as any).location?.latitude
    const lng = (business as any).longitude ?? (business as any).location?.longitude
    if (mapInstance && lat !== undefined && lng !== undefined) {
      mapInstance.flyTo({
        center: [Number(lng), Number(lat)],
        zoom: 14,
        essential: true,
      })
    }
  }

  // Filter businesses based on active filters
  const filteredBusinesses = useMemo(() => {
    return businesses
      .filter((b: Business) => {
        const typeMatch = filters.type && filters.type !== 'all' ? b.type === filters.type : true
        const verifiedMatch = filters.showVerifiedOnly ? b.isVerified : true
        const promotionsMatch = filters.showPromotionsOnly
          ? Boolean((b.promotions && b.promotions.length > 0) || (b as any).isSponsored)
          : true
        const searchText = filters.search.toLowerCase()
        const city = ((b as any).city ?? (b as any).location?.city ?? '').toLowerCase()
        const searchMatch = searchText
          ? (b.name?.toLowerCase() || '').includes(searchText) ||
            (b.description?.toLowerCase() || '').includes(searchText) ||
            city.includes(searchText)
          : true
        return typeMatch && verifiedMatch && promotionsMatch && searchMatch
      })
      .sort(
        (a: any, b: any) => Number(Boolean(b.isSponsored)) - Number(Boolean(a.isSponsored))
      )
  }, [businesses, filters])

  // Get favorite businesses that are in view
  const favoriteBusinessesInView = useMemo(() => {
    if (!showFavorites) return []
    return favorites.filter((fav) => {
      const business = businesses.find((b) => b.id === fav.id)
      return business !== undefined
    })
  }, [favorites, businesses, showFavorites])

  // Get check-in businesses (placeholder - would come from API)
  const checkInBusinesses = useMemo(() => {
    if (!showCheckIns) return []
    // TODO: Fetch from API
    return []
  }, [showCheckIns])

  return (
    <div className="flex h-[calc(100vh-60px)] bg-dark-bg text-white overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          'relative z-20 flex-shrink-0 border-r border-gray-800 bg-dark-card transition-all duration-200',
          sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
        )}
      >
        <UserMapSidebar
          filters={filters}
          onFilterChange={setFilters}
          businesses={filteredBusinesses}
          selectedBusiness={selectedBusiness}
          onBusinessClick={handleSelectBusiness}
          isLoading={isFetching}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onClose={() => setSidebarOpen(false)}
          waveLeaders={waveLeaders}
          selectedWaveLeader={selectedWaveLeader}
          onWaveLeaderClick={(wl) => {
            setSelectedWaveLeader(wl)
            const lat = wl.latitude
            const lng = wl.longitude
            if (mapInstance && lat != null && lng != null) {
              mapInstance.flyTo({
                center: [Number(lng), Number(lat)],
                zoom: 14,
                essential: true,
              })
            }
          }}
          waveLeadersLoading={waveLeadersLoading}
        />
      </div>

      {/* Main map area */}
      <div className="relative flex-1">
        {/* Mobile header */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2 lg:hidden">
          <Button variant="secondary" size="icon" onClick={() => setSidebarOpen((s) => !s)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Badge variant="secondary" className="text-xs">
            {filteredBusinesses.length} places
          </Badge>
        </div>

        {/* "I want to go out" overlay - the primary action on this screen */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-3">
          <div className="pointer-events-auto w-full max-w-md space-y-3">
            <div className="max-h-[42vh] overflow-y-auto">
              <OffersInbox className="rounded-2xl border border-gray-800 bg-dark-card/95 p-4 backdrop-blur-sm" />
            </div>
            <GoOutButton />
          </div>
        </div>

        {/* Layer controls */}
        <div className="absolute top-3 right-3 z-30">
          <Card className="bg-dark-card/95 backdrop-blur-sm border-gray-800 shadow-lg">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                <Layers className="h-4 w-4" />
                Layers
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-red-500" />
                    My Places
                  </span>
                  <Switch
                    checked={showFavorites}
                    onCheckedChange={setShowFavorites}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                    Been Here
                  </span>
                  <Switch
                    checked={showCheckIns}
                    onCheckedChange={setShowCheckIns}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <span className="text-purple-500">●</span>
                    WaveLeaders
                  </span>
                  <Switch
                    checked={showWaveLeaders}
                    onCheckedChange={setShowWaveLeaders}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <span className="text-yellow-500">●</span>
                    Events
                  </span>
                  <Switch
                    checked={showEvents}
                    onCheckedChange={setShowEvents}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <MapPinned className="h-3.5 w-3.5 text-purple-400" />
                    Bar Crawls
                  </span>
                  <Switch
                    checked={showCrawls}
                    onCheckedChange={setShowCrawls}
                    size="sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading indicator */}
        {isFetching && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-md bg-dark-card border border-gray-800 px-3 py-2 text-xs text-gray-300">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Updating map…
          </div>
        )}

        {/* Map */}
        <MapContainer
          onMapLoad={handleMapLoad}
          onMoveEnd={handleMoveEnd}
          interactive
          showUserLocation={true}
          initialCenter={userLocation ? [userLocation.lng, userLocation.lat] : undefined}
        >
          {(map) => (
            <>
              {/* Business markers */}
              <BusinessMarkerLayer
                map={map}
                businesses={filteredBusinesses}
                selectedId={selectedBusiness?.id}
                onBusinessClick={handleSelectBusiness}
                activeOfferVenueIds={activeVenueIds}
              />

              {/* Favorites layer - would use different marker style */}
              {showFavorites && favoriteBusinessesInView.length > 0 && (
                <BusinessMarkerLayer
                  map={map}
                  businesses={favoriteBusinessesInView}
                  selectedId={selectedBusiness?.id}
                  onBusinessClick={handleSelectBusiness}
                />
              )}

              {/* Check-ins layer - placeholder */}
              {showCheckIns && checkInBusinesses.length > 0 && (
                <BusinessMarkerLayer
                  map={map}
                  businesses={checkInBusinesses}
                  selectedId={selectedBusiness?.id}
                  onBusinessClick={handleSelectBusiness}
                />
              )}

              {/* Business popup */}
              {selectedBusiness && (
                <BusinessPopup
                  map={map}
                  business={selectedBusiness}
                  onClose={() => setSelectedBusiness(null)}
                  userLocation={userLocation}
                />
              )}

              {/* WaveLeader markers */}
              {showWaveLeaders && waveLeaders.length > 0 && (
                <WaveLeaderMarkerLayer
                  map={map}
                  waveLeaders={waveLeaders}
                  selectedId={selectedWaveLeader?.id}
                  onClick={(wl) => {
                    setSelectedWaveLeader(wl)
                    const lat = wl.latitude
                    const lng = wl.longitude
                    if (lat != null && lng != null) {
                      map.flyTo({
                        center: [Number(lng), Number(lat)],
                        zoom: 14,
                        essential: true,
                      })
                    }
                  }}
                />
              )}

              {/* WaveLeader popup */}
              {selectedWaveLeader && (
                <WaveLeaderPopup
                  map={map}
                  waveLeader={selectedWaveLeader}
                  onClose={() => setSelectedWaveLeader(null)}
                />
              )}

              {/* Bar crawl stop markers */}
              {showCrawls && crawls.length > 0 && (
                <CrawlMarkerLayer
                  map={map}
                  crawls={crawls}
                  selectedId={selectedCrawl?.id}
                  onClick={(c) => {
                    setSelectedCrawl(c)
                    const firstStop = c.stops.find((s) => s.business?.latitude != null && s.business?.longitude != null)
                    if (firstStop?.business) {
                      map.flyTo({
                        center: [Number(firstStop.business.longitude), Number(firstStop.business.latitude)],
                        zoom: 13,
                        essential: true,
                      })
                    }
                  }}
                />
              )}
            </>
          )}
        </MapContainer>

        {/* Selected business card (mobile) */}
        {selectedBusiness && viewMode === 'map' && (
          <div className="absolute bottom-4 left-4 right-4 z-30 lg:hidden">
            <Card className="bg-dark-card border-primary/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{selectedBusiness.name}</p>
                      {(selectedBusiness as any).isSponsored && (
                        <Badge variant="warning" className="text-[10px]">
                          Sponsored
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedBusiness.type} •{' '}
                      {(selectedBusiness as any).city ||
                        (selectedBusiness as any).location?.city ||
                        'Unknown'}
                    </p>
                  </div>
                  <FavoriteButton businessId={selectedBusiness.id} />
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">
                  {selectedBusiness.description || 'No description provided.'}
                </p>
                <div className="flex items-center gap-2">
                  <CheckInButton
                    business={selectedBusiness}
                    userLocation={userLocation}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // Navigate to business detail
                      window.location.href = `/business/${selectedBusiness.id}`
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Selected crawl card */}
        {selectedCrawl && (
          <div className="absolute bottom-4 left-4 right-4 z-30 lg:left-auto lg:right-4 lg:w-80">
            <Card className="bg-dark-card border-purple-500/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">{selectedCrawl.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{selectedCrawl.stops.length} stops</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCrawl(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">{selectedCrawl.description}</p>
                <Link to={`/crawls/${selectedCrawl.id}`} className="block">
                  <Button variant="secondary" size="sm" className="w-full">
                    View Crawl
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <div className="absolute inset-0 z-10 bg-dark-bg overflow-y-auto p-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBusinesses.map((biz) => (
                <Card
                  key={biz.id}
                  className={cn(
                    'bg-dark-card border-gray-800 hover:border-primary/60 transition-colors cursor-pointer',
                    selectedBusiness?.id === biz.id && 'border-primary'
                  )}
                  onClick={() => handleSelectBusiness(biz)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{biz.name}</p>
                        {(biz as any).isSponsored && (
                          <Badge variant="warning" className="text-[10px]">
                            Sponsored
                          </Badge>
                        )}
                      </div>
                      <FavoriteButton businessId={biz.id} />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {biz.type}
                    </Badge>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {biz.description || 'No description provided.'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>
                        {(biz as any).city ||
                          (biz as any).location?.city ||
                          'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <CheckInButton
                        business={biz}
                        userLocation={userLocation}
                        className="flex-1"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `/business/${biz.id}`
                        }}
                      >
                        Details
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
          </div>
        )}
      </div>
    </div>
  )
}
