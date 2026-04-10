import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/utils/booking'
import type { PromotionPerformanceRow } from '@/hooks/useBusinessAnalytics'

function statusBadge(status: PromotionPerformanceRow['status']) {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="success">Active</Badge>
    case 'SCHEDULED':
      return <Badge variant="secondary">Scheduled</Badge>
    case 'ENDED':
    default:
      return <Badge variant="outline">Ended</Badge>
  }
}

export function PromotionsPerformanceTable({
  rows = [],
  isLoading,
}: {
  rows?: PromotionPerformanceRow[]
  isLoading?: boolean
}) {
  return (
    <Card className="border-gray-800 bg-gray-900/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-white">Promotion Performance</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">No promotion performance data yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-dark-bg border-b border-gray-800">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Promotion</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3">Check-ins</th>
                  <th className="px-4 py-3">Revenue Impact</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-dark-bg/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{p.name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{p.startDate}</td>
                    <td className="px-4 py-3 text-gray-300">{p.endDate}</td>
                    <td className="px-4 py-3 text-white font-semibold">{p.checkIns}</td>
                    <td className="px-4 py-3 text-white">{formatCurrency(p.revenueImpact)}</td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

