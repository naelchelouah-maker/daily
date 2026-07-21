'use client'

import { useCallback, useEffect, useState } from 'react'

type WhoopStatus = 'loading' | 'connected' | 'disconnected'

export default function SettingsPage() {
  const [whoopStatus, setWhoopStatus] = useState<WhoopStatus>('loading')
  const [banner, setBanner] = useState<'connected' | 'error' | null>(null)

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whoop/summary')
      const data = await res.json()
      setWhoopStatus(data.connected ? 'connected' : 'disconnected')
    } catch (error) {
      console.error('Failed to load Whoop status:', error)
      setWhoopStatus('disconnected')
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const whoop = params.get('whoop')
    if (whoop === 'connected' || whoop === 'error') {
      setBanner(whoop)
      window.history.replaceState(null, '', '/settings')
    }
    loadStatus()
  }, [loadStatus])

  async function handleDisconnect() {
    const res = await fetch('/api/whoop/disconnect', { method: 'POST' })
    if (!res.ok) {
      console.error('Failed to disconnect Whoop:', res.status)
    }
    setBanner(null)
    loadStatus()
  }

  return (
    <main className="flex flex-col gap-4 pb-8">
      <header className="px-4 pt-6">
        <h1 className="text-lg font-medium text-text-primary">Réglages</h1>
      </header>

      {banner === 'connected' && (
        <p className="mx-4 rounded-2xl border border-accent bg-surface px-4 py-3 text-sm text-accent" role="status">
          Whoop connecté avec succès
        </p>
      )}
      {banner === 'error' && (
        <p className="mx-4 rounded-2xl border border-danger bg-surface px-4 py-3 text-sm text-danger" role="alert">
          Échec de la connexion Whoop — réessaie
        </p>
      )}

      <div className="flex flex-col gap-3 px-4">
        {whoopStatus === 'connected' ? (
          <div className="flex min-h-[44px] items-center justify-between rounded-2xl border border-accent bg-surface px-4 py-3">
            <span className="text-text-primary">Whoop connecté ✓</span>
            <button
              onClick={handleDisconnect}
              className="min-h-[44px] px-2 text-sm font-medium text-text-secondary transition-transform active:scale-95"
            >
              Déconnecter
            </button>
          </div>
        ) : (
          <a
            href="/api/whoop/connect"
            aria-disabled={whoopStatus === 'loading'}
            className={`flex min-h-[44px] items-center rounded-2xl border border-surface-border bg-surface px-4 py-3 text-text-primary transition-transform active:scale-95 ${
              whoopStatus === 'loading' ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            Connecter Whoop
          </a>
        )}

        <button
          disabled
          className="min-h-[44px] rounded-2xl border border-surface-border bg-surface px-4 py-3 text-left text-text-secondary opacity-50"
        >
          Connecter Calendar
        </button>
      </div>
    </main>
  )
}
