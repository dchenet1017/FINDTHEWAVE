import { Bell, CheckCircle, Calendar, Gift, MapPin, AlertCircle, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { formatDateTime, cn } from '@/lib/utils'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications'
import { useAcceptInvite, useDeclineInvite } from '@/hooks/useInvites'
import type { NotificationRow } from '@/hooks/useNotifications'

const notificationIcons: Record<string, typeof Bell> = {
  check_in: MapPin,
  booking: Calendar,
  reward: Gift,
  community: CheckCircle,
  business_invite: Tag,
  system: AlertCircle,
}

const notificationColors: Record<string, string> = {
  check_in: 'text-blue-500',
  booking: 'text-green-500',
  reward: 'text-yellow-500',
  community: 'text-purple-500',
  business_invite: 'text-pink-500',
  system: 'text-red-500',
}

export function UserNotifications() {
  const { data } = useNotifications()
  const notifications = data?.items ?? []
  const unreadCount = data?.unreadCount ?? 0

  const markAsReadMutation = useMarkNotificationRead()
  const markAllAsReadMutation = useMarkAllNotificationsRead()
  const acceptInviteMutation = useAcceptInvite()
  const declineInviteMutation = useDeclineInvite()

  const handleNotificationClick = (notification: NotificationRow) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id)
    }
  }

  return (
    <DropdownMenu
      trigger={
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      }
      align="right"
    >
      <div className="w-80">
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="h-7 text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || AlertCircle
              const iconColor = notificationColors[notification.type] || 'text-gray-400'
              const inviteId =
                notification.type === 'business_invite'
                  ? (notification.data?.inviteId as string | undefined)
                  : undefined

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'p-3 hover:bg-dark-bg transition-colors cursor-pointer',
                    !notification.isRead ? 'bg-primary/5 border-l-2 border-primary' : ''
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${iconColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            !notification.isRead ? 'text-white' : 'text-gray-300'
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(notification.createdAt)}
                      </p>
                      {inviteId && (
                        <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            loading={acceptInviteMutation.isPending}
                            onClick={() => acceptInviteMutation.mutate(inviteId)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            loading={declineInviteMutation.isPending}
                            onClick={() => declineInviteMutation.mutate(inviteId)}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {notifications.length > 0 && <DropdownMenuSeparator />}
      </div>
    </DropdownMenu>
  )
}
