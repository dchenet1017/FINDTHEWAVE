import { format, isToday, isTomorrow } from 'date-fns'

export function formatEventWhen(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`
  if (isTomorrow(d)) return `Tomorrow at ${format(d, 'h:mm a')}`
  return `${format(d, 'EEE, MMM d')} at ${format(d, 'h:mm a')}`
}

export function formatTicketPrice(price: number | null | undefined): string {
  if (price == null || price === 0) return 'Free'
  return `$${Number(price).toFixed(2)}`
}
