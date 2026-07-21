interface UndoToastProps {
  message: string
  onUndo: () => void
  offset?: number
}

export default function UndoToast({ message, onUndo, offset = 0 }: UndoToastProps) {
  return (
    <div
      className="fixed inset-x-4 z-50 flex items-center justify-between rounded-2xl border border-surface-border bg-surface px-4 py-3 shadow-lg"
      style={{ bottom: `calc(6rem + ${offset * 3.5}rem)` }}
    >
      <span className="text-sm text-text-primary">{message}</span>
      <button onClick={onUndo} className="min-h-[44px] px-2 text-sm font-medium text-accent">
        Annuler
      </button>
    </div>
  )
}
