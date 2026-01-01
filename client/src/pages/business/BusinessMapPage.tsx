import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { MapContainer } from '@/components/map/MapContainer'
import { BusinessMarkerLayer } from '@/components/map/BusinessMarkerLayer'
import { MapMarker } from '@/components/map/MapMarker'
import { BusinessLocationEditor } from '@/components/map/BusinessLocationEditor'
import { useBusinessMap, useCompetitors } from '@/hooks/business/useBusinessMap'
import type { MapBounds } from '@/services/business.service'
import type { Business } from '../../../../shared/types/business'
import { cn } from '@/lib/utils'

export default function BusinessMapPage() {
  const { myBusiness } = useBusinessMap()
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [layers, setLayers] = useState({
    competitors: true,
    customerHeatmap: false,
    waveleaders: false,
    partners: false,
    ads: false,
  })
  const center = useMemo(() => {
    const lat = (myBusiness as any)?.latitude ?? (myBusiness as any)?.location?.latitude
    const lng = (myBusiness as any)?.longitude ?? (myBusiness as any)?.location?.longitude
    if (lat == null || lng == null) return undefined
    return [Number(lng), Number(lat)] as [number, number]
  }, [myBusiness])

  const { data: competitorData = [] } = useCompetitors(myBusiness?.type, undefined, 5)
  const competitors: Business[] = competitorData as Business[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Area Map</h1>
          <p className="text-sm text-gray-400">Analyze your area, competitors, and customers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary">
            Export Data
          </Button>
          <Button size="sm" variant="default">
            View Ads
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="bg-dark-card border-gray-800 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-200">Map</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[70vh] rounded-lg overflow-hidden">
              <div className="absolute top-3 left-3 z-20 space-y-2 bg-dark-bg/90 border border-gray-800 p-3 rounded-md shadow-lg">
                <div className="text-xs text-gray-300 font-semibold mb-1">Layers</div>
                {[
                  { key: 'competitors', label: 'Competitors' },
                  { key: 'customerHeatmap', label: 'Customer Heatmap' },
                  { key: 'waveleaders', label: 'WaveLeaders' },
                  { key: 'partners', label: 'Partner Businesses' },
                  { key: 'ads', label: 'Ad Coverage Zone' },
                ].map((l) => (
                  <label key={l.key} className="flex items-center gap-2 text-sm text-gray-200">
                    <Checkbox
                      checked={(layers as any)[l.key]}
                      onCheckedChange={(checked) =>
                        setLayers((prev) => ({ ...prev, [l.key]: Boolean(checked) }))
                      }
                    />
                    {l.label}
                  </label>
                ))}
              </div>

              <MapContainer
                initialCenter={center}
                initialZoom={13}
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
                    {myBusiness && center && (
                      <MapMarker
                        map={map}
                        position={center}
                        type={myBusiness.type as any}
                        isSelected
                        onClick={() => {}}
                      />
                    )}
                    {layers.competitors && competitors && (
                      <BusinessMarkerLayer
                        map={map}
                        businesses={competitors}
                        selectedId={undefined}
                        onBusinessClick={() => {}}
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
              <CardTitle className="text-sm text-gray-200">Sidebar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-300">
              <p>Competitors: {competitors.length}</p>
              <p>Customer Insights: (coming soon)</p>
              <p>WaveLeaders: (coming soon)</p>
            </CardContent>
          </Card>

          <BusinessLocationEditor
            latitude={(myBusiness as any)?.latitude ?? (myBusiness as any)?.location?.latitude}
            longitude={(myBusiness as any)?.longitude ?? (myBusiness as any)?.location?.longitude}
            onUpdate={(c) => console.log('update location', c)}
          />
        </div>
      </div>
    </div>
  )
}

