# Daily Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold and build Phase 1 of "Daily" — a personal Next.js 14 + Supabase PWA for sport/nutrition/habit tracking, installable on iPhone, protected by a client-side PIN, with five core pages and pre-seeded workout data.

**Architecture:** Every page is a Client Component that calls the Supabase JS client directly — no Server Actions, no server-rendered data fetching. A stone/sage dark theme is expressed as Tailwind semantic color tokens (`background`, `surface`, `surface-border`, `text-primary`, `text-secondary`, `accent`, `accent-foreground`). A persistent bottom tab bar and a client-side PIN gate wrap every route via `app/layout.tsx`. PWA installability comes from a hand-written `manifest.json`, generated PNG icons, and a minimal hand-rolled service worker — no `next-pwa` dependency.

**Tech Stack:** Next.js 14 (App Router) + TypeScript, Tailwind CSS, `@supabase/supabase-js`, `lucide-react` icons, Vitest for pure-logic unit tests, `sharp` for icon generation.

**Testing scope:** TDD (Vitest) is used for the two pure-logic modules (`lib/date.ts`, `lib/streak.ts`) — these have real edge cases worth locking down. UI components and pages are verified manually via the dev server (typecheck/build + click-through), not component tests, since this is a solo-use app where component snapshot tests add little value.

**Reference spec:** `docs/superpowers/specs/2026-07-20-daily-tracker-design.md`

**Project root:** `C:\Users\naelc\Documents\App tracker` (all paths below are relative to this root)

---

### Task 1: Scaffold the Next.js project

**Files:**
- Create: entire Next.js project skeleton via `create-next-app` (package.json, tsconfig.json, app/, public/, etc.)

- [ ] **Step 1: Run create-next-app non-interactively**

Run (from the project root):
```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```

Expected: command completes, creates `package.json`, `tsconfig.json`, `app/`, `public/`, `next.config.js` (or `.mjs`), `tailwind.config.ts`, `.eslintrc.json`, `node_modules/`. It will not touch the existing `docs/` folder or `.git`.

- [ ] **Step 2: Verify the dev server boots**

Run: `npm run dev` in the background, then check `http://localhost:3000` responds (e.g. `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`).
Expected: HTTP 200. Stop the dev server afterward.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js 14 project with TypeScript, Tailwind, App Router"
```

---

### Task 2: Install additional dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install runtime dependencies**

Run: `npm install @supabase/supabase-js lucide-react`

- [ ] **Step 2: Install dev dependencies**

Run: `npm install --save-dev vitest sharp`

- [ ] **Step 3: Add npm scripts**

Edit `package.json`, add to the `"scripts"` block:
```json
"test": "vitest run",
"generate-icons": "node scripts/generate-icons.mjs"
```

- [ ] **Step 4: Verify install**

Run: `npm run test`
Expected: Vitest runs with "No test files found" (no tests written yet) — exit code non-zero is fine at this point, this just confirms the binary resolves. If it errors with "command not found", the install failed — re-run Step 1/2.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add Supabase, lucide-react, vitest, sharp dependencies"
```

---

### Task 3: Configure Tailwind design tokens

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace tailwind.config.ts**

Write `tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1c1917',
        surface: '#262220',
        'surface-border': '#3a3532',
        'text-primary': '#fafaf9',
        'text-secondary': '#a8a29e',
        accent: '#7c9885',
        'accent-foreground': '#1c1917',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Replace app/globals.css**

Write `app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  height: 100%;
}

