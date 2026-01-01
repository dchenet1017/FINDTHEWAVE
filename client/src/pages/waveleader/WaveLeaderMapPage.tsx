import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { Slider } from '@/components/ui/Slider'
import { MapContainer } from '@/components/map/MapContainer'
import { BusinessMarkerLayer } from '@/components/map/BusinessMarkerLayer'
import { ServiceAreaEditor } from '@/components/map/ServiceAreaEditor'
import { useWaveLeaderMap, useBusinessesInArea } from '@/hooks/waveleader/useWaveLeaderMap'
import type { MapBounds } from '@/services/business.service'
import type { Business } from '../../../../shared/types/business'
import { cn } from '@/lib/utils'

type Tab = 'service' | 'opportunities' | 'bookings' | 'earnings'

export default function WaveLeaderMapPage() {
  const { area, center, radius, businesses } = useWaveLeaderMap()
  const [tab, setTab] = useState<Tab>('service')
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [selected, setSelected] = useState<Business | null>(null)
  const [layerFlags, setLayerFlags] = useState({
    competitors: true,
    heatmap: false,
    waveleaders: false,
    partners: false,
    ads: false,
  })
  const [serviceRadius, setServiceRadius] = useState<number>(radius || 10)

  const { data: areaBusinesses = [] } = useBusinessesInArea(center, serviceRadius)

  const filteredBusinesses = useMemo(() => {
    return areaBusinesses as Business[]
  }, [areaBusinesses])

  useEffect(() => {
    if (radius) setServiceRadius(radius)
  }, [radius])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">My Service Area</h1>
          <p className="text-sm text-gray-400">
            Adjust your area, find opportunities, and see bookings on the map.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['service', 'opportunities', 'bookings', 'earnings'] as Tab[]).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={tab === t ? 'default' : 'ghost'}
              onClick={() => setTab(t)}
            >
              {t === 'service' && 'Service Area'}
              {t === 'opportunities' && 'Opportunities'}
              {t === 'bookings' && 'My Bookings'}
              {t === 'earnings' && 'Earnings'}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="bg-dark-card border-gray-800 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-200">Map</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[70vh] rounded-lg overflow-hidden">
              <div className="absolute top-3 left-3 z-20 bg-dark-bg/90 border border-gray-800 p-3 rounded-md shadow-lg space-y-2">
                <div className="text-xs text-gray-300 font-semibold">Layers</div>
                {[
                  { key: 'competitors', label: 'Competitors' },
                  { key: 'heatmap', label: 'Customer Heatmap' },
                  { key: 'waveleaders', label: 'WaveLeaders' },
                  { key: 'partners', label: 'Partner Businesses' },
                  { key: 'ads', label: 'Ad Coverage Zone' },
                ].map((l) => (
                  <label key={l.key} className="flex items-center gap-2 text-sm text-gray-200">
                    <Checkbox
                      checked={(layerFlags as any)[l.key]}
                      onCheckedChange={(checked) =>
                        setLayerFlags((prev) => ({ ...prev, [l.key]: Boolean(checked) }))
                      }
                    />
                    {l.label}
                  </label>
                ))}
              </div>

              <MapContainer
                initialCenter={center}
                initialZoom={12}
                showControls
                showUserLocation={false}
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
              >
                {(map) => (
                  <>
                    {center && (
                      <MapMarker map={map} position={center} type="WAVELEADER" isSelected />
                    )}
                    {filteredBusinesses && (
                      <BusinessMarkerLayer
                        map={map}
                        businesses={filteredBusinesses}
                        selectedId={selected?.id}
                        onBusinessClick={(biz) => setSelected(biz as any)}
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
            <CardHeader>
              <CardTitle className="text-sm text-gray-200">Service Area</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <span>Radius</span>
                <Badge variant="secondary" className="text-[11px]">
                  {serviceRadius} mi
                </Badge>
              </div>
              <Slider value={[serviceRadius]} min={1} max={25} step={1} onValueChange={(v) => setServiceRadius(v[0])} />
              <Button size="sm" className="w-full">
                Save Service Area
              </Button>
            </CardContent>
          </Card>

          <ServiceAreaEditor
            center={center}
            radius={serviceRadius}
            onSave={(area) => {
              setServiceRadius(area.radius)
            }}
          />
        </div>
      </div>

      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm text-gray-200">Opportunities & Bookings</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-400">
          Opportunities and bookings data will appear here.
        </CardContent>
      </Card>
    </div>
  )
}

