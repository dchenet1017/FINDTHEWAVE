import { useState } from 'react'
import {
  Gift, Search, CheckCircle, Clock, XCircle,
  Tag, Percent, Calendar, Building2, Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'

const PROMOTIONS = [
  { id: '1', name: 'Happy Hour Special', business: 'The Downtown Brewery', type: 'DISCOUNT', discount: '20% off all drinks', validFrom: 'Dec 1, 2024', validTo: 'Dec 31, 2024', uses: 142, status: 'ACTIVE' },
  { id: '2', name: 'First Class Free', business: 'Serenity Yoga Studio', type: 'FREE_TRIAL', discount: 'First yoga class free', validFrom: 'Nov 1, 2024', validTo: 'Jan 31, 2025', uses: 89, status: 'ACTIVE' },
  { id: '3', name: 'Lunch Deal', business: 'Bella Italia Restaurant', type: 'BOGO', discount: 'Buy 1 pasta, get 1 half off', validFrom: 'Dec 1, 2024', validTo: 'Dec 15, 2024', uses: 67, status: 'EXPIRED' },
  { id: '4', name: 'New Year Membership', business: 'PowerFit Gym', type: 'DISCOUNT', discount: '30% off annual membership', validFrom: 'Jan 1, 2025', validTo: 'Jan 31, 2025', uses: 0, status: 'UPCOMING' },
  { id: '5', name: 'Weekend Brunch Combo', business: 'Sky Lounge Bar', type: 'BUNDLE', discount: 'Brunch + Cocktail for $45', validFrom: 'Dec 1, 2024', validTo: 'Feb 28, 2025', uses: 210, status: 'ACTIVE' },
  { id: '6', name: 'Hotel Stay + Spa', business: 'The Grand Hotel', type: 'BUNDLE', discount: 'Stay 2 nights, get spa access free', validFrom: 'Dec 15, 2024', validTo: 'Jan 15, 2025', uses: 34, status: 'ACTIVE' },
  { id: '7', name: 'Comedy Night 2-for-1', business: 'Laugh Factory Comedy Club', type: 'BOGO', discount: '2 tickets for the price of 1', validFrom: 'Dec 10, 2024', validTo: 'Dec 25, 2024', uses: 0, status: 'PENDING' },
  { id: '8', name: 'Morning Coffee Boost', business: 'Green Leaf Cafe', type: 'DISCOUNT', discount: '15% off before 9 AM', validFrom: 'Dec 1, 2024', validTo: 'Mar 31, 2025', uses: 312, status: 'ACTIVE' },
  { id: '9', name: 'VIP Bottle Service', business: 'Neon Nights Club', type: 'BUNDLE', discount: 'Table + 2 bottles for $250', validFrom: 'Dec 20, 2024', validTo: 'Jan 1, 2025', uses: 0, status: 'PENDING' },
  { id: '10', name: 'Spa Sunday Special', business: 'Zen Spa & Wellness', type: 'DISCOUNT', discount: '25% off all treatments on Sunday', validFrom: 'Nov 1, 2024', validTo: 'Feb 28, 2025', uses: 156, status: 'ACTIVE' },
  { id: '11', name: 'Summer Body Blast', business: 'CrossFit Central', type: 'FREE_TRIAL', discount: '1 week free trial', validFrom: 'Nov 1, 2024', validTo: 'Nov 30, 2024', uses: 43, status: 'EXPIRED' },
  { id: '12', name: 'Valentine\'s Package', business: 'Bella Italia Restaurant', type: 'BUNDLE', discount: 'Dinner for 2 with wine + dessert', validFrom: 'Feb 10, 2025', validTo: 'Feb 15, 2025', uses: 0, status: 'UPCOMING' },
]

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  EXPIRED: 'destructive',
  UPCOMING: 'secondary',
}

const TYPE_COLORS: Record<string, string> = {
  DISCOUNT: 'bg-blue-500/10 text-blue-400',
  BOGO: 'bg-purple-500/10 text-purple-400',
  BUNDLE: 'bg-orange-500/10 text-orange-400',
  FREE_TRIAL: 'bg-green-500/10 text-green-400',
}

export default function PromotionsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = PROMOTIONS.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.business.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchType = typeFilter === 'all' || p.type === typeFilter
    return matchSearch && matchStatus && matchType
  })

  const totalUses = PROMOTIONS.reduce((sum, p) => sum + p.uses, 0)
  const activeCount = PROMOTIONS.filter(p => p.status === 'ACTIVE').length
  const pendingCount = PROMOTIONS.filter(p => p.status === 'PENDING').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Promotions</h1>
        <p className="text-gray-400 mt-1">Manage and moderate all promotions across the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Promotions', value: PROMOTIONS.length, icon: Gift, color: 'text-primary' },
          { label: 'Currently Active', value: activeCount, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Pending Approval', value: pendingCount, icon: Clock, color: 'text-yellow-500' },
          { label: 'Total Redemptions', value: totalUses.toLocaleString(), icon: Percent, color: 'text-secondary' },
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
                placeholder="Search promotions or businesses..."
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
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DISCOUNT">Discount</SelectItem>
                <SelectItem value="BOGO">BOGO</SelectItem>
                <SelectItem value="BUNDLE">Bundle</SelectItem>
                <SelectItem value="FREE_TRIAL">Free Trial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">
            {filtered.length} promotion{filtered.length !== 1 ? 's' : ''} found
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="text-left px-6 py-3 font-medium">Promotion</th>
                  <th className="text-left px-6 py-3 font-medium">Business</th>
                  <th className="text-left px-6 py-3 font-medium">Offer</th>
                  <th className="text-left px-6 py-3 font-medium">Type</th>
                  <th className="text-left px-6 py-3 font-medium">Valid Period</th>
                  <th className="text-left px-6 py-3 font-medium">Uses</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((promo) => (
                  <tr key={promo.id} className="hover:bg-dark-bg/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Tag className="h-5 w-5 text-primary" />
                        </div>
                        <p className="font-medium text-white">{promo.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        {promo.business}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 max-w-[180px] truncate">{promo.discount}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[promo.type]}`}>
                        {promo.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{promo.validFrom} – {promo.validTo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{promo.uses.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_VARIANTS[promo.status]}>
                        {promo.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-gray-400">
                <Gift className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No promotions match your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
