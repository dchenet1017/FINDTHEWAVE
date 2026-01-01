import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from './Button'
import {
  type Table,
} from '@tanstack/react-table'

interface DataTablePaginationProps<T> {
  table: Table<T>
}

export function DataTablePagination<T>({ table }: DataTablePaginationProps<T>) {
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const totalRows = table.getFilteredRowModel().rows.length
  const totalPages = table.getPageCount()
  const startRow = pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-dark-bg">
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-400">
          Showing <span className="font-medium text-white">{startRow}</span> to{' '}
          <span className="font-medium text-white">{endRow}</span> of{' '}
          <span className="font-medium text-white">{totalRows}</span> results
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Rows per page:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value))
            }}
            className="rounded-md border border-gray-700 bg-dark-card px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 5) {
              pageNum = i
            } else if (pageIndex < 3) {
              pageNum = i
            } else if (pageIndex > totalPages - 4) {
              pageNum = totalPages - 5 + i
            } else {
              pageNum = pageIndex - 2 + i
            }

            return (
              <Button
                key={pageNum}
                variant={pageIndex === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => table.setPageIndex(pageNum)}
                className="min-w-[40px]"
              >
                {pageNum + 1}
              </Button>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.setPageIndex(totalPages - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

