'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import UndoToast from '@/components/UndoToast'
import type { Grocery } from '@/lib/types'

const CATEGORIES = ['Fruits & légumes', 'Épicerie', 'Frais', 'Autre']

export default function FoodPage() {
  const [items, setItems] = useState<Grocery[]>([])
  const [newItem, setNewItem] = useState('')
  const [newCategory, setNewCategory] = useState(CATEGORIES[CATEGORIES.length - 1])
  const [pendingDeletes, setPendingDeletes] = useState<Grocery[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  async function loadItems() {
    const { data, error } = await supabase
      .from('groceries')
      .select('*')
      .order('created_at', { ascending: true })
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
    const { error } = await supabase.from('groceries').insert({ item: newItem.trim(), category: newCategory })
    if (error) {
      console.error('Failed to add grocery item:', error)
    } else {
      setNewItem('')
    }
    loadItems()
  }

  async function toggleChecked(item: Grocery) {
    const { error } = await supabase.from('groceries').update({ checked: !item.checked }).eq('id', item.id)
    if (error) {
      console.error('Failed to update grocery item:', error)
    }
    loadItems()
  }

  function requestDelete(item: Grocery) {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    setPendingDeletes((prev) => [...prev, item])
    const timer = setTimeout(() => {
      timers.current.delete(item.id)
      setPendingDeletes((prev) => prev.filter((i) => i.id !== item.id))
      supabase
        .from('groceries')
        .delete()
        .eq('id', item.id)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to delete grocery item:', error)
          }
        })
    }, 4000)
    timers.current.set(item.id, timer)
  }

  function undoDelete(item: Grocery) {
    const timer = timers.current.get(item.id)
    if (timer) clearTimeout(timer)
    timers.current.delete(item.id)
    setItems((prev) => [...prev, item])
    setPendingDeletes((prev) => prev.filter((i) => i.id !== item.id))
  }

  const grouped = CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0)

  return (
    <main className="flex flex-col gap-4 pb-24">
      <header className="px-4 pt-6">
        <h1 className="text-lg font-medium text-text-primary">Food</h1>
      </header>

      <form onSubmit={handleAdd} className="flex gap-2 px-4">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Ajouter un article"
          aria-label="Ajouter un article"
          className="min-w-0 flex-1 rounded-2xl border border-surface-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          aria-label="Catégorie"
          className="rounded-2xl border border-surface-border bg-surface px-2 py-2 text-sm text-text-primary"
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button
          type="submit"
          aria-label="Ajouter"
          className="min-h-[44px] min-w-[44px] rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-transform active:scale-95"
        >
          +
        </button>
      </form>

      <div className="flex flex-col gap-4 px-4">
        {grouped.map(({ category, items: groupItems }) => (
          <section key={category}>
            <h2 className="text-sm font-medium text-text-secondary">{category}</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {groupItems.map((item) => (
                <li
                  key={item.id}
                  className="flex min-h-[44px] items-center justify-between rounded-2xl border border-surface-border bg-surface px-3 py-2"
                >
                  <label className="flex flex-1 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecked(item)}
                      className="h-5 w-5 accent-[#7c9885]"
                    />
                    <span
                      className={item.checked ? 'text-text-secondary line-through' : 'text-text-primary'}
                    >
                      {item.item}
                    </span>
                  </label>
                  <button
                    onClick={() => requestDelete(item)}
                    aria-label={`Supprimer ${item.item}`}
                    className="flex h-11 w-11 items-center justify-center text-text-secondary transition-transform active:scale-95"
                  >
                    <X size={18} strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {items.length === 0 && <p className="text-text-secondary">Liste vide</p>}
      </div>

      {pendingDeletes.map((item) => (
        <UndoToast key={item.id} message={`Supprimé : ${item.item}`} onUndo={() => undoDelete(item)} />
      ))}
    </main>
  )
}
