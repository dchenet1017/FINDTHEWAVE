import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { type Business } from '@/services/admin.service'
import { useApproveBusiness, useRejectBusiness } from '@/hooks/admin/useBusinesses'
import { cn } from '@/lib/utils'

interface BusinessApprovalModalProps {
  business: Business
  isOpen: boolean
  onClose: () => void
  action: 'approve' | 'reject'
}

export function BusinessApprovalModal({
  business,
  isOpen,
  onClose,
  action,
}: BusinessApprovalModalProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const approveBusiness = useApproveBusiness()
  const rejectBusiness = useRejectBusiness()

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (action === 'approve') {
      await approveBusiness.mutateAsync({
        id: business.id,
        notes: notes || undefined,
      })
    } else {
      if (!reason.trim() || reason.length < 10) {
        return
      }
      await rejectBusiness.mutateAsync({
        id: business.id,
        reason,
        notes: notes || undefined,
      })
    }
    onClose()
    setReason('')
    setNotes('')
  }

  const isLoading = approveBusiness.isPending || rejectBusiness.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-md rounded-lg border border-gray-800 bg-dark-card p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {action === 'approve' ? 'Approve Business' : 'Reject Business'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Business Summary */}
        <div className="mb-6 rounded-lg border border-gray-800 bg-dark-bg p-4">
          <h3 className="font-medium text-white mb-2">{business.name}</h3>
          <p className="text-sm text-gray-400 line-clamp-2">
            {business.description}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {business.city}, {business.state}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{business.type}</span>
          </div>
        </div>

        {/* Rejection Reason (only for reject) */}
        {action === 'reject' && (
          <div className="mb-4">
            <Label htmlFor="reason" className="text-white">
              Rejection Reason <span className="text-danger">*</span>
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for rejection (minimum 10 characters)"
              className="mt-2 bg-dark-bg border-gray-700"
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              {reason.length}/10 characters minimum
            </p>
          </div>
        )}

        {/* Notes (optional) */}
        <div className="mb-6">
          <Label htmlFor="notes" className="text-white">
            Notes (Optional)
          </Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes or comments..."
            rows={3}
            className="mt-2 w-full rounded-md border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={action === 'approve' ? 'default' : 'destructive'}
            onClick={handleSubmit}
            disabled={
              isLoading ||
              (action === 'reject' && (!reason.trim() || reason.length < 10))
            }
          >
            {isLoading ? (
              'Processing...'
            ) : action === 'approve' ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Business
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Reject Business
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}


