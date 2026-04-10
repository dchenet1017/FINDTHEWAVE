import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { RevenueDataPoint } from '@/hooks/useBusinessDashboard'
import { formatCurrency } from '@/utils/booking'
import { cn } from '@/lib/utils'

type Period = '7d' | '30d' | '90d' | '1y'

interface RevenueChartProps {
  title?: string
  data?: RevenueDataPoint[]
  isLoading?: boolean
  period?: Period
  onPeriodChange?: (p: Period) => void
}

function formatLabel(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function RevenueChart({
  title = 'Revenue Overview',
  data = [],
  isLoading,
  period = '30d',
  onPeriodChange,
}: RevenueChartProps) {
  const [internal, setInternal] = useState<Period>(period)
  const selected = onPeriodChange ? period : internal

  const points = useMemo(() => {
    return (data || []).map((p) => ({
      ...p,
      label: formatLabel(p.date),
    }))
  }, [data])

  const hasData = points.length > 0

  const setPeriod = (p: Period) => {
    if (onPeriodChange) onPeriodChange(p)
    else setInternal(p)
  }

  return (
    <Card className="border-gray-800 bg-gray-900/40 min-w-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-white">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={selected === p ? 'default' : 'secondary'}
              className={cn('h-8 px-3', selected === p && 'shadow-none')}
              onClick={() => setPeriod(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : !hasData ? (
          <div className="h-[260px] flex items-center justify-center text-sm text-gray-500">
            No revenue data yet.
          </div>
        ) : (
          <div className="h-[260px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#00D4FF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#262626' }}
                  tickLine={{ stroke: '#262626' }}
                />
                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#262626' }}
                  tickLine={{ stroke: '#262626' }}
                  tickFormatter={(v: number) => `$${Math.round(v)}`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid #1F2937',
                    borderRadius: 10,
                    color: '#E5E7EB',
                  }}
                  formatter={(value: any, name: any, props: any) => {
                    if (name === 'revenue') return [formatCurrency(Number(value)), 'Revenue']
                    return [value, name]
                  }}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#00D4FF"
                  strokeWidth={2}
                  fill="url(#revGradient)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

