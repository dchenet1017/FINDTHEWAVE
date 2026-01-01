import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MapPin, Star } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { MapWidget } from '@/components/map/MapWidget'
import { useNearbyBusinesses } from '@/hooks/useBusinesses'
import { getCurrentPosition } from '@/lib/mapbox'
import { CheckInButton } from '@/components/map/CheckInButton'
import type { Business } from '../../../../shared/types/business'

export default function UserDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)

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
    return nearby.map((b: any) => ({
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

  const stats = [
    { title: 'Check-ins', value: '12' },
    { title: 'Points', value: '1,240' },
    { title: 'Bookings', value: '3' },
    { title: 'Favorites', value: '8' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!</h1>
        <p className="text-gray-400 mt-2">Explore nearby experiences and keep your streak alive.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.title} className="bg-dark-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-300">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <MapWidget
            size="medium"
            markers={markers}
            highlightId={selectedBusiness?.id}
            onMarkerClick={(m) => {
              const biz = nearby.find((b: any) => b.id === m.id) as Business
              setSelectedBusiness(biz || null)
            }}
            onExpand={() => navigate('/dashboard/map')}
          />
          {selectedBusiness && (
            <Card className="bg-dark-card border-primary/40">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{selectedBusiness.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
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
        <div className="space-y-4">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-sm text-gray-200">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => navigate('/dashboard/map')}>
                Explore Map
              </Button>
              <Button variant="secondary" className="w-full">
                View Check-ins
              </Button>
              <Button variant="ghost" className="w-full text-primary">
                Earn more points
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-sm text-gray-200">Favorites</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-300">
              {markers.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center justify-between">
                  <span className="line-clamp-1">{m.name}</span>
                  <Star className="h-4 w-4 text-warning" />
                </div>
              ))}
              {markers.length === 0 && <p className="text-xs text-gray-500">No favorites yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm text-gray-200">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400">
            Activity feed coming soon.
          </CardContent>
        </Card>
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm text-gray-200">Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400">
            No upcoming bookings yet.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

