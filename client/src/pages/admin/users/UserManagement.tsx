import { useState } from 'react'
import { Plus, Users as UsersIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { DataTableFilters, type FilterState } from '@/components/ui/DataTableFilters'
import { userColumns } from '@/features/admin/users/columns'
import { useUsers, useBulkUserAction } from '@/hooks/admin/useUsers'
import { type User } from '@/services/admin.service'
import { toast } from 'sonner'

export default function UserManagement() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: '',
    status: '',
  })
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])

  const [page, setPage] = useState(1)

  const { data, isLoading } = useUsers({
    search: filters.search,
    role: filters.role as any,
    status: filters.status as any,
    page,
    limit: 10,
  })

  const bulkAction = useBulkUserAction()

  const handleClearFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: '',
    })
    setPage(1)
  }

  const handleBulkAction = async (action: 'activate' | 'suspend' | 'delete') => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    if (action === 'delete') {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`
      )
      if (!confirmed) return
    }

    try {
      await bulkAction.mutateAsync({
        action,
        userIds: selectedUsers.map((u) => u.id),
      })
      setSelectedUsers([])
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">
            Manage and monitor all platform users
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-800 bg-dark-card p-6">
        <DataTableFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="rounded-lg border border-primary/50 bg-primary/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            <span className="text-white font-medium">
              {selectedUsers.length} user(s) selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('activate')}
              disabled={bulkAction.isPending}
            >
              Activate Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('suspend')}
              disabled={bulkAction.isPending}
            >
              Suspend Selected
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction('delete')}
              disabled={bulkAction.isPending}
            >
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUsers([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="space-y-4">
        <DataTable
          columns={userColumns}
          data={data?.users || []}
          isLoading={isLoading}
          selectable={true}
          onSelectionChange={setSelectedUsers}
          pagination={false}
        />

        {/* Custom Pagination for Server-side */}
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
                <span className="font-medium text-white">{data.total}</span> users
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
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
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

