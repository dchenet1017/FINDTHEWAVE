import type { EventCategory, EventDatePreset, EventDiscoveryFilters } from '@/types/event'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/Switch'
import { Slider } from '@/components/ui/Slider'
import { cn } from '@/lib/utils'

const CATEGORIES: { id: EventCategory | 'ALL'; label: string; emoji: string }[] = [
  { id: 'ALL', label: 'All Events', emoji: '✨' },
  { id: 'MUSIC', label: 'Music', emoji: '🎵' },
  { id: 'SPORTS', label: 'Sports', emoji: '⚽' },
  { id: 'FOOD_DRINK', label: 'Food & Drink', emoji: '🍽️' },
  { id: 'WELLNESS', label: 'Wellness', emoji: '🧘' },
  { id: 'NETWORKING', label: 'Networking', emoji: '🤝' },
  { id: 'EDUCATION', label: 'Education', emoji: '📚' },
  { id: 'ART', label: 'Art', emoji: '🎨' },
  { id: 'NIGHTLIFE', label: 'Nightlife', emoji: '🌙' },
  { id: 'COMMUNITY', label: 'Community', emoji: '👥' },
]

const DATE_PRESETS: { id: EventDatePreset; label: string }[] = [
  { id: 'all', label: 'Any time' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_weekend', label: 'This Weekend' },
  { id: 'next_week', label: 'Next Week' },
  { id: 'custom', label: 'Custom Range' },
]

interface EventFiltersProps {
  filters: EventDiscoveryFilters
  onChange: (patch: Partial<EventDiscoveryFilters>) => void
  onClear: () => void
  showApply?: boolean
  onApply?: () => void
  className?: string
}

export function EventFilters({
  filters,
  onChange,
  onClear,
  showApply,
  onApply,
  className,
}: EventFiltersProps) {
  return (
    <div className={cn('flex flex-col gap-6 p-4', className)}>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Categories
        </p>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange({ category: c.id, page: 1, limit: 24 })}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                filters.category === c.id
                  ? 'bg-primary/20 text-white'
                  : 'text-gray-400 hover:bg-gray-800/80 hover:text-white'
              )}
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Date
        </p>
        <div className="flex flex-col gap-1">
          {DATE_PRESETS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onChange({ datePreset: d.id, page: 1, limit: 24 })}
              className={cn(
                'rounded-lg px-3 py-2 text-left text-sm transition-colors',
                filters.datePreset === d.id
                  ? 'bg-primary/20 text-white'
                  : 'text-gray-400 hover:bg-gray-800/80 hover:text-white'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        {filters.datePreset === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">From</Label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-white"
                value={filters.dateFrom?.slice(0, 10) ?? ''}
                onChange={(e) =>
                  onChange({
                    dateFrom: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined,
                    page: 1,
                    limit: 24,
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">To</Label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-gray-700 bg-dark-bg px-2 py-1.5 text-sm text-white"
                value={filters.dateTo?.slice(0, 10) ?? ''}
                onChange={(e) =>
                  onChange({
                    dateTo: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined,
                    page: 1,
                    limit: 24,
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Other</p>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="free-only" className="text-sm text-gray-300">
            Free events only
          </Label>
          <Switch
            id="free-only"
            checked={filters.freeOnly}
            onCheckedChange={(v) => onChange({ freeOnly: v, page: 1, limit: 24 })}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="has-wl" className="text-sm text-gray-300">
            Has WaveLeader
          </Label>
          <Switch
            id="has-wl"
            checked={filters.hasWaveLeader}
            onCheckedChange={(v) => onChange({ hasWaveLeader: v, page: 1, limit: 24 })}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="virtual-only" className="text-sm text-gray-300">
            Virtual events only
          </Label>
          <Switch
            id="virtual-only"
            checked={filters.virtualOnly}
            onCheckedChange={(v) => onChange({ virtualOnly: v, page: 1, limit: 24 })}
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-sm">
          <Label>Distance</Label>
          <span className="text-gray-400">{filters.distanceMiles} mi</span>
        </div>
        <Slider
          min={1}
          max={50}
          step={1}
          value={[filters.distanceMiles]}
          onValueChange={([v]) => onChange({ distanceMiles: v, page: 1, limit: 24 })}
        />
        <p className="mt-1 text-xs text-gray-500">Uses your location when available</p>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-sm">
          <Label>Min spots available</Label>
          <span className="text-gray-400">
            {filters.minSpotsLeft === 0 ? 'Any' : `${filters.minSpotsLeft}+`}
          </span>
        </div>
        <Slider
          min={0}
          max={50}
          step={1}
          value={[filters.minSpotsLeft]}
          onValueChange={([v]) => onChange({ minSpotsLeft: v, page: 1, limit: 24 })}
        />
      </div>

      <div>
        <div className="mb-2 flex justify-between text-sm">
          <Label>Price range (paid)</Label>
          <span className="text-gray-400">
            ${filters.minPrice} – ${filters.maxPrice >= 500 ? '500+' : filters.maxPrice}
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-gray-500">Min</span>
            <Slider
              min={0}
              max={500}
              step={5}
              value={[filters.minPrice]}
              onValueChange={([v]) =>
                onChange({ minPrice: Math.min(v, filters.maxPrice), page: 1, limit: 24 })
              }
            />
          </div>
          <div>
            <span className="text-xs text-gray-500">Max</span>
            <Slider
              min={0}
              max={500}
              step={5}
              value={[filters.maxPrice]}
              onValueChange={([v]) =>
                onChange({ maxPrice: Math.max(v, filters.minPrice), page: 1, limit: 24 })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
        <Button variant="outline" className="w-full border-gray-600" type="button" onClick={onClear}>
          Clear all
        </Button>
        {showApply && (
          <Button className="w-full" type="button" onClick={onApply}>
            Apply
          </Button>
        )}
      </div>
    </div>
  )
}
