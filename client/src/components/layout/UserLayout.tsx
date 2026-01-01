import { Outlet, Link } from 'react-router-dom'
import { Waves, User, Settings, LogOut, Home, Map as MapIcon, Heart } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

export function UserLayout() {
  const { user } = useAuthStore()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-card border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Waves className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-white">WaveFinder</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-300 hover:bg-dark-bg hover:text-white transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/dashboard/map"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-300 hover:bg-dark-bg hover:text-white transition-colors"
          >
            <MapIcon className="h-5 w-5" />
            <span>Explore Map</span>
          </Link>
          <Link
            to="/dashboard/places"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-300 hover:bg-dark-bg hover:text-white transition-colors"
          >
            <Heart className="h-5 w-5" />
            <span>My Places</span>
          </Link>
          <Link
            to="/dashboard/profile"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-300 hover:bg-dark-bg hover:text-white transition-colors"
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>
          <Link
            to="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-300 hover:bg-dark-bg hover:text-white transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium text-white">{user?.email}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

