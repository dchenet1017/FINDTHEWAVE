import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { AnalyticsMetricCard } from '@/components/business/AnalyticsMetricCard'
import { PeakHoursTable } from '@/components/business/PeakHoursTable'
import { TopCustomersTable } from '@/components/business/TopCustomersTable'
import { PromotionsPerformanceTable } from '@/components/business/PromotionsPerformanceTable'
import {
  useBusinessAnalytics,
  usePeakHours,
  usePromotionsPerformance,
  useTopCustomers,
  type AnalyticsPeriod,
} from '@/hooks/useBusinessAnalytics'
import { formatCurrency } from '@/utils/booking'
import { BarChart3, DollarSign, Star, Users } from 'lucide-react'

type Granularity = 'daily' | 'weekly' | 'monthly'

function iso(date: Date) {
  return date.toISOString().slice(0, 10)
}

function labelShort(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function BusinessAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('week')
  const [granularity, setGranularity] = useState<Granularity>('daily')
  const [compare, setCompare] = useState(true)

  const [customStart, setCustomStart] = useState(() => iso(new Date(Date.now() - 29 * 86400000)))
  const [customEnd, setCustomEnd] = useState(() => iso(new Date()))

  const params = useMemo(() => {
    return {
      period,
      granularity,
      compareTo: compare ? ('previous' as const) : ('none' as const),
      ...(period === 'custom'
        ? { startDate: customStart, endDate: customEnd }
        : {}),
    }
  }, [period, granularity, compare, customStart, customEnd])

  const { data: analytics, isLoading } = useBusinessAnalytics(params as any)
  const { data: peakHours = [], isLoading: peakLoading } = usePeakHours(
    period === 'custom' ? `${customStart}_${customEnd}` : period
  )
  const { data: topCustomers = [], isLoading: customersLoading } = useTopCustomers(10)
  const { data: promoPerf = [], isLoading: promoLoading } = usePromotionsPerformance()

  const metrics = analytics?.metrics

  const checkInSeries = (analytics?.series?.checkIns || []).map((p) => ({
    ...p,
    label: labelShort(p.date),
  }))
  const revenueSeries = (analytics?.series?.revenue || []).map((p) => ({
    ...p,
    label: labelShort(p.date),
  }))
  const customerSeries = (analytics?.series?.customers || []).map((p) => ({
    ...p,
    label: labelShort(p.date),
  }))

  const trendLabel =
    period === 'today'
      ? 'vs yesterday'
      : period === 'week'
        ? 'vs last week'
        : period === 'month'
          ? 'vs last month'
          : period === 'year'
            ? 'vs last year'
            : 'vs previous'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">
            Track check-ins, revenue, customers, and performance.
          </p>
        </div>
        {analytics?.range && (
          <Badge variant="outline">
            {analytics.range.start} → {analytics.range.end}
          </Badge>
        )}
      </div>

      {/* Period selector */}
      <Card className="border-gray-800 bg-gray-900/40">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <Tabs value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
              <TabsList className="w-full lg:w-auto">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
                <TabsTrigger value="year">This Year</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {period === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-dark-bg border-gray-700"
                  />
                  <span className="text-gray-500 text-sm">to</span>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-dark-bg border-gray-700"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch checked={compare} onCheckedChange={setCompare} />
                <span className="text-sm text-gray-300">Compare to previous period</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {compare ? 'Comparison enabled' : 'Comparison disabled'}
            </div>
            <div className="flex items-center gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((g) => (
                <Button
                  key={g}
                  size="sm"
                  variant={granularity === g ? 'default' : 'secondary'}
                  className="h-8"
                  onClick={() => setGranularity(g)}
                >
                  {g[0].toUpperCase() + g.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AnalyticsMetricCard
          label="Check-ins"
          value={metrics ? metrics.checkIns.total : 0}
          trend={metrics ? metrics.checkIns.trendPct : 0}
          trendLabel={trendLabel}
          icon={Users}
          chartData={metrics?.checkIns.sparkline}
          isLoading={isLoading}
        />
        <AnalyticsMetricCard
          label="Revenue"
          value={metrics ? formatCurrency(metrics.revenue.total) : formatCurrency(0)}
          trend={metrics ? metrics.revenue.trendPct : 0}
          trendLabel={trendLabel}
          icon={DollarSign}
          chartData={metrics?.revenue.sparkline}
          isLoading={isLoading}
        />
        <AnalyticsMetricCard
          label="New Customers"
          value={metrics ? metrics.newCustomers.total : 0}
          trend={metrics ? metrics.newCustomers.trendPct : 0}
          trendLabel={trendLabel}
          icon={BarChart3}
          chartData={metrics?.newCustomers.sparkline}
          isLoading={isLoading}
        />
        <AnalyticsMetricCard
          label="Average Rating"
          value={metrics ? metrics.avgRating.value.toFixed(1) : '0.0'}
          trend={metrics ? metrics.avgRating.trendPct : 0}
          trendLabel={trendLabel}
          icon={Star}
          chartData={metrics?.avgRating.sparkline}
          isLoading={isLoading}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-800 bg-gray-900/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Check-ins Over Time</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={checkInSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid #1F2937',
                      borderRadius: 10,
                      color: '#E5E7EB',
                    }}
                  />
                  <Bar dataKey="value" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="revGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(v: number) => `$${Math.round(v)}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid #1F2937',
                      borderRadius: 10,
                      color: '#E5E7EB',
                    }}
                    formatter={(v: any) => [formatCurrency(Number(v)), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#34d399"
                    strokeWidth={2}
                    fill="url(#revGreen)"
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer insights */}
      <Card className="border-gray-800 bg-gray-900/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-white">Customer Insights</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={customerSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(v: number) => `${Math.round(v)}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid #1F2937',
                    borderRadius: 10,
                    color: '#E5E7EB',
                  }}
                />
                <Bar yAxisId="left" dataKey="new" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="left" dataKey="returning" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="retentionRate"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6">
        <PeakHoursTable rows={peakHours} isLoading={peakLoading} />
        <TopCustomersTable rows={topCustomers} isLoading={customersLoading} />
        <PromotionsPerformanceTable rows={promoPerf} isLoading={promoLoading} />
      </div>
    </div>
  )
}

