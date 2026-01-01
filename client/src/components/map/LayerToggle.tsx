import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type LayerItem = {
  key: string
  label: string
  icon?: React.ReactNode
  count?: number
}

interface LayerToggleProps {
  layers: Record<string, boolean>
  items: LayerItem[]
  onToggle: (key: string, value: boolean) => void
  className?: string
  title?: string
}

export function LayerToggle({ layers, items, onToggle, className, title = 'Layers' }: LayerToggleProps) {
  return (
    <div className={cn('rounded-md border border-gray-800 bg-dark-card p-3 space-y-2 text-sm text-gray-200', className)}>
      <div className="text-xs text-gray-400 font-semibold">{title}</div>
      {items.map((item) => (
        <label key={item.key} className="flex items-center gap-2">
          <Checkbox
            checked={Boolean(layers[item.key])}
            onCheckedChange={(checked) => onToggle(item.key, Boolean(checked))}
          />
          {item.icon}
          <span className="flex-1">{item.label}</span>
          {item.count !== undefined && (
            <Badge variant="secondary" className="text-[11px]">
              {item.count}
            </Badge>
          )}
        </label>
      ))}
    </div>
  )
}

