import { Menu, Search, Bell, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { User, Settings, LogOut } from 'lucide-react'
import { useWaveLeaderStats } from '@/hooks/useWaveLeaderDashboard'

interface WaveLeaderHeaderProps {
  onMenuClick?: () => void
}

export function WaveLeaderHeader({ onMenuClick }: WaveLeaderHeaderProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { logout } = useAuth()
  const { data: stats } = useWaveLeaderStats()

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : 'U'

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-gray-800 bg-dark-card/95 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left: Mobile menu button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Center: Search (desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <Input
            type="search"
            placeholder="Search bookings, clients..."
            leftIcon={<Search className="h-4 w-4" />}
            className="bg-dark-bg border-gray-700"
          />
        </div>

        {/* Right: Notifications, Earnings, User */}
        <div className="flex items-center gap-3">
          {/* Earnings badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-white">
              ${stats?.thisWeekEarnings ?? 0}
            </span>
            <span className="text-xs text-gray-400">/week</span>
          </div>

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
                  src={user?.avatar || undefined}
                  fallback={userInitials}
                  size="sm"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-white">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email}
                  </div>
                  <div className="text-xs text-gray-400">WaveLeader</div>
                </div>
              </button>
            }
          >
            <DropdownMenuItem
              icon={<User className="h-4 w-4" />}
              onClick={() => navigate('/waveleader/profile')}
            >
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<Settings className="h-4 w-4" />}
              onClick={() => navigate('/waveleader/settings')}
            >
              Settings
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
