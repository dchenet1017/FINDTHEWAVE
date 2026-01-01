import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminBreadcrumb() {
  const location = useLocation()
  const paths = location.pathname.split('/').filter(Boolean)

  const breadcrumbMap: Record<string, string> = {
    admin: 'Admin',
    users: 'Users',
    waveleaders: 'Wave Leaders',
    businesses: 'Businesses',
    listings: 'Listings',
    events: 'Events',
    promotions: 'Promotions',
    analytics: 'Analytics',
    revenue: 'Revenue',
    engagement: 'Engagement',
    settings: 'Settings',
  }

  const breadcrumbs = paths.map((path, index) => {
    const href = '/' + paths.slice(0, index + 1).join('/')
    const label = breadcrumbMap[path] || path.charAt(0).toUpperCase() + path.slice(1)
    const isLast = index === paths.length - 1

    return { href, label, isLast }
  })

  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        to="/admin"
        className="text-gray-400 hover:text-white transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-gray-600" />
          {crumb.isLast ? (
            <span className="text-white font-medium">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.href}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

