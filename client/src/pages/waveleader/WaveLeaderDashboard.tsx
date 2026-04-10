import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MapWidget } from '@/components/map/MapWidget'
import { WaveLeaderStats } from '@/components/waveleader/WaveLeaderStats'
import { useWaveLeaderDashboard, useWaveLeaderStats } from '@/hooks/useWaveLeaderDashboard'
import { useWaveLeaderMap } from '@/hooks/waveleader/useWaveLeaderMap'
import { CheckCircle, XCircle, MapPin, ChevronRight } from 'lucide-react'
import type { Business } from '../../../../shared/types/business'

export default function WaveLeaderDashboard() {
  const navigate = useNavigate()
  const { data: dashboard } = useWaveLeaderDashboard()
  const { data: stats } = useWaveLeaderStats()
  const { center, businesses } = useWaveLeaderMap()
  const bizList: Business[] = (businesses as Business[]) || []

  const serviceCenter = useMemo(() => {
    return center ? ([center[0], center[1]] as [number, number]) : undefined
  }, [center])

  const markers = useMemo(() => {
    return bizList.map((b) => ({
      id: b.id,
      latitude: (b as any).latitude ?? (b as any).location?.latitude,
      longitude: (b as any).longitude ?? (b as any).location?.longitude,
      type: b.type,
      name: b.name,
      isVerified: b.isVerified,
    }))
  }, [bizList])

  const upcomingBookings = dashboard?.upcomingBookings ?? []
  const recentReviews = dashboard?.recentReviews ?? []
  const earningsChart = dashboard?.earningsChart ?? []
  const serviceArea = dashboard?.serviceArea

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {dashboard?.displayName ?? 'WaveLeader'}!
          </h1>
          <div className="flex items-center gap-2 mt-2">
            {dashboard?.isAvailable ? (
              <span className="inline-flex items-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Available</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-red-500">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Unavailable</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <WaveLeaderStats />

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Service Area Map Widget */}
        <div className="lg:col-span-2 space-y-2">
          <MapWidget
            size="medium"
            markers={markers}
            center={serviceCenter ?? serviceArea?.center}
            title="Service Area"
            onExpand={() => navigate('/waveleader/map')}
          />
          <p className="text-sm text-gray-400">
            {serviceArea?.businessesCount ?? markers.length} businesses in your
            service area
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/waveleader/map')}
          >
            Manage Service Area
          </Button>
        </div>

        {/* Right: Upcoming Bookings */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">Upcoming Bookings</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/waveleader/bookings')}
            >
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No upcoming bookings</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => navigate('/waveleader/bookings')}
                >
                  View Bookings
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <p className="font-medium text-white">{booking.clientName}</p>
                    <p className="text-sm text-gray-400">
                      {booking.date} at {booking.time}
                    </p>
                    {booking.location && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {booking.location}
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 p-0 h-auto text-primary"
                      onClick={() => navigate(`/waveleader/bookings/${booking.id}`)}
                    >
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reviews */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {recentReviews.length === 0 ? (
              <p className="text-sm text-gray-400">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {recentReviews.slice(0, 3).map((review) => (
                  <div
                    key={review.id}
                    className="p-3 rounded-lg border border-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white">{review.clientName}</p>
                      <span className="text-amber-400">
                        ★ {review.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {review.comment}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{review.date}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Earnings Chart */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Earnings (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {earningsChart.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-400">
                <p className="text-sm">Chart data coming soon</p>
              </div>
            ) : (
              <div className="h-[200px] flex items-end gap-1">
                {earningsChart.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/50 rounded-t min-h-[4px]"
                    style={{
                      height: `${Math.max(4, (d.amount / Math.max(...earningsChart.map((e) => e.amount), 1)) * 100)}%`,
                    }}
                    title={`${d.date}: $${d.amount}`}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
