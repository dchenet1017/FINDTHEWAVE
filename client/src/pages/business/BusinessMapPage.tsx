import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Slider } from '@/components/ui/Slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { MapContainer } from '@/components/map/MapContainer'
import { BusinessMarkerLayer } from '@/components/map/BusinessMarkerLayer'
import { WaveLeaderMarkerLayer } from '@/components/map/WaveLeaderMarkerLayer'
import { CustomerHeatmap } from '@/components/map/CustomerHeatmap'
import { AdCoverageZone } from '@/components/map/AdCoverageZone'
import { PulsingMarker } from '@/components/map/PulsingMarker'
import { BusinessLocationEditor } from '@/components/business/BusinessLocationEditor'
import {
  useBusinessLocation,
  useCustomerHeatmap,
  useNearbyCompetitors,
  useNearbyWaveLeaders,
  useUpdateBusinessLocation,
} from '@/hooks/useBusinessMap'
import { calculateDistance, formatDistance } from '@/lib/mapbox'
import { MapPin, Navigation, Search, SlidersHorizontal } from 'lucide-react'
import { formatCurrency } from '@/utils/booking'

export default function BusinessMapPage() {
  const { data: myBusiness } = useBusinessLocation()
  const updateLocation = useUpdateBusinessLocation()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'competitors' | 'insights' | 'waveleaders' | 'ads'
  >('competitors')
  const [viewRadius, setViewRadius] = useState(5)
  const [layers, setLayers] = useState({
    competitors: true,
    heatmap: true,
    waveleaders: false,
    ads: false,
  })

  const [locationModalOpen, setLocationModalOpen] = useState(false)

  const [competitorSort, setCompetitorSort] = useState<'distance' | 'rating'>('distance')
  const [competitorVerifiedOnly, setCompetitorVerifiedOnly] = useState(false)
  const [competitorActivePromosOnly, setCompetitorActivePromosOnly] = useState(false)
  const [wlSearch, setWlSearch] = useState('')

  const center = useMemo(() => {
    if (!myBusiness) return undefined
    const lat = Number((myBusiness as any).latitude)
    const lng = Number((myBusiness as any).longitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return undefined
    return [lng, lat] as [number, number]
  }, [myBusiness])

  const lat = center?.[1]
  const lng = center?.[0]

  const { data: competitors = [] } = useNearbyCompetitors({
    type: myBusiness?.type,
    lat,
    lng,
    radiusMiles: viewRadius,
  })

  const { data: heatPoints = [] } = useCustomerHeatmap('30d')

  const { data: waveLeaders = [] } = useNearbyWaveLeaders({
    lat,
    lng,
    radiusMiles: viewRadius,
  })

  const competitorsWithDistance = useMemo(() => {
    if (!center) return []
    const baseLat = center[1]
    const baseLng = center[0]
    return (competitors as any[])
      .map((c) => {
        const d = calculateDistance(baseLat, baseLng, Number(c.latitude), Number(c.longitude))
        return { ...c, distanceMiles: d }
      })
      .filter((c) => !competitorVerifiedOnly || c.isVerified)
      .filter((c) => !competitorActivePromosOnly || c.hasActivePromotions)
      .sort((a, b) => {
        if (competitorSort === 'rating') return Number(b.rating || 0) - Number(a.rating || 0)
        return Number(a.distanceMiles || 0) - Number(b.distanceMiles || 0)
      })
  }, [
    competitors,
    center,
    competitorSort,
    competitorVerifiedOnly,
    competitorActivePromosOnly,
  ])

  const availableWaveLeaders = useMemo(() => {
    const list = (waveLeaders as any[]).filter((w) => w.isAvailable !== false)
    const q = wlSearch.trim().toLowerCase()
    if (!q) return list
    return list.filter((w) => String(w.specialty || '').toLowerCase().includes(q))
  }, [waveLeaders, wlSearch])

  const customerInsights = useMemo(() => {
    if (!center) {
      return {
        uniqueCustomers: 0,
        avgDistance: 0,
        breakdown: { '1': 0, '3': 0, '5': 0, '5plus': 0 },
      }
    }
    const baseLat = center[1]
    const baseLng = center[0]
    const distances = (heatPoints as any[]).map((p) =>
      calculateDistance(baseLat, baseLng, Number(p.latitude), Number(p.longitude))
    )
    const avg = distances.length ? distances.reduce((a, b) => a + b, 0) / distances.length : 0
    const breakdown = {
      '1': distances.filter((d) => d <= 1).length,
      '3': distances.filter((d) => d > 1 && d <= 3).length,
      '5': distances.filter((d) => d > 3 && d <= 5).length,
      '5plus': distances.filter((d) => d > 5).length,
    }
    return { uniqueCustomers: distances.length, avgDistance: avg, breakdown }
  }, [heatPoints, center])

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Area Map</h1>
          <p className="text-sm text-gray-400">
            Location, competitors, customers, and WaveLeaders.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setSidebarOpen((v) => !v)}>
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {sidebarOpen ? 'Hide Panel' : 'Show Panel'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        {sidebarOpen && (
          <div className="space-y-4">
            <Card className="border-gray-800 bg-gray-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  My Location
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-3">
                  <p className="text-white font-medium">{myBusiness?.name ?? 'Business'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {myBusiness?.address ||
                      [myBusiness?.city, myBusiness?.state, myBusiness?.zipCode]
                        .filter(Boolean)
                        .join(', ') ||
                      'Address not set'}
                  </p>
                  <div className="mt-2">
                    {myBusiness?.isVerified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setLocationModalOpen(true)}
                  >
                    Edit Location
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    disabled={!center}
                    onClick={() => {
                      if (!center) return
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${center[1]},${center[0]}`
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Directions
                  </Button>
                </div>

                <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">View radius</span>
                    <span className="text-white font-semibold">{viewRadius} mi</span>
                  </div>
                  <Slider
                    value={[viewRadius]}
                    min={1}
                    max={25}
                    step={1}
                    onValueChange={(v) => setViewRadius(v[0] ?? 5)}
                  />
                </div>

                <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-3">
                  <p className="text-xs text-gray-500 font-medium mb-2">Map layers</p>
                  <div className="space-y-2">
                    {[
                      { key: 'competitors', label: 'Competitors' },
                      { key: 'heatmap', label: 'Customer Heatmap' },
                      { key: 'waveleaders', label: 'WaveLeaders' },
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
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="competitors">Competitors</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="waveleaders">WaveLeaders</TabsTrigger>
                <TabsTrigger value="ads">Ads</TabsTrigger>
              </TabsList>

              <TabsContent value="competitors" className="mt-3">
                <Card className="border-gray-800 bg-gray-900/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-white">Nearby Competitors</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={competitorSort === 'distance' ? 'default' : 'secondary'}
                        onClick={() => setCompetitorSort('distance')}
                      >
                        Sort: Distance
                      </Button>
                      <Button
                        size="sm"
                        variant={competitorSort === 'rating' ? 'default' : 'secondary'}
                        onClick={() => setCompetitorSort('rating')}
                      >
                        Sort: Rating
                      </Button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <label className="flex items-center gap-2 text-gray-200">
                        <Checkbox
                          checked={competitorVerifiedOnly}
                          onCheckedChange={(v) => setCompetitorVerifiedOnly(Boolean(v))}
                        />
                        Verified only
                      </label>
                      <label className="flex items-center gap-2 text-gray-200">
                        <Checkbox
                          checked={competitorActivePromosOnly}
                          onCheckedChange={(v) => setCompetitorActivePromosOnly(Boolean(v))}
                        />
                        Active promotions
                      </label>
                    </div>

                    <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                      {competitorsWithDistance.length === 0 ? (
                        <p className="text-sm text-gray-500 py-6 text-center">No competitors found.</p>
                      ) : (
                        competitorsWithDistance.map((c: any) => (
                          <div key={c.id} className="rounded-lg border border-gray-800 bg-dark-bg/30 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-white font-medium truncate">{c.name}</p>
                              <span className="text-xs text-gray-400">
                                {formatDistance(Number(c.distanceMiles || 0))}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                              <span>★ {(Number(c.rating || 0)).toFixed(1)}</span>
                              {c.isVerified && (
                                <Badge variant="success" className="text-[10px]">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-gray-500">Check-ins: {c.checkIns ?? '—'}</span>
                              <Button size="sm" variant="secondary">
                                View on Map
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="mt-3">
                <Card className="border-gray-800 bg-gray-900/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-white">Customer Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-sm text-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total unique customers</span>
                      <span className="text-white font-semibold">{customerInsights.uniqueCustomers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Average distance traveled</span>
                      <span className="text-white font-semibold">
                        {customerInsights.avgDistance ? `${customerInsights.avgDistance.toFixed(1)} mi` : '—'}
                      </span>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-3 space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Radius breakdown</p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Within 1 mile</span>
                        <span className="text-white font-semibold">{customerInsights.breakdown['1']}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">1–3 miles</span>
                        <span className="text-white font-semibold">{customerInsights.breakdown['3']}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">3–5 miles</span>
                        <span className="text-white font-semibold">{customerInsights.breakdown['5']}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">5+ miles</span>
                        <span className="text-white font-semibold">{customerInsights.breakdown['5plus']}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="waveleaders" className="mt-3">
                <Card className="border-gray-800 bg-gray-900/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-white">Available WaveLeaders</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <Input
                      value={wlSearch}
                      onChange={(e) => setWlSearch(e.target.value)}
                      placeholder="Search by specialty…"
                      leftIcon={<Search className="h-4 w-4" />}
                      className="bg-dark-bg border-gray-700"
                    />
                    <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                      {availableWaveLeaders.length === 0 ? (
                        <p className="text-sm text-gray-500 py-6 text-center">
                          No WaveLeaders found in this area.
                        </p>
                      ) : (
                        availableWaveLeaders.map((w: any) => (
                          <div key={w.id} className="rounded-lg border border-gray-800 bg-dark-bg/30 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-white font-medium truncate">{w.displayName}</p>
                                <p className="text-xs text-gray-500 truncate">{w.specialty || 'WaveLeader'}</p>
                              </div>
                              <Badge variant="success" className="text-[10px]">
                                Available
                              </Badge>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                              <span>★ {(Number(w.rating || 0)).toFixed(1)}</span>
                              <span>
                                {w.hourlyRate != null ? formatCurrency(Number(w.hourlyRate)) + '/hr' : '—'}
                              </span>
                            </div>
                            <div className="mt-2">
                              <Button size="sm" className="w-full">
                                Invite for Partnership
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ads" className="mt-3">
                <Card className="border-gray-800 bg-gray-900/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-white">Advertising</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-sm text-gray-300 space-y-3">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={layers.ads}
                        onCheckedChange={(v) => setLayers((p) => ({ ...p, ads: Boolean(v) }))}
                      />
                      Show ad coverage zone
                    </label>
                    <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-3">
                      <p className="text-xs text-gray-500">Ad reach radius</p>
                      <p className="text-white font-semibold">{Number(myBusiness?.adRadiusMiles ?? 5)} miles</p>
                      <p className="text-xs text-gray-500 mt-2">Estimated impressions/day: —</p>
                      <p className="text-xs text-gray-500">Cost per day: —</p>
                    </div>
                    <Button onClick={() => window.location.assign('/business/ads')}>Create Advertisement</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <Card className="border-gray-800 bg-gray-900/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Map</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[70vh] lg:h-[calc(100vh-220px)] rounded-lg overflow-hidden">
              <MapContainer
                initialCenter={center}
                initialZoom={14}
                showControls
                showUserLocation={false}
                interactive
                onMapLoad={(map) => {
                  if (center) map.easeTo({ center, zoom: 14 })
                }}
              >
                {(map) => (
                  <>
                    {center && <PulsingMarker map={map} position={center} color="#6C5CE7" />}

                    {layers.heatmap && (
                      <CustomerHeatmap map={map} checkIns={heatPoints as any} visible={layers.heatmap} />
                    )}

                    {layers.competitors && competitorsWithDistance.length > 0 && (
                      <BusinessMarkerLayer map={map} businesses={competitorsWithDistance as any} selectedId={null} />
                    )}

                    {layers.waveleaders && availableWaveLeaders.length > 0 && (
                      <WaveLeaderMarkerLayer map={map} waveLeaders={availableWaveLeaders as any} selectedId={null} />
                    )}

                    {center && (
                      <AdCoverageZone
                        map={map}
                        center={center}
                        radiusMiles={Number(myBusiness?.adRadiusMiles ?? 5)}
                        visible={layers.ads}
                      />
                    )}
                  </>
                )}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <BusinessLocationEditor
        open={locationModalOpen}
        onOpenChange={setLocationModalOpen}
        initial={center ? { lat: center[1], lng: center[0], address: myBusiness?.address ?? '' } : null}
        onSave={async (payload) => {
          await updateLocation.mutateAsync(payload)
        }}
      />
    </div>
  )
}

