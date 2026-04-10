import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

type Color = 'blue' | 'green' | 'yellow' | 'purple'

const colorStyles: Record<Color, { ring: string; icon: string; bg: string }> = {
  blue: {
    ring: 'ring-blue-500/20',
    icon: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  green: {
    ring: 'ring-emerald-500/20',
    icon: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  yellow: {
    ring: 'ring-amber-500/20',
    icon: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  purple: {
    ring: 'ring-purple-500/20',
    icon: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
}

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  icon: LucideIcon
  color?: Color
  action?: { label: string; onClick: () => void }
  isLoading?: boolean
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color = 'blue',
  action,
  isLoading,
}: StatCardProps) {
  const styles = colorStyles[color]
  const hasTrend = typeof trend === 'number' && !Number.isNaN(trend)
  const up = (trend ?? 0) >= 0

  return (
    <Card className="border-gray-800 bg-gray-900/40">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-gray-400">{title}</p>
            {isLoading ? (
              <div className="mt-2">
                <Skeleton className="h-8 w-28" />
              </div>
            ) : (
              <p className="mt-2 text-3xl font-bold text-white truncate">{value}</p>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-gray-500 line-clamp-1">{subtitle}</p>
            )}
          </div>

          <div className={cn('h-11 w-11 rounded-xl ring-1 flex items-center justify-center', styles.bg, styles.ring)}>
            <Icon className={cn('h-5 w-5', styles.icon)} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs">
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : hasTrend ? (
              <span className={cn('inline-flex items-center gap-1', up ? 'text-emerald-400' : 'text-red-400')}>
                {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(trend!).toFixed(1)}%
                <span className="text-gray-500">vs last week</span>
              </span>
            ) : (
              <span className="text-gray-500">—</span>
            )}
          </div>

          {action && !isLoading && (
            <Button size="sm" variant="secondary" onClick={action.onClick} className="h-8">
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