body {
  -webkit-tap-highlight-color: transparent;
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds (the default `app/page.tsx` still exists and compiles — it will be replaced in a later task).

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "Configure stone/sage dark theme design tokens"
```

---

### Task 4: Set up Vitest

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Write vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
})
```

- [ ] **Step 2: Verify**

Run: `npm run test`
Expected: "No test files found" message, exit code 1 (no test files exist yet — this is expected and fixed in the next tasks).

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "Add Vitest configuration"
```

---

### Task 5: Shared TypeScript types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Write lib/types.ts**

```ts
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface Exercise {
  name: string
  sets: number
  reps: string
}

export interface Workout {
  id: string
  day_of_week: DayOfWeek
  name: string
  exercises: Exercise[]
}

export interface WorkoutLog {
  id: string
  date: string
  workout_id: string
  exercise: string
  sets: number | null
  reps: string | null
  weight: number | null
  rpe: number | null
  notes: string | null
  completed: boolean
}

export interface Grocery {
  id: string
  item: string
  category: string
  checked: boolean
  created_at: string
}

export interface Habit {
  id: string
  name: string
  icon: string
  created_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  date: string
  completed: boolean
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors related to `lib/types.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "Add shared Supabase table types"
```

---

### Task 6: Date utilities (TDD)

**Files:**
- Create: `lib/date.ts`
- Test: `lib/__tests__/date.test.ts`

- [ ] **Step 1: Write the failing tests**

Write `lib/__tests__/date.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getDayKey, toISODate, formatDateFR } from '../date'

describe('getDayKey', () => {
  it('returns monday for a known Monday', () => {
    expect(getDayKey(new Date(2026, 6, 20))).toBe('monday')
  })

  it('returns sunday for a known Sunday', () => {
    expect(getDayKey(new Date(2026, 6, 19))).toBe('sunday')
  })
})

describe('toISODate', () => {
  it('formats a date as YYYY-MM-DD using local date parts', () => {
    expect(toISODate(new Date(2026, 6, 20))).toBe('2026-07-20')
  })

  it('pads single-digit month and day', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('formatDateFR', () => {
  it('formats with a capitalized weekday in French', () => {
    expect(formatDateFR(new Date(2026, 6, 20))).toBe('lundi 20 juillet 2026'.replace(/^./, (c) => c.toUpperCase()))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `Cannot find module '../date'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Write `lib/date.ts`:
```ts
import type { DayOfWeek } from './types'

const DAY_KEYS: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export function getDayKey(date: Date): DayOfWeek {
  return DAY_KEYS[date.getDay()]
}

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const FR_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDateFR(date: Date): string {
  const formatted = FR_FORMATTER.format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS — all 5 tests in `lib/__tests__/date.test.ts` green.

- [ ] **Step 5: Commit**

```bash
git add lib/date.ts lib/__tests__/date.test.ts
git commit -m "Add date utilities with tests"
```

---

### Task 7: Streak calculation (TDD)

**Files:**
- Create: `lib/streak.ts`
- Test: `lib/__tests__/streak.test.ts`

- [ ] **Step 1: Write the failing tests**

Write `lib/__tests__/streak.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { calculateStreak } from '../streak'

describe('calculateStreak', () => {
  it('returns 0 when today is not completed', () => {
    const logs = [{ date: '2026-07-19', completed: true }]
    expect(calculateStreak(logs, new Date(2026, 6, 20))).toBe(0)
  })

  it('counts consecutive completed days ending today', () => {
    const logs = [
      { date: '2026-07-20', completed: true },
      { date: '2026-07-19', completed: true },
      { date: '2026-07-18', completed: true },
      { date: '2026-07-17', completed: false },
    ]
    expect(calculateStreak(logs, new Date(2026, 6, 20))).toBe(3)
  })

  it('stops at the first gap', () => {
    const logs = [
      { date: '2026-07-20', completed: true },
      { date: '2026-07-18', completed: true },
    ]
    expect(calculateStreak(logs, new Date(2026, 6, 20))).toBe(1)
  })

  it('ignores completed=false entries', () => {
    const logs = [{ date: '2026-07-20', completed: false }]
    expect(calculateStreak(logs, new Date(2026, 6, 20))).toBe(0)
  })

  it('returns 0 for an empty log list', () => {
    expect(calculateStreak([], new Date(2026, 6, 20))).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `Cannot find module '../streak'`.

- [ ] **Step 3: Write the implementation**

Write `lib/streak.ts`:
```ts
import { toISODate } from './date'

export interface HabitLogEntry {
  date: string
  completed: boolean
}

export function calculateStreak(logs: HabitLogEntry[], today: Date): number {
  const completedDates = new Set(
    logs.filter((log) => log.completed).map((log) => log.date)
  )

  let streak = 0
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  while (completedDates.has(toISODate(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS — all tests in both `date.test.ts` and `streak.test.ts` green (10 tests total).

- [ ] **Step 5: Commit**

```bash
git add lib/streak.ts lib/__tests__/streak.test.ts
git commit -m "Add streak calculation with tests"
```

---

### Task 8: Supabase client

**Files:**
- Create: `lib/supabase.ts`
- Create: `.env.local.example`
- Modify: `.gitignore` (verify `.env.local` is ignored)

- [ ] **Step 1: Write lib/supabase.ts**

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

- [ ] **Step 2: Write .env.local.example**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_PIN=
```

- [ ] **Step 3: Confirm .env.local is gitignored**

Check `.gitignore` (created by `create-next-app`) already contains `.env*.local`. If missing, append it.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (the `!` non-null assertions are intentional — these vars are required at runtime, populated later during Supabase project setup).

- [ ] **Step 5: Commit**

```bash
git add lib/supabase.ts .env.local.example .gitignore
git commit -m "Add Supabase client and env var template"
```

---

### Task 9: Supabase migration (schema + seed)

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Write the migration**

Write `supabase/migrations/0001_init.sql`:
```sql
create table workouts (
  id uuid primary key default gen_random_uuid(),
  day_of_week text not null unique,
  name text not null,
  exercises jsonb not null default '[]'::jsonb
);

create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  workout_id uuid references workouts(id),
  exercise text not null,
  sets integer,
  reps text,
  weight numeric,
  rpe numeric,
  notes text,
  completed boolean not null default false,
  unique (workout_id, date, exercise)
);

create table groceries (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  category text not null default 'Autre',
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '',
  created_at timestamptz not null default now()
);

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  unique (habit_id, date)
);

alter table workouts disable row level security;
alter table workout_logs disable row level security;
alter table groceries disable row level security;
alter table habits disable row level security;
alter table habit_logs disable row level security;

insert into workouts (day_of_week, name, exercises) values
('monday', 'Legs Force', '[
  {"name": "Back squat", "sets": 4, "reps": "5"},
  {"name": "Bulgarian split squat", "sets": 3, "reps": "8/jambe"},
  {"name": "Nordic curl", "sets": 3, "reps": "6"},
  {"name": "Tibialis raises + Copenhagen plank (superset)", "sets": 3, "reps": "-"}
]'::jsonb),
('tuesday', 'Pull + Kettlebell', '[
  {"name": "Tractions lestées", "sets": 5, "reps": "5"},
  {"name": "KB swings", "sets": 4, "reps": "15"},
  {"name": "Rowing barre/KB", "sets": 3, "reps": "8"},
  {"name": "Face pulls + leg raises (superset)", "sets": 3, "reps": "-"}
]'::jsonb),
('wednesday', 'Legs Athlétisme', '[
  {"name": "RDL unilatéral/trap bar deadlift", "sets": 3, "reps": "6"},
  {"name": "Box jumps", "sets": 4, "reps": "5"},
  {"name": "Lateral lunges", "sets": 3, "reps": "10/côté"},
  {"name": "Calf raises + mobilité cheville (superset)", "sets": 3, "reps": "-"}
]'::jsonb),
('thursday', 'Push (Dips) + KB', '[
  {"name": "Dips lestés", "sets": 5, "reps": "5"},
  {"name": "KB clean & press", "sets": 4, "reps": "8/côté"},
  {"name": "Pompes archer/développé militaire", "sets": 3, "reps": "10"},
  {"name": "Ab wheel/hollow body", "sets": 3, "reps": "-"}
]'::jsonb),
('friday', 'Full body + sprints', '[
  {"name": "KB complex", "sets": 5, "reps": "tours"},
  {"name": "Superset tractions/dips", "sets": 4, "reps": "-"},
  {"name": "Sprints 6x100m ou côte 8x20s", "sets": 1, "reps": "-"}
]'::jsonb),
('saturday', 'Course ou sport random', '[]'::jsonb),
('sunday', 'Repos', '[]'::jsonb);
```

- [ ] **Step 2: Review for syntax correctness**

Read the file back and check: every `create table` has balanced parens and a trailing semicolon, every `insert` statement is terminated, the jsonb literals are valid JSON. This migration will actually be applied later against the real Supabase project during the guided external setup (see spec's "Setup externe requis") — it cannot be tested locally without a Postgres instance.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "Add Supabase schema migration with workout seed data"
```

---

### Task 10: PIN gate component

**Files:**
- Create: `components/PinGate.tsx`

- [ ] **Step 1: Write components/PinGate.tsx**

```tsx
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
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setError(false)
            }}
            className="rounded-2xl border border-surface-border bg-surface px-4 py-3 text-center text-2xl tracking-[0.5em] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {error && <p className="text-center text-sm text-text-secondary">Code incorrect</p>}
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
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/PinGate.tsx
git commit -m "Add client-side PIN gate component"
```

---

### Task 11: Bottom navigation component

**Files:**
- Create: `components/BottomNav.tsx`

- [ ] **Step 1: Write components/BottomNav.tsx**

```tsx
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
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/BottomNav.tsx
git commit -m "Add bottom tab navigation"
```

---

### Task 12: PWA assets — manifest, icons, service worker

**Files:**
- Create: `public/manifest.json`
- Create: `scripts/generate-icons.mjs`
- Create: `public/sw.js`
- Create: `components/ServiceWorkerRegister.tsx`

- [ ] **Step 1: Write public/manifest.json**

```json
{
  "name": "Daily",
  "short_name": "Daily",
  "description": "Suivi sport, nutrition et habitudes",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1c1917",
  "theme_color": "#1c1917",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Write the icon generation script**

Write `scripts/generate-icons.mjs`:
```js
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const OUT_DIR = new URL('../public/icons/', import.meta.url)
mkdirSync(OUT_DIR, { recursive: true })

function svgIcon(size) {
  const fontSize = Math.round(size * 0.5)
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#1c1917"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
    font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#7c9885">D</text>
</svg>`
}

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

for (const { file, size } of targets) {
  await sharp(Buffer.from(svgIcon(size))).png().toFile(new URL(file, OUT_DIR))
  console.log(`generated ${file}`)
}
```

- [ ] **Step 3: Run the icon generation script**

Run: `npm run generate-icons`
Expected: console prints `generated icon-192.png`, `generated icon-512.png`, `generated apple-touch-icon.png`, and `public/icons/` contains all three PNG files.

- [ ] **Step 4: Write the service worker**

Write `public/sw.js`:
```js
const CACHE_NAME = 'daily-v1'
const STATIC_ASSETS = ['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(request).then((res) => res || caches.match('/'))))
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        return response
      })
    })
  )
})
```

- [ ] **Step 5: Write the registration component**

Write `components/ServiceWorkerRegister.tsx`:
```tsx
'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return null
}
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add public/manifest.json public/sw.js scripts/generate-icons.mjs components/ServiceWorkerRegister.tsx public/icons package.json
git commit -m "Add PWA manifest, generated icons, and service worker"
```

---

### Task 13: Root layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace app/layout.tsx**

```tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import PinGate from '@/components/PinGate'
import BottomNav from '@/components/BottomNav'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'Daily',
  description: 'Suivi sport, nutrition et habitudes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Daily',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1c1917',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-background text-text-primary antialiased">
        <PinGate>
          <div className="min-h-dvh pb-20">{children}</div>
          <BottomNav />
        </PinGate>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds (the default `app/page.tsx` content still renders inside the new layout at this point).

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "Wire PIN gate, bottom nav, and PWA meta tags into root layout"
```

---

### Task 14: Shared UI — Card and DateHeader

**Files:**
- Create: `components/Card.tsx`
- Create: `components/DateHeader.tsx`

- [ ] **Step 1: Write components/Card.tsx**

```tsx
import type { ReactNode } from 'react'

