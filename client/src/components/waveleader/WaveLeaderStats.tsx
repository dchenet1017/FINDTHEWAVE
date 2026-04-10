import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { TrendingUp, TrendingDown, Star } from 'lucide-react'
import { useWaveLeaderStats } from '@/hooks/useWaveLeaderDashboard'

export function WaveLeaderStats() {
  const { data: stats, isLoading } = useWaveLeaderStats()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-dark-card border-gray-800">
            <CardHeader className="pb-1">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const items = [
    {
      title: 'This Week Bookings',
      value: String(stats?.thisWeekBookings ?? 0),
      trend: stats?.trend?.bookings,
    },
    {
      title: 'This Week Earnings',
      value: `$${stats?.thisWeekEarnings ?? 0}`,
      trend: stats?.trend?.earnings,
    },
    {
      title: 'Rating',
      value: (stats?.rating ?? 0).toFixed(1),
      suffix: ` (${stats?.totalReviews ?? 0})`,
      showStar: true,
    },
    {
      title: 'Response Rate',
      value: `${stats?.responseRate ?? 0}%`,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.title} className="bg-dark-card border-gray-800">
          <CardHeader className="pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-gray-400 font-normal">
              {item.title}
            </CardTitle>
            {item.trend != null && item.trend !== 0 && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  item.trend > 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {item.trend > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {Math.abs(item.trend)}%
              </span>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              {item.showStar && (
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
              )}
              <p className="text-2xl font-bold text-white">{item.value}</p>
              {item.suffix && (
                <span className="text-sm text-gray-500">{item.suffix}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
