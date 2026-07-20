'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import Card from './Card'
import type { Grocery } from '@/lib/types'

export default function FoodCard() {
  const [items, setItems] = useState<Grocery[]>([])
  const [newItem, setNewItem] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadItems() {
    const { data, error } = await supabase
      .from('groceries')
      .select('*')
      .eq('checked', false)
      .order('created_at', { ascending: false })
      .limit(4)
    if (error) {
      console.error('Failed to load groceries:', error)
    }
    setItems((data as Grocery[]) ?? [])
  }

  useEffect(() => {
    loadItems()
  }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newItem.trim()) return
    setSaving(true)
    const { error } = await supabase.from('groceries').insert({ item: newItem.trim(), category: 'Autre' })
    if (error) {
      console.error('Failed to add grocery item:', error)
    }
    setNewItem('')
    setSaving(false)
    loadItems()
  }

  return (
    <Card>
      <h2 className="text-sm font-medium text-text-secondary">Food</h2>
      <ul className="mt-2 flex flex-col gap-1">
        {items.length === 0 && <li className="text-text-secondary">Liste vide</li>}
        {items.map((item) => (
          <li key={item.id} className="text-text-primary">
            {item.item}
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Ajouter un article"
          className="min-w-0 flex-1 rounded-2xl border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={saving}
          className="min-h-[44px] min-w-[44px] rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-transform active:scale-95 disabled:opacity-50"
        >
          +
        </button>
      </form>
    </Card>
  )
}