export default function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-surface-border bg-surface p-4 ${className}`}>{children}</div>
  )
}
```

- [ ] **Step 2: Write components/DateHeader.tsx**

```tsx
import { formatDateFR } from '@/lib/date'

export default function DateHeader() {
  const today = formatDateFR(new Date())
  return (
    <header className="px-4 pt-6 pb-2">
      <p className="text-sm text-text-secondary">{today}</p>
    </header>
  )
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/Card.tsx components/DateHeader.tsx
git commit -m "Add shared Card and DateHeader components"
```

---

### Task 15: Home page — SportCard

**Files:**
- Create: `components/SportCard.tsx`

- [ ] **Step 1: Write components/SportCard.tsx**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getDayKey } from '@/lib/date'
import Card from './Card'
import type { Workout } from '@/lib/types'

export default function SportCard() {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const dayKey = getDayKey(new Date())
    supabase
      .from('workouts')
      .select('*')
      .eq('day_of_week', dayKey)
      .single()
      .then(({ data }) => {
        setWorkout(data as Workout | null)
        setLoading(false)
      })
  }, [])

  return (
    <Card>
      <h2 className="text-sm font-medium text-text-secondary">Sport</h2>
      {loading ? (
        <p className="mt-2 text-text-secondary">Chargement...</p>
      ) : (
        <>
          <p className="mt-1 text-lg font-medium text-text-primary">{workout?.name ?? 'Repos'}</p>
          <Link
            href="/sport"
            className="mt-3 inline-block min-h-[44px] rounded-2xl bg-accent px-4 py-2 text-sm font-medium leading-[28px] text-accent-foreground transition-transform active:scale-95"
          >
            Démarrer
          </Link>
        </>
      )}
    </Card>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/SportCard.tsx
git commit -m "Add SportCard for home page"
```

---

### Task 16: Home page — FoodCard

**Files:**
- Create: `components/FoodCard.tsx`

- [ ] **Step 1: Write components/FoodCard.tsx**

```tsx
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
    const { data } = await supabase
      .from('groceries')
      .select('*')
      .eq('checked', false)
      .order('created_at', { ascending: false })
      .limit(4)
    setItems((data as Grocery[]) ?? [])
  }

  useEffect(() => {
    loadItems()
  }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newItem.trim()) return
    setSaving(true)
    await supabase.from('groceries').insert({ item: newItem.trim(), category: 'Autre' })
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
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/FoodCard.tsx
git commit -m "Add FoodCard for home page"
```

---

### Task 17: Home page — HabitsRow and page assembly

**Files:**
- Create: `components/HabitsRow.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write components/HabitsRow.tsx**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toISODate } from '@/lib/date'
import { calculateStreak } from '@/lib/streak'
import type { Habit, HabitLog } from '@/lib/types'

