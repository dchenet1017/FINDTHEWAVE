import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { MapContainer } from '@/components/map/MapContainer'
import { BusinessMarkerLayer } from '@/components/map/BusinessMarkerLayer'
import { WaveLeaderMarkerLayer } from '@/components/map/WaveLeaderMarkerLayer'
import { EventMarkerLayer } from '@/components/map/EventMarkerLayer'
import { useAdminMapData } from '@/hooks/admin/useAdminMap'
import type { MapBounds } from '@/services/business.service'
import type { Business } from '../../../../shared/types/business'
import { cn } from '@/lib/utils'

type ViewFilter = 'all' | 'pending' | 'verified'

export default function AdminMapPage() {
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all')
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [layers, setLayers] = useState({
    businesses: true,
    waveleaders: false,
    events: false,
    checkinsHeatmap: false,
    userHeatmap: false,
  })

  const { data } = useAdminMapData(bounds)
  const businesses = data?.businesses || []
  const waveleaders = data?.waveleaders || []
  const events = data?.events || []

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b: any) => {
      if (viewFilter === 'pending') return b.approvalStatus === 'PENDING'
      if (viewFilter === 'verified') return b.isVerified === true
      return true
    })
  }, [businesses, viewFilter])

  const stats = useMemo(() => {
    return {
      total: filteredBusinesses.length,
      pending: filteredBusinesses.filter((b: any) => b.approvalStatus === 'PENDING').length,
      verified: filteredBusinesses.filter((b: any) => b.isVerified).length,
    }
  }, [filteredBusinesses])

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ businesses: filteredBusinesses }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'platform-map-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Platform Map</h1>
          <p className="text-sm text-gray-400">
            Monitor businesses, WaveLeaders, events, and activity across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setViewFilter('all')}>
            All
          </Button>
          <Button variant={viewFilter === 'pending' ? 'default' : 'ghost'} size="sm" onClick={() => setViewFilter('pending')}>
            Pending Approval
          </Button>
          <Button variant={viewFilter === 'verified' ? 'default' : 'ghost'} size="sm" onClick={() => setViewFilter('verified')}>
            Verified Only
          </Button>
          <Button variant="secondary" size="sm" onClick={exportData}>
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="bg-dark-card border-gray-800 lg:col-span-3">
          <CardContent className="p-0">
            <div className="relative h-[70vh] overflow-hidden rounded-lg">
              <div className="absolute top-3 left-3 z-20 space-y-2 rounded-md bg-dark-bg/90 border border-gray-800 p-3 shadow-lg">
                <div className="text-xs text-gray-300 font-semibold mb-1">Layers</div>
                {[
                  { key: 'businesses', label: 'Businesses' },
                  { key: 'waveleaders', label: 'WaveLeaders' },
                  { key: 'events', label: 'Events' },
                  { key: 'checkinsHeatmap', label: 'Check-ins Heatmap' },
                  { key: 'userHeatmap', label: 'User Activity Heatmap' },
                ].map((l) => (
                  <label key={l.key} className="flex items-center gap-2 text-sm text-gray-200">
                    <Checkbox
                      checked={(layers as any)[l.key]}
                      onChange={(e) =>
                        setLayers((prev) => ({ ...prev, [l.key]: Boolean(e.target.checked) }))
                      }
                    />
                    {l.label}
                  </label>
                ))}
              </div>

              <div className="absolute top-3 right-3 z-20 grid grid-cols-3 gap-2 text-xs">
                <Badge variant="secondary" className="text-[11px] justify-center">
                  Total: {stats.total}
                </Badge>
                <Badge variant="secondary" className="text-[11px] justify-center">
                  Pending: {stats.pending}
                </Badge>
                <Badge variant="secondary" className="text-[11px] justify-center">
                  Verified: {stats.verified}
                </Badge>
              </div>

              <MapContainer
                onMapLoad={(map) => {
                  const b = map.getBounds()
                  setBounds({
                    ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng },
                    sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
                  })
                }}
                onMoveEnd={(map) => {
                  const b = map.getBounds()
                  setBounds({
                    ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng },
                    sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
                  })
                }}
                initialZoom={11}
                showControls
                showUserLocation={false}
              >
                {(map) => map && (
                  <>
                    {layers.businesses && (
                      <BusinessMarkerLayer
                        map={map}
                        businesses={filteredBusinesses}
                        selectedId={selectedBusiness?.id}
                        onBusinessClick={(biz) => setSelectedBusiness(biz as any)}
                      />
                    )}
                    {layers.waveleaders && (
                      <WaveLeaderMarkerLayer
                        map={map}
                        waveLeaders={waveleaders}
                      />
                    )}
                    {layers.events && (
                      <EventMarkerLayer
                        map={map}
                        events={events}
                      />
                    )}
                  </>
                )}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="bg-dark-card border-gray-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white text-sm">Entities</p>
                <Badge variant="secondary" className="text-[11px]">
                  {filteredBusinesses.length} in view
                </Badge>
              </div>
              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                {filteredBusinesses.map((biz) => (
                  <button
                    key={biz.id}
                    onClick={() => setSelectedBusiness(biz)}
                    className={cn(
                      'w-full text-left rounded-md border px-3 py-2 text-sm transition-colors',
                      selectedBusiness?.id === biz.id
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-gray-800 bg-dark-bg text-gray-200 hover:border-primary/40'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{biz.name}</span>
                      <Badge variant="outline" className="text-[11px]">
                        {biz.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                      <span>{(biz as any).city || (biz as any).location?.city || 'Unknown'}</span>
                      {biz.approvalStatus === 'PENDING' && (
                        <span className="text-warning">Pending</span>
                      )}
                      {biz.isVerified && <span className="text-success">Verified</span>}
                    </div>
                  </button>
                ))}
                {filteredBusinesses.length === 0 && (
                  <p className="text-xs text-gray-500">No entities in view.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedBusiness && (
            <Card className="bg-dark-card border-primary/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{selectedBusiness.name}</p>
                    <p className="text-xs text-gray-400">{selectedBusiness.type}</p>
                  </div>
                  <Badge variant="secondary" className="text-[11px]">
                    {selectedBusiness.approvalStatus}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary">
                    Approve
                  </Button>
                  <Button size="sm" variant="secondary">
                    Verify
                  </Button>
                  <Button size="sm" variant="ghost" className="text-danger">
                    Suspend
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

