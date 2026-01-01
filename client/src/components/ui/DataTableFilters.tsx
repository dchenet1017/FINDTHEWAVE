import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Input } from './Input'
import { Button } from './Button'
import { Badge } from './Badge'
import { cn } from '@/lib/utils'

export interface FilterState {
  search: string
  role: 'USER' | 'WAVELEADER' | 'BUSINESS' | 'ADMIN' | ''
  status: 'active' | 'inactive' | 'unverified' | ''
  startDate?: string
  endDate?: string
}

interface DataTableFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClearFilters: () => void
}

export function DataTableFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: DataTableFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchValue })
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue])

  const hasActiveFilters =
    filters.search ||
    filters.role ||
    filters.status ||
    filters.startDate ||
    filters.endDate

  const activeFilterCount = [
    filters.search,
    filters.role,
    filters.status,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-dark-bg border-gray-700"
          />
        </div>

        {/* Role Filter */}
        <div className="w-full md:w-48">
          <select
            value={filters.role}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                role: e.target.value as FilterState['role'],
              })
            }
            className="w-full rounded-md border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="WAVELEADER">WaveLeader</option>
            <option value="BUSINESS">Business</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={filters.status}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status: e.target.value as FilterState['status'],
              })
            }
            className="w-full rounded-md border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, startDate: e.target.value })
            }
            className="w-full rounded-md border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, endDate: e.target.value })
            }
            className="w-full rounded-md border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400">Active filters:</span>
          {filters.search && (
            <Badge variant="outline" className="gap-1">
              Search: {filters.search}
              <button
                onClick={() => {
                  setSearchValue('')
                  onFiltersChange({ ...filters, search: '' })
                }}
                className="ml-1 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.role && (
            <Badge variant="outline" className="gap-1">
              Role: {filters.role}
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, role: '' })
                }
                className="ml-1 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="outline" className="gap-1">
              Status: {filters.status}
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, status: '' })
                }
                className="ml-1 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.startDate || filters.endDate) && (
            <Badge variant="outline" className="gap-1">
              Date range
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, startDate: '', endDate: '' })
                }
                className="ml-1 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-400 hover:text-white"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

