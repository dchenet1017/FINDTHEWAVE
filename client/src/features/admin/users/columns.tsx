import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/Checkbox'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { UserActions } from './UserActions'
import { type User } from '@/services/admin.service'

export const userColumns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'User',
    cell: ({ row }) => {
      const user = row.original
      const fullName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email.split('@')[0]
      const initials = user.firstName?.[0] || user.email[0].toUpperCase()

      return (
        <div className="flex items-center gap-3">
          <Avatar
            src={user.avatar || undefined}
            fallback={initials}
            size="sm"
          />
          <div>
            <p className="font-medium text-white">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : 'No Name'}
            </p>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.original.role
      const roleColors = {
        USER: 'bg-primary/10 text-primary',
        WAVELEADER: 'bg-secondary/10 text-secondary',
        BUSINESS: 'bg-accent/10 text-accent',
        ADMIN: 'bg-danger/10 text-danger',
      }

      return (
        <Badge className={roleColors[role] || ''}>
          {role}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const user = row.original
      if (!user.isActive) {
        return <Badge variant="destructive">Inactive</Badge>
      }
      if (!user.isVerified) {
        return <Badge variant="warning">Unverified</Badge>
      }
      return <Badge variant="success">Active</Badge>
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => {
      return (
        <span className="text-sm text-gray-300">
          {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
        </span>
      )
    },
  },
  {
    accessorKey: 'lastLogin',
    header: 'Last Active',
    cell: ({ row }) => {
      const lastLogin = row.original.lastLogin
      if (!lastLogin) {
        return <span className="text-sm text-gray-500">Never</span>
      }
      return (
        <span className="text-sm text-gray-300">
          {format(new Date(lastLogin), 'MMM dd, yyyy')}
        </span>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <UserActions user={row.original} />,
    enableSorting: false,
  },
]

