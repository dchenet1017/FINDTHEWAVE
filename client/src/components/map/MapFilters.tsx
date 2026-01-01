import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Slider } from '@/components/ui/Slider'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { BusinessType } from '../../../shared/types/business'

type MapFiltersProps = {
  search?: string
  radius?: number
  businessTypes?: BusinessType[]
  showPromotionsOnly?: boolean
  showVerifiedOnly?: boolean
  onChange: (partial: any) => void
  onClear?: () => void
  showRadius?: boolean
  showToggles?: boolean
  className?: string
}

const CATEGORIES: { label: string; value: BusinessType }[] = [
  { label: 'Bars', value: 'BAR' },
  { label: 'Restaurants', value: 'RESTAURANT' },
  { label: 'Entertainment', value: 'ENTERTAINMENT' },
  { label: 'Fitness', value: 'FITNESS' },
  { label: 'Wellness', value: 'WELLNESS' },
  { label: 'Hotels', value: 'HOTEL' },
  { label: 'Other', value: 'OTHER' },
]

export function MapFilters({
  search = '',
  radius = 5,
  businessTypes = [],
  showPromotionsOnly = false,
  showVerifiedOnly = false,
  onChange,
  onClear,
  showRadius = true,
  showToggles = true,
  className,
}: MapFiltersProps) {
  const toggleType = (val: BusinessType) => {
    const exists = businessTypes.includes(val)
    const next = exists ? businessTypes.filter((t) => t !== val) : [...businessTypes, val]
    onChange({ businessTypes: next })
  }

  return (
    <div className={cn('space-y-3 rounded-md border border-gray-800 bg-dark-card p-3 text-sm', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          className="pl-9 bg-dark-bg border-gray-800"
          placeholder="Search places"
          value={search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => toggleType(c.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs border transition-colors',
              businessTypes.includes(c.value)
                ? 'bg-primary text-white border-primary'
                : 'bg-dark-bg border-gray-800 text-gray-300 hover:border-gray-600'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {showRadius && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Radius</span>
            <span className="text-primary font-semibold">{radius} mi</span>
          </div>
          <Slider value={[radius]} min={1} max={25} step={1} onValueChange={(v) => onChange({ radius: v[0] })} />
        </div>
      )}

      {showToggles && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Promotions only</span>
            <Switch checked={showPromotionsOnly} onCheckedChange={(checked) => onChange({ showPromotionsOnly: Boolean(checked) })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Verified only</span>
            <Switch checked={showVerifiedOnly} onCheckedChange={(checked) => onChange({ showVerifiedOnly: Boolean(checked) })} />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear all
        </Button>
      </div>
    </div>
  )
}

