import { formatDateFR } from '@/lib/date'

export default function DateHeader() {
  const today = formatDateFR(new Date())
  return (
    <header className="px-4 pt-6 pb-2">
      <p className="text-sm text-text-secondary">{today}</p>
    </header>
  )
}
