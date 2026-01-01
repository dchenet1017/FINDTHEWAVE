import { formatDistanceToNow } from 'date-fns'
import { UserPlus, Building2, Calendar, Star, User } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export interface Activity {
  id: string
  type: 'user_registered' | 'business_pending' | 'booking_created' | 'review_posted'
  description: string
  timestamp: Date
  user?: { name: string; avatar?: string }
}

interface RecentActivityProps {
  activities: Activity[]
  maxItems?: number
}

const activityConfig = {
  user_registered: {
    icon: UserPlus,
    color: 'text-primary',
    bg: 'bg-primary/10',
    badge: 'New User',
    badgeVariant: 'default' as const,
  },
  business_pending: {
    icon: Building2,
    color: 'text-warning',
    bg: 'bg-warning/10',
    badge: 'Pending',
    badgeVariant: 'warning' as const,
  },
  booking_created: {
    icon: Calendar,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    badge: 'Booking',
    badgeVariant: 'secondary' as const,
  },
  review_posted: {
    icon: Star,
    color: 'text-accent',
    bg: 'bg-accent/10',
    badge: 'Review',
    badgeVariant: 'outline' as const,
  },
}

export function RecentActivity({ activities, maxItems = 10 }: RecentActivityProps) {
  const displayActivities = activities.slice(0, maxItems)

  return (
    <div className="rounded-lg border border-gray-800 bg-dark-card">
      <div className="border-b border-gray-800 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-800">
        {displayActivities.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">
            No recent activity
          </div>
        ) : (
          displayActivities.map((activity) => {
            const config = activityConfig[activity.type]
            const Icon = config.icon

            return (
              <div key={activity.id} className="px-6 py-4 hover:bg-dark-bg/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={cn('rounded-full p-2', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {activity.user && (
                        <Avatar
                          src={activity.user.avatar}
                          fallback={activity.user.name[0]}
                          size="sm"
                        />
                      )}
                      <p className="text-sm text-white">{activity.description}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={config.badgeVariant} className="text-xs">
                        {config.badge}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

