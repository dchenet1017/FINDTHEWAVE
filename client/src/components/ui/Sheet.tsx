import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: 'left' | 'right' | 'top' | 'bottom'
  children: React.ReactNode
}

export function Sheet({
  open,
  onOpenChange,
  side = 'left',
  children,
}: SheetProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const sideClasses = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full',
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      {/* Sheet */}
      <div
        className={cn(
          'fixed z-50 bg-dark-card border-r border-gray-700 shadow-lg transition-transform',
          sideClasses[side],
          side === 'left' || side === 'right' ? 'w-80' : 'h-80'
        )}
      >
        {children}
      </div>
    </>
  )
}

export interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
}

export function SheetHeader({
  className,
  children,
  onClose,
  ...props
}: SheetHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between border-b border-gray-700 p-4', className)}
      {...props}
    >
      <div>{children}</div>
      {onClose && (
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SheetContent({
  className,
  children,
  ...props
}: SheetContentProps) {
  return (
    <div className={cn('p-4 overflow-y-auto h-full', className)} {...props}>
      {children}
    </div>
  )
}

