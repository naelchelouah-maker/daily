'use client'

import { useCallback, useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toISODate } from '@/lib/date'
import { calculateStreak } from '@/lib/streak'
import type { Habit, HabitLog } from '@/lib/types'

interface HabitWithStatus extends Habit {
  completedToday: boolean
  streak: number
}

export default function HabitsRow() {
  const [habits, setHabits] = useState<HabitWithStatus[]>([])
  const todayISO = toISODate(new Date())

  const loadHabits = useCallback(async () => {
    const { data: habitsData, error: habitsError } = await supabase.from('habits').select('*')
    const { data: logsData, error: logsError } = await supabase.from('habit_logs').select('*')

    if (habitsError) {
      console.error('Failed to load habits:', habitsError)
    }
    if (logsError) {
      console.error('Failed to load habit logs:', logsError)
    }

    const habitsList = (habitsData as Habit[]) ?? []
    const logsList = (logsData as HabitLog[]) ?? []

    const withStatus = habitsList.map((habit) => {
      const habitLogs = logsList.filter((log) => log.habit_id === habit.id)
      const todayLog = habitLogs.find((log) => log.date === todayISO)
      return {
        ...habit,
        completedToday: todayLog?.completed ?? false,
        streak: calculateStreak(habitLogs, new Date()),
      }
    })

    setHabits(withStatus)
  }, [todayISO])

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  async function toggleHabit(habitId: string, current: boolean) {
    const { error } = await supabase
      .from('habit_logs')
      .upsert(
        { habit_id: habitId, date: todayISO, completed: !current },
        { onConflict: 'habit_id,date' }
      )
    if (error) {
      console.error('Failed to toggle habit:', error)
    }
    loadHabits()
  }

  return (
    <section className="px-4">
      <h2 className="text-sm font-medium text-text-secondary">Habits</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => toggleHabit(habit.id, habit.completedToday)}
            aria-pressed={habit.completedToday}
            className={`flex min-h-[44px] items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-transform active:scale-95 ${
              habit.completedToday
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-surface-border bg-surface text-text-primary'
            }`}
          >
            <span>{habit.name}</span>
            {habit.streak > 0 && (
              <span className="flex items-center gap-0.5 text-xs opacity-80">
                <Flame size={12} strokeWidth={1.5} />
                {habit.streak}
              </span>
            )}
          </button>
        ))}
        {habits.length === 0 && <p className="text-text-secondary">Aucune habitude pour le moment</p>}
      </div>
    </section>
  )
}
