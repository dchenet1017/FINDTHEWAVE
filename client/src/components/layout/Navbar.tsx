import { Link, useNavigate } from 'react-router-dom'
import { Bell, Calendar, LogOut, Map, Menu, Users, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface NavbarProps {
  className?: string
}

export function Navbar({ className }: NavbarProps) {
  const { user, isAuthenticated } = useAuthStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const dashboardPath =
    user?.role === 'BUSINESS'
      ? '/business/dashboard'
      : user?.role === 'WAVELEADER'
        ? '/waveleader/dashboard'
        : user?.role === 'ADMIN'
          ? '/admin'
          : '/dashboard'

  const initials =
    (user?.firstName?.[0] || '') + (user?.lastName?.[0] || user?.email?.[0] || '')

  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full border-b border-gray-800 bg-dark-card/90 backdrop-blur',
        className
      )}
    >
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary">
              WF
            </div>
            <div>
              <p className="text-sm text-gray-400 leading-tight">WaveFinder</p>
              <p className="font-semibold text-white leading-tight">Explore</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-4 ml-4">
            <Link to="/map" className="text-sm text-gray-300 hover:text-white inline-flex items-center gap-1">
              <Map className="h-4 w-4" />
              Explore Map
            </Link>
            <Link to="/events" className="text-sm text-gray-300 hover:text-white inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Events
            </Link>
            <Link to="/communities" className="text-sm text-gray-300 hover:text-white inline-flex items-center gap-1">
              <Users className="h-4 w-4" />
              Communities
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <button className="p-2 text-gray-400 hover:text-white">
                <Bell className="h-5 w-5" />
              </button>
              <DropdownMenu
                trigger={
                  <button className="flex items-center gap-2 rounded-md border border-gray-800 bg-dark-bg px-2 py-1 text-sm text-white hover:border-primary/50">
                    <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-sm">
                      {initials || <User className="h-4 w-4" />}
                    </div>
                    <span className="hidden sm:inline text-gray-200">
                      {user?.firstName ? `${user.firstName}` : user?.email}
                    </span>
                    <Menu className="h-4 w-4 text-gray-500" />
                  </button>
                }
                align="right"
              >
                <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                  Dashboard
                </DropdownMenuItem>
                {user?.role === 'BUSINESS' && (
                  <DropdownMenuItem onClick={() => navigate('/business/dashboard')}>
                    Business Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  icon={<LogOut className="h-4 w-4" />}
                  className="text-danger"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

