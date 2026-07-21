'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from './Card'
import type { WhoopSummaryData } from '@/lib/whoop'

type SummaryState =
  | { status: 'loading' }
  | { status: 'disconnected' }
  | ({ status: 'connected' } & WhoopSummaryData)

function recoveryColor(score: number): string {
  if (score >= 67) return 'text-accent'
  if (score >= 34) return 'text-warning'
  return 'text-danger'
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

export default function WhoopCard() {
  const [summary, setSummary] = useState<SummaryState>({ status: 'loading' })

  useEffect(() => {
    fetch('/api/whoop/summary')
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) {
          setSummary({ status: 'connected', recovery: data.recovery, sleep: data.sleep, strain: data.strain })
        } else {
          setSummary({ status: 'disconnected' })
        }
      })
      .catch((error) => {
        console.error('Failed to load Whoop summary:', error)
        setSummary({ status: 'disconnected' })
      })
  }, [])

  if (summary.status === 'loading') {
    return (
      <Card>
        <h2 className="text-sm font-medium text-text-secondary">Whoop</h2>
        <p className="mt-2 text-text-secondary">Chargement...</p>
      </Card>
    )
  }

  if (summary.status === 'disconnected') {
    return (
      <Card>
        <h2 className="text-sm font-medium text-text-secondary">Whoop</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Whoop non connecté —{' '}
          <Link href="/settings" className="text-accent underline-offset-2 hover:underline">
            connecter
          </Link>
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-sm font-medium text-text-secondary">Whoop</h2>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className={`text-xl font-semibold tabular-nums ${summary.recovery !== null ? recoveryColor(summary.recovery) : 'text-text-secondary'}`}>
            {summary.recovery !== null ? `${summary.recovery} %` : '—'}
          </p>
          <p className="text-xs text-text-secondary">Récupération</p>
        </div>
        <div>
          <p className="text-xl font-semibold tabular-nums text-text-primary">
            {summary.sleep ? formatDuration(summary.sleep.durationMinutes) : '—'}
          </p>
          <p className="text-xs text-text-secondary">
            {summary.sleep ? `Sommeil · ${summary.sleep.performance} %` : 'Sommeil'}
          </p>
        </div>
        <div>
          <p className="text-xl font-semibold tabular-nums text-text-primary">
            {summary.strain !== null ? summary.strain : '—'}
          </p>
          <p className="text-xs text-text-secondary">Strain</p>
        </div>
      </div>
    </Card>
  )
}
