import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { MapWidget } from '@/components/map/MapWidget'
import { useWaveLeaderMap } from '@/hooks/waveleader/useWaveLeaderMap'
import type { Business } from '../../../../shared/types/business'
import { ShieldCheck, MapPin } from 'lucide-react'

export default function WaveLeaderDashboard() {
  const navigate = useNavigate()
  const { center, businesses } = useWaveLeaderMap()
  const [available, setAvailable] = useState(true)
  const [selected, setSelected] = useState<Business | null>(null)
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

  const stats = [
    { title: 'This Week Bookings', value: '5' },
    { title: 'Earnings', value: '$820' },
    { title: 'Rating', value: '4.8' },
    { title: 'Response Rate', value: '95%' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">WaveLeader Dashboard</h1>
          <p className="text-gray-400 mt-2">Manage your service area and opportunities.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>Available</span>
          <Switch checked={available} onCheckedChange={(v) => setAvailable(Boolean(v))} />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.title} className="bg-dark-card border-gray-800">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-gray-300">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapWidget
            size="medium"
            markers={markers}
            center={serviceCenter}
            onMarkerClick={(m) => {
              const found = (bizList as any[]).find((b) => b.id === m.id) as Business
              setSelected(found || null)
            }}
            onExpand={() => navigate('/waveleader/map')}
          />
          <p className="text-xs text-gray-400 mt-2">
            {markers.length} businesses in your area
          </p>
        </div>
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm text-gray-200">Upcoming bookings</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400">
            No upcoming bookings.
          </CardContent>
        </Card>
      </div>

      {selected && (
        <Card className="bg-dark-card border-primary/40">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{selected.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" />
                  <span>{(selected as any).city || (selected as any).location?.city || 'Unknown'}</span>
                  {selected.isVerified && (
                    <Badge variant="secondary" className="text-[10px]">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary">
                  View Details
                </Button>
                <Button size="sm" variant="default">
                  Propose Collaboration
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">
              {selected.description || 'No description provided.'}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm text-gray-200">Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400">Reviews coming soon.</CardContent>
        </Card>
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm text-gray-200">Earnings</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400">Chart coming soon.</CardContent>
        </Card>
      </div>
    </div>
  )
}

