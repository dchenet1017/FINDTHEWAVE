import { useState } from 'react'
import { Search, Menu, User, Settings, LogOut, HelpCircle, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { UserNotifications } from '@/components/layout/UserNotifications'

interface UserHeaderProps {
  onMenuClick?: () => void
}

export function UserHeader({ onMenuClick }: UserHeaderProps) {
  const { user } = useAuthStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : 'U'

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'User'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      // TODO: Implement search functionality
      console.log('Search:', searchValue)
    }
  }

  return (
    <header className="sticky top-0 z-20 h-[60px] border-b border-gray-800 bg-dark-card backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left: Mobile menu button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search bar - hidden on mobile, visible on md+ */}
          <form onSubmit={handleSearch} className="hidden md:block">
            <Input
              type="search"
              placeholder="Search businesses, places..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="w-64 lg:w-80 bg-dark-bg border-gray-700"
            />
          </form>
        </div>

        {/* Right: Notifications + User Menu */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <UserNotifications />

          {/* User Menu */}
          <DropdownMenu
            trigger={
              <button className="flex items-center gap-2 p-1.5 rounded-md hover:bg-dark-bg transition-colors">
                <Avatar
                  src={user?.avatar || undefined}
                  fallback={userInitials}
                  size="sm"
                />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-white">{userName}</div>
                  <div className="text-xs text-gray-400 capitalize">
                    {user?.role?.toLowerCase() || 'user'}
                  </div>
                </div>
              </button>
            }
            align="right"
          >
            <DropdownMenuItem
              icon={<User className="h-4 w-4" />}
              onClick={() => navigate('/dashboard/profile')}
            >
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<Settings className="h-4 w-4" />}
              onClick={() => navigate('/dashboard/settings')}
            >
              Settings
            </DropdownMenuItem>
            {user?.role === 'BUSINESS' && (
              <DropdownMenuItem
                icon={<Bell className="h-4 w-4" />}
                onClick={() => navigate('/business/dashboard')}
              >
                Business Dashboard
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              icon={<HelpCircle className="h-4 w-4" />}
              onClick={() => {
                // TODO: Navigate to help page
                console.log('Help & Support')
              }}
            >
              Help & Support
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

