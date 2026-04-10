import { useMemo } from 'react'
import { Menu, Bell, Plus, User, Settings, LogOut, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard'

interface BusinessHeaderProps {
  onMenuClick?: () => void
}

export function BusinessHeader({ onMenuClick }: BusinessHeaderProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { logout } = useAuth()
  const { data: dashboard } = useBusinessDashboard()

  const businessName = dashboard?.business?.name || 'Business'

  const userInitials = useMemo(() => {
    if (!user) return 'B'
    const initials =
      `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
      user.email[0]?.toUpperCase()
    return initials || 'B'
  }, [user])

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-gray-800 bg-dark-card/95 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-400">Business</p>
              {dashboard?.business?.isVerified && (
                <Badge variant="success" className="text-[11px]">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-base font-semibold text-white truncate">{businessName}</p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Quick actions */}
          <DropdownMenu
            trigger={
              <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 transition-colors">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-semibold">Create</span>
              </button>
            }
            align="right"
          >
            <DropdownMenuItem
              icon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/business/ads/create')}
            >
              Create Ad
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/business/promotions')}
            >
              Add Promotion
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              icon={<Building2 className="h-4 w-4" />}
              onClick={() => navigate('/business/profile')}
            >
              View Profile
            </DropdownMenuItem>
          </DropdownMenu>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-gray-400 hover:bg-dark-bg hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          </button>

          {/* User menu */}
          <DropdownMenu
            trigger={
              <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dark-bg transition-colors">
                <Avatar
                  src={dashboard?.business?.logoUrl || user?.avatar || undefined}
                  fallback={userInitials}
                  size="sm"
                />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-white">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email}
                  </div>
                  <div className="text-xs text-gray-400">Business owner</div>
                </div>
              </button>
            }
            align="right"
          >
            <DropdownMenuItem
              icon={<Settings className="h-4 w-4" />}
              onClick={() => navigate('/business/settings')}
            >
              Business Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<User className="h-4 w-4" />}
              onClick={() => navigate('/business/profile')}
            >
              Business Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              icon={<LogOut className="h-4 w-4" />}
              onClick={logout}
              className="text-danger hover:bg-danger/10"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

