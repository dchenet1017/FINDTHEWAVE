import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  link?: string
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  link,
  onClick,
}: StatCardProps) {
  const content = (
    <Card className={cn('bg-dark-card border-gray-800 transition-all hover:border-gray-700', onClick && 'cursor-pointer')} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={cn('rounded-full p-3', iconBg)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </CardHeader>
    </Card>
  )

  if (link) {
    return (
      <a href={link} className="block">
        {content}
      </a>
    )
  }

  return content
}

