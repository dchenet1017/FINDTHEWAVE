import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  BarChart3,
  Settings,
  ChevronDown,
  UserCheck,
  Star,
  Map as MapIcon,
} from 'lucide-react'
import { Waves } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/Separator'
import { Badge } from '@/components/ui/Badge'

interface NavItem {
  name: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: { name: string; href: string }[]
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Platform Map',
    href: '/admin/map',
    icon: MapIcon,
  },
  {
    name: 'Users',
    icon: Users,
    children: [
      { name: 'All Users', href: '/admin/users' },
      { name: 'WaveLeaders', href: '/admin/waveleaders' },
      { name: 'Businesses', href: '/admin/businesses' },
    ],
  },
  {
    name: 'Content',
    icon: Building2,
    children: [
      { name: 'Listings', href: '/admin/listings' },
      { name: 'Events', href: '/admin/events' },
      { name: 'Promotions', href: '/admin/promotions' },
    ],
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    children: [
      { name: 'Overview', href: '/admin/analytics' },
      { name: 'Revenue', href: '/admin/analytics/revenue' },
      { name: 'Engagement', href: '/admin/analytics/engagement' },
    ],
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

interface AdminSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function AdminSidebar({ isCollapsed = false, onToggle }: AdminSidebarProps) {
  const location = useLocation()
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const toggleSection = (name: string) => {
    setExpandedSections((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const isActive = (href?: string) => {
    if (!href) return false
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const isChildActive = (children?: { name: string; href: string }[]) => {
    if (!children) return false
    return children.some((child) => location.pathname === child.href)
  }

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-full bg-[#1E1E1E] border-r border-gray-800 transition-all duration-200 z-30',
        isCollapsed ? 'w-16' : 'w-[280px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 h-16 px-4 border-b border-gray-800">
        <Waves className="h-6 w-6 text-primary flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="text-xl font-bold text-white">WaveFinder</span>
            <Badge variant="destructive" className="ml-auto text-xs">
              Admin
            </Badge>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {navigation.map((item) => {
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedSections.includes(item.name)
            const active = isActive(item.href) || isChildActive(item.children)
            const Icon = item.icon

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleSection(item.name)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200',
                        active
                          ? 'bg-primary/10 text-white border-l-4 border-primary'
                          : 'text-[#B0B0B0] hover:bg-primary/10 hover:text-white',
                        isCollapsed && 'justify-center'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.name}</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      )}
                    </button>
                    {!isCollapsed && isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-gray-700 pl-4">
                        {item.children?.map((child) => {
                          const childActive = location.pathname === child.href
                          return (
                            <Link
                              key={child.href}
                              to={child.href}
                              className={cn(
                                'block px-3 py-2 rounded-md text-sm transition-colors duration-200',
                                childActive
                                  ? 'text-white bg-primary/10'
                                  : 'text-[#B0B0B0] hover:text-white hover:bg-primary/10'
                              )}
                            >
                              {child.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.href || '#'}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200',
                      active
                        ? 'bg-primary/10 text-white border-l-4 border-primary'
                        : 'text-[#B0B0B0] hover:bg-primary/10 hover:text-white',
                      isCollapsed && 'justify-center'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

