import { toISODate } from './date'

export interface HabitLogEntry {
  date: string
  completed: boolean
}

export function calculateStreak(logs: HabitLogEntry[], today: Date): number {
  const completedDates = new Set(
    logs.filter((log) => log.completed).map((log) => log.date)
  )

  let streak = 0
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  while (completedDates.has(toISODate(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}
