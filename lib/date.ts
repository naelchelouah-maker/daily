import type { DayOfWeek } from './types'

const DAY_KEYS: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export function getDayKey(date: Date): DayOfWeek {
  return DAY_KEYS[date.getDay()]
}

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const FR_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDateFR(date: Date): string {
  const formatted = FR_FORMATTER.format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
