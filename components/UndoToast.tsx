interface UndoToastProps {
  message: string
  onUndo: () => void
}

export default function UndoToast({ message, onUndo }: UndoToastProps) {
  return (
    <div className="fixed inset-x-4 bottom-24 z-50 flex items-center justify-between rounded-2xl border border-surface-border bg-surface px-4 py-3 shadow-lg">
      <span className="text-sm text-text-primary">{message}</span>
      <button onClick={onUndo} className="min-h-[44px] px-2 text-sm font-medium text-accent">
        Annuler
      </button>
    </div>
  )
}
