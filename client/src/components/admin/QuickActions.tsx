import { Link } from 'react-router-dom'
import {
  CheckCircle,
  Flag,
  Megaphone,
  Users,
  Building2,
  Settings,
  BarChart3,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface QuickAction {
  id: string
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  count?: number
}

interface QuickActionsProps {
  pendingBusinesses?: number
  flaggedContent?: number
  pendingWaveLeaders?: number
}

export function QuickActions({
  pendingBusinesses = 0,
  flaggedContent = 0,
}: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'approve-businesses',
      name: 'Approve Businesses',
      href: '/admin/businesses?tab=pending',
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      count: pendingBusinesses,
    },
    {
      id: 'flagged-content',
      name: 'Flagged Content',
      href: '/admin/moderation',
      icon: Flag,
      color: 'text-danger',
      bgColor: 'bg-danger/10',
      count: flaggedContent,
    },
    {
      id: 'send-announcement',
      name: 'Send Announcement',
      href: '/admin/announcements/new',
      icon: Megaphone,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'manage-users',
      name: 'Manage Users',
      href: '/admin/users',
      icon: Users,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      id: 'view-analytics',
      name: 'View Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      id: 'platform-settings',
      name: 'Platform Settings',
      href: '/admin/settings',
      icon: Settings,
      color: 'text-gray-400',
      bgColor: 'bg-gray-800',
    },
  ]

  return (
    <div className="rounded-lg border border-gray-800 bg-dark-card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.id}
              to={action.href}
              className={cn(
                'flex flex-col items-center gap-3 p-4 rounded-lg border border-gray-800 transition-all hover:border-gray-700 hover:bg-dark-bg/50',
                action.bgColor
              )}
            >
              <div className={cn('rounded-full p-3', action.bgColor)}>
                <Icon className={cn('h-5 w-5', action.color)} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">{action.name}</p>
                {action.count !== undefined && action.count > 0 && (
                  <Badge
                    variant="destructive"
                    className="mt-2"
                  >
                    {action.count}
                  </Badge>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

