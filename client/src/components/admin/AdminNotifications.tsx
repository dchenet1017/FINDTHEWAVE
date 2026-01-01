import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, UserPlus, Building2, Calendar, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { formatDateTime } from '@/lib/utils'
import { Link } from 'react-router-dom'

interface Notification {
  id: string
  type: 'user_registered' | 'business_pending' | 'booking_created' | 'system_alert'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}

const notificationIcons = {
  user_registered: UserPlus,
  business_pending: Building2,
  booking_created: Calendar,
  system_alert: AlertTriangle,
}

const notificationColors = {
  user_registered: 'text-blue-500',
  business_pending: 'text-orange-500',
  booking_created: 'text-green-500',
  system_alert: 'text-red-500',
}

export function AdminNotifications() {
  const queryClient = useQueryClient()

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['admin', 'notifications'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return [
        {
          id: '1',
          type: 'business_pending',
          title: 'New Business Pending Approval',
          message: 'Ocean Breeze Restaurant is waiting for approval',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/admin/businesses',
        },
        {
          id: '2',
          type: 'user_registered',
          title: 'New User Registration',
          message: 'john.doe@example.com has registered',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          link: '/admin/users',
        },
        {
          id: '3',
          type: 'booking_created',
          title: 'New Booking',
          message: 'Sarah booked a session with WaveLeader Mike',
          isRead: true,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ]
    },
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 300))
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 300))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
    },
  })

  const handleNotificationClick = (notification: Notification) => {
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
              const Icon = notificationIcons[notification.type]
              const iconColor = notificationColors[notification.type]

              const content = (
                <div
                  className={`
                    p-3 hover:bg-dark-bg transition-colors cursor-pointer
                    ${!notification.isRead ? 'bg-primary/5 border-l-2 border-primary' : ''}
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${iconColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium ${
                            !notification.isRead ? 'text-white' : 'text-gray-300'
                          }`}
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
                    </div>
                  </div>
                </div>
              )

              if (notification.link) {
                return (
                  <Link key={notification.id} to={notification.link}>
                    {content}
                  </Link>
                )
              }

              return <div key={notification.id}>{content}</div>
            })
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link to="/admin/notifications">
                <Button
                  variant="ghost"
                  className="w-full justify-center text-sm"
                >
                  View All Notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </DropdownMenu>
  )
}