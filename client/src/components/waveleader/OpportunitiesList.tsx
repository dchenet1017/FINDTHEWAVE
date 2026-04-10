import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useOpportunities } from '@/hooks/useServiceArea'
import { formatDistance } from '@/lib/mapbox'
import { MapPin } from 'lucide-react'

export function OpportunitiesList() {
  const { data: opportunities = [], isLoading } = useOpportunities()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (opportunities.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400">
        <p className="text-sm">No opportunities in your area yet</p>
        <p className="text-xs mt-1">
          Check back later for businesses seeking WaveLeaders
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {opportunities.map((opp) => (
        <div
          key={opp.id}
          className="p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white truncate">{opp.name}</p>
              <p className="text-xs text-gray-400">{opp.type}</p>
              {opp.distance != null && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {formatDistance(opp.distance)} from you
                </p>
              )}
              {opp.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {opp.description}
                </p>
              )}
            </div>
            <Button size="sm" variant="outline" className="shrink-0">
              Contact
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
