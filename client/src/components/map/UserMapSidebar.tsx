import { useState, useMemo } from 'react'
import { X, Heart, Calendar, User, Search, SlidersHorizontal, Map, List, Star } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Slider } from '@/components/ui/Slider'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { BusinessCard } from './BusinessCard'
import { FavoriteButton } from './FavoriteButton'
import { useFavorites } from '@/hooks/useUserFavorites'
import { cn, formatDistance } from '@/lib/utils'
import type { Business } from '../../../../shared/types/business'
import type { BusinessType } from '../../../../shared/types/business'
import type { WaveLeaderDiscovery } from '@/hooks/useWaveLeaders'

type Tab = 'explore' | 'myplaces' | 'waveleaders' | 'events'

interface Filters {
  type: BusinessType | 'all' | string
  search: string
  radius: number
  showPromotionsOnly: boolean
  showVerifiedOnly: boolean
}

interface UserMapSidebarProps {
  filters: Filters
  onFilterChange: (partial: Partial<Filters>) => void
  businesses: (Business & { distance?: number })[]
  selectedBusiness?: Business | null
  onBusinessClick: (business: Business) => void
  isLoading?: boolean
  viewMode: 'map' | 'list'
  onViewModeChange: (mode: 'map' | 'list') => void
  onClose?: () => void
  waveLeaders?: WaveLeaderDiscovery[]
  selectedWaveLeader?: WaveLeaderDiscovery | null
  onWaveLeaderClick?: (wl: WaveLeaderDiscovery) => void
  waveLeadersLoading?: boolean
}

const TYPE_TABS = [
  { value: 'all', label: 'All', icon: '🗺️' },
  { value: 'BAR', label: 'Bars', icon: '🍺' },
  { value: 'RESTAURANT', label: 'Restaurants', icon: '🍽️' },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎭' },
  { value: 'FITNESS', label: 'Fitness', icon: '💪' },
  { value: 'WELLNESS', label: 'Wellness', icon: '🧘' },
  { value: 'HOTEL', label: 'Hotels', icon: '🏨' },
]