interface HabitWithStatus extends Habit {
  completedToday: boolean
  streak: number
}

export default function HabitsRow() {
  const [habits, setHabits] = useState<HabitWithStatus[]>([])
  const todayISO = toISODate(new Date())

  async function loadHabits() {
    const { data: habitsData } = await supabase.from('habits').select('*')
    const { data: logsData } = await supabase.from('habit_logs').select('*')

    const habitsList = (habitsData as Habit[]) ?? []
    const logsList = (logsData as HabitLog[]) ?? []

    setHabits(
      habitsList.map((habit) => {
        const habitLogs = logsList.filter((log) => log.habit_id === habit.id)
        const todayLog = habitLogs.find((log) => log.date === todayISO)
        return {
          ...habit,
          completedToday: todayLog?.completed ?? false,
          streak: calculateStreak(habitLogs, new Date()),
        }
      })
    )
  }

  useEffect(() => {
    loadHabits()
  }, [])

  async function toggleHabit(habitId: string, current: boolean) {
    await supabase
      .from('habit_logs')
      .upsert({ habit_id: habitId, date: todayISO, completed: !current }, { onConflict: 'habit_id,date' })
    loadHabits()
  }

  return (
    <section className="px-4">
      <h2 className="text-sm font-medium text-text-secondary">Habits</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => toggleHabit(habit.id, habit.completedToday)}
            className={`flex min-h-[44px] items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-transform active:scale-95 ${
              habit.completedToday
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-surface-border bg-surface text-text-primary'
            }`}
          >
            <span>{habit.name}</span>
            {habit.streak > 0 && (
              <span className="flex items-center gap-0.5 text-xs opacity-80">
                <Flame size={12} strokeWidth={1.5} />
                {habit.streak}
              </span>
            )}
          </button>
        ))}
        {habits.length === 0 && <p className="text-text-secondary">Aucune habitude pour le moment</p>}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Replace app/page.tsx**

