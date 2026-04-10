import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { UserSidebar } from './UserSidebar'
import { UserHeader } from './UserHeader'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/Sheet'
import { Waves } from 'lucide-react'

export function UserLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full z-30">
        <UserSidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'lg:ml-[70px]' : 'lg:ml-[260px]'
        }`}
      >
        {/* Header */}
        <UserHeader
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} side="left">
        <SheetHeader onClose={() => setMobileMenuOpen(false)}>
          <div className="flex items-center gap-2">
            <Waves className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-white">WaveFinder</span>
          </div>
        </SheetHeader>
        <SheetContent>
          <UserSidebar onClose={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

