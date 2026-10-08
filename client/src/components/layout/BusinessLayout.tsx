import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BusinessSidebar } from './BusinessSidebar'
import { BusinessHeader } from './BusinessHeader'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/Sheet'
import { Clock, Waves, XCircle } from 'lucide-react'
import { useMyBusiness } from '@/hooks/useMyBusiness'

/** Until an admin approves the venue it is off the public map and cannot send offers */
function ApprovalBanner() {
  const { data: business } = useMyBusiness()
  if (!business || business.approvalStatus === 'APPROVED') return null

  const rejected = business.approvalStatus === 'REJECTED'
  const Icon = rejected ? XCircle : Clock
  return (
    <div
      role="status"
      className={`flex items-start gap-3 border-b px-4 py-3 text-sm lg:px-6 ${
        rejected
          ? 'border-danger/30 bg-danger/10 text-red-200'
          : 'border-warning/30 bg-warning/10 text-amber-100'
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        {rejected
          ? `${business.name} was not approved. Contact the WaveFinder team to find out why and resubmit.`
          : `${business.name} is awaiting approval. You can set things up now - you'll appear on the live map and can send offers once it's approved.`}
      </p>
    </div>
  )
}

export function BusinessLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full z-30">
        <BusinessSidebar
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
        <BusinessHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <ApprovalBanner />

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
          <BusinessSidebar onClose={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

