import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Map as MapIcon,
  Heart,
  Calendar,
  CalendarClock,
  Ticket,
  Users,
  Gift,
  Settings,
  ChevronLeft,
  ChevronRight,
  Waves,
  LogOut,
  UserSearch,
  MapPinned,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Explore Map',
    href: '/dashboard/map',
    icon: MapIcon,
  },
  {
    name: 'My Places',
    href: '/dashboard/places',
    icon: Heart,
  },
  {
    name: 'Bookings',
    href: '/dashboard/bookings',
    icon: CalendarClock,
  },
  {
    name: 'My Events',
    href: '/dashboard/events',
    icon: Calendar,
  },
  {
    name: 'Digital Passport',
    href: '/dashboard/passport',
    icon: Ticket,
  },
  {
    name: 'Bar Crawls',
    href: '/crawls',
    icon: MapPinned,
  },
  {
    name: 'Communities',
    href: '/dashboard/communities',
    icon: Users,
  },
  {
    name: 'Find WaveLeaders',
    href: '/waveleaders',
    icon: UserSearch,
  },
  {
    name: 'Rewards',
    href: '/dashboard/rewards',
    icon: Gift,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

interface UserSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
  onClose?: () => void
}

export function UserSidebar({ isCollapsed = false, onToggle, onClose }: UserSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { logout } = useAuth()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const handleLogout = () => {
    logout()
    onClose?.()
  }

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : 'U'

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'User'

  return (
    <div
      className={cn(
        'h-full bg-[#1A1A1A] border-r border-gray-800 flex flex-col transition-all duration-200',
        isCollapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        <Link
          to="/dashboard"
          className="flex items-center gap-2"
          onClick={onClose}
        >
          <Waves className="h-6 w-6 text-primary flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-xl font-bold text-white">WaveFinder</span>
          )}
        </Link>
        {!isCollapsed && onToggle && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {navigation.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-primary/10 text-white border-l-4 border-primary'
                    : 'text-gray-300 hover:bg-dark-bg hover:text-white',
                  isCollapsed && 'justify-center px-2'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-800 p-4">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <Avatar
                src={user?.avatar || undefined}
                fallback={userInitials}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-gray-400 capitalize">
                  {user?.role?.toLowerCase() || 'user'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-dark-bg"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => navigate('/dashboard/profile')}
              className="p-2 rounded-md hover:bg-dark-bg transition-colors"
              title={userName}
            >
              <Avatar
                src={user?.avatar || undefined}
                fallback={userInitials}
                size="sm"
              />
            </button>
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

