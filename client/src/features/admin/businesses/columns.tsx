import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/Checkbox'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ChevronDown, ChevronRight, Building2 } from 'lucide-react'
import { type Business } from '@/services/admin.service'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export const businessColumns: ColumnDef<Business>[] = [
  {
    id: 'expand',
    header: () => null,
    cell: ({ row }) => {
      const [isExpanded, setIsExpanded] = useState(false)
      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: 'Business',
    cell: ({ row }) => {
      const business = row.original
      return (
        <div className="flex items-center gap-3">
          {business.images && business.images.length > 0 ? (
            <img
              src={business.images[0]}
              alt={business.name}
              className="h-10 w-10 rounded-md object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-md bg-dark-card flex items-center justify-center">
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-white">{business.name}</p>
            <p className="text-sm text-gray-400 line-clamp-1">
              {business.description}
            </p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'user',
    header: 'Owner',
    cell: ({ row }) => {
      const user = row.original.user
      const fullName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email.split('@')[0]
      const initials = user.firstName?.[0] || user.email[0].toUpperCase()

      return (
        <div className="flex items-center gap-2">
          <Avatar
            src={user.avatar || undefined}
            fallback={initials}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-white">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : 'No Name'}
            </p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.type
      const typeColors: Record<string, string> = {
        BAR: 'bg-primary/10 text-primary',
        RESTAURANT: 'bg-accent/10 text-accent',
        ENTERTAINMENT: 'bg-secondary/10 text-secondary',
        FITNESS: 'bg-success/10 text-success',
        WELLNESS: 'bg-warning/10 text-warning',
        HOTEL: 'bg-danger/10 text-danger',
        OTHER: 'bg-gray-800 text-gray-300',
      }

      return (
        <Badge className={typeColors[type] || ''}>
          {type}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => {
      const business = row.original
      return (
        <div>
          <p className="text-sm text-white">{business.city}, {business.state}</p>
          <p className="text-xs text-gray-400">{business.address}</p>
        </div>
      )
    },
  },
  {
    accessorKey: 'approvalStatus',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.approvalStatus
      const statusConfig = {
        PENDING: { variant: 'warning' as const, label: 'Pending' },
        APPROVED: { variant: 'success' as const, label: 'Approved' },
        REJECTED: { variant: 'destructive' as const, label: 'Rejected' },
      }

      const config = statusConfig[status] || statusConfig.PENDING

      return <Badge variant={config.variant}>{config.label}</Badge>
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Submitted',
    cell: ({ row }) => {
      return (
        <span className="text-sm text-gray-300">
          {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
        </span>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      // Actions will be handled in the parent component
      return null
    },
    enableSorting: false,
  },
]


