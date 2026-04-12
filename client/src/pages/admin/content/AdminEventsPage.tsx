import { useState } from 'react'
import {
  Calendar, Search, Users, CheckCircle, Clock, XCircle,
  MapPin, Tag, Eye, Ticket,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'

const EVENTS = [
  { id: '1', name: 'Live Jazz Night', business: 'The Downtown Brewery', city: 'Austin, TX', date: 'Dec 15, 2024', time: '8:00 PM', attendees: 45, capacity: 80, status: 'ACTIVE', type: 'ENTERTAINMENT', price: '$15' },
  { id: '2', name: 'Sunset Yoga on the Roof', business: 'Serenity Yoga Studio', city: 'Miami, FL', date: 'Dec 18, 2024', time: '6:00 AM', attendees: 22, capacity: 30, status: 'ACTIVE', type: 'WELLNESS', price: '$20' },
  { id: '3', name: 'Italian Wine Tasting', business: 'Bella Italia Restaurant', city: 'Denver, CO', date: 'Dec 20, 2024', time: '7:00 PM', attendees: 34, capacity: 40, status: 'ACTIVE', type: 'FOOD', price: '$45' },
  { id: '4', name: 'New Year\'s Eve Bash', business: 'Neon Nights Club', city: 'Las Vegas, NV', date: 'Dec 31, 2024', time: '9:00 PM', attendees: 0, capacity: 500, status: 'PENDING', type: 'NIGHTLIFE', price: '$75' },
  { id: '5', name: 'CrossFit Open Challenge', business: 'CrossFit Central', city: 'Phoenix, AZ', date: 'Jan 5, 2025', time: '9:00 AM', attendees: 60, capacity: 60, status: 'SOLD_OUT', type: 'FITNESS', price: 'Free' },
  { id: '6', name: 'Stand-Up Comedy Night', business: 'Laugh Factory Comedy Club', city: 'Los Angeles, CA', date: 'Jan 8, 2025', time: '8:30 PM', attendees: 12, capacity: 150, status: 'PENDING', type: 'ENTERTAINMENT', price: '$25' },
  { id: '7', name: 'Craft Beer Festival', business: 'The Downtown Brewery', city: 'Austin, TX', date: 'Jan 12, 2025', time: '2:00 PM', attendees: 230, capacity: 300, status: 'ACTIVE', type: 'FOOD', price: '$30' },
  { id: '8', name: 'Spa Day Retreat', business: 'Zen Spa & Wellness', city: 'San Francisco, CA', date: 'Jan 15, 2025', time: '10:00 AM', attendees: 8, capacity: 15, status: 'ACTIVE', type: 'WELLNESS', price: '$120' },
  { id: '9', name: 'Morning Run Club', business: 'PowerFit Gym', city: 'Chicago, IL', date: 'Jan 20, 2025', time: '6:30 AM', attendees: 41, capacity: 50, status: 'ACTIVE', type: 'FITNESS', price: 'Free' },
  { id: '10', name: 'Valentine\'s Dinner Special', business: 'Bella Italia Restaurant', city: 'Denver, CO', date: 'Feb 14, 2025', time: '7:00 PM', attendees: 0, capacity: 60, status: 'UPCOMING', type: 'FOOD', price: '$85' },
  { id: '11', name: 'Rooftop Brunch', business: 'Sky Lounge Bar', city: 'Austin, TX', date: 'Nov 24, 2024', time: '11:00 AM', attendees: 75, capacity: 75, status: 'COMPLETED', type: 'FOOD', price: '$40' },
  { id: '12', name: 'Meditation Workshop', business: 'Serenity Yoga Studio', city: 'Miami, FL', date: 'Nov 30, 2024', time: '10:00 AM', attendees: 18, capacity: 20, status: 'COMPLETED', type: 'WELLNESS', price: '$35' },
]

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  SOLD_OUT: 'destructive',
  UPCOMING: 'secondary',
  COMPLETED: 'secondary',
}

const TYPE_COLORS: Record<string, string> = {
  ENTERTAINMENT: 'text-purple-400',
  WELLNESS: 'text-green-400',
  FOOD: 'text-orange-400',
  NIGHTLIFE: 'text-pink-400',
  FITNESS: 'text-blue-400',
}

export default function AdminEventsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = EVENTS.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.business.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    const matchType = typeFilter === 'all' || e.type === typeFilter
    return matchSearch && matchStatus && matchType
  })

  const totalAttendees = EVENTS.reduce((sum, e) => sum + e.attendees, 0)
  const activeCount = EVENTS.filter(e => e.status === 'ACTIVE').length
  const pendingCount = EVENTS.filter(e => e.status === 'PENDING').length
  const completedCount = EVENTS.filter(e => e.status === 'COMPLETED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Events Management</h1>
        <p className="text-gray-400 mt-1">Monitor and manage all events across the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: EVENTS.length, icon: Calendar, color: 'text-primary' },
          { label: 'Active Now', value: activeCount, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Pending Approval', value: pendingCount, icon: Clock, color: 'text-yellow-500' },
          { label: 'Total Attendees', value: totalAttendees, icon: Users, color: 'text-secondary' },
        ].map((s) => (
          <Card key={s.label} className="bg-dark-card border-gray-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{s.label}</p>
                  <p className="text-2xl font-bold text-white">{s.value.toLocaleString()}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-dark-card border-gray-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search events or businesses..."
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-dark-bg border-gray-700"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
                <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ENTERTAINMENT">Entertainment</SelectItem>
                <SelectItem value="WELLNESS">Wellness</SelectItem>
                <SelectItem value="FOOD">Food & Drink</SelectItem>
                <SelectItem value="NIGHTLIFE">Nightlife</SelectItem>
                <SelectItem value="FITNESS">Fitness</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="text-left px-6 py-3 font-medium">Event</th>
                  <th className="text-left px-6 py-3 font-medium">Business</th>
                  <th className="text-left px-6 py-3 font-medium">Date & Time</th>
                  <th className="text-left px-6 py-3 font-medium">Attendees</th>
                  <th className="text-left px-6 py-3 font-medium">Price</th>
                  <th className="text-left px-6 py-3 font-medium">Type</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((event) => {
                  const fillPct = event.capacity > 0 ? Math.round((event.attendees / event.capacity) * 100) : 0
                  return (
                    <tr key={event.id} className="hover:bg-dark-bg/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Ticket className="h-5 w-5 text-primary" />
                          </div>
                          <p className="font-medium text-white">{event.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-200">{event.business}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {event.city}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white">{event.date}</p>
                        <p className="text-xs text-gray-400">{event.time}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white">{event.attendees} / {event.capacity}</p>
                          <div className="w-20 h-1.5 bg-gray-700 rounded-full mt-1">
                            <div
                              className="h-1.5 rounded-full bg-primary"
                              style={{ width: `${fillPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Tag className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-white">{event.price}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium ${TYPE_COLORS[event.type] || 'text-gray-400'}`}>
                          {event.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={STATUS_VARIANTS[event.status]}>
                          {event.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-gray-400">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No events match your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
