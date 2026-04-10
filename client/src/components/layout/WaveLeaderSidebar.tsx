import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Calendar,
  Map as MapIcon,
  Users,
  DollarSign,
  BarChart3,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Waves, BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AvailabilityToggle } from '@/components/waveleader/AvailabilityToggle'
import { Switch } from '@/components/ui/Switch'
import { useWaveLeaderDashboard, useUpdateAvailability } from '@/hooks/useWaveLeaderDashboard'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/waveleader/dashboard', icon: Home },
  { name: 'My Bookings', href: '/waveleader/bookings', icon: Calendar },
  { name: 'Service Area', href: '/waveleader/map', icon: MapIcon },
  { name: 'Communities', href: '/waveleader/communities', icon: Users },
  { name: 'Earnings', href: '/waveleader/earnings', icon: DollarSign },
  { name: 'Analytics', href: '/waveleader/analytics', icon: BarChart3 },
  { name: 'My Profile', href: '/waveleader/profile', icon: User },
  { name: 'Settings', href: '/waveleader/settings', icon: Settings },
]

interface WaveLeaderSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
  onClose?: () => void
}

export function WaveLeaderSidebar({
  isCollapsed = false,
  onToggle,
  onClose,
}: WaveLeaderSidebarProps) {
  const location = useLocation()
  const { data: dashboard, isLoading } = useWaveLeaderDashboard()
  const updateAvailability = useUpdateAvailability()

  const isActive = (href: string) => {
    if (href === '/waveleader/dashboard') {
      return location.pathname === '/waveleader/dashboard'
    }
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-30 bg-dark-card border-r border-gray-800 flex flex-col transition-all duration-200',
        isCollapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-800 shrink-0 flex items-center justify-between">
        <Link
          to="/waveleader/dashboard"
          className="flex items-center gap-2"
          onClick={onClose}
        >
          <Waves className="h-6 w-6 text-primary shrink-0" />
          {!isCollapsed && (
            <>
              <span className="text-xl font-bold text-white">WaveFinder</span>
              <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded">
                Wave Leader
              </span>
            </>
          )}
        </Link>
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Availability Toggle */}
      <div className={cn('p-4 border-b border-gray-800 shrink-0', isCollapsed && 'px-2')}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                'h-3 w-3 rounded-full',
                dashboard?.isAvailable ? 'bg-green-500' : 'bg-red-500'
              )}
              title={dashboard?.isAvailable ? 'Available' : 'Unavailable'}
            />
            <Switch
              checked={dashboard?.isAvailable ?? true}
              onCheckedChange={(v) => updateAvailability.mutate(v)}
              disabled={updateAvailability.isPending || isLoading}
            />
          </div>
        ) : (
          <AvailabilityToggle
            isAvailable={dashboard?.isAvailable ?? true}
            onChange={(v) => updateAvailability.mutate(v)}
            isLoading={updateAvailability.isPending || isLoading}
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                  active
                    ? 'bg-primary/20 text-primary'
                    : 'text-gray-400 hover:bg-dark-bg hover:text-white',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            )
        })}
      </nav>

      {/* Profile Card */}
      <div className={cn('p-4 border-t border-gray-800 shrink-0', isCollapsed && 'px-2')}>
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg bg-dark-bg/50',
            isCollapsed && 'justify-center p-2'
          )}
        >
          {isLoading ? (
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          ) : (
            <Avatar
              src={undefined}
              fallback={dashboard?.displayName?.[0] ?? 'U'}
              size={isCollapsed ? 'sm' : 'md'}
              className="shrink-0"
            />
          )}
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {dashboard?.displayName ?? 'WaveLeader'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-amber-400">★</span>
                <span className="text-xs text-gray-400">
                  {(dashboard?.rating ?? 0).toFixed(1)} ({dashboard?.totalReviews ?? 0} reviews)
                </span>
              </div>
              {dashboard?.isVerified && (
                <div className="flex items-center gap-1 mt-1 text-primary">
                  <BadgeCheck className="h-4 w-4" />
                  <span className="text-xs font-medium">Verified</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
