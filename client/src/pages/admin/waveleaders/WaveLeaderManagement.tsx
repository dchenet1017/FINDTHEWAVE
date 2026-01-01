import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Star, DollarSign, Calendar, CheckCircle, XCircle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { useNavigate } from 'react-router-dom'
import { adminService } from '@/services/admin.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'

interface WaveLeader {
  id: string
  displayName: string
  specialty: string
  rating: number
  totalBookings: number
  totalEarnings: number
  isVerified: boolean
  isAvailable: boolean
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    avatar?: string
  }
  createdAt: string
}

const waveLeaderColumns: ColumnDef<WaveLeader>[] = [
  {
    accessorKey: 'displayName',
    header: 'WaveLeader',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar 
          src={row.original.user.avatar} 
          alt={row.original.displayName}
          fallback={row.original.displayName.charAt(0)}
        />
        <div>
          <p className="font-medium text-white">{row.original.displayName}</p>
          <p className="text-sm text-gray-400">{row.original.user.email}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'specialty',
    header: 'Specialty',
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.specialty}</Badge>
    ),
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 text-yellow-500 fill-current" />
        <span className="text-white">{row.original.rating.toFixed(1)}</span>
        <span className="text-gray-400 text-sm">({row.original.totalBookings})</span>
      </div>
    ),
  },
  {
    accessorKey: 'totalEarnings',
    header: 'Earnings',
    cell: ({ row }) => (
      <span className="text-white font-medium">
        {formatCurrency(row.original.totalEarnings)}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const { isVerified, isAvailable } = row.original
      return (
        <div className="flex items-center gap-2">
          {isVerified ? (
            <Badge variant="success">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="warning">Pending</Badge>
          )}
          {!isAvailable && (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Suspended
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => (
      <span className="text-gray-400">{formatDate(row.original.createdAt)}</span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const navigate = useNavigate()
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/admin/waveleaders/${row.original.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      )
    },
  },
]

export default function WaveLeaderManagement() {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'waveleaders', activeTab, search, specialty, page],
    queryFn: () => adminService.getWaveLeaders({
      status: activeTab,
      search,
      specialty: specialty === 'all' ? undefined : specialty,
      page,
      limit: 10,
    }),
  })

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleSpecialtyChange = (value: string) => {
    setSpecialty(value)
    setPage(1)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">WaveLeader Management</h1>
          <p className="text-gray-400 mt-1">
            Verify and manage WaveLeader accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="py-1 px-3">
            <CheckCircle className="h-4 w-4 mr-1" />
            {data?.stats?.verified || 0} Verified
          </Badge>
          <Badge variant="warning" className="py-1 px-3">
            <Calendar className="h-4 w-4 mr-1" />
            {data?.stats?.pending || 0} Pending
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-dark-card border-gray-800">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending Verification</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="mt-6 rounded-lg border border-gray-800 bg-dark-card p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={specialty} onValueChange={handleSpecialtyChange}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                <SelectItem value="outdoor">Outdoor Activities</SelectItem>
                <SelectItem value="nightlife">Nightlife</SelectItem>
                <SelectItem value="food">Food & Dining</SelectItem>
                <SelectItem value="wellness">Wellness</SelectItem>
                <SelectItem value="culture">Arts & Culture</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          <DataTable
            columns={waveLeaderColumns}
            data={data?.waveLeaders || []}
            isLoading={isLoading}
            pagination={false}
          />

          {/* Custom Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-dark-bg rounded-b-lg mt-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-400">
                  Showing <span className="font-medium text-white">
                    {(page - 1) * 10 + 1}
                  </span> to{' '}
                  <span className="font-medium text-white">
                    {Math.min(page * 10, data.total)}
                  </span> of{' '}
                  <span className="font-medium text-white">{data.total}</span> WaveLeaders
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    let pageNum: number
                    if (data.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page < 3) {
                      pageNum = i + 1
                    } else if (page > data.totalPages - 2) {
                      pageNum = data.totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
