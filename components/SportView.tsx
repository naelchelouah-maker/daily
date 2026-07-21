'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getDayKey, toISODate } from '@/lib/date'
import type { DayOfWeek, Exercise, Workout, WorkoutLog } from '@/lib/types'

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mer' },
  { key: 'thursday', label: 'Jeu' },
  { key: 'friday', label: 'Ven' },
  { key: 'saturday', label: 'Sam' },
  { key: 'sunday', label: 'Dim' },
]

interface ExerciseLogState {
  sets: string
  reps: string
  weight: string
  rpe: string
  notes: string
  completed: boolean
}

export default function SportView() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDayKey(new Date()))
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [logs, setLogs] = useState<Record<string, ExerciseLogState>>({})
  const todayISO = toISODate(new Date())

  useEffect(() => {
    async function load() {
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('day_of_week', selectedDay)
        .single()

      if (workoutError) {
        console.error('Failed to load workout:', workoutError)
      }

      const workoutRow = workoutData as Workout | null
      setWorkout(workoutRow)
      if (!workoutRow) return

      const { data: logsData, error: logsError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('workout_id', workoutRow.id)
        .eq('date', todayISO)

      if (logsError) {
        console.error('Failed to load workout logs:', logsError)
      }

      const logsByExercise: Record<string, ExerciseLogState> = {}
      for (const exercise of workoutRow.exercises as Exercise[]) {
        const existing = (logsData as WorkoutLog[] | null)?.find((log) => log.exercise === exercise.name)
        logsByExercise[exercise.name] = {
          sets: existing?.sets?.toString() ?? '',
          reps: existing?.reps ?? '',
          weight: existing?.weight?.toString() ?? '',
          rpe: existing?.rpe?.toString() ?? '',
          notes: existing?.notes ?? '',
          completed: existing?.completed ?? false,
        }
      }
      setLogs(logsByExercise)
    }

    load()
  }, [selectedDay, todayISO])

  function updateField(exercise: string, field: keyof ExerciseLogState, value: string | boolean) {
    setLogs((prev) => ({ ...prev, [exercise]: { ...prev[exercise], [field]: value } }))
  }

  async function saveExercise(exercise: string, overrides?: Partial<ExerciseLogState>) {
    if (!workout) return
    const log = { ...logs[exercise], ...overrides }
    const { error } = await supabase.from('workout_logs').upsert(
      {
        date: todayISO,
        workout_id: workout.id,
        exercise,
        sets: log.sets ? Number(log.sets) : null,
        reps: log.reps || null,
        weight: log.weight ? Number(log.weight) : null,
        rpe: log.rpe ? Number(log.rpe) : null,
        notes: log.notes || null,
        completed: log.completed,
      },
      { onConflict: 'workout_id,date,exercise' }
    )
    if (error) {
      console.error('Failed to save exercise log:', error)
    }
  }

  return (
    <main className="flex flex-col gap-4 pb-8">
      <header className="px-4 pt-6">
        <h1 className="text-lg font-medium text-text-primary">Sport</h1>
      </header>

      <div className="flex gap-2 overflow-x-auto px-4">
        {DAYS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedDay(key)}
            aria-pressed={selectedDay === key}
            className={`min-h-[44px] shrink-0 rounded-2xl border px-4 py-2 text-sm transition-transform active:scale-95 ${
              selectedDay === key
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-surface-border bg-surface text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-4">
        <h2 className="text-lg font-medium text-text-primary">{workout?.name ?? 'Repos'}</h2>
        {(workout?.exercises as Exercise[] | undefined)?.map((exercise) => {
          const log = logs[exercise.name]
          if (!log) return null
          return (
            <div key={exercise.name} className="rounded-2xl border border-surface-border bg-surface p-4">
              <label className="flex min-h-[44px] items-center gap-3">
                <input
                  type="checkbox"
                  checked={log.completed}
                  onChange={(e) => {
                    const completed = e.target.checked
                    updateField(exercise.name, 'completed', completed)
                    saveExercise(exercise.name, { completed })
                  }}
                  className="h-5 w-5 accent-accent"
                />
                <span className="text-text-primary">
                  {exercise.name} <span className="text-text-secondary">{exercise.sets}x{exercise.reps}</span>
                </span>
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  Charge (kg)
                  <input
                    type="text"
                    inputMode="numeric"
                    value={log.weight}
                    onChange={(e) => updateField(exercise.name, 'weight', e.target.value)}
                    onBlur={() => saveExercise(exercise.name)}
                    className="rounded-xl border border-surface-border bg-background px-3 py-2 tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  Reps
                  <input
                    type="text"
                    value={log.reps}
                    onChange={(e) => updateField(exercise.name, 'reps', e.target.value)}
                    onBlur={() => saveExercise(exercise.name)}
                    className="rounded-xl border border-surface-border bg-background px-3 py-2 tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  RPE
                  <input
                    type="text"
                    inputMode="numeric"
                    value={log.rpe}
                    onChange={(e) => updateField(exercise.name, 'rpe', e.target.value)}
                    onBlur={() => saveExercise(exercise.name)}
                    className="rounded-xl border border-surface-border bg-background px-3 py-2 tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  Notes
                  <input
                    type="text"
                    value={log.notes}
                    onChange={(e) => updateField(exercise.name, 'notes', e.target.value)}
                    onBlur={() => saveExercise(exercise.name)}
                    className="rounded-xl border border-surface-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
              </div>
            </div>
          )
        })}
        {workout && (workout.exercises as Exercise[]).length === 0 && (
          <p className="text-text-secondary">Jour libre — pas de structure fixe.</p>
        )}
      </div>
    </main>
  )
}
