import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { MapWidget } from '@/components/map/MapWidget'
import type { Business } from '../../../../shared/types/business'
import {
  CalendarClock,
  DollarSign,
  Gift,
  Megaphone,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react'
import { BusinessDemandPanel } from '@/components/goout/BusinessDemandPanel'
import { StatCard } from '@/components/business/StatCard'
import { RevenueChart } from '@/components/business/RevenueChart'
import { RecentCheckIns } from '@/components/business/RecentCheckIns'
import { useBusinessLocation, useNearbyCompetitors } from '@/hooks/useBusinessMap'
import {
  useBusinessDashboard,
  useBusinessRevenue,
  useBusinessStats,
  useRecentCheckIns,
} from '@/hooks/useBusinessDashboard'
import { formatCurrency } from '@/utils/booking'

export default function BusinessDashboard() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Business | null>(null)

  const { data: dashboard } = useBusinessDashboard()
  const { data: stats, isLoading: statsLoading } = useBusinessStats()
  const [revPeriod, setRevPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const { data: revenue = [], isLoading: revenueLoading } = useBusinessRevenue(revPeriod)
  const { data: recentCheckIns = [], isLoading: checkInsLoading } = useRecentCheckIns(5)
  const { data: myBusiness } = useBusinessLocation()
  const { data: competitors = [] } = useNearbyCompetitors({
    type: myBusiness?.type,
    lat: myBusiness?.latitude,
    lng: myBusiness?.longitude,
    radiusMiles: 5,
  })

  const businessName = dashboard?.business?.name || myBusiness?.name || 'Business'
  const isVerified = dashboard?.business?.isVerified ?? myBusiness?.isVerified ?? false
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const center = useMemo(() => {
    const lat = (myBusiness as any)?.latitude ?? (myBusiness as any)?.location?.latitude
    const lng = (myBusiness as any)?.longitude ?? (myBusiness as any)?.location?.longitude
    if (lat == null || lng == null) return undefined
    return [Number(lng), Number(lat)] as [number, number]
  }, [myBusiness])

  const markers = useMemo(() => {
    const list: any[] = []
    if (myBusiness) {
      list.push({
        id: myBusiness.id,
        latitude: (myBusiness as any).latitude ?? (myBusiness as any).location?.latitude,
        longitude: (myBusiness as any).longitude ?? (myBusiness as any).location?.longitude,
        type: myBusiness.type,
        name: myBusiness.name,
        isVerified: myBusiness.isVerified,
        isOwn: true,
      })
    }
    competitors.forEach((c: any) => {
      list.push({
        id: c.id,
        latitude: c.latitude ?? c.location?.latitude,
        longitude: c.longitude ?? c.location?.longitude,
        type: c.type,
        name: c.name,
        isVerified: c.isVerified,
      })
    })
    return list
  }, [myBusiness, competitors])

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome back, {businessName}!</h1>
          <p className="text-gray-400 mt-1">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {isVerified ? (
            <Badge variant="success" className="inline-flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" /> Verified
            </Badge>
          ) : (
            <Badge variant="warning">Verification pending</Badge>
          )}
        </div>
      </div>

      {/* Live "I want to go out" demand near this venue */}
      <BusinessDemandPanel />

      {!isVerified && (
        <Alert variant="warning">
          <div className="space-y-1">
            <p className="font-semibold">Your business verification is pending.</p>
            <p className="text-sm text-gray-200/90">
              Some features (ads & promotions visibility) may be limited until verification is complete.
            </p>
          </div>
        </Alert>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Today's Check-ins"
          value={stats ? stats.todayCheckIns : 0}
          subtitle="Customers checked in today"
          trend={stats?.todayCheckInsChangePct}
          icon={Users}
          color="blue"
          isLoading={statsLoading}
        />
        <StatCard
          title="This Week Revenue"
          value={stats ? formatCurrency(stats.thisWeekRevenue) : formatCurrency(0)}
          subtitle="Revenue from check-ins & promos"
          trend={stats?.weekRevenueChangePct}
          icon={DollarSign}
          color="green"
          isLoading={statsLoading}
        />
        <StatCard
          title="Active Promotions"
          value={stats ? stats.activePromotions : 0}
          subtitle="Running right now"
          icon={Gift}
          color="purple"
          action={{ label: 'Create New', onClick: () => navigate('/business/promotions') }}
          isLoading={statsLoading}
        />
        <StatCard
          title="Average Rating"
          value={stats ? stats.averageRating.toFixed(1) : '0.0'}
          subtitle={`${stats?.reviewCount ?? 0} reviews`}
          icon={Star}
          color="yellow"
          isLoading={statsLoading}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2/3) */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <RevenueChart
            data={revenue}
            isLoading={revenueLoading}
            period={revPeriod}
            onPeriodChange={setRevPeriod}
          />

          <Card className="border-gray-800 bg-gray-900/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-white">Customer Check-ins</CardTitle>
              <Button size="sm" variant="secondary" onClick={() => navigate('/business/map')}>
                View Full Map
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <MapWidget
                title="Customer Check-ins"
                size="medium"
                markers={markers}
                highlightId={myBusiness?.id}
                center={center}
                zoom={14}
                onMarkerClick={(m) => {
                  const id = (m as any).id
                  const found =
                    competitors.find((c: any) => c.id === id) ||
                    (id === myBusiness?.id ? myBusiness : null)
                  setSelected(found || null)
                }}
                onExpand={() => navigate('/business/map')}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right (1/3) */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card className="border-gray-800 bg-gray-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              <Button className="w-full" onClick={() => navigate('/business/ads/create')}>
                <Megaphone className="h-4 w-4 mr-2" />
                Create Advertisement
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/business/promotions')}
              >
                <Gift className="h-4 w-4 mr-2" />
                Add Promotion
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => navigate('/waveleaders')}>
                <Users className="h-4 w-4 mr-2" />
                Invite WaveLeader
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => navigate('/business/profile')}>
                <CalendarClock className="h-4 w-4 mr-2" />
                Update Hours
              </Button>
            </CardContent>
          </Card>

          <RecentCheckIns items={recentCheckIns} isLoading={checkInsLoading} />

          {/* Performance metrics (optional fields; shown as placeholders until API supports) */}
          <Card className="border-gray-800 bg-gray-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-gray-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total check-ins</span>
                <span className="font-semibold text-white">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total customers</span>
                <span className="font-semibold text-white">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Repeat rate</span>
                <span className="font-semibold text-white">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Peak hours</span>
                <span className="font-semibold text-white">—</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: Recent Reviews */}
      <Card className="border-gray-800 bg-gray-900/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-white">Recent Reviews</CardTitle>
          <Button size="sm" variant="secondary" onClick={() => navigate('/business/reviews')}>
            View All Reviews
          </Button>
        </CardHeader>
        <CardContent className="pt-4 text-sm text-gray-500">
          {stats?.reviewCount ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-dark-bg/30 p-3">
                <span className="text-gray-400">Average rating</span>
                <span className="text-white font-semibold">
                  {stats.averageRating.toFixed(1)} from {stats.reviewCount} reviews
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Detailed business review entries are not stored yet, so this section currently shows the aggregate review summary.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

