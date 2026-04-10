import {
  startOfDay,
  endOfDay,
  addDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  nextSaturday,
  isSaturday,
  isSunday,
} from 'date-fns'

export function rangeForDatePreset(
  preset: 'all' | 'today' | 'tomorrow' | 'this_week' | 'this_weekend' | 'next_week' | 'custom',
  customFrom?: Date,
  customTo?: Date
): { from?: string; to?: string } {
  const now = new Date()
  if (preset === 'custom' && customFrom && customTo) {
    return { from: customFrom.toISOString(), to: customTo.toISOString() }
  }
  if (preset === 'all') return {}

  if (preset === 'today') {
    return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() }
  }
  if (preset === 'tomorrow') {
    const t = addDays(now, 1)
    return { from: startOfDay(t).toISOString(), to: endOfDay(t).toISOString() }
  }
  if (preset === 'this_week') {
    return {
      from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
      to: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
    }
  }
  if (preset === 'this_weekend') {
    let sat: Date
    if (isSaturday(now)) sat = startOfDay(now)
    else if (isSunday(now)) sat = startOfDay(addDays(now, -1))
    else sat = startOfDay(nextSaturday(now))
    const sunEnd = endOfDay(addDays(sat, 1))
    return { from: sat.toISOString(), to: sunEnd.toISOString() }
  }
  if (preset === 'next_week') {
    const nextMon = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 })
    return {
      from: nextMon.toISOString(),
      to: endOfWeek(nextMon, { weekStartsOn: 1 }).toISOString(),
    }
  }
  return {}
}
