import { useState } from 'react'
import {
  Activity, Users, MapPin, Calendar,
  TrendingUp, Heart, MessageSquare, Repeat2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatNumber } from '@/lib/utils'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-gray-800 rounded-lg p-3">
        <p className="text-white font-medium mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const DAILY_CHECKINS = [
  { day: 'Mon', checkIns: 124, activeUsers: 312 },
  { day: 'Tue', checkIns: 98, activeUsers: 278 },
  { day: 'Wed', checkIns: 143, activeUsers: 341 },
  { day: 'Thu', checkIns: 167, activeUsers: 398 },
  { day: 'Fri', checkIns: 289, activeUsers: 612 },
  { day: 'Sat', checkIns: 412, activeUsers: 834 },
  { day: 'Sun', checkIns: 356, activeUsers: 721 },
]

const HOURLY_ACTIVITY = [
  { hour: '6AM', activity: 45 },
  { hour: '8AM', activity: 112 },
  { hour: '10AM', activity: 189 },
  { hour: '12PM', activity: 267 },
  { hour: '2PM', activity: 198 },
  { hour: '4PM', activity: 234 },
  { hour: '6PM', activity: 389 },
  { hour: '8PM', activity: 445 },
  { hour: '10PM', activity: 312 },
  { hour: '12AM', activity: 178 },
]

const COMMUNITY_GROWTH = [
  { month: 'Jul', members: 1240, posts: 342 },
  { month: 'Aug', members: 1580, posts: 421 },
  { month: 'Sep', members: 1890, posts: 512 },
  { month: 'Oct', members: 2340, posts: 634 },
  { month: 'Nov', members: 2780, posts: 789 },
  { month: 'Dec', members: 3210, posts: 912 },
]

const TOP_LOCATIONS = [
  { name: 'The Downtown Brewery', city: 'Austin, TX', checkIns: 412, trend: '+24%', type: 'BAR' },
  { name: 'PowerFit Gym', city: 'Chicago, IL', checkIns: 389, trend: '+18%', type: 'FITNESS' },
  { name: 'Sky Lounge Bar', city: 'Austin, TX', checkIns: 356, trend: '+31%', type: 'BAR' },
  { name: 'Green Leaf Cafe', city: 'Portland, OR', checkIns: 312, trend: '+9%', type: 'CAFE' },
  { name: 'CrossFit Central', city: 'Phoenix, AZ', checkIns: 289, trend: '+15%', type: 'FITNESS' },
  { name: 'Zen Spa & Wellness', city: 'San Francisco, CA', checkIns: 267, trend: '+42%', type: 'WELLNESS' },
]

const PERIODS: Record<string, { checkIns: number; activeUsers: number; retention: number; avgSession: string; checkInsGrowth: number; usersGrowth: number }> = {
  '7days': { checkIns: 1589, activeUsers: 3496, retention: 68, avgSession: '14m', checkInsGrowth: 23.4, usersGrowth: 11.2 },
  '30days': { checkIns: 6842, activeUsers: 12450, retention: 72, avgSession: '18m', checkInsGrowth: 34.1, usersGrowth: 19.8 },
  'month': { checkIns: 6842, activeUsers: 12450, retention: 72, avgSession: '18m', checkInsGrowth: 34.1, usersGrowth: 19.8 },
  '90days': { checkIns: 18920, activeUsers: 28700, retention: 65, avgSession: '16m', checkInsGrowth: 51.2, usersGrowth: 38.6 },
}

export default function EngagementAnalytics() {
  const [dateRange, setDateRange] = useState('30days')
  const metrics = PERIODS[dateRange]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Engagement Analytics</h1>
          <p className="text-gray-400 mt-1">User activity, retention and platform engagement insights</p>
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
            label: 'Total Check-ins',
            value: formatNumber(metrics.checkIns),
            sub: `+${metrics.checkInsGrowth}% vs last period`,
            icon: MapPin,
            iconColor: 'text-primary',
            subColor: 'text-green-500',
          },
          {
            label: 'Active Users',
            value: formatNumber(metrics.activeUsers),
            sub: `+${metrics.usersGrowth}% vs last period`,
            icon: Users,
            iconColor: 'text-secondary',
            subColor: 'text-green-500',
          },
          {
            label: 'Retention Rate',
            value: `${metrics.retention}%`,
            sub: 'Monthly active retention',
            icon: Repeat2,
            iconColor: 'text-orange-400',
            subColor: 'text-gray-400',
          },
          {
            label: 'Avg Session',
            value: metrics.avgSession,
            sub: 'Per active user',
            icon: Activity,
            iconColor: 'text-green-500',
            subColor: 'text-gray-400',
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
              <p className={`text-sm mt-1 flex items-center gap-1 ${m.subColor}`}>
                <TrendingUp className="h-3 w-3" />
                {m.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Check-ins */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Check-ins & Active Users (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={DAILY_CHECKINS}>
                <defs>
                  <linearGradient id="checkInGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D2D3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D2D3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="#B0B0B0" style={{ fontSize: '12px' }} />
                <YAxis stroke="#B0B0B0" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="activeUsers" name="Active Users" stroke="#00D2D3" fill="url(#userGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="checkIns" name="Check-ins" stroke="#6C5CE7" fill="url(#checkInGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-400" />
              Activity by Time of Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={HOURLY_ACTIVITY}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="hour" stroke="#B0B0B0" style={{ fontSize: '11px' }} />
                <YAxis stroke="#B0B0B0" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="activity" name="Active Users" fill="#FF9F43" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Community Growth */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Community Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={COMMUNITY_GROWTH}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="#B0B0B0" style={{ fontSize: '12px' }} />
              <YAxis stroke="#B0B0B0" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="members" name="Total Members" stroke="#00B894" strokeWidth={2} dot={{ fill: '#00B894', r: 4 }} />
              <Line type="monotone" dataKey="posts" name="Community Posts" stroke="#FDCB6E" strokeWidth={2} dot={{ fill: '#FDCB6E', r: 4 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Locations */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-400" />
            Most Visited Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-6 py-3 font-medium">Rank</th>
                <th className="text-left px-6 py-3 font-medium">Business</th>
                <th className="text-left px-6 py-3 font-medium">Location</th>
                <th className="text-left px-6 py-3 font-medium">Type</th>
                <th className="text-left px-6 py-3 font-medium">Check-ins</th>
                <th className="text-left px-6 py-3 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {TOP_LOCATIONS.map((loc, i) => (
                <tr key={loc.name} className="hover:bg-dark-bg/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                      #{i + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{loc.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {loc.city}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary">{loc.type}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{loc.checkIns}</span>
                      <div className="w-16 h-1.5 bg-gray-800 rounded-full">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${(loc.checkIns / 412) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="success">{loc.trend}</Badge>
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
