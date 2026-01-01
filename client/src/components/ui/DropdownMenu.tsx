import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

type Align = 'left' | 'right'

export interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: Align
}

// Wrapper to maintain existing trigger-based API
export function DropdownMenu({ trigger, children, align = 'right' }: DropdownMenuProps) {
  const alignMap: Record<Align, 'start' | 'end'> = {
    left: 'start',
    right: 'end',
  }
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          sideOffset={6}
          align={alignMap[align]}
          className={cn(
            'z-50 min-w-[200px] overflow-hidden rounded-md border border-gray-800 bg-dark-card p-1 text-gray-100 shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0'
          )}
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}

export interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  icon?: React.ReactNode
}

export function DropdownMenuItem({ children, icon, className, ...props }: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none transition-colors',
        'focus:bg-gray-800 focus:text-white',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-gray-200',
        className
      )}
      {...props}
    >
      {icon && <span className="text-gray-400">{icon}</span>}
      {children}
    </DropdownMenuPrimitive.Item>
  )
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn('my-1 h-px bg-gray-800', className)}
      {...props}
    />
  )
}

