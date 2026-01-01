import { useState } from 'react'
import { MoreVertical, Eye, Edit, Key, Ban, CheckCircle, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { Button } from '@/components/ui/Button'
import { type User } from '@/services/admin.service'
import { useDeleteUser, useSuspendUser, useActivateUser } from '@/hooks/admin/useUsers'
import { toast } from 'sonner'

interface UserActionsProps {
  user: User
  onView?: (user: User) => void
  onEdit?: (user: User) => void
}

export function UserActions({ user, onView, onEdit }: UserActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const deleteUser = useDeleteUser()
  const suspendUser = useSuspendUser()
  const activateUser = useActivateUser()

  const handleDelete = async () => {
    try {
      await deleteUser.mutateAsync(user.id)
      setShowDeleteConfirm(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleSuspend = async () => {
    try {
      await suspendUser.mutateAsync(user.id)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleActivate = async () => {
    try {
      await activateUser.mutateAsync(user.id)
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <div className="flex items-center justify-end">
      {showDeleteConfirm ? (
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteUser.isPending}
          >
            Confirm
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
        >
          {onView && (
            <DropdownMenuItem
              icon={<Eye className="h-4 w-4" />}
              onClick={() => onView(user)}
            >
              View Profile
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem
              icon={<Edit className="h-4 w-4" />}
              onClick={() => onEdit(user)}
            >
              Edit User
            </DropdownMenuItem>
          )}
          <DropdownMenuItem icon={<Key className="h-4 w-4" />}>
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.isActive ? (
            <DropdownMenuItem
              icon={<Ban className="h-4 w-4" />}
              onClick={handleSuspend}
              disabled={suspendUser.isPending}
            >
              Suspend User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              icon={<CheckCircle className="h-4 w-4" />}
              onClick={handleActivate}
              disabled={activateUser.isPending}
            >
              Activate User
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => setShowDeleteConfirm(true)}
            className="text-danger hover:bg-danger/10"
          >
            Delete User
          </DropdownMenuItem>
        </DropdownMenu>
      )}
    </div>
  )
}

