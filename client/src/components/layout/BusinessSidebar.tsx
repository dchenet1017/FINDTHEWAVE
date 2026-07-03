import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  BarChart3,
  CalendarDays,
  Map as MapIcon,
  Megaphone,
  Gift,
  Star,
  Users,
  DollarSign,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Waves,
  BadgeCheck,
  LogOut,
  MapPinned,
  Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useBusinessDashboard, useBusinessStats } from '@/hooks/useBusinessDashboard'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/business/dashboard', icon: Home },
  { name: 'Analytics', href: '/business/analytics', icon: BarChart3 },
  { name: 'My Location', href: '/business/map', icon: MapIcon },
  { name: 'Advertisements', href: '/business/ads', icon: Megaphone },
  { name: 'Events', href: '/business/events', icon: CalendarDays },
  { name: 'Bar Crawls', href: '/business/crawls', icon: MapPinned },
  { name: 'Go Out Queue', href: '/business/go-out', icon: Radio },
  { name: 'Promotions', href: '/business/promotions', icon: Gift },
  { name: 'Reviews', href: '/business/reviews', icon: Star },
  { name: 'Customers', href: '/business/customers', icon: Users },
  { name: 'Revenue', href: '/business/revenue', icon: DollarSign },
  { name: 'Business Profile', href: '/business/profile', icon: Building2 },
  { name: 'Settings', href: '/business/settings', icon: Settings },
]

interface BusinessSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
  onClose?: () => void
}

export function BusinessSidebar({
  isCollapsed = false,
  onToggle,
  onClose,
}: BusinessSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { data: dashboard, isLoading: dashboardLoading } = useBusinessDashboard()
  const { data: stats, isLoading: statsLoading } = useBusinessStats()

  const isActive = (href: string) => {
    if (href === '/business/dashboard') {
      return location.pathname === '/business/dashboard'
    }
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const businessName = dashboard?.business?.name || 'Business'
  const isVerified = dashboard?.business?.isVerified ?? false

  const checkInsToday = stats?.todayCheckIns ?? 0
  const weekRevenue = stats?.thisWeekRevenue ?? 0

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
          to="/business/dashboard"
          className="flex items-center gap-2"
          onClick={onClose}
        >
          <Waves className="h-6 w-6 text-primary shrink-0" />
          {!isCollapsed && (
            <>
              <span className="text-xl font-bold text-white">WaveFinder</span>
              <span className="text-xs text-secondary bg-secondary/10 px-2 py-1 rounded">
                Business
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

      {/* Bottom: business info + quick stats */}
      <div className={cn('p-4 border-t border-gray-800 shrink-0', isCollapsed && 'px-2')}>
        <div
          className={cn(
            'p-3 rounded-lg bg-dark-bg/50',
            isCollapsed ? 'flex flex-col items-center gap-2 p-2' : 'space-y-3'
          )}
        >
          <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
            {dashboardLoading ? (
              <Skeleton className="h-10 w-10 rounded-full" />
            ) : (
              <Avatar
                src={dashboard?.business?.logoUrl || undefined}
                fallback={(businessName?.[0] || 'B').toUpperCase()}
                size={isCollapsed ? 'sm' : 'md'}
              />
            )}

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{businessName}</p>
                <div className="flex items-center gap-2 mt-1">
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 text-primary text-xs font-medium">
                      <BadgeCheck className="h-4 w-4" />
                      Verified
                    </span>
                  ) : (
                    <Badge variant="warning" className="text-[11px]">
                      Pending verification
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-gray-800 bg-gray-900/40 p-2">
                <p className="text-gray-500">Today</p>
                <p className="text-white font-semibold">
                  {statsLoading ? '—' : checkInsToday}
                </p>
                <p className="text-gray-500">check-ins</p>
              </div>
              <div className="rounded-md border border-gray-800 bg-gray-900/40 p-2">
                <p className="text-gray-500">This week</p>
                <p className="text-white font-semibold">
                  {statsLoading ? '—' : `$${weekRevenue.toLocaleString()}`}
                </p>
                <p className="text-gray-500">revenue</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start text-gray-300 hover:text-white hover:bg-dark-bg',
              isCollapsed && 'justify-center px-2'
            )}
            onClick={() => {
              logout()
              onClose?.()
            }}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
            {!isCollapsed && 'Logout'}
          </Button>

          {isCollapsed && (
            <button
              onClick={() => navigate('/business/profile')}
              className="text-[10px] text-gray-500 hover:text-gray-300"
              title="View business profile"
            >
              {businessName.slice(0, 10)}
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

