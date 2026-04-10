import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Calendar,
  Star,
  Gift,
  Users,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { useRecentActivity } from '@/hooks/useUserDashboard'
import type { ActivityItem } from '@/services/user.service'

const activityIcons = {
  check_in: MapPin,
  booking: Calendar,
  review: Star,
  reward: Gift,
  community: Users,
}

const activityColors = {
  check_in: 'text-blue-500 bg-blue-500/10',
  booking: 'text-green-500 bg-green-500/10',
  review: 'text-yellow-500 bg-yellow-500/10',
  reward: 'text-purple-500 bg-purple-500/10',
  community: 'text-cyan-500 bg-cyan-500/10',
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now.getTime() - time.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(time)
}

interface RecentActivityProps {
  limit?: number
  showViewAll?: boolean
}

export function RecentActivity({ limit = 5, showViewAll = true }: RecentActivityProps) {
  const navigate = useNavigate()
  const { data: activities = [], isLoading } = useRecentActivity(limit)

  if (isLoading) {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm text-gray-200">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm text-gray-200">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">No recent activity</p>
            <p className="text-xs text-gray-500 mt-1">Your activity will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-gray-200">Recent Activity</CardTitle>
        {showViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/activity')}
            className="text-xs"
          >
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isLast={index === activities.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({
  activity,
  isLast,
}: {
  activity: ActivityItem
  isLast: boolean
}) {
  const navigate = useNavigate()
  const Icon = activityIcons[activity.type] || CheckCircle
  const colorClass = activityColors[activity.type] || 'text-gray-500 bg-gray-500/10'

  const handleClick = () => {
    if (activity.link) {
      navigate(activity.link)
    }
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 relative',
        activity.link && 'cursor-pointer hover:opacity-80 transition-opacity'
      )}
      onClick={handleClick}
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 top-10 w-0.5 h-full bg-gray-800" />
      )}

      {/* Icon */}
      <div className={cn('rounded-full p-2 flex-shrink-0 z-10', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <p className="text-sm font-medium text-white mb-1">{activity.title}</p>
        <p className="text-xs text-gray-400 mb-2">{activity.description}</p>
        <p className="text-xs text-gray-500">{formatRelativeTime(activity.timestamp)}</p>
      </div>
    </div>
  )
}

