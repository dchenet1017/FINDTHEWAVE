import type { EventCategory } from '@/types/event'

export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  MUSIC: '#a855f7',
  SPORTS: '#3b82f6',
  FOOD_DRINK: '#f97316',
  WELLNESS: '#10b981',
  NETWORKING: '#06b6d4',
  EDUCATION: '#6366f1',
  ART: '#ec4899',
  NIGHTLIFE: '#8b5cf6',
  COMMUNITY: '#14b8a6',
  OTHER: '#6b7280',
}

export const EVENT_CATEGORY_ICONS: Record<EventCategory, string> = {
  MUSIC: '🎵',
  SPORTS: '⚽',
  FOOD_DRINK: '🍽️',
  WELLNESS: '🧘',
  NETWORKING: '🤝',
  EDUCATION: '📚',
  ART: '🎨',
  NIGHTLIFE: '🌙',
  COMMUNITY: '👥',
  OTHER: '📌',
}

export function categoryColor(category: EventCategory): string {
  return EVENT_CATEGORY_COLORS[category] ?? EVENT_CATEGORY_COLORS.OTHER
}

export function isEventHappeningToday(startIso: string, endIso: string): boolean {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const now = new Date()
  return now >= start && now <= end
}

export function isEventStartingToday(startIso: string): boolean {
  const start = new Date(startIso)
  const now = new Date()
  return (
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate()
  )
}
