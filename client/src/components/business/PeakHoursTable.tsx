import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import type { PeakHourRow } from '@/hooks/useBusinessAnalytics'
import { formatCurrency } from '@/utils/booking'

type SortKey = 'hour' | 'checkIns' | 'revenue'

function hourLabel(h: number) {
  const hh12 = ((h + 11) % 12) + 1
  const period = h >= 12 ? 'PM' : 'AM'
  return `${hh12} ${period}`
}

export function PeakHoursTable({
  rows = [],
  isLoading,
}: {
  rows?: PeakHourRow[]
  isLoading?: boolean
}) {
  const [sortBy, setSortBy] = useState<SortKey>('checkIns')

  const sorted = useMemo(() => {
    const list = [...rows]
    list.sort((a, b) => {
      if (sortBy === 'hour') return a.hour - b.hour
      if (sortBy === 'revenue') return b.revenue - a.revenue
      return b.checkIns - a.checkIns
    })
    return list
  }, [rows, sortBy])

  const maxCheckIns = Math.max(1, ...sorted.map((r) => r.checkIns))
  const top3 = new Set(sorted.slice(0, 3).map((r) => r.hour))

  return (
    <Card className="border-gray-800 bg-gray-900/40">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-white">Peak Hours Analysis</CardTitle>
        <div className="w-[170px]">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="bg-dark-bg border-gray-700 h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checkIns">Sort: Check-ins</SelectItem>
              <SelectItem value="revenue">Sort: Revenue</SelectItem>
              <SelectItem value="hour">Sort: Hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : sorted.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">No peak-hours data yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-dark-bg border-b border-gray-800">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Hour</th>
                  <th className="px-4 py-3">Check-ins</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Avg Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sorted.map((r) => {
                  const pct = Math.round((r.checkIns / maxCheckIns) * 100)
                  return (
                    <tr
                      key={r.hour}
                      className={cn(
                        'bg-gray-900/30 hover:bg-dark-bg/40 transition-colors',
                        top3.has(r.hour) && 'bg-primary/5'
                      )}
                    >
                      <td className="px-4 py-3 text-white font-medium">
                        {hourLabel(r.hour)}{' '}
                        {top3.has(r.hour) && (
                          <span className="ml-2 text-[11px] text-primary">Top</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-semibold w-10">{r.checkIns}</span>
                          <div className="h-2 flex-1 rounded-full bg-gray-800 overflow-hidden">
                            <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">{formatCurrency(r.revenue)}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {r.avgDurationMinutes != null ? `${Math.round(r.avgDurationMinutes)} min` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

