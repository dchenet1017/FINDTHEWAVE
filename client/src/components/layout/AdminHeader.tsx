import { useState } from 'react'
import { Search, Menu, User, Settings, LogOut, Waves } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { Input } from '@/components/ui/Input'
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb'
import { AdminNotifications } from '@/components/admin/AdminNotifications'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/Sheet'
import { AdminSidebar } from './AdminSidebar'

interface AdminHeaderProps {
  onMenuClick?: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user } = useAuthStore()
  const { logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : 'A'

  return (
    <>
      <header className="sticky top-0 z-20 h-16 border-b border-gray-800 bg-dark-card backdrop-blur-sm">
        <div className="flex h-full items-center justify-between px-4">
          {/* Left: Mobile menu + Breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                onMenuClick?.()
                setMobileMenuOpen(true)
              }}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <AdminBreadcrumb />
          </div>

          {/* Right: Search + Notifications + User */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:block w-64">
              <Input
                type="search"
                placeholder="Search..."
                leftIcon={<Search className="h-4 w-4" />}
                className="bg-dark-bg border-gray-700"
              />
            </div>

            {/* Notifications */}
            <AdminNotifications />

            {/* User Menu */}
            <DropdownMenu
              trigger={
                <button className="flex items-center gap-2 p-1 rounded-md hover:bg-dark-bg transition-colors">
                  <Avatar
                    src={user?.avatar || undefined}
                    fallback={userInitials}
                    size="sm"
                  />
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-white">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email}
                    </div>
                    <div className="text-xs text-gray-400">Administrator</div>
                  </div>
                </button>
              }
            >
              <DropdownMenuItem icon={<User className="h-4 w-4" />}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem icon={<Settings className="h-4 w-4" />}>
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

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} side="left">
        <SheetHeader onClose={() => setMobileMenuOpen(false)}>
          <div className="flex items-center gap-2">
            <Waves className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-white">WaveFinder</span>
          </div>
        </SheetHeader>
        <SheetContent>
          <AdminSidebar />
        </SheetContent>
      </Sheet>
    </>
  )
}

