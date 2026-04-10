import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Copy,
  PauseCircle,
  PlayCircle,
  Plus,
  Trash2,
  Pencil,
  Map as MapIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AdCoverageMap } from '@/components/ads/AdCoverageMap'
import { useBusinessLocation, useCustomerHeatmap } from '@/hooks/useBusinessMap'
import {
  useAdvertisements,
  useDeleteAdvertisement,
  usePauseAdvertisement,
  useResumeAdvertisement,
  type AdsTabStatus,
} from '@/hooks/useAdvertisements'
import type { Advertisement } from '@/types/ads'
import { formatCurrency } from '@/utils/booking'

function statusBadge(status: Advertisement['status']) {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="success">Live</Badge>
    case 'SCHEDULED':
      return <Badge variant="secondary">Scheduled</Badge>
    case 'PAUSED':
      return <Badge variant="warning">Paused</Badge>
    case 'COMPLETED':
      return <Badge variant="outline">Completed</Badge>
    case 'DRAFT':
    default:
      return <Badge variant="outline">Draft</Badge>
  }
}

function ctr(clicks: number, impressions: number) {
  if (!impressions) return 0
  return (clicks / impressions) * 100
}

export default function AdvertisementsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<AdsTabStatus>('active')

  const { data: ads = [], isLoading } = useAdvertisements(tab)
  const activeCount = useMemo(() => ads.filter((a) => a.status === 'ACTIVE').length, [ads])

  const pauseMutation = usePauseAdvertisement()
  const resumeMutation = useResumeAdvertisement()
  const deleteMutation = useDeleteAdvertisement()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: biz } = useBusinessLocation()
  const { data: heatPoints = [] } = useCustomerHeatmap('30d')

  const center = biz ? ([Number(biz.longitude), Number(biz.latitude)] as [number, number]) : null

  const empty = !isLoading && ads.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Advertisements</h1>
          <p className="text-gray-400 mt-1">Create and manage promoted campaigns with dynamic pricing.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{activeCount} active</Badge>
          <Button className="py-6 px-5" onClick={() => navigate('/business/ads/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Ad
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as AdsTabStatus)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-900/80 border border-gray-800">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value={tab} className="mt-0">
            {empty ? (
              <Card className="border-gray-800 bg-gray-900/40">
                <CardContent className="p-10 text-center">
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <MapIcon className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-white font-semibold text-lg">No ads yet</p>
                  <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
                    Create your first ad to reach more customers near your business.
                  </p>
                  <Button className="mt-6" onClick={() => navigate('/business/ads/create')}>
                    Create Ad
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {ads.map((ad) => (
                  <Card key={ad.id} className="border-gray-800 bg-gray-900/40">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="text-base text-white truncate">{ad.title}</CardTitle>
                          <p className="text-xs text-gray-500 mt-1">
                            {ad.startDate} — {ad.endDate || 'Continuous'}
                          </p>
                        </div>
                        {statusBadge(ad.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-3">
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="text-white font-semibold">{formatCurrency(ad.dailyBudget)}/day</p>
                        </div>
                        <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-3">
                          <p className="text-xs text-gray-500">Total spent</p>
                          <p className="text-white font-semibold">{formatCurrency(ad.totalSpent)}</p>
                        </div>
                        <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-3">
                          <p className="text-xs text-gray-500">Impressions</p>
                          <p className="text-white font-semibold">{ad.impressions.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-gray-800 bg-dark-bg/30 p-3">
                          <p className="text-xs text-gray-500">CTR</p>
                          <p className="text-white font-semibold">
                            {ctr(ad.clicks, ad.impressions).toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-500">Target radius</p>
                          <p className="text-xs text-gray-300 font-semibold">{ad.radiusMiles} mi</p>
                        </div>
                        <AdCoverageMap
                          center={center}
                          radiusMiles={ad.radiusMiles}
                          heatPoints={heatPoints}
                          showHeatmap={true}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/business/ads/${ad.id}/analytics`)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Analytics
                        </Button>

                        {ad.status === 'ACTIVE' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => pauseMutation.mutate(ad.id)}
                            disabled={pauseMutation.isPending}
                          >
                            <PauseCircle className="h-4 w-4 mr-2" />
                            Pause
                          </Button>
                        ) : ad.status === 'PAUSED' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => resumeMutation.mutate(ad.id)}
                            disabled={resumeMutation.isPending}
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Resume
                          </Button>
                        ) : null}

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/business/ads/${ad.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate('/business/ads/create', { state: { duplicateFrom: ad } })}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteId(ad.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete advertisement?"
        description="This will permanently delete the campaign. This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => {
          if (!deleteId) return
          deleteMutation.mutate(deleteId, { onSettled: () => setDeleteId(null) } as any)
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