```tsx
import DateHeader from '@/components/DateHeader'
import SportCard from '@/components/SportCard'
import FoodCard from '@/components/FoodCard'
import HabitsRow from '@/components/HabitsRow'

export default function HomePage() {
  return (
    <main className="flex flex-col gap-4 pb-8">
      <DateHeader />
      <div className="flex flex-col gap-4 px-4">
        <SportCard />
        <FoodCard />
      </div>
      <HabitsRow />
    </main>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds. Note: Supabase calls will fail at runtime until env vars are set (Task 22 / external setup) — this is expected at this stage, we're only verifying the build compiles.

- [ ] **Step 4: Commit**

```bash
git add components/HabitsRow.tsx app/page.tsx
git commit -m "Assemble home page with SportCard, FoodCard, HabitsRow"
```

---

### Task 18: Sport page

**Files:**
- Create: `app/sport/page.tsx`

- [ ] **Step 1: Write app/sport/page.tsx**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getDayKey, toISODate } from '@/lib/date'
import type { DayOfWeek, Exercise, Workout, WorkoutLog } from '@/lib/types'

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mer' },
  { key: 'thursday', label: 'Jeu' },
  { key: 'friday', label: 'Ven' },
  { key: 'saturday', label: 'Sam' },
  { key: 'sunday', label: 'Dim' },
]

interface ExerciseLogState {
  sets: string
  reps: string
  weight: string
  rpe: string
  notes: string
  completed: boolean
}

export default function SportPage() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDayKey(new Date()))
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [logs, setLogs] = useState<Record<string, ExerciseLogState>>({})
  const todayISO = toISODate(new Date())

  useEffect(() => {
    async function load() {
      const { data: workoutData } = await supabase
        .from('workouts')
        .select('*')
        .eq('day_of_week', selectedDay)
        .single()

      const workoutRow = workoutData as Workout | null
      setWorkout(workoutRow)
      if (!workoutRow) return

      const { data: logsData } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('workout_id', workoutRow.id)
        .eq('date', todayISO)

      const logsByExercise: Record<string, ExerciseLogState> = {}
      for (const exercise of workoutRow.exercises as Exercise[]) {
        const existing = (logsData as WorkoutLog[] | null)?.find((log) => log.exercise === exercise.name)
        logsByExercise[exercise.name] = {
          sets: existing?.sets?.toString() ?? '',
          reps: existing?.reps ?? '',
          weight: existing?.weight?.toString() ?? '',
          rpe: existing?.rpe?.toString() ?? '',
          notes: existing?.notes ?? '',
          completed: existing?.completed ?? false,
        }
      }
      setLogs(logsByExercise)
    }

    load()
  }, [selectedDay, todayISO])

  function updateField(exercise: string, field: keyof ExerciseLogState, value: string | boolean) {
    setLogs((prev) => ({ ...prev, [exercise]: { ...prev[exercise], [field]: value } }))
  }

  async function saveExercise(exercise: string) {
    if (!workout) return
    const log = logs[exercise]
    await supabase.from('workout_logs').upsert(
      {
        date: todayISO,
        workout_id: workout.id,
        exercise,
        sets: log.sets ? Number(log.sets) : null,
        reps: log.reps || null,
        weight: log.weight ? Number(log.weight) : null,
        rpe: log.rpe ? Number(log.rpe) : null,
        notes: log.notes || null,
        completed: log.completed,
      },
      { onConflict: 'workout_id,date,exercise' }
    )
  }

  return (
    <main className="flex flex-col gap-4 pb-8">
      <header className="px-4 pt-6">
        <h1 className="text-lg font-medium text-text-primary">Sport</h1>
      </header>

      <div className="flex gap-2 overflow-x-auto px-4">
        {DAYS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedDay(key)}
            className={`min-h-[44px] shrink-0 rounded-2xl border px-4 py-2 text-sm transition-transform active:scale-95 ${
              selectedDay === key
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-surface-border bg-surface text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-4">
        <h2 className="text-lg font-medium text-text-primary">{workout?.name ?? 'Repos'}</h2>
        {(workout?.exercises as Exercise[] | undefined)?.map((exercise) => {
          const log = logs[exercise.name]
          if (!log) return null
          return (
            <div key={exercise.name} className="rounded-2xl border border-surface-border bg-surface p-4">
              <label className="flex min-h-[44px] items-center gap-3">
                <input
                  type="checkbox"
                  checked={log.completed}
                  onChange={(e) => {
                    updateField(exercise.name, 'completed', e.target.checked)
                    saveExercise(exercise.name)
                  }}
                  className="h-5 w-5 accent-[#7c9885]"
                />
                <span className="text-text-primary">
                  {exercise.name} <span className="text-text-secondary">{exercise.sets}x{exercise.reps}</span>
                </span>
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  Charge (kg)
                  <input
                    type="text"
                    inputMode="numeric"
                    value={log.weight}
                    onChange={(e) => updateField(exercise.name, 'weight', e.target.value)}
                    onBlur={() => saveExercise(exercise.name)}
                    className="rounded-xl border border-surface-border bg-background px-3 py-2 tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  Reps
                  <input
                    type="text"
                    value={log.reps}
                    onChange={(e) => updateField(exercise.name, 'reps', e.target.value)}
                    onBlur={() => saveExercise(exercise.name)}
                    className="rounded-xl border border-surface-border bg-background px-3 py-2 tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  RPE
                  <input
                    type="text"
                    inputMode="numeric"
                    value={log.rpe}
                    onChange={(e) => updateField(exercise.name, 'rpe', e.target.value)}
                    onBlur={() => saveExercise(exercise.name)}
                    className="rounded-xl border border-surface-border bg-background px-3 py-2 tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-text-secondary">
                  Notes
                  <input
                    type="text"
                    value={log.notes}
                    onChange={(e) => updateField(exercise.name, 'notes', e.target.value)}
                    onBlur={() => saveExercise(exercise.name)}
                    className="rounded-xl border border-surface-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
              </div>
            </div>
          )
        })}
        {workout && (workout.exercises as Exercise[]).length === 0 && (
          <p className="text-text-secondary">Jour libre — pas de structure fixe.</p>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/sport/page.tsx
git commit -m "Add sport page with week view and exercise logging"
```

---

### Task 19: Food page

**Files:**
- Create: `components/UndoToast.tsx`
- Create: `app/food/page.tsx`

- [ ] **Step 1: Write components/UndoToast.tsx**

```tsx
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
```

- [ ] **Step 2: Write app/food/page.tsx**

```tsx
'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import UndoToast from '@/components/UndoToast'
import type { Grocery } from '@/lib/types'

const CATEGORIES = ['Fruits & légumes', 'Épicerie', 'Frais', 'Autre']

export default function FoodPage() {
  const [items, setItems] = useState<Grocery[]>([])
  const [newItem, setNewItem] = useState('')
  const [newCategory, setNewCategory] = useState(CATEGORIES[CATEGORIES.length - 1])
  const [pendingDelete, setPendingDelete] = useState<Grocery | null>(null)

  async function loadItems() {
    const { data } = await supabase.from('groceries').select('*').order('created_at', { ascending: true })
    setItems((data as Grocery[]) ?? [])
  }

  useEffect(() => {
    loadItems()
  }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newItem.trim()) return
    await supabase.from('groceries').insert({ item: newItem.trim(), category: newCategory })
    setNewItem('')
    loadItems()
  }

  async function toggleChecked(item: Grocery) {
    await supabase.from('groceries').update({ checked: !item.checked }).eq('id', item.id)
    loadItems()
  }

  function requestDelete(item: Grocery) {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    setPendingDelete(item)
    setTimeout(() => {
      setPendingDelete((current) => {
        if (current?.id === item.id) {
          supabase.from('groceries').delete().eq('id', item.id)
          return null
        }
        return current
      })
    }, 4000)
  }

  function undoDelete() {
    if (pendingDelete) {
      setItems((prev) => [...prev, pendingDelete])
      setPendingDelete(null)
    }
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
          className="min-w-0 flex-1 rounded-2xl border border-surface-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
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
                    <span className={item.checked ? 'text-text-secondary line-through' : 'text-text-primary'}>
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

      {pendingDelete && <UndoToast message={`Supprimé : ${pendingDelete.item}`} onUndo={undoDelete} />}
    </main>
  )
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/UndoToast.tsx app/food/page.tsx
git commit -m "Add food page with grouped grocery list and undo-delete"
```

---

### Task 20: Habits page

**Files:**
- Create: `app/habits/page.tsx`

- [ ] **Step 1: Write app/habits/page.tsx**

```tsx
'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toISODate } from '@/lib/date'
import { calculateStreak } from '@/lib/streak'
import type { Habit, HabitLog } from '@/lib/types'

interface HabitWithStatus extends Habit {
  completedToday: boolean
  streak: number
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitWithStatus[]>([])
  const [newHabit, setNewHabit] = useState('')
  const todayISO = toISODate(new Date())

  async function loadHabits() {
    const { data: habitsData } = await supabase.from('habits').select('*').order('created_at')
    const { data: logsData } = await supabase.from('habit_logs').select('*')

    const habitsList = (habitsData as Habit[]) ?? []
    const logsList = (logsData as HabitLog[]) ?? []

    setHabits(
      habitsList.map((habit) => {
        const habitLogs = logsList.filter((log) => log.habit_id === habit.id)
        const todayLog = habitLogs.find((log) => log.date === todayISO)
        return {
          ...habit,
          completedToday: todayLog?.completed ?? false,
          streak: calculateStreak(habitLogs, new Date()),
        }
      })
    )
  }

  useEffect(() => {
    loadHabits()
  }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newHabit.trim()) return
    await supabase.from('habits').insert({ name: newHabit.trim(), icon: '' })
    setNewHabit('')
    loadHabits()
  }

  async function toggleHabit(habitId: string, current: boolean) {
    await supabase
      .from('habit_logs')
      .upsert({ habit_id: habitId, date: todayISO, completed: !current }, { onConflict: 'habit_id,date' })
    loadHabits()
  }

  return (
    <main className="flex flex-col gap-4 pb-8">
      <header className="px-4 pt-6">
        <h1 className="text-lg font-medium text-text-primary">Habits</h1>
      </header>

      <form onSubmit={handleAdd} className="flex gap-2 px-4">
        <input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Nouvelle habitude"
          className="min-w-0 flex-1 rounded-2xl border border-surface-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          className="min-h-[44px] min-w-[44px] rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-transform active:scale-95"
        >
          +
        </button>
      </form>

      <ul className="flex flex-col gap-2 px-4">
        {habits.map((habit) => (
          <li key={habit.id}>
            <button
              onClick={() => toggleHabit(habit.id, habit.completedToday)}
              className={`flex min-h-[44px] w-full items-center justify-between rounded-2xl border px-4 py-3 transition-transform active:scale-95 ${
                habit.completedToday
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-surface-border bg-surface text-text-primary'
              }`}
            >
              <span>{habit.name}</span>
              <span className="flex items-center gap-1 text-sm opacity-80">
                <Flame size={14} strokeWidth={1.5} />
                {habit.streak}
              </span>
            </button>
          </li>
        ))}
        {habits.length === 0 && <p className="text-text-secondary">Aucune habitude pour le moment</p>}
      </ul>
    </main>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/habits/page.tsx
git commit -m "Add habits page with streak tracking"
```

---

### Task 21: Settings page

**Files:**
- Create: `app/settings/page.tsx`

- [ ] **Step 1: Write app/settings/page.tsx**

```tsx
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
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/settings/page.tsx
git commit -m "Add settings page with disabled Whoop/Calendar placeholders"
```

---

### Task 22: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: PASS — 10 tests across `date.test.ts` and `streak.test.ts`.

- [ ] **Step 2: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds, all 5 routes (`/`, `/sport`, `/food`, `/habits`, `/settings`) listed in the build output.

- [ ] **Step 4: Manual walkthrough with placeholder env vars**

Create a local `.env.local` (not committed) with dummy values so the app boots:
```
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
NEXT_PUBLIC_APP_PIN=1234
```

Run: `npm run dev`, open `http://localhost:3000` in a browser.

Verify:
- The PIN screen appears; entering `1234` unlocks the app and the choice persists on reload
- The bottom nav shows 5 tabs with correct icons/labels and highlights the active tab
- All 5 pages render without crashing (Supabase calls will fail silently/return empty since the project doesn't exist yet — that's expected; full data flow is verified after the real Supabase project is created)
- Resize the browser to a mobile viewport (375×812) and confirm no horizontal scroll, touch targets look adequately sized, and the bottom nav respects the bottom of the screen

- [ ] **Step 5: Delete the placeholder .env.local**

Run: `rm .env.local` (it was only for this manual check; real values are added during the guided Supabase/Vercel setup).

- [ ] **Step 6: Final commit if any stray files changed**

```bash
git status
```
If clean, no commit needed — this task is verification-only.

---

## After this plan

Once all 22 tasks are complete and verified, the remaining work is the guided **external setup** described in the spec (`docs/superpowers/specs/2026-07-20-daily-tracker-design.md`, section "Setup externe requis"): creating the real Supabase project, running the migration, setting real env vars, and deploying to Vercel. That is a manual, user-driven walkthrough — not additional coding tasks.
