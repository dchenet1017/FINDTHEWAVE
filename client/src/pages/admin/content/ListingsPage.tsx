import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Search, Eye, CheckCircle, XCircle, MoreHorizontal,
  MapPin, Star, TrendingUp, Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'

const LISTINGS = [
  { id: '1', name: 'The Downtown Brewery', type: 'BAR', city: 'Austin', state: 'TX', status: 'APPROVED', owner: 'Alex Johnson', checkIns: 247, rating: 4.8, createdAt: 'Jan 15, 2024' },
  { id: '2', name: 'Sky Lounge Bar', type: 'BAR', city: 'Austin', state: 'TX', status: 'APPROVED', owner: 'Priya Patel', checkIns: 312, rating: 4.6, createdAt: 'Jan 20, 2024' },
  { id: '3', name: 'Bella Italia Restaurant', type: 'RESTAURANT', city: 'Denver', state: 'CO', status: 'APPROVED', owner: 'Marco Rossi', checkIns: 189, rating: 4.9, createdAt: 'Feb 3, 2024' },
  { id: '4', name: 'Serenity Yoga Studio', type: 'WELLNESS', city: 'Miami', state: 'FL', status: 'APPROVED', owner: 'Sarah Chen', checkIns: 134, rating: 4.7, createdAt: 'Feb 12, 2024' },
  { id: '5', name: 'PowerFit Gym', type: 'FITNESS', city: 'Chicago', state: 'IL', status: 'APPROVED', owner: 'Mike Okafor', checkIns: 401, rating: 4.5, createdAt: 'Mar 1, 2024' },
  { id: '6', name: 'The Grand Hotel', type: 'HOTEL', city: 'New York', state: 'NY', status: 'APPROVED', owner: 'Emma Davis', checkIns: 98, rating: 4.4, createdAt: 'Mar 18, 2024' },
  { id: '7', name: 'Laugh Factory Comedy Club', type: 'ENTERTAINMENT', city: 'Los Angeles', state: 'CA', status: 'PENDING', owner: 'Tom Nguyen', checkIns: 0, rating: 0, createdAt: 'Apr 2, 2024' },
  { id: '8', name: 'Green Leaf Cafe', type: 'CAFE', city: 'Portland', state: 'OR', status: 'APPROVED', owner: 'Lily Park', checkIns: 223, rating: 4.6, createdAt: 'Apr 10, 2024' },
  { id: '9', name: 'Neon Nights Club', type: 'NIGHTCLUB', city: 'Las Vegas', state: 'NV', status: 'PENDING', owner: 'DJ Carlos', checkIns: 0, rating: 0, createdAt: 'Apr 22, 2024' },
  { id: '10', name: 'Zen Spa & Wellness', type: 'WELLNESS', city: 'San Francisco', state: 'CA', status: 'APPROVED', owner: 'Mei Wang', checkIns: 176, rating: 4.9, createdAt: 'May 5, 2024' },
  { id: '11', name: 'Harbor View Seafood', type: 'RESTAURANT', city: 'Seattle', state: 'WA', status: 'REJECTED', owner: 'James O\'Brien', checkIns: 0, rating: 0, createdAt: 'May 14, 2024' },
  { id: '12', name: 'CrossFit Central', type: 'FITNESS', city: 'Phoenix', state: 'AZ', status: 'APPROVED', owner: 'Diana Martinez', checkIns: 289, rating: 4.3, createdAt: 'May 28, 2024' },
]

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'destructive'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'destructive',
}

const TYPE_COLORS: Record<string, string> = {
  BAR: 'text-purple-400',
  RESTAURANT: 'text-orange-400',
  WELLNESS: 'text-green-400',
  FITNESS: 'text-blue-400',
  HOTEL: 'text-yellow-400',
  ENTERTAINMENT: 'text-pink-400',
  CAFE: 'text-amber-400',
  NIGHTCLUB: 'text-red-400',
}

export default function ListingsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = LISTINGS.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.owner.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    const matchType = typeFilter === 'all' || l.type === typeFilter
    return matchSearch && matchStatus && matchType
  })

  const stats = {
    total: LISTINGS.length,
    approved: LISTINGS.filter(l => l.status === 'APPROVED').length,
    pending: LISTINGS.filter(l => l.status === 'PENDING').length,
    rejected: LISTINGS.filter(l => l.status === 'REJECTED').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Business Listings</h1>
        <p className="text-gray-400 mt-1">Manage and moderate all business listings on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Listings', value: stats.total, icon: Building2, color: 'text-primary' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-yellow-500' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-500' },
        ].map((s) => (
          <Card key={s.label} className="bg-dark-card border-gray-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{s.label}</p>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
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
                placeholder="Search by name, owner or city..."
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
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="BAR">Bar</SelectItem>
                <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                <SelectItem value="WELLNESS">Wellness</SelectItem>
                <SelectItem value="FITNESS">Fitness</SelectItem>
                <SelectItem value="HOTEL">Hotel</SelectItem>
                <SelectItem value="ENTERTAINMENT">Entertainment</SelectItem>
                <SelectItem value="CAFE">Cafe</SelectItem>
                <SelectItem value="NIGHTCLUB">Nightclub</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">
            {filtered.length} listing{filtered.length !== 1 ? 's' : ''} found
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="text-left px-6 py-3 font-medium">Business</th>
                  <th className="text-left px-6 py-3 font-medium">Type</th>
                  <th className="text-left px-6 py-3 font-medium">Location</th>
                  <th className="text-left px-6 py-3 font-medium">Rating</th>
                  <th className="text-left px-6 py-3 font-medium">Check-ins</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Added</th>
                  <th className="text-left px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((listing) => (
                  <tr key={listing.id} className="hover:bg-dark-bg/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{listing.name}</p>
                          <p className="text-xs text-gray-400">{listing.owner}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium text-xs ${TYPE_COLORS[listing.type] || 'text-gray-400'}`}>
                        {listing.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-300">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {listing.city}, {listing.state}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {listing.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-white">{listing.rating}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-white">
                        <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                        {listing.checkIns}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_VARIANTS[listing.status]}>
                        {listing.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{listing.createdAt}</td>
                    <td className="px-6 py-4">
                      <Link to={`/admin/businesses/${listing.id}`}>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-gray-400">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No listings match your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
