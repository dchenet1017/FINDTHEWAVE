import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatPercentage(value: number, digits = 1) {
  if (Number.isNaN(value)) return '0%'
  return `${value.toFixed(digits)}%`
}

export function formatDistance(miles: number) {
  if (miles == null || Number.isNaN(Number(miles))) return ''
  const feet = miles * 5280
  if (feet < 1000) {
    return `${Math.round(feet)} ft`
  }
  return `${Number(miles).toFixed(1)} mi`
}

export function getInitials(name?: string | null, fallback?: string) {
  if (!name) return fallback || ''
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || fallback || ''
  return (parts[0][0] || '') + (parts[parts.length - 1][0] || '')
}

