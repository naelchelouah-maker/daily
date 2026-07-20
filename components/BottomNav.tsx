'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Dumbbell, ShoppingCart, CheckSquare, Settings } from 'lucide-react'

const ITEMS = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/sport', label: 'Sport', icon: Dumbbell },
  { href: '/food', label: 'Food', icon: ShoppingCart },
  { href: '/habits', label: 'Habits', icon: CheckSquare },
  { href: '/settings', label: 'Réglages', icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-border bg-surface"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <li key={href} className="flex-1">
              <Link href={href} className="flex flex-col items-center gap-1 py-2 text-xs">
                <Icon size={24} strokeWidth={1.5} className={active ? 'text-accent' : 'text-text-secondary'} />
                <span className={active ? 'text-accent' : 'text-text-secondary'}>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
