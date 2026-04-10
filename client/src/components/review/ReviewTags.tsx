import {
  Briefcase,
  Clock,
  Smile,
  BookOpen,
  Lightbulb,
  MessageCircle,
  DollarSign,
  Repeat,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const REVIEW_TAGS = [
  { id: 'professional', label: 'Professional', icon: Briefcase },
  { id: 'punctual', label: 'Punctual', icon: Clock },
  { id: 'friendly', label: 'Friendly', icon: Smile },
  { id: 'knowledgeable', label: 'Knowledgeable', icon: BookOpen },
  { id: 'creative', label: 'Creative', icon: Lightbulb },
  { id: 'responsive', label: 'Responsive', icon: MessageCircle },
  { id: 'value', label: 'Great Value', icon: DollarSign },
  { id: 'rebook', label: 'Would Book Again', icon: Repeat },
] as const

export type ReviewTagId = (typeof REVIEW_TAGS)[number]['id']

export interface ReviewTagsProps {
  selected: string[]
  onChange: (next: string[]) => void
}

export function ReviewTags({ selected, onChange }: ReviewTagsProps) {
  const toggle = (tagId: string) => {
    if (selected.includes(tagId)) {
      onChange(selected.filter((id) => id !== tagId))
    } else {
      onChange([...selected, tagId])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {REVIEW_TAGS.map((tag) => {
        const Icon = tag.icon
        const isSelected = selected.includes(tag.id)
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full border transition-colors',
              isSelected
                ? 'bg-primary border-primary text-white'
                : 'border-gray-700 text-gray-300 hover:border-gray-500'
            )}
          >
            <Icon size={16} />
            <span className="text-sm">{tag.label}</span>
          </button>
        )
      })}
    </div>
  )
}

