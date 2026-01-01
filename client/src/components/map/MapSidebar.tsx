import { useState } from 'react'
import { Search, SlidersHorizontal, Loader2, Map, List } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Slider } from '@/components/ui/Slider'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BusinessCard } from './BusinessCard'
import type { BusinessType } from '../../../../shared/types/business'
import type { Business } from '../../../../shared/types/business'
import { cn } from '@/lib/utils'

interface Filters {
  type: BusinessType | 'all' | string
  search: string
  radius: number
  showPromotionsOnly: boolean
  showVerifiedOnly: boolean
}

interface MapSidebarProps {
  filters: Filters
  onFilterChange: (partial: Partial<Filters>) => void
  businesses: (Business & { distance?: number })[]
  selectedBusiness?: Business | null
  onBusinessClick: (business: Business) => void
  isLoading?: boolean
  viewMode: 'map' | 'list'
  onViewModeChange: (mode: 'map' | 'list') => void
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

export function MapSidebar({
  filters,
  onFilterChange,
  businesses,
  selectedBusiness,
  onBusinessClick,
  isLoading,
  viewMode,
  onViewModeChange,
}: MapSidebarProps) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="h-full w-full flex flex-col bg-dark-card border-r border-gray-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary">
            WF
          </div>
          <div>
            <p className="text-sm text-gray-400">WaveFinder</p>
            <p className="font-semibold text-white">Discover</p>
          </div>
        </div>
      </div>

      {/* Search */}
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
                <span className="text-primary cursor-pointer" onClick={() => onFilterChange({ radius: 5 })}>
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
          {businesses.length} results
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
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading businesses...
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-sm text-gray-500 py-6 text-center">
            No businesses in view. Try moving the map or changing filters.
          </div>
        ) : (
          businesses.map((biz) => (
            <BusinessCard
              key={biz.id}
              business={biz}
              selected={selectedBusiness?.id === biz.id}
              onClick={() => onBusinessClick(biz)}
            />
          ))
        )}
      </div>
    </div>
  )
}

