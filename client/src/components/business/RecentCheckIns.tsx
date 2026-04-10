import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import type { RecentCheckInItem } from '@/hooks/useBusinessDashboard'
import { formatDistanceToNow } from 'date-fns'

interface RecentCheckInsProps {
  items?: RecentCheckInItem[]
  isLoading?: boolean
}

function displayName(firstName: string | null, lastName: string | null) {
  const f = firstName?.trim()
  const l = lastName?.trim()
  if (!f && !l) return 'Customer'
  if (f && l) return `${f} ${l[0].toUpperCase()}.`
  return f || l || 'Customer'
}

export function RecentCheckIns({ items = [], isLoading }: RecentCheckInsProps) {
  return (
    <Card className="border-gray-800 bg-gray-900/40">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-white">Recent Check-ins</CardTitle>
        <Link to="/business/map" className="text-xs text-primary hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24 mt-2" />
                </div>
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            No check-ins yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-[260px] overflow-auto pr-1">
            {items.slice(0, 5).map((c) => {
              const name = displayName(c.user.firstName, c.user.lastName)
              const initials = (c.user.firstName?.[0] || c.user.lastName?.[0] || 'C').toUpperCase()
              const when = formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-800 bg-dark-bg/30 p-3"
                >
                  <Avatar
                    src={c.user.avatar || undefined}
                    fallback={initials}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{name}</p>
                    <p className="text-xs text-gray-500">{when}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Points</p>
                    <p className="text-sm font-semibold text-white">{c.points}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

