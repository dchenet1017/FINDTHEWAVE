import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  CheckCircle,
  Gift,
  Calendar,
  Heart,
  Map as MapIcon,
  UserPlus,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { MapWidget } from '@/components/map/MapWidget'
import { useNearbyBusinesses } from '@/hooks/useBusinesses'
import { getCurrentPosition } from '@/lib/mapbox'
import { StatCard } from '@/components/dashboard/StatCard'
import { UpcomingBookings } from '@/components/dashboard/UpcomingBookings'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { EventsWidget } from '@/components/dashboard/EventsWidget'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CheckInButton } from '@/components/map/CheckInButton'
import { GoOutButton } from '@/components/goout/GoOutButton'
import { OffersInbox } from '@/components/goout/OffersInbox'
import { useUserStats } from '@/hooks/useUserDashboard'
import { LoadingScreen } from '@/components/layout/LoadingScreen'
import type { Business } from '../../../../shared/types/business'

export default function UserDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)

  const { data: stats, isLoading: statsLoading } = useUserStats()

  useEffect(() => {
    getCurrentPosition()
      .then((pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }))
      .catch(() => setUserLocation(null))
  }, [])

  const { data: nearby = [], isFetching } = useNearbyBusinesses(
    userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng, radiusMiles: 5 }
      : { latitude: 0, longitude: 0, radiusMiles: 0 },
    Boolean(userLocation)
  )

  const markers = useMemo(() => {
    const list = Array.isArray(nearby) ? nearby : []
    return list.map((b: any) => ({
      id: b.id,
      latitude: b.latitude ?? b.location?.latitude,
      longitude: b.longitude ?? b.location?.longitude,
      type: b.type,
      name: b.name,
      isVerified: b.isVerified,
      distance: (b as any).distance,
      description: b.description,
    }))
  }, [nearby])

  if (statsLoading) {
    return <LoadingScreen />
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const firstName = user?.firstName || 'there'
  const statsData = stats || {
    totalCheckIns: 0,
    checkInsThisMonth: 0,
    rewardPoints: 0,
    rewardLevel: 1,
    upcomingBookings: 0,
    favoritesCount: 0,
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome back, {firstName}!</h1>
          <p className="text-gray-400 mt-1">{currentDate}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => navigate('/dashboard/map')}>
            <MapIcon className="h-4 w-4 mr-2" />
            Explore Map
          </Button>
          <Button variant="secondary" onClick={() => navigate('/dashboard/bookings')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Book a WaveLeader
          </Button>
        </div>
      </div>

      {/* "I want to go out" - headline CTA, or the live broadcast banner */}
      <GoOutButton />
      <OffersInbox />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Check-ins"
          value={statsData.totalCheckIns.toLocaleString()}
          subtitle={`${statsData.checkInsThisMonth} this month`}
          icon={CheckCircle}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
          onClick={() => navigate('/dashboard/places')}
        />
        <StatCard
          title="Reward Points"
          value={statsData.rewardPoints.toLocaleString()}
          subtitle={`Level ${statsData.rewardLevel}`}
          icon={Gift}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/10"
          onClick={() => navigate('/dashboard/rewards')}
        />
        <StatCard
          title="Bookings"
          value={statsData.upcomingBookings}
          subtitle="Upcoming"
          icon={Calendar}
          iconColor="text-green-500"
          iconBg="bg-green-500/10"
          onClick={() => navigate('/dashboard/bookings')}
        />
        <StatCard
          title="Favorites"
          value={statsData.favoritesCount}
          subtitle="Saved places"
          icon={Heart}
          iconColor="text-red-500"
          iconBg="bg-red-500/10"
          onClick={() => navigate('/dashboard/places')}
        />
      </div>

      <EventsWidget />

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Map Widget (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-dark-card border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Nearby Places
              </h2>
              <Badge variant="secondary" className="text-xs">
                {markers.length} places
              </Badge>
            </div>
            <div className="h-[300px]">
              <MapWidget
                size="medium"
                markers={markers}
                highlightId={selectedBusiness?.id}
                onMarkerClick={(m) => {
                  const biz = nearby.find((b: any) => b.id === m.id) as Business
                  setSelectedBusiness(biz || null)
                }}
                onExpand={() => navigate('/dashboard/map')}
                className="border-0 rounded-none"
              />
            </div>
            <div className="p-4 border-t border-gray-800">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/dashboard/map')}
              >
                Explore Full Map
              </Button>
            </div>
          </div>

          {/* Selected Business Card */}
          {selectedBusiness && (
            <Card className="bg-dark-card border-primary/40">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{selectedBusiness.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>
                        {(selectedBusiness as any).city ||
                          (selectedBusiness as any).location?.city ||
                          'Unknown'}
                      </span>
                      {selectedBusiness.isVerified && (
                        <Badge variant="secondary" className="text-[10px]">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CheckInButton business={selectedBusiness} userLocation={userLocation} />
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {selectedBusiness.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Upcoming Bookings (1/3 width) */}
        <div>
          <UpcomingBookings limit={3} showViewAll={true} />
        </div>
      </div>

      {/* Bottom Section - Recent Activity */}
      <div>
        <RecentActivity limit={5} showViewAll={true} />
      </div>
    </div>
  )
}
