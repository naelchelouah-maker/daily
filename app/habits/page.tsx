'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toISODate } from '@/lib/date'
import { calculateStreak } from '@/lib/streak'
import type { Habit, HabitLog } from '@/lib/types'

interface HabitWithStatus extends Habit {
  completedToday: boolean
  streak: number
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitWithStatus[]>([])
  const [newHabit, setNewHabit] = useState('')
  const todayISO = toISODate(new Date())

  const loadHabits = useCallback(async () => {
    const { data: habitsData, error: habitsError } = await supabase.from('habits').select('*').order('created_at')
    const { data: logsData, error: logsError } = await supabase.from('habit_logs').select('*')

    if (habitsError) {
      console.error('Failed to load habits:', habitsError)
    }
    if (logsError) {
      console.error('Failed to load habit logs:', logsError)
    }

    const habitsList = (habitsData as Habit[]) ?? []
    const logsList = (logsData as HabitLog[]) ?? []

    setHabits(
      habitsList.map((habit) => {
        const habitLogs = logsList.filter((log) => log.habit_id === habit.id)
        const todayLog = habitLogs.find((log) => log.date === todayISO)
        return {
          ...habit,
          completedToday: todayLog?.completed ?? false,
          streak: calculateStreak(habitLogs, new Date()),
        }
      })
    )
  }, [todayISO])

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newHabit.trim()) return
    const { error } = await supabase.from('habits').insert({ name: newHabit.trim(), icon: '' })
    if (error) {
      console.error('Failed to add habit:', error)
    } else {
      setNewHabit('')
    }
    loadHabits()
  }

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
    <main className="flex flex-col gap-4 pb-8">
      <header className="px-4 pt-6">
        <h1 className="text-lg font-medium text-text-primary">Habits</h1>
      </header>

      <form onSubmit={handleAdd} className="flex gap-2 px-4">
        <input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Nouvelle habitude"
          aria-label="Nouvelle habitude"
          className="min-w-0 flex-1 rounded-2xl border border-surface-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          aria-label="Ajouter"
          className="min-h-[44px] min-w-[44px] rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-transform active:scale-95"
        >
          +
        </button>
      </form>

      <ul className="flex flex-col gap-2 px-4">
        {habits.map((habit) => (
          <li key={habit.id}>
            <button
              onClick={() => toggleHabit(habit.id, habit.completedToday)}
              aria-pressed={habit.completedToday}
              className={`flex min-h-[44px] w-full items-center justify-between rounded-2xl border px-4 py-3 transition-transform active:scale-95 ${
                habit.completedToday
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-surface-border bg-surface text-text-primary'
              }`}
            >
              <span>{habit.name}</span>
              <span className="flex items-center gap-1 text-sm opacity-80">
                <Flame size={14} strokeWidth={1.5} />
                {habit.streak}
              </span>
            </button>
          </li>
        ))}
        {habits.length === 0 && <p className="text-text-secondary">Aucune habitude pour le moment</p>}
      </ul>
    </main>
  )
}
