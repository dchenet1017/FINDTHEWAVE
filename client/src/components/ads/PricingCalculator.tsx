import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/booking'

export interface PricingParams {
  radius: number
  duration: number
  peakHours: boolean
  demographics: boolean
  weekendBoost: boolean
}

export function calculateDailyPrice(params: Omit<PricingParams, 'duration'>) {
  const basePrice = 150

  let radiusMultiplier = 1
  if (params.radius <= 5) radiusMultiplier = 1
  else if (params.radius <= 10) radiusMultiplier = 1.5
  else if (params.radius <= 15) radiusMultiplier = 2
  else if (params.radius <= 20) radiusMultiplier = 2.5
  else radiusMultiplier = 3

  let daily = basePrice * radiusMultiplier
  const breakdown: Array<{ label: string; value: string; hint?: string }> = [
    { label: 'Base price', value: formatCurrency(basePrice) + '/day' },
    { label: 'Radius multiplier', value: `${radiusMultiplier}x`, hint: `${formatCurrency(basePrice * radiusMultiplier)}/day` },
  ]

  if (params.peakHours) {
    daily *= 1.2
    breakdown.push({ label: 'Peak hours', value: '+20%', hint: formatCurrency(daily) + '/day' })
  }
  if (params.demographics) {
    daily += 50
    breakdown.push({ label: 'Demographic targeting', value: '+$50/day' })
  }
  if (params.weekendBoost) {
    daily += 100
    breakdown.push({ label: 'Weekend boost (Fri–Sun)', value: '+$100/day' })
  }

  daily = Math.round(daily)
  return { daily, basePrice, radiusMultiplier, breakdown }
}

export function calculateAdPrice(params: PricingParams): number {
  const { daily } = calculateDailyPrice(params)
  return daily * Math.max(1, params.duration)
}

export function PricingCalculator({
  params,
  estimatedImpressionsPerDay,
  estimatedClicksPerDay,
  className,
}: {
  params: PricingParams
  estimatedImpressionsPerDay?: number
  estimatedClicksPerDay?: number
  className?: string
}) {
  const duration = Math.max(1, params.duration)
  const { daily, breakdown } = calculateDailyPrice(params)
  const total = daily * duration

  return (
    <Card className={cn('border-gray-800 bg-gray-900/40', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-white">Dynamic pricing</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500">Cost per day</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(daily)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total campaign</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(total)}</p>
              <p className="text-xs text-gray-500 mt-1">{duration} day{duration === 1 ? '' : 's'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {breakdown.map((b) => (
            <div key={b.label} className="flex items-center justify-between gap-2">
              <span className="text-gray-400">{b.label}</span>
              <span className="text-white font-medium">
                {b.value}
                {b.hint ? <span className="text-gray-500 font-normal"> · {b.hint}</span> : null}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-3">
            <p className="text-gray-500">Est. impressions/day</p>
            <p className="text-white font-semibold">{estimatedImpressionsPerDay ?? '—'}</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-3">
            <p className="text-gray-500">Est. clicks/day</p>
            <p className="text-white font-semibold">{estimatedClicksPerDay ?? '—'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

