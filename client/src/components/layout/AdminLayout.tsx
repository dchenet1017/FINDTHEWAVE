import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Sidebar */}
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-200 ${
          sidebarCollapsed ? 'ml-16' : 'ml-[280px]'
        }`}
      >
        {/* Header */}
        <AdminHeader onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
