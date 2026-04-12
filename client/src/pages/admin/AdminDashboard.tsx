import { Users, Star, Building2, DollarSign } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAdminStats } from '@/hooks/admin/useAdminStats'
import { StatCard } from '@/components/admin/StatCard'
import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'
import { RecentActivity } from '@/components/admin/RecentActivity'
import { QuickActions } from '@/components/admin/QuickActions'
import { LoadingScreen } from '@/components/layout/LoadingScreen'
import { MapWidget } from '@/components/map/MapWidget'
import { businessService } from '@/services/business.service'

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data: stats, isLoading } = useAdminStats()
  const { data: businessMapData } = useQuery({
    queryKey: ['admin', 'map', 'businesses'],
    queryFn: async () => {
      const res = await businessService.getBusinesses({ limit: 200, page: 1 })
      const payload = (res.data as any)?.data ?? res.data
      return Array.isArray(payload?.items) ? payload.items : []
    },
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Failed to load dashboard data</p>
      </div>
    )
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const adminName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'Admin'

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {adminName}
          </h1>
          <p className="text-gray-400 mt-1">{currentDate}</p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={stats.userGrowth}
          changeLabel="vs last month"
          icon={Users}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <StatCard
          title="Active WaveLeaders"
          value={stats.activeWaveLeaders}
          change={stats.waveLeaderGrowth}
          changeLabel="vs last month"
          icon={Star}
          iconColor="text-secondary"
          iconBg="bg-secondary/10"
        />
        <StatCard
          title="Total Businesses"
          value={stats.totalBusinesses}
          change={stats.businessGrowth}
          changeLabel="vs last month"
          icon={Building2}
          iconColor="text-accent"
          iconBg="bg-accent/10"
        />
        <StatCard
          title="Revenue This Month"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          change={stats.revenueGrowth}
          changeLabel="vs last month"
          icon={DollarSign}
          iconColor="text-success"
          iconBg="bg-success/10"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          data={stats.userChartData}
          dataKey="value"
          strokeColor="#6C5CE7"
          title="User Growth (Last 30 Days)"
          height={300}
        />
        <BarChart
          data={stats.revenueChartData}
          dataKey="value"
          fillColor="#00D2D3"
          title="Revenue (Last 7 Days)"
          height={300}
        />
      </div>

      {/* Map + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapWidget
            size="large"
            markers={Array.isArray(businessMapData) ? businessMapData : []}
            onExpand={() => navigate('/admin/map')}
          />
        </div>
        <div className="space-y-4">
          <RecentActivity activities={stats.recentActivity} maxItems={8} />
          <QuickActions
            pendingBusinesses={stats.pendingBusinesses}
            flaggedContent={stats.flaggedContent}
            pendingWaveLeaders={stats.pendingWaveLeaders}
          />
        </div>
      </div>
    </div>
  )
}
