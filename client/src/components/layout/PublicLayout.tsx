import { Outlet, Link } from 'react-router-dom'
import { Waves } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'

export function PublicLayout() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <header className="border-b border-gray-800 bg-dark-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Waves className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-white">WaveFinder</span>
          </Link>

          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-800 bg-dark-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-primary" />
              <span className="text-sm text-gray-400">© 2024 WaveFinder. All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/about" className="hover:text-white transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

