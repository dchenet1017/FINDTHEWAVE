import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Map as MapboxMap } from 'mapbox-gl'
import {
  Calendar,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Map as MapIcon,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Search,
} from 'lucide-react'
import { MapContainer } from '@/components/map/MapContainer'
import { EventMapMarkers } from '@/components/events/EventMapMarker'
import { EventCard } from '@/components/events/EventCard'
import { EventPreviewPopup } from '@/components/events/EventPreviewPopup'
import { EventFilters } from '@/components/events/EventFilters'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/Sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useEvents } from '@/hooks/useEvents'
import {
  defaultEventDiscoveryFilters,
  type EventDiscoveryFilters,
  type EventSortOption,
} from '@/types/event'
import type { Event } from '@/types/event'
import { rangeForDatePreset } from '@/utils/eventDatePresets'

function useDebouncedValue<T>(value: T, ms: number): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return d
}

export default function EventsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { location: userLoc } = useGeolocation()

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [filters, setFilters] = useState<EventDiscoveryFilters>(defaultEventDiscoveryFilters)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(true)
  const [mapInstance, setMapInstance] = useState<MapboxMap | null>(null)
  const [popupEvent, setPopupEvent] = useState<Event | null>(null)
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 350)

  useEffect(() => {
    setFilters((f) => ({ ...f, search: debouncedSearch, page: 1, limit: 24 }))
  }, [debouncedSearch])

  const dateRange = useMemo(() => {
    if (filters.datePreset === 'custom') {
      return { dateFrom: filters.dateFrom, dateTo: filters.dateTo }
    }
    if (filters.datePreset === 'all') return { dateFrom: undefined, dateTo: undefined }
    return rangeForDatePreset(
      filters.datePreset,
      filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      filters.dateTo ? new Date(filters.dateTo) : undefined
    )
  }, [filters.datePreset, filters.dateFrom, filters.dateTo])

  const canUseNearest = userLoc != null
  const effectiveSort: EventSortOption =
    filters.sort === 'nearest' && !canUseNearest ? 'soon' : filters.sort

  const queryFilters = useMemo(
    () => ({ ...filters, sort: effectiveSort }),
    [filters, effectiveSort]
  )

  const { data, isLoading, isFetching, error, refetch } = useEvents(queryFilters, {
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    userLat: userLoc?.lat,
    userLng: userLoc?.lng,
  })

  const items = data?.items ?? []
  const hasMore = data ? items.length < data.total : false

  const updatePopupPosition = useCallback(() => {
    if (!mapInstance || !popupEvent) return
    const p = mapInstance.project([popupEvent.longitude, popupEvent.latitude])
    setPopupPos({ x: p.x, y: p.y })
  }, [mapInstance, popupEvent])

  useEffect(() => {
    if (!mapInstance || !popupEvent) {
      setPopupPos(null)
      return
    }
    updatePopupPosition()
    mapInstance.on('move', updatePopupPosition)
    mapInstance.on('zoom', updatePopupPosition)
    return () => {
      mapInstance.off('move', updatePopupPosition)
      mapInstance.off('zoom', updatePopupPosition)
    }
  }, [mapInstance, popupEvent, updatePopupPosition])

  const patchFilters = (patch: Partial<EventDiscoveryFilters>) => {
    setFilters((f) => ({ ...f, ...patch }))
  }

  const clearFilters = () => {
    setSearchInput('')
    setFilters(defaultEventDiscoveryFilters())
  }

  const onMapEventClick = useCallback((ev: Event) => setPopupEvent(ev), [])

  const isBusiness = isAuthenticated && user?.role === 'BUSINESS'

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-dark-bg text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-dark-card/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Discover Events</h1>
            <p className="text-sm text-gray-400">Find what&apos;s happening near you</p>
          </div>
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center lg:max-w-3xl lg:flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search title, description, tags…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border-gray-700 bg-dark-bg pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="border-gray-600 lg:hidden"
                type="button"
                onClick={() => setFilterSheetOpen(true)}
              >
                <Filter className="mr-1 h-4 w-4" />
                Filters
              </Button>
              <Button
                variant="outline"
                className="hidden border-gray-600 lg:inline-flex"
                type="button"
                onClick={() => setDesktopFiltersOpen((o) => !o)}
              >
                {desktopFiltersOpen ? (
                  <PanelLeftClose className="mr-1 h-4 w-4" />
                ) : (
                  <PanelLeft className="mr-1 h-4 w-4" />
                )}
                Filters
              </Button>
              <div className="flex rounded-lg border border-gray-700 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm',
                    viewMode === 'map' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                  )}
                >
                  <MapIcon className="h-4 w-4" />
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('list')
                    setPopupEvent(null)
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm',
                    viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                  )}
                >
                  <List className="h-4 w-4" />
                  List
                </button>
              </div>
              {isBusiness && (
                <Link
                  to="/business/events/create"
                  className={cn(buttonVariants({ variant: 'default' }), 'inline-flex gap-1')}
                >
                  <Plus className="h-4 w-4" />
                  Create Event
                </Link>
              )}
            </div>
          </div>
        </div>
        {filters.sort === 'nearest' && !canUseNearest && (
          <p className="mx-auto mt-2 max-w-7xl text-center text-xs text-amber-400/90">
            Enable location to sort by nearest — showing soonest events instead.
          </p>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1">
        {/* Desktop filter rail */}
        <aside
          className={cn(
            'hidden shrink-0 border-r border-gray-800 bg-dark-card transition-[width] duration-200 lg:block',
            desktopFiltersOpen ? 'w-80 overflow-y-auto' : 'w-0 overflow-hidden border-0'
          )}
        >
          <EventFilters
            filters={filters}
            onChange={patchFilters}
            onClear={clearFilters}
            className="min-w-[20rem]"
          />
        </aside>

        {/* Mobile filter sheet */}
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen} side="left">
          <SheetHeader onClose={() => setFilterSheetOpen(false)}>
            <SheetTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filters
            </SheetTitle>
          </SheetHeader>
          <SheetContent className="h-[calc(100%-4rem)] overflow-y-auto p-0">
            <EventFilters
              filters={filters}
              onChange={patchFilters}
              onClear={clearFilters}
              showApply
              onApply={() => setFilterSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Main */}
        <div className="relative min-h-0 min-w-0 flex-1">
          {viewMode === 'map' && (
            <div className="absolute inset-0 z-0">
              <MapContainer
                className="h-full w-full rounded-none border-0"
                showStyleSwitcher={false}
                onMapLoad={(m) => {
                  setMapInstance(m)
                }}
              >
                {(map) =>
                  map ? (
                    <EventMapMarkers map={map} events={items} onEventClick={onMapEventClick} />
                  ) : null
                }
              </MapContainer>

              {popupEvent && popupPos && (
                <div
                  className="pointer-events-none absolute inset-0 z-50"
                  aria-hidden={false}
                >
                  <div
                    className="pointer-events-auto absolute"
                    style={{
                      left: popupPos.x,
                      top: popupPos.y,
                      transform: 'translate(-50%, calc(-100% - 12px))',
                    }}
                  >
                    <EventPreviewPopup
                      event={popupEvent}
                      onClose={() => setPopupEvent(null)}
                    />
                  </div>
                </div>
              )}

              <Button
                type="button"
                variant="secondary"
                className="absolute bottom-6 right-4 z-40 gap-2 shadow-lg"
                onClick={() => setViewMode('list')}
              >
                <LayoutGrid className="h-4 w-4" />
                List view
              </Button>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="h-full overflow-y-auto p-4">
              <div className="mx-auto flex max-w-7xl flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-400">
                    {isLoading ? 'Loading…' : `${data?.total ?? 0} events`}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-500">Sort</span>
                    <Select
                      value={filters.sort}
                      onValueChange={(v) =>
                        patchFilters({ sort: v as EventSortOption, page: 1, limit: 24 })
                      }
                    >
                      <SelectTrigger className="w-[200px] border-gray-700 bg-dark-bg">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soon">Happening Soon</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="nearest">Nearest to Me</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
                    Could not load events.{' '}
                    <button type="button" className="underline" onClick={() => refetch()}>
                      Retry
                    </button>
                  </div>
                )}

                {isLoading && (
                  <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                )}

                {!isLoading && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((ev) => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        userLat={userLoc?.lat}
                        userLng={userLoc?.lng}
                      />
                    ))}
                  </div>
                )}

                {!isLoading && items.length === 0 && !error && (
                  <p className="py-16 text-center text-gray-500">No events match your filters.</p>
                )}

                {hasMore && (
                  <div className="flex justify-center pb-8">
                    <Button
                      variant="outline"
                      className="border-gray-600"
                      disabled={isFetching}
                      onClick={() =>
                        patchFilters({ limit: filters.limit + 24, page: 1 })
                      }
                    >
                      {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load more'}
                    </Button>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="secondary"
                className="fixed bottom-6 right-4 z-40 gap-2 shadow-lg"
                onClick={() => setViewMode('map')}
              >
                <MapIcon className="h-4 w-4" />
                Map view
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
