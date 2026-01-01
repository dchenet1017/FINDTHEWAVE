import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: string | number
  change?: number // percentage
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="rounded-lg border border-gray-800 bg-dark-card p-6 transition-all hover:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <div className="mt-3 flex items-center gap-1">
              <TrendIcon
                className={cn(
                  'h-4 w-4',
                  isPositive ? 'text-success' : 'text-danger'
                )}
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive ? 'text-success' : 'text-danger'
                )}
              >
                {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500 ml-1">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={cn('rounded-full p-3', iconBg)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>
    </div>
  )
}

