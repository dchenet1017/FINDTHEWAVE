import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export interface AnalyticsMetricCardProps {
  label: string
  value: string | number
  trend: number
  trendLabel: string
  icon: LucideIcon
  chartData?: number[]
  isLoading?: boolean
}

export function AnalyticsMetricCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  chartData,
  isLoading,
}: AnalyticsMetricCardProps) {
  const up = trend >= 0
  const spark = (chartData || []).map((v, idx) => ({ idx, v }))

  return (
    <Card className="border-gray-800 bg-gray-900/40">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-gray-400">{label}</p>
            {isLoading ? (
              <div className="mt-2">
                <Skeleton className="h-8 w-28" />
              </div>
            ) : (
              <p className="mt-2 text-3xl font-bold text-white truncate">{value}</p>
            )}
          </div>

          <div className="h-11 w-11 rounded-xl bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="text-xs">
            {isLoading ? (
              <Skeleton className="h-4 w-28" />
            ) : (
              <span className={cn('inline-flex items-center gap-1', up ? 'text-emerald-400' : 'text-red-400')}>
                {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(trend).toFixed(1)}%
                <span className="text-gray-500">{trendLabel}</span>
              </span>
            )}
          </div>

          <div className="h-10 w-24">
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : spark.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spark}>
                  <Tooltip
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid #1F2937',
                      borderRadius: 10,
                      color: '#E5E7EB',
                    }}
                    formatter={(v: any) => [v, label]}
                    labelFormatter={() => ''}
                  />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={up ? '#34d399' : '#fb7185'}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-10 w-24 rounded-md border border-gray-800 bg-dark-bg/30" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

