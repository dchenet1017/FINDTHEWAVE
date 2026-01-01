import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { DataTableFilters, type FilterState } from '@/components/ui/DataTableFilters'
import { businessColumns } from '@/features/admin/businesses/columns'
import { useBusinesses } from '@/hooks/admin/useBusinesses'
import { type Business } from '@/services/admin.service'
import { BusinessApprovalModal } from '@/features/admin/businesses/BusinessApprovalModal'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type TabType = 'all' | 'pending' | 'approved' | 'rejected'

export default function BusinessManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: '',
    status: '',
  })
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null)
  const [page, setPage] = useState(1)

  // Map tab to status filter
  const statusFilter = activeTab === 'all' ? '' : activeTab.toUpperCase()

  const { data, isLoading } = useBusinesses({
    search: filters.search,
    status: statusFilter as any,
    page,
    limit: 10,
  })

  const handleClearFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: '',
    })
    setPage(1)
  }

  const tabs = [
    { id: 'all' as TabType, label: 'All', count: data?.total },
    {
      id: 'pending' as TabType,
      label: 'Pending',
      count: data?.businesses.filter((b) => b.approvalStatus === 'PENDING').length,
    },
    {
      id: 'approved' as TabType,
      label: 'Approved',
      count: data?.businesses.filter((b) => b.approvalStatus === 'APPROVED').length,
    },
    {
      id: 'rejected' as TabType,
      label: 'Rejected',
      count: data?.businesses.filter((b) => b.approvalStatus === 'REJECTED').length,
    },
  ]

  // Add actions to columns
  const columnsWithActions = [
    ...businessColumns,
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => {
        const business = row.original as Business
        return (
          <div className="flex items-center gap-2">
            <Link to={`/admin/businesses/${business.id}`}>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </Link>
            {business.approvalStatus === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBusiness(business)
                    setApprovalAction('approve')
                  }}
                  className="text-success border-success/50 hover:bg-success/10"
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBusiness(business)
                    setApprovalAction('reject')
                  }}
                  className="text-danger border-danger/50 hover:bg-danger/10"
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Business Management</h1>
          <p className="text-gray-400 mt-1">
            Review and manage business registrations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setPage(1)
            }}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <Badge variant="outline" className="ml-2">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-800 bg-dark-card p-6">
        <DataTableFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Data Table */}
      <div className="space-y-4">
        <DataTable
          columns={columnsWithActions as any}
          data={data?.businesses || []}
          isLoading={isLoading}
          pagination={false}
        />

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-dark-bg rounded-b-lg">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-400">
                Showing <span className="font-medium text-white">
                  {(page - 1) * 10 + 1}
                </span> to{' '}
                <span className="font-medium text-white">
                  {Math.min(page * 10, data.total)}
                </span> of{' '}
                <span className="font-medium text-white">{data.total}</span> businesses
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
      </div>

      {/* Approval Modal */}
      {selectedBusiness && approvalAction && (
        <BusinessApprovalModal
          business={selectedBusiness}
          isOpen={!!selectedBusiness}
          onClose={() => {
            setSelectedBusiness(null)
            setApprovalAction(null)
          }}
          action={approvalAction}
        />
      )}
    </div>
  )
}


