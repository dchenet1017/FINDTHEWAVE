import { Outlet, Link } from 'react-router-dom'
import { Waves, LayoutDashboard, Calendar, DollarSign, Settings, LogOut, Map as MapIcon, Briefcase } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

export function WaveLeaderLayout() {
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
          <Link to="/waveleader/dashboard" className="flex items-center gap-2">
            <Waves className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-white">WaveFinder</span>
            <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded">Wave Leader</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/waveleader/dashboard"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-300 hover:bg-dark-bg hover:text-white transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/waveleader/map"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-300 hover:bg-dark-bg hover:text-white transition-colors"
          >
            <MapIcon className="h-5 w-5" />
            <span>My Area</span>
          </Link>
          <Link
            to="/waveleader/opportunities"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-300 hover:bg-dark-bg hover:text-white transition-colors"
          >
            <Briefcase className="h-5 w-5" />
            <span>Opportunities</span>
          </Link>
          <Link
            to="/waveleader/bookings"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-300 hover:bg-dark-bg hover:text-white transition-colors"
          >
            <Calendar className="h-5 w-5" />
            <span>Bookings</span>
          </Link>
          <Link
            to="/waveleader/earnings"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-300 hover:bg-dark-bg hover:text-white transition-colors"
          >
            <DollarSign className="h-5 w-5" />
            <span>Earnings</span>
          </Link>
          <Link
            to="/waveleader/settings"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-300 hover:bg-dark-bg hover:text-white transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium text-white">{user?.email}</p>
            <p className="text-xs text-gray-400">Wave Leader</p>
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

