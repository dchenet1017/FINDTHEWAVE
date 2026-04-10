import { useState } from 'react'
import { ChevronDown, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/Sheet'
import { cn } from '@/lib/utils'
import type { WaveLeaderFilters as WaveLeaderFiltersType } from '@/hooks/useWaveLeaders'

const SPECIALTIES = [
  { value: 'all', label: 'All specialties' },
  { value: 'Music & Entertainment', label: 'Music & Entertainment' },
  { value: 'Fitness & Wellness', label: 'Fitness & Wellness' },
  { value: 'Education & Tutoring', label: 'Education & Tutoring' },
  { value: 'Business Consulting', label: 'Business Consulting' },
  { value: 'Creative Services', label: 'Creative Services' },
  { value: 'Other', label: 'Other' },
]

const SORT_OPTIONS = [
  { value: 'rating', label: 'Rating (highest first)', order: 'desc' },
  { value: 'hourlyRate', label: 'Price (lowest first)', order: 'asc' },
  { value: 'distance', label: 'Distance (nearest first)', order: 'asc' },
  { value: 'createdAt', label: 'Newest', order: 'desc' },
]

const DISTANCE_OPTIONS = [5, 10, 25, 50]

interface WaveLeaderFiltersProps {
  filters: WaveLeaderFiltersType
  onChange: (f: Partial<WaveLeaderFiltersType>) => void
  onClear: () => void
  hasLocation?: boolean
  className?: string
}

function FilterSection({
  title,
  openDefault = true,
  children,
}: {
  title: string
  openDefault?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(openDefault)
  return (
    <div className="border-b border-gray-800 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-gray-300"
      >
        {title}
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}

function FiltersContent({
  filters,
  onChange,
  hasLocation,
}: {
  filters: WaveLeaderFiltersType
  onChange: (f: Partial<WaveLeaderFiltersType>) => void
  hasLocation?: boolean
}) {
  return (
    <div className="space-y-4">
      <FilterSection title="Specialty">
        <Select
          value={filters.specialty || 'all'}
          onValueChange={(v) => onChange({ specialty: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-full bg-dark-bg border-gray-700">
            <SelectValue placeholder="Select specialty" />
          </SelectTrigger>
          <SelectContent>
            {SPECIALTIES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      <FilterSection title="Hourly rate ($25–$500)">
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-0.5">Min</label>
            <input
              type="number"
              min={25}
              max={500}
              value={filters.minRate ?? 25}
              onChange={(e) =>
                onChange({ minRate: Math.min(500, Math.max(25, Number(e.target.value) || 25)) })
              }
              className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-white"
            />
          </div>
          <span className="text-gray-500 pt-5">–</span>
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-0.5">Max</label>
            <input
              type="number"
              min={25}
              max={500}
              value={filters.maxRate ?? 500}
              onChange={(e) =>
                onChange({ maxRate: Math.min(500, Math.max(25, Number(e.target.value) || 500)) })
              }
              className="w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-white"
            />
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Minimum rating">
        <Select
          value={filters.minRating != null ? String(filters.minRating) : '0'}
          onValueChange={(v) => onChange({ minRating: v === '0' ? undefined : Number(v) })}
        >
          <SelectTrigger className="w-full bg-dark-bg border-gray-700">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n === 0 ? 'Any' : `${n}+ stars`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      <FilterSection title="Availability">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.availableNow ?? false}
              onChange={(e) => onChange({ availableNow: e.target.checked })}
              className="rounded border-gray-600 bg-dark-bg text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-300">Available now</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.availableThisWeek ?? false}
              onChange={(e) => onChange({ availableThisWeek: e.target.checked })}
              className="rounded border-gray-600 bg-dark-bg text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-300">Available this week</span>
          </label>
        </div>
      </FilterSection>

      {hasLocation && (
        <FilterSection title="Distance (miles)">
          <div className="flex flex-wrap gap-2">
            {DISTANCE_OPTIONS.map((miles) => (
              <button
                key={miles}
                type="button"
                onClick={() =>
                  onChange({
                    radiusMiles: filters.radiusMiles === miles ? undefined : miles,
                  })
                }
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  filters.radiusMiles === miles
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                )}
              >
                {miles} mi
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Other">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Verified only</span>
          <Switch
            checked={filters.verifiedOnly ?? false}
            onCheckedChange={(v) => onChange({ verifiedOnly: v })}
          />
        </div>
      </FilterSection>

      <FilterSection title="Sort by">
        <Select
          value={filters.sortBy || 'rating'}
          onValueChange={(v) => {
            const opt = SORT_OPTIONS.find((o) => o.value === v)
            onChange({
              sortBy: (v as WaveLeaderFiltersType['sortBy']) || 'rating',
              sortOrder: (opt?.order as 'asc' | 'desc') || 'desc',
            })
          }}
        >
          <SelectTrigger className="w-full bg-dark-bg border-gray-700">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>
    </div>
  )
}

function countActiveFilters(filters: WaveLeaderFiltersType): number {
  let n = 0
  if (filters.specialty && filters.specialty !== 'all') n++
  if ((filters.minRate != null && filters.minRate > 25) || (filters.maxRate != null && filters.maxRate < 500)) n++
  if (filters.minRating != null && filters.minRating > 0) n++
  if (filters.availableNow) n++
  if (filters.availableThisWeek) n++
  if (filters.radiusMiles != null) n++
  if (filters.verifiedOnly) n++
  return n
}

export function WaveLeaderFilters({
  filters,
  onChange,
  onClear,
  hasLocation = false,
  className,
}: WaveLeaderFiltersProps) {
  const activeCount = countActiveFilters(filters)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:block w-64 shrink-0 border-r border-gray-800 bg-dark-card overflow-y-auto',
          className
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-dark-card px-4 py-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-white">Filters</span>
            {activeCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeCount}
              </Badge>
            )}
          </div>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
        <div className="p-4">
          <FiltersContent
            filters={filters}
            onChange={onChange}
            hasLocation={hasLocation}
          />
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {activeCount}
            </Badge>
          )}
        </Button>
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen} side="left">
          <SheetHeader onClose={() => setMobileFiltersOpen(false)}>
            <SheetTitle className="text-white">Filters</SheetTitle>
          </SheetHeader>
          <SheetContent className="w-80 bg-dark-card border-gray-800">
            <div className="mt-4">
              {activeCount > 0 && (
                <Button variant="ghost" size="sm" onClick={onClear} className="mb-4">
                  Clear filters
                </Button>
              )}
              <FiltersContent
                filters={filters}
                onChange={onChange}
                hasLocation={hasLocation}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
