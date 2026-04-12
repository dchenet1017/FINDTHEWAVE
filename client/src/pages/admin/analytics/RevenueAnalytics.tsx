import { useState } from 'react'
import {
  DollarSign, TrendingUp, TrendingDown, Calendar,
  CreditCard, Award, ArrowUpRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import {
  LineChart, Line, BarChart, Bar,
  PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#6C5CE7', '#00D2D3', '#FF9F43', '#00B894', '#FF7675', '#FDCB6E']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-gray-800 rounded-lg p-3">
        <p className="text-white font-medium mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('commission') || entry.name.toLowerCase().includes('earnings')
              ? formatCurrency(entry.value)
              : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const MONTHLY_REVENUE = [
  { month: 'Jul', revenue: 18400, commission: 3680, bookings: 142 },
  { month: 'Aug', revenue: 22100, commission: 4420, bookings: 178 },
  { month: 'Sep', revenue: 19800, commission: 3960, bookings: 156 },
  { month: 'Oct', revenue: 26500, commission: 5300, bookings: 212 },
  { month: 'Nov', revenue: 31200, commission: 6240, bookings: 251 },
  { month: 'Dec', revenue: 38700, commission: 7740, bookings: 310 },
]

const REVENUE_BY_CATEGORY = [
  { name: 'WaveLeader Bookings', value: 58 },
  { name: 'Business Ads', value: 22 },
  { name: 'Event Tickets', value: 12 },
  { name: 'Premium Features', value: 8 },
]

const PAYMENT_METHODS = [
  { method: 'Credit Card', amount: 84200, pct: 62 },
  { method: 'Debit Card', amount: 27100, pct: 20 },
  { method: 'Apple Pay', amount: 13500, pct: 10 },
  { method: 'Google Pay', amount: 10900, pct: 8 },
]

const TOP_EARNERS = [
  { rank: 1, name: 'James Rivera', specialty: 'Nightlife Guide', bookings: 48, earnings: 9600, growth: '+18%' },
  { rank: 2, name: 'Sofia Martinez', specialty: 'Food Tours', bookings: 41, earnings: 8200, growth: '+12%' },
  { rank: 3, name: 'David Kim', specialty: 'Cultural Experiences', bookings: 37, earnings: 7400, growth: '+24%' },
  { rank: 4, name: 'Aisha Johnson', specialty: 'Wellness & Yoga', bookings: 34, earnings: 6800, growth: '+9%' },
  { rank: 5, name: 'Marco Chen', specialty: 'Adventure Sports', bookings: 29, earnings: 5800, growth: '-3%' },
]

const PERIODS: Record<string, { mrr: number; arr: number; commission: number; avgBooking: number; mrrGrowth: number; bookingsGrowth: number }> = {
  '7days': { mrr: 8700, arr: 104400, commission: 1740, avgBooking: 187, mrrGrowth: 14.2, bookingsGrowth: 11.3 },
  '30days': { mrr: 38700, arr: 464400, commission: 7740, avgBooking: 187, mrrGrowth: 22.5, bookingsGrowth: 18.7 },
  'month': { mrr: 38700, arr: 464400, commission: 7740, avgBooking: 187, mrrGrowth: 22.5, bookingsGrowth: 18.7 },
  '90days': { mrr: 96400, arr: 385600, commission: 19280, avgBooking: 194, mrrGrowth: 31.8, bookingsGrowth: 27.4 },
}

export default function RevenueAnalytics() {
  const [dateRange, setDateRange] = useState('30days')
  const metrics = PERIODS[dateRange]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Revenue Analytics</h1>
          <p className="text-gray-400 mt-1">Detailed financial performance and earnings breakdown</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue',
            value: formatCurrency(metrics.mrr),
            sub: `${metrics.mrrGrowth > 0 ? '+' : ''}${metrics.mrrGrowth}% vs last period`,
            positive: metrics.mrrGrowth > 0,
            icon: DollarSign,
            iconColor: 'text-green-500',
          },
          {
            label: 'Annual Run Rate',
            value: formatCurrency(metrics.arr),
            sub: 'Projected ARR',
            positive: true,
            icon: TrendingUp,
            iconColor: 'text-primary',
          },
          {
            label: 'Commission Earned',
            value: formatCurrency(metrics.commission),
            sub: '20% of bookings',
            positive: true,
            icon: CreditCard,
            iconColor: 'text-secondary',
          },
          {
            label: 'Avg Booking Value',
            value: formatCurrency(metrics.avgBooking),
            sub: `+${metrics.bookingsGrowth}% bookings`,
            positive: true,
            icon: ArrowUpRight,
            iconColor: 'text-orange-400',
          },
        ].map((m) => (
          <Card key={m.label} className="bg-dark-card border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between">
                <span>{m.label}</span>
                <m.icon className={`h-4 w-4 ${m.iconColor}`} />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{m.value}</p>
              <p className={`text-sm mt-1 flex items-center gap-1 ${m.positive ? 'text-green-500' : 'text-red-400'}`}>
                {m.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {m.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <Card className="bg-dark-card border-gray-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Monthly Revenue & Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={MONTHLY_REVENUE}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="#B0B0B0" style={{ fontSize: '12px' }} />
                <YAxis stroke="#B0B0B0" style={{ fontSize: '12px' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#6C5CE7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="commission" name="Commission" fill="#00D2D3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Category */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RePieChart>
                <Pie
                  data={REVENUE_BY_CATEGORY}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {REVENUE_BY_CATEGORY.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} contentStyle={{ background: '#1E1E1E', border: '1px solid #374151', borderRadius: '8px' }} />
              </RePieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {REVENUE_BY_CATEGORY.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-gray-300">{cat.name}</span>
                  </div>
                  <span className="text-white font-medium">{cat.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trend */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Booking Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MONTHLY_REVENUE}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="#B0B0B0" style={{ fontSize: '12px' }} />
                <YAxis stroke="#B0B0B0" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#FF9F43" strokeWidth={2} dot={{ fill: '#FF9F43', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-secondary" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {PAYMENT_METHODS.map((pm) => (
                <div key={pm.method}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{pm.method}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">{pm.pct}%</span>
                      <span className="text-sm font-medium text-white">{formatCurrency(pm.amount)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${pm.pct}%`, opacity: 0.4 + (pm.pct / 100) * 0.6 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Earners Table */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top Earning WaveLeaders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-6 py-3 font-medium">Rank</th>
                <th className="text-left px-6 py-3 font-medium">WaveLeader</th>
                <th className="text-left px-6 py-3 font-medium">Specialty</th>
                <th className="text-left px-6 py-3 font-medium">Bookings</th>
                <th className="text-left px-6 py-3 font-medium">Earnings</th>
                <th className="text-left px-6 py-3 font-medium">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {TOP_EARNERS.map((e) => (
                <tr key={e.rank} className="hover:bg-dark-bg/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`font-bold ${e.rank === 1 ? 'text-yellow-400' : e.rank === 2 ? 'text-gray-300' : e.rank === 3 ? 'text-amber-600' : 'text-gray-500'}`}>
                      #{e.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{e.name}</td>
                  <td className="px-6 py-4 text-gray-400">{e.specialty}</td>
                  <td className="px-6 py-4 text-white">{e.bookings}</td>
                  <td className="px-6 py-4 font-medium text-green-400">{formatCurrency(e.earnings)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={e.growth.startsWith('+') ? 'success' : 'destructive'}>{e.growth}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
