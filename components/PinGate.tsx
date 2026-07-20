'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

const STORAGE_KEY = 'daily_pin_ok'

export default function PinGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    setUnlocked(localStorage.getItem(STORAGE_KEY) === 'true')
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (pin === process.env.NEXT_PUBLIC_APP_PIN) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
      setPin('')
    }
  }

  if (unlocked === null) {
    return null
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
        <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-4">
          <h1 className="text-center text-lg font-medium text-text-primary">Code d&apos;accès</h1>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            aria-label="Code d'accès"
            aria-invalid={error}
            aria-describedby={error ? 'pin-error' : undefined}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setError(false)
            }}
            className="rounded-2xl border border-surface-border bg-surface px-4 py-3 text-center text-2xl tracking-[0.5em] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {error && (
            <p id="pin-error" aria-live="polite" className="text-center text-sm text-text-secondary">
              Code incorrect
            </p>
          )}
          <button
            type="submit"
            className="min-h-[44px] rounded-2xl bg-accent px-4 py-3 text-center font-medium text-accent-foreground transition-transform active:scale-95"
          >
            Valider
          </button>
        </form>
      </div>
    )
  }

  return <>{children}</>
}
