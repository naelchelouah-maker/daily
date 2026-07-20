'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getDayKey } from '@/lib/date'
import Card from './Card'
import type { Workout } from '@/lib/types'

export default function SportCard() {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const dayKey = getDayKey(new Date())
    supabase
      .from('workouts')
      .select('*')
      .eq('day_of_week', dayKey)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load today\'s workout:', error)
        }
        setWorkout(data as Workout | null)
        setLoading(false)
      })
  }, [])

  return (
    <Card>
      <h2 className="text-sm font-medium text-text-secondary">Sport</h2>
      {loading ? (
        <p className="mt-2 text-text-secondary">Chargement...</p>
      ) : (
        <>
          <p className="mt-1 text-lg font-medium text-text-primary">{workout?.name ?? 'Repos'}</p>
          <Link
            href="/sport"
            className="mt-3 inline-block min-h-[44px] rounded-2xl bg-accent px-4 py-2 text-sm font-medium leading-[28px] text-accent-foreground transition-transform active:scale-95"
          >
            Démarrer
          </Link>
        </>
      )}
    </Card>
  )
}
