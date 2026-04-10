import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  MapPin,
  Heart,
  Calendar,
  Star,
  Map as MapIcon,
  Navigation,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { PlaceCard } from '@/components/places/PlaceCard'
import { MapContainer } from '@/components/map/MapContainer'
import { BusinessMarkerLayer } from '@/components/map/BusinessMarkerLayer'
import { useFavorites, useVisitedPlaces } from '@/hooks/usePlaces'
import { getCurrentPosition } from '@/lib/mapbox'
import { calculateDistance } from '@/utils/distance'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Business } from '../../../../shared/types/business'

type SortOption = 'recent' | 'name' | 'rating' | 'distance'
type FilterType = 'all' | 'BAR' | 'RESTAURANT' | 'ENTERTAINMENT' | 'FITNESS' | 'WELLNESS' | 'HOTEL' | 'OTHER'

export default function PlacesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'favorites' | 'visited' | 'wishlist'>('favorites')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [showMap, setShowMap] = useState(true)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)

  const { data: favorites = [], isLoading: favoritesLoading } = useFavorites()
  const { data: visitedPlaces = [], isLoading: visitedLoading } = useVisitedPlaces()

  useEffect(() => {
    getCurrentPosition()
      .then((pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }))
      .catch(() => setUserLocation(null))
  }, [])

  // Get current tab's places
  const currentPlaces = useMemo(() => {
    if (activeTab === 'favorites') {
      return favorites.map((fav) => ({ business: fav }))
    } else if (activeTab === 'visited') {
      return visitedPlaces.map((vp) => ({
        business: vp.business,
        lastVisited: vp.lastVisited,
        checkInCount: vp.checkInCount,
      }))
    }
    return []
  }, [activeTab, favorites, visitedPlaces])

  // Filter and sort places
  const filteredAndSortedPlaces = useMemo(() => {
    let filtered = [...currentPlaces]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) =>
        item.business.name.toLowerCase().includes(query) ||
        (item.business.description || '').toLowerCase().includes(query)
      )
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((item) => item.business.type === filterType)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.business.name.localeCompare(b.business.name)
        case 'rating':
          const ratingA = (a.business as any).rating || 0
          const ratingB = (b.business as any).rating || 0
          return ratingB - ratingA
        case 'distance':
          if (!userLocation) return 0
          const latA = (a.business as any).latitude ?? (a.business as any).location?.latitude
          const lngA = (a.business as any).longitude ?? (a.business as any).location?.longitude
          const latB = (b.business as any).latitude ?? (b.business as any).location?.latitude
          const lngB = (b.business as any).longitude ?? (b.business as any).location?.longitude
          if (!latA || !lngA) return 1
          if (!latB || !lngB) return -1
          const distA = calculateDistance(userLocation.lat, userLocation.lng, Number(latA), Number(lngA))
          const distB = calculateDistance(userLocation.lat, userLocation.lng, Number(latB), Number(lngB))
          return distA - distB
        case 'recent':
        default:
          if ('lastVisited' in a && 'lastVisited' in b) {
            return new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime()
          }
          return 0
      }
    })

    return filtered
  }, [currentPlaces, searchQuery, filterType, sortBy, userLocation])

  // Map markers
  const mapMarkers = useMemo(() => {
    return filteredAndSortedPlaces.map((item) => {
      const lat = (item.business as any).latitude ?? (item.business as any).location?.latitude
      const lng = (item.business as any).longitude ?? (item.business as any).location?.longitude
      return {
        id: item.business.id,
        latitude: lat,
        longitude: lng,
        type: item.business.type,
        name: item.business.name,
        isVerified: item.business.isVerified,
      }
    }).filter((m) => m.latitude && m.longitude)
  }, [filteredAndSortedPlaces])

  const isLoading = activeTab === 'favorites' ? favoritesLoading : visitedLoading
  const isEmpty = filteredAndSortedPlaces.length === 0

  return (
    <div className="flex h-[calc(100vh-60px)] bg-dark-bg text-white">
      {/* Left Column - Places List */}
      <div className={`flex flex-col ${showMap ? 'w-full md:w-1/2 lg:w-2/5' : 'w-full'} border-r border-gray-800 transition-all`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Places</h1>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab === 'favorites' && `${favorites.length} favorites`}
                {activeTab === 'visited' && `${visitedPlaces.length} places visited`}
                {activeTab === 'wishlist' && 'Wishlist'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMap(!showMap)}
              className="md:hidden"
            >
              {showMap ? <X className="h-5 w-5" /> : <MapIcon className="h-5 w-5" />}
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="favorites">
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="visited">
                <MapPin className="h-4 w-4 mr-2" />
                Visited
              </TabsTrigger>
              <TabsTrigger value="wishlist" disabled>
                <Calendar className="h-4 w-4 mr-2" />
                Wishlist
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="distance">Distance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="BAR">Bar</SelectItem>
                <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                <SelectItem value="ENTERTAINMENT">Entertainment</SelectItem>
                <SelectItem value="FITNESS">Fitness</SelectItem>
                <SelectItem value="WELLNESS">Wellness</SelectItem>
                <SelectItem value="HOTEL">Hotel</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Places List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Heart className="h-16 w-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {activeTab === 'favorites' && 'No favorites yet'}
                {activeTab === 'visited' && 'No places visited yet'}
                {activeTab === 'wishlist' && 'Wishlist coming soon'}
              </h3>
              <p className="text-gray-400 mb-6 max-w-sm">
                {activeTab === 'favorites' && 'Start exploring and save your favorite places!'}
                {activeTab === 'visited' && 'Check in at places to see them here'}
                {activeTab === 'wishlist' && 'This feature is coming soon'}
              </p>
              {activeTab !== 'wishlist' && (
                <Button onClick={() => navigate('/dashboard/map')}>
                  Explore Map
                </Button>
              )}
            </div>
          ) : (
            filteredAndSortedPlaces.map((item) => (
              <PlaceCard
                key={item.business.id}
                business={item.business}
                userLocation={userLocation}
                lastVisited={'lastVisited' in item ? item.lastVisited : undefined}
                checkInCount={'checkInCount' in item ? item.checkInCount : undefined}
                onSelect={setSelectedBusiness}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Column - Map */}
      {showMap && (
        <div className="hidden md:flex flex-1 relative">
          <MapContainer
            initialCenter={userLocation ? [userLocation.lng, userLocation.lat] : undefined}
            initialZoom={12}
            onMapLoad={setMapInstance}
            showUserLocation={!!userLocation}
          >
            {(map) => {
              if (!map) return null
              return mapMarkers.length > 0 ? (
                <BusinessMarkerLayer
                  map={map}
                  businesses={filteredAndSortedPlaces.map((item) => item.business)}
                  onMarkerClick={(business) => setSelectedBusiness(business)}
                  highlightId={selectedBusiness?.id}
                />
              ) : null
            }}
          </MapContainer>
        </div>
      )}
    </div>
  )
}

