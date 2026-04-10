export const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
] as const

export const formatBookingDateTimeISO = (date: Date, time: string): string => {
  const [hours, minutes] = time.split(':')
  const dateTime = new Date(date)
  dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
  return dateTime.toISOString()
}

export const calculateBookingPrice = (
  hourlyRate: number,
  durationHours: number
): { subtotal: number; serviceFee: number; total: number } => {
  const subtotal = hourlyRate * durationHours
  const serviceFee = Math.round(subtotal * 0.15 * 100) / 100
  const total = Math.round((subtotal + serviceFee) * 100) / 100
  return { subtotal, serviceFee, total }
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export const getDurationOptions = (): { value: number; label: string }[] => [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 3, label: '3 hours' },
  { value: 4, label: '4 hours' },
]

export const formatTimeRange = (start: string, durationHours: number): string => {
  const [h, m] = start.split(':').map((n) => parseInt(n, 10))
  const startMinutes = h * 60 + (m || 0)
  const endMinutes = startMinutes + durationHours * 60
  const toLabel = (minutes: number) => {
    const hh24 = Math.floor(minutes / 60) % 24
    const mm = minutes % 60
    const period = hh24 >= 12 ? 'PM' : 'AM'
    const hh12 = ((hh24 + 11) % 12) + 1
    return `${hh12}:${String(mm).padStart(2, '0')} ${period}`
  }
  return `${toLabel(startMinutes)} - ${toLabel(endMinutes)}`
}