export function UserMapSidebar({
  filters,
  onFilterChange,
  businesses,
  selectedBusiness,
  onBusinessClick,
  isLoading,
  viewMode,
  onViewModeChange,
  onClose,
  waveLeaders = [],
  selectedWaveLeader,
  onWaveLeaderClick,
  waveLeadersLoading = false,
}: UserMapSidebarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('explore')
  const { data: favorites = [] } = useFavorites()

  const filteredBusinesses = useMemo(() => {
    let filtered = businesses

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(searchLower) ||
          (b.description?.toLowerCase() || '').includes(searchLower) ||
          ((b as any).city?.toLowerCase() || '').includes(searchLower)
      )
    }

    // Apply type filter
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter((b) => b.type === filters.type)
    }

    // Apply verified filter
    if (filters.showVerifiedOnly) {
      filtered = filtered.filter((b) => b.isVerified)
    }

    if (filters.showPromotionsOnly) {
      filtered = filtered.filter(
        (b) => Boolean((b.promotions && b.promotions.length > 0) || (b as any).isSponsored)
      )
    }

    return filtered.sort(
      (a: any, b: any) => Number(Boolean(b.isSponsored)) - Number(Boolean(a.isSponsored))
    )
  }, [businesses, filters])

  const favoriteBusinesses = useMemo(() => {
    return favorites.filter((fav) => {
      const business = businesses.find((b) => b.id === fav.id)
      return business !== undefined
    })
  }, [favorites, businesses])

  return (
    <div className="h-full w-full flex flex-col bg-dark-card border-r border-gray-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary">
            WF
          </div>
          <div>
            <p className="text-sm text-gray-400">WaveFinder</p>
            <p className="font-semibold text-white">Explore</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3 grid grid-cols-4">
          <TabsTrigger value="explore" className="text-xs">
            Explore
          </TabsTrigger>
          <TabsTrigger value="myplaces" className="text-xs">
            <Heart className="h-3.5 w-3.5 mr-1" />
            Places
          </TabsTrigger>
          <TabsTrigger value="waveleaders" className="text-xs">
            <User className="h-3.5 w-3.5 mr-1" />
            Leaders
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Events
          </TabsTrigger>
        </TabsList>

        {/* Explore Tab */}
        <TabsContent value="explore" className="flex-1 flex flex-col mt-0">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                className="pl-9 bg-dark-bg border-gray-800"
                placeholder="Search businesses"
                value={filters.search}
                onChange={(e) => onFilterChange({ search: e.target.value })}
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="px-4 pb-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border transition-colors',
                    filters.type === tab.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-dark-bg border-gray-800 text-gray-300 hover:border-gray-600'
                  )}
                  onClick={() => onFilterChange({ type: tab.value || 'all' })}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced filters */}
          <div className="px-4 pb-2">
            <button
              className="flex items-center justify-between w-full text-sm text-gray-300"
              onClick={() => setShowFilters((s) => !s)}
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Advanced filters
              </span>
              <span className="text-xs text-gray-500">{showFilters ? 'Hide' : 'Show'}</span>
            </button>
            {showFilters && (
              <div className="mt-3 space-y-4 rounded-lg border border-gray-800 bg-dark-bg p-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>Radius: {filters.radius} mi</span>
                    <span
                      className="text-primary cursor-pointer"
                      onClick={() => onFilterChange({ radius: 5 })}
                    >
                      Reset
                    </span>
                  </div>
                  <Slider
                    value={[filters.radius]}
                    onValueChange={(val) => onFilterChange({ radius: val[0] })}
                    min={1}
                    max={25}
                    step={1}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Promotions only</span>
                  <Switch
                    checked={filters.showPromotionsOnly}
                    onCheckedChange={(checked) => onFilterChange({ showPromotionsOnly: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Verified only</span>
                  <Switch
                    checked={filters.showVerifiedOnly}
                    onCheckedChange={(checked) => onFilterChange({ showVerifiedOnly: checked })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results summary */}
          <div className="px-4 pb-3 flex items-center justify-between text-xs text-gray-400">
            <Badge variant="secondary" className="text-[11px]">
              {filteredBusinesses.length} results
            </Badge>
            <div className="flex items-center gap-2 bg-dark-bg border border-gray-800 rounded-full p-1">
              <Button
                size="sm"
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                className="h-7 px-3"
                onClick={() => onViewModeChange('map')}
              >
                <Map className="h-4 w-4 mr-1" /> Map
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                className="h-7 px-3"
                onClick={() => onViewModeChange('list')}
              >
                <List className="h-4 w-4 mr-1" /> List
              </Button>
            </div>
          </div>

          {/* Business list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <p className="text-sm">Loading businesses...</p>
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="text-sm text-gray-500 py-6 text-center">
                No businesses in view. Try moving the map or changing filters.
              </div>
            ) : (
              filteredBusinesses.map((biz) => (
                <BusinessCard
                  key={biz.id}
                  business={biz}
                  selected={selectedBusiness?.id === biz.id}
                  onClick={() => onBusinessClick(biz)}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* My Places Tab */}
        <TabsContent value="myplaces" className="flex-1 flex flex-col mt-0">
          <div className="px-4 py-3 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">My Favorites</h3>
              <Badge variant="secondary" className="text-[11px]">
                {favoriteBusinesses.length}
              </Badge>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 mt-3">
            {favoriteBusinesses.length === 0 ? (
              <div className="text-sm text-gray-500 py-6 text-center">
                <Heart className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p>No favorites yet</p>
                <p className="text-xs mt-1">Save places you love to see them here</p>
              </div>
            ) : (
              favoriteBusinesses.map((fav) => {
                const business = businesses.find((b) => b.id === fav.id)
                if (!business) return null
                return (
                  <div
                    key={fav.id}
                    className={cn(
                      'rounded-lg border border-gray-800 bg-dark-bg p-3',
                      selectedBusiness?.id === fav.id && 'border-primary'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-white">{business.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{business.type}</p>
                      </div>
                      <FavoriteButton businessId={fav.id} />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={() => onBusinessClick(business)}
                    >
                      View on map
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* WaveLeaders Tab */}
        <TabsContent value="waveleaders" className="flex-1 flex flex-col mt-0">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="font-semibold text-white">WaveLeaders</h3>
            <p className="text-xs text-gray-400 mt-1">Available guides nearby</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 mt-3">
            {waveLeadersLoading ? (
              <div className="text-sm text-gray-500 py-6 text-center">
                Loading WaveLeaders…
              </div>
            ) : waveLeaders.length === 0 ? (
              <div className="text-sm text-gray-500 py-6 text-center">
                Enable &quot;WaveLeaders&quot; in Layers to see nearby guides, or browse at{' '}
                <a href="/waveleaders" className="text-primary hover:underline">
                  /waveleaders
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {waveLeaders.map((wl) => (
                  <div
                    key={wl.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onWaveLeaderClick?.(wl)}
                    onKeyDown={(e) => e.key === 'Enter' && onWaveLeaderClick?.(wl)}
                    className={cn(
                      'rounded-lg border p-3 transition-colors cursor-pointer text-left',
                      selectedWaveLeader?.id === wl.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-800 bg-dark-bg hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={wl.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${wl.id}`}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">{wl.displayName}</p>
                        <p className="text-xs text-gray-400 truncate">{wl.specialty}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {wl.rating.toFixed(1)} · ${wl.hourlyRate}/hr
                          {wl.distance != null && ` · ${wl.distance.toFixed(1)} mi`}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `/waveleader/${wl.id}/profile`
                        }}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs"
                        disabled={!wl.isAvailable}
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `/waveleader/${wl.id}/profile?book=1`
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="flex-1 flex flex-col mt-0">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="font-semibold text-white">Events</h3>
            <p className="text-xs text-gray-400 mt-1">Upcoming events in your area</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 mt-3">
            <div className="text-sm text-gray-500 py-6 text-center">
              Events feature coming soon
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

