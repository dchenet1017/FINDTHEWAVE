import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Hand, Megaphone, Percent, Users } from 'lucide-react'
import { isAxiosError } from 'axios'
import { StatCard } from '@/components/admin/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import api from '@/lib/axios'

interface GoOutOverview {
  live: {
    handsRaised: number
    people: number
    groupsOf3Plus: number
    byVibe: { vibe: string; count: number }[]
  }
  last24h: {
    offersSent: number
    accepted: number
    declined: number
    acceptanceRate: number | null
  }
  venues: { businessId: string; name: string; sent: number; accepted: number }[]
  recentIntents: {
    id: string
    who: string
    status: string
    vibes: string[]
    partySize: number
    approxLatitude: number
    approxLongitude: number
    offersReceived: number
    createdAt: string
  }[]
  recentOffers: {
    id: string
    business: { id: string; name: string } | null
    broadcast: boolean
    message: string
    perkDescription: string
    status: string
    createdAt: string
  }[]
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  ACCEPTED: 'success',
  CLAIMED: 'success',
  DECLINED: 'destructive',
  EXPIRED: 'outline',
}

const label = (vibe: string) => vibe.replace(/_/g, ' ').toLowerCase()
const ago = (iso: string) => formatDistanceToNow(parseISO(iso), { addSuffix: true })

/** Live view of the go-out queue for running the pilot */
export default function AdminGoOutPage() {
  const queryClient = useQueryClient()
  const [withdrawing, setWithdrawing] = useState<GoOutOverview['recentOffers'][number] | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'go-out'],
    queryFn: async () =>
      (await api.get<{ success: boolean; data: GoOutOverview }>('/admin/go-out')).data.data,
    refetchInterval: 15_000,
  })

  const withdraw = useMutation({
    mutationFn: (id: string) => api.post(`/admin/go-out/offers/${id}/withdraw`),
    onSuccess: () => {
      toast.success('Offer withdrawn')
      queryClient.invalidateQueries({ queryKey: ['admin', 'go-out'] })
      setWithdrawing(null)
    },
    onError: (error) => {
      toast.error(
        (isAxiosError(error) && error.response?.data?.error?.message) || 'Could not withdraw the offer'
      )
      setWithdrawing(null)
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return <p className="p-8 text-center text-gray-400">Could not load the go-out queue.</p>
  }

  const rate = data.last24h.acceptanceRate

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Go-Out Queue</h1>
        <p className="mt-1 text-sm text-gray-400">
          Live demand and venue offers. Refreshes every 15 seconds. Locations are rounded to about 1 km.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Hands raised now" value={data.live.handsRaised} icon={Hand} />
        <StatCard
          title="People looking to go out"
          value={data.live.people}
          icon={Users}
          iconColor="text-success"
          iconBg="bg-success/10"
        />
        <StatCard
          title="Offers sent (24h)"
          value={data.last24h.offersSent}
          icon={Megaphone}
          iconColor="text-warning"
          iconBg="bg-warning/10"
        />
        <StatCard
          title="Acceptance rate (24h)"
          value={rate === null ? '—' : `${Math.round(rate * 100)}%`}
          icon={Percent}
          iconColor="text-secondary"
          iconBg="bg-secondary/10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Looking for right now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.live.byVibe.length === 0 ? (
              <p className="text-sm text-gray-500">Nobody has a hand up right now.</p>
            ) : (
              data.live.byVibe.map(({ vibe, count }) => (
                <div key={vibe} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-gray-300">{label(vibe)}</span>
                  <span className="font-semibold tabular-nums text-white">{count}</span>
                </div>
              ))
            )}
            {data.live.groupsOf3Plus > 0 && (
              <p className="border-t border-gray-800 pt-3 text-sm text-gray-400">
                {data.live.groupsOf3Plus} group{data.live.groupsOf3Plus === 1 ? '' : 's'} of 3+
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Venues (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.venues.length === 0 ? (
              <p className="text-sm text-gray-500">No venue has sent an offer in the last 24 hours.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-2 font-medium">Venue</th>
                    <th className="pb-2 text-right font-medium">Offers sent</th>
                    <th className="pb-2 text-right font-medium">Accepted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {data.venues.map((v) => (
                    <tr key={v.businessId}>
                      <td className="py-2 text-white">{v.name}</td>
                      <td className="py-2 text-right tabular-nums text-gray-300">{v.sent}</td>
                      <td className="py-2 text-right tabular-nums text-gray-300">{v.accepted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent hands raised</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-800">
            {data.recentIntents.length === 0 && <p className="text-sm text-gray-500">None yet.</p>}
            {data.recentIntents.map((i) => (
              <div key={i.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="text-white">
                    {i.who} · party of {i.partySize}
                  </p>
                  <p className="mt-0.5 capitalize text-gray-400">{i.vibes.map(label).join(', ')}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {ago(i.createdAt)} · near {i.approxLatitude.toFixed(2)}, {i.approxLongitude.toFixed(2)} ·{' '}
                    {i.offersReceived} offer{i.offersReceived === 1 ? '' : 's'}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[i.status] ?? 'outline'}>{i.status.toLowerCase()}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent offers</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-800">
            {data.recentOffers.length === 0 && <p className="text-sm text-gray-500">None yet.</p>}
            {data.recentOffers.map((o) => (
              <div key={o.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="text-white">
                    {o.business?.name ?? 'Unknown venue'}
                    {o.broadcast && <span className="ml-2 text-xs text-gray-500">broadcast</span>}
                  </p>
                  <p className="mt-0.5 text-gray-300">{o.perkDescription}</p>
                  <p className="mt-0.5 truncate text-gray-500">“{o.message}”</p>
                  <p className="mt-0.5 text-xs text-gray-500">{ago(o.createdAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge variant={STATUS_VARIANT[o.status] ?? 'outline'}>{o.status.toLowerCase()}</Badge>
                  {o.status === 'PENDING' && (
                    <Button size="sm" variant="ghost" onClick={() => setWithdrawing(o)}>
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!withdrawing}
        onOpenChange={(open) => !open && setWithdrawing(null)}
        title="Withdraw this offer?"
        description={`${withdrawing?.business?.name ?? 'This venue'}'s offer will disappear from everyone's inbox. This can't be undone.`}
        confirmText="Withdraw offer"
        variant="destructive"
        isLoading={withdraw.isPending}
        onConfirm={() => withdrawing && withdraw.mutate(withdrawing.id)}
      />
    </div>
  )
}
