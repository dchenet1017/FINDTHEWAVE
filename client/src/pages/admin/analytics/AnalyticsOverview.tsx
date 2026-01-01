import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, TrendingUp, Users, DollarSign, Activity, Award, BarChart3, PieChart } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { adminService } from '@/services/admin.service'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

// Custom tooltip for dark theme
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-gray-800 rounded-lg p-3">
        <p className="text-white font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name.includes('Revenue') ? formatCurrency(entry.value) : formatNumber(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const COLORS = ['#6C5CE7', '#00D2D3', '#FF9F43', '#00B894', '#FF7675', '#FDCB6E']

export default function AnalyticsOverview() {
  const [dateRange, setDateRange] = useState('30days')
  
  const getDateRange = () => {
    const end = new Date()
    let start: Date
    
    switch (dateRange) {
      case '7days':
        start = subDays(end, 7)
        break
      case '30days':
        start = subDays(end, 30)
        break
      case 'month':
        start = startOfMonth(end)
        break
      case '90days':
        start = subDays(end, 90)
        break
      default:
        start = subDays(end, 30)
    }
    
    return { start, end }
  }

  const { start, end } = getDateRange()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'analytics', dateRange],
    queryFn: () => adminService.getAnalytics({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Format chart data
  const revenueData = data?.charts?.revenue?.map((item: any) => ({
    date: format(new Date(item.date), 'MMM dd'),
    revenue: Number(item.amount),
  })) || []

  const userGrowthData = data?.charts?.userGrowth?.map((item: any) => ({
    date: format(new Date(item.date), 'MMM dd'),
    users: Number(item.count),
  })) || []

  const categoryData = data?.bookingsByCategory || [
    { name: 'Outdoor', value: 35 },
    { name: 'Nightlife', value: 25 },
    { name: 'Food', value: 20 },
    { name: 'Wellness', value: 15 },
    { name: 'Culture', value: 5 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Overview</h1>
          <p className="text-gray-400 mt-1">
            Platform performance and insights
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select period" />
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
        <Card className="bg-dark-card border-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Total Revenue</span>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(data?.stats?.totalRevenue || 0)}
            </p>
            <p className="text-sm text-green-500 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +22.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-card border-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Total Bookings</span>
              <Calendar className="h-4 w-4 text-primary" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              {formatNumber(data?.stats?.totalBookings || 0)}
            </p>
            <p className="text-sm text-primary mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +15.3% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-card border-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>New Users</span>
              <Users className="h-4 w-4 text-secondary" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              {formatNumber(data?.stats?.newUsers || 0)}
            </p>
            <p className="text-sm text-secondary mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8.7% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-card border-gray-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Active WaveLeaders</span>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              {formatNumber(data?.stats?.activeWaveLeaders || 0)}
            </p>
            <p className="text-sm text-orange-500 mt-1">
              {formatNumber(data?.stats?.totalWaveLeaders || 0)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Revenue Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#B0B0B0"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#B0B0B0"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6C5CE7" 
                  strokeWidth={2}
                  dot={{ fill: '#6C5CE7', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bookings by Category */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-secondary" />
              Bookings by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            User Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="#B0B0B0"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#B0B0B0"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#00D2D3" 
                fill="#00D2D3"
                fillOpacity={0.3}
                strokeWidth={2}
                name="New Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top WaveLeaders */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top WaveLeaders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.topWaveLeaders?.map((waveLeader: any, index: number) => (
                <div key={waveLeader.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-medium w-6">#{index + 1}</span>
                    <div>
                      <p className="text-white font-medium">{waveLeader.displayName}</p>
                      <p className="text-sm text-gray-400">{waveLeader.totalBookings} bookings</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{formatCurrency(waveLeader.totalEarnings || 0)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Businesses */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Top Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.topBusinesses?.map((business: any, index: number) => (
                <div key={business.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-medium w-6">#{index + 1}</span>
                    <div>
                      <p className="text-white font-medium">{business.name}</p>
                      <p className="text-sm text-gray-400">{business.checkIns} check-ins</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{business.type}</Badge>
                </div>
              )) || (
                <p className="text-gray-400">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Communities */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Active Communities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.activeCommunities?.map((community: any, index: number) => (
                <div key={community.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-medium w-6">#{index + 1}</span>
                    <div>
                      <p className="text-white font-medium">{community.name}</p>
                      <p className="text-sm text-gray-400">{community.totalMembers} members</p>
                    </div>
                  </div>
                  <Badge variant="secondary">+{community.newMembers || 0} new</Badge>
                </div>
              )) || (
                <p className="text-gray-400">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
