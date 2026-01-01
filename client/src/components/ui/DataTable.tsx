import React, { useState, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading?: boolean
  pagination?: boolean
  pageSize?: number
  onRowClick?: (row: T) => void
  selectable?: boolean
  onSelectionChange?: (selected: T[]) => void
  tableRef?: React.MutableRefObject<any>
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  pagination = true,
  pageSize = 10,
  onRowClick,
  selectable = false,
  onSelectionChange,
  tableRef,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: selectable,
    initialState: {
      pagination: {
        pageSize,
      },
    },
    state: {
      sorting,
      rowSelection,
    },
  })

  // Expose table instance via ref if provided
  useEffect(() => {
    if (tableRef) {
      tableRef.current = table
    }
  }, [table, tableRef])

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original)
      onSelectionChange(selectedRows)
    }
  }, [rowSelection, onSelectionChange, table])

  if (isLoading) {
    return <DataTableSkeleton />
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-dark-card p-12 text-center">
        <p className="text-gray-400">No data available</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-dark-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-dark-bg border-b border-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const isSorted = header.column.getIsSorted()

                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider',
                        canSort && 'cursor-pointer select-none hover:bg-gray-800/50',
                        header.id === 'select' && 'w-12'
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="flex flex-col">
                            <ChevronUp
                              className={cn(
                                'h-3 w-3',
                                isSorted === 'asc' ? 'text-primary' : 'text-gray-600'
                              )}
                            />
                            <ChevronDown
                              className={cn(
                                'h-3 w-3 -mt-1',
                                isSorted === 'desc' ? 'text-primary' : 'text-gray-600'
                              )}
                            />
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-800">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'hover:bg-dark-bg/50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DataTableSkeleton() {
  return (
    <div className="rounded-lg border border-gray-800 bg-dark-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-dark-bg border-b border-gray-800">
            <tr>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <th key={i} className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-700 rounded w-24 animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-700 rounded w-full animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


