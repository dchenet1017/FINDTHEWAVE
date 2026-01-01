import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MapWidget } from '@/components/map/MapWidget'
import { useBusinessMap } from '@/hooks/business/useBusinessMap'
import type { Business } from '../../../../shared/types/business'
import { ShieldCheck, MapPin, TrendingUp, DollarSign, Users, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BusinessDashboard() {
  const navigate = useNavigate()
  const { myBusiness, competitors } = useBusinessMap()
  const [selected, setSelected] = useState<Business | null>(null)

  const stats = [
    { title: "Today's Check-ins", value: '24' },
    { title: 'This Week Revenue', value: '$4,120' },
    { title: 'Active Promos', value: '3' },
    { title: 'Rating', value: '4.7' },
  ]

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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {myBusiness?.name || 'Business Dashboard'}
          </h1>
          <p className="text-gray-400 mt-1">Monitor performance and the area around you.</p>
        </div>
        {myBusiness?.isVerified && (
          <Badge variant="secondary" className="inline-flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" /> Verified
          </Badge>
        )}
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
            highlightId={myBusiness?.id}
            center={center}
            zoom={14}
            onMarkerClick={(m) => {
              const found = competitors.find((c: any) => c.id === m.id) || (m.id === myBusiness?.id ? myBusiness : null)
              setSelected(found || null)
            }}
            onExpand={() => navigate('/business/map')}
          />
        </div>
        <div className="space-y-4">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-sm text-gray-200">Customer Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-secondary" />
                Check-ins today: 24
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" />
                Revenue this week: $4,120
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />
                Avg rating: 4.7
              </div>
            </CardContent>
          </Card>

          {selected && (
            <Card className="bg-dark-card border-primary/40">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{selected.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {(selected as any).city || (selected as any).location?.city || 'Unknown'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[11px]">
                    {selected.type}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {selected.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm text-gray-200">Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400">
            Recent check-ins will appear here.
          </CardContent>
        </Card>
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm text-gray-200">Promotion Performance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400">
            Promotion metrics coming soon.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

