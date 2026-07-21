export default function SettingsPage() {
  return (
    <main className="flex flex-col gap-4 pb-8">
      <header className="px-4 pt-6">
        <h1 className="text-lg font-medium text-text-primary">Réglages</h1>
      </header>

      <div className="flex flex-col gap-3 px-4">
        <button
          disabled
          className="min-h-[44px] rounded-2xl border border-surface-border bg-surface px-4 py-3 text-left text-text-secondary opacity-50"
        >
          Connecter Whoop
        </button>
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
