# Whoop Connector Implementation Plan (Phase 2A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the user's Whoop account via OAuth and display today's recovery, sleep, and strain on the home page of "Daily".

**Architecture:** First server-side code in the app: four Next.js route handlers (`/api/whoop/connect|callback|summary|disconnect`) keep `WHOOP_CLIENT_SECRET` and the Supabase `service_role` key strictly server-side. Tokens live in a singleton `whoop_tokens` table protected by RLS-with-no-policies (invisible to the public anon key), accessed only through a dedicated admin client. Pure logic (auth URL building, expiry math, API response mapping) is extracted into `lib/whoop.ts` and TDD-tested; route handlers are verified end-to-end against the real Whoop API.

**Tech Stack:** Next.js 14 route handlers, Supabase (service_role client), Whoop API v2, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-07-21-whoop-connector-design.md`

**Project root:** `C:\Users\naelc\Documents\App tracker` (all paths relative to this root; work directly on `master` per established project convention)

**Critical Whoop API facts (verify against docs if anything 404s):**
- Authorize URL: `https://api.prod.whoop.com/oauth/oauth2/auth`
- Token URL: `https://api.prod.whoop.com/oauth/oauth2/token`
- The `offline` scope MUST be requested at authorization time or Whoop returns no refresh token.
- v2 data endpoints (v1 is deprecated): `/developer/v2/recovery?limit=1`, `/developer/v2/activity/sleep?limit=1`, `/developer/v2/cycle?limit=1`, all on `https://api.prod.whoop.com`, `Authorization: Bearer <access_token>`.
- Next.js 14 GET route handlers can be statically cached at build time — every route in this plan MUST carry `export const dynamic = 'force-dynamic'`.

---

### Task 1: Whoop tokens migration

**Files:**
- Create: `supabase/migrations/0002_whoop.sql`

- [ ] **Step 1: Write the migration**

```sql
create table whoop_tokens (
  id integer primary key default 1 check (id = 1),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table whoop_tokens enable row level security;
-- No policies on purpose: with RLS enabled and zero policies, the public anon
-- key can neither read nor write this table. Only the service_role client
-- (server-only) bypasses RLS.
```

- [ ] **Step 2: Review for syntax correctness**

Read the file back: balanced parens, trailing semicolons, the `check (id = 1)` singleton constraint present, `enable row level security` present, and no `create policy` statements. This migration is applied manually against the real Supabase project during final verification (Task 11) — it cannot be tested locally.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0002_whoop.sql
git commit -m "Add whoop_tokens migration with RLS lockdown"
```

---

### Task 2: Env template and recovery-zone color tokens

**Files:**
- Modify: `.env.local.example`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace .env.local.example**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_PIN=
NEXT_PUBLIC_APP_URL=
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 2: Add warning/danger color tokens**

In `tailwind.config.ts`, extend the `colors` object (keep all existing tokens unchanged):

```ts
      colors: {
        background: '#1c1917',
        surface: '#262220',
        'surface-border': '#3a3532',
        'text-primary': '#fafaf9',
        'text-secondary': '#a8a29e',
        accent: '#7c9885',
        'accent-foreground': '#1c1917',
        warning: '#d9a662',
        danger: '#c1666b',
      },
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds (no consumer of the new tokens yet).

- [ ] **Step 4: Commit**

```bash
git add .env.local.example tailwind.config.ts
git commit -m "Add Whoop env template entries and warning/danger color tokens"
```

---

### Task 3: Pure Whoop logic (TDD)

**Files:**
- Create: `lib/whoop.ts`
- Test: `lib/__tests__/whoop.test.ts`

- [ ] **Step 1: Write the failing tests**

Write `lib/__tests__/whoop.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildAuthUrl, computeExpiresAt, needsRefresh, mapSummary } from '../whoop'

describe('buildAuthUrl', () => {
  it('builds the Whoop authorize URL with all required params', () => {
    const url = new URL(
      buildAuthUrl({
        clientId: 'my-client',
        redirectUri: 'https://app.example/api/whoop/callback',
        state: 'abc123',
      })
    )
    expect(url.origin + url.pathname).toBe('https://api.prod.whoop.com/oauth/oauth2/auth')
    expect(url.searchParams.get('client_id')).toBe('my-client')
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.example/api/whoop/callback')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('state')).toBe('abc123')
    expect(url.searchParams.get('scope')).toBe(
      'offline read:recovery read:sleep read:cycles read:workout'
    )
  })
})

describe('computeExpiresAt', () => {
  it('adds expires_in seconds to now and returns an ISO string', () => {
    const now = Date.parse('2026-07-21T10:00:00.000Z')
    expect(computeExpiresAt(now, 3600)).toBe('2026-07-21T11:00:00.000Z')
  })
})

describe('needsRefresh', () => {
  const now = Date.parse('2026-07-21T10:00:00.000Z')

  it('returns false when expiry is comfortably in the future', () => {
    expect(needsRefresh('2026-07-21T11:00:00.000Z', now)).toBe(false)
  })

  it('returns true within the 60s safety margin', () => {
    expect(needsRefresh('2026-07-21T10:00:30.000Z', now)).toBe(true)
  })

  it('returns true when already expired', () => {
    expect(needsRefresh('2026-07-21T09:00:00.000Z', now)).toBe(true)
  })
})

describe('mapSummary', () => {
  const recovery = {
    records: [
      { score_state: 'SCORED', score: { recovery_score: 67, resting_heart_rate: 52 } },
    ],
  }
  const sleep = {
    records: [
      {
        score_state: 'SCORED',
        score: {
          sleep_performance_percentage: 85,
          stage_summary: {
            total_in_bed_time_milli: 28_800_000,
            total_awake_time_milli: 1_800_000,
          },
        },
      },
    ],
  }
  const cycle = {
    records: [{ score_state: 'SCORED', score: { strain: 12.437 } }],
  }

  it('maps full responses to the compact summary shape', () => {
    expect(mapSummary(recovery, sleep, cycle)).toEqual({
      recovery: 67,
      sleep: { durationMinutes: 450, performance: 85 },
      strain: 12.4,
    })
  })

  it('returns null blocks for null inputs', () => {
    expect(mapSummary(null, null, null)).toEqual({ recovery: null, sleep: null, strain: null })
  })

  it('returns null blocks for empty record lists', () => {
    expect(mapSummary({ records: [] }, { records: [] }, { records: [] })).toEqual({
      recovery: null,
      sleep: null,
      strain: null,
    })
  })

  it('returns null blocks when score_state is not SCORED', () => {
    const pending = { records: [{ score_state: 'PENDING_SCORE', score: null }] }
    expect(mapSummary(pending, pending, pending)).toEqual({
      recovery: null,
      sleep: null,
      strain: null,
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `Cannot find module '../whoop'`.

- [ ] **Step 3: Write the implementation**

Write `lib/whoop.ts`:

```ts
export const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth'
export const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'
export const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer/v2'

export const WHOOP_SCOPES = 'offline read:recovery read:sleep read:cycles read:workout'

export function buildAuthUrl(params: {
  clientId: string
  redirectUri: string
  state: string
}): string {
  const url = new URL(WHOOP_AUTH_URL)
  url.searchParams.set('client_id', params.clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', WHOOP_SCOPES)
  url.searchParams.set('state', params.state)
  return url.toString()
}

export function computeExpiresAt(nowMs: number, expiresInSeconds: number): string {
  return new Date(nowMs + expiresInSeconds * 1000).toISOString()
}

const REFRESH_MARGIN_MS = 60_000

export function needsRefresh(expiresAtIso: string, nowMs: number): boolean {
  return Date.parse(expiresAtIso) - nowMs <= REFRESH_MARGIN_MS
}

interface WhoopRecord {
  score_state?: string
  score?: Record<string, unknown> | null
}

interface WhoopCollection {
  records?: WhoopRecord[]
}

export interface WhoopSummaryData {
  recovery: number | null
  sleep: { durationMinutes: number; performance: number } | null
  strain: number | null
}

function scoredRecord(collection: WhoopCollection | null): Record<string, unknown> | null {
  const record = collection?.records?.[0]
  if (!record || record.score_state !== 'SCORED' || !record.score) return null
  return record.score
}

export function mapSummary(
  recovery: WhoopCollection | null,
  sleep: WhoopCollection | null,
  cycle: WhoopCollection | null
): WhoopSummaryData {
  const recoveryScore = scoredRecord(recovery)
  const sleepScore = scoredRecord(sleep)
  const cycleScore = scoredRecord(cycle)

  let sleepBlock: WhoopSummaryData['sleep'] = null
  if (sleepScore) {
    const stages = sleepScore.stage_summary as
      | { total_in_bed_time_milli?: number; total_awake_time_milli?: number }
      | undefined
    const inBed = stages?.total_in_bed_time_milli
    const awake = stages?.total_awake_time_milli
    const performance = sleepScore.sleep_performance_percentage
    if (typeof inBed === 'number' && typeof awake === 'number' && typeof performance === 'number') {
      sleepBlock = {
        durationMinutes: Math.round((inBed - awake) / 60_000),
        performance,
      }
    }
  }

  return {
    recovery:
      typeof recoveryScore?.recovery_score === 'number' ? recoveryScore.recovery_score : null,
    sleep: sleepBlock,
    strain:
      typeof cycleScore?.strain === 'number'
        ? Math.round((cycleScore.strain as number) * 10) / 10
        : null,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS — all tests green (previous 10 + the new whoop tests).

- [ ] **Step 5: Commit**

```bash
git add lib/whoop.ts lib/__tests__/whoop.test.ts
git commit -m "Add pure Whoop OAuth/summary logic with tests"
```

---

### Task 4: Admin Supabase client and token store

**Files:**
- Create: `lib/supabase-admin.ts`
- Create: `lib/whoop-tokens.ts`

- [ ] **Step 1: Write lib/supabase-admin.ts**

```ts
import { createClient } from '@supabase/supabase-js'

// Server-only client. Bypasses RLS via the service_role key.
// NEVER import this from a component — route handlers only.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key',
  { auth: { persistSession: false } }
)
```

(The `??` fallbacks mirror `lib/supabase.ts` — they keep `next build` from crashing when env vars are absent at build time; real values are required at runtime.)

- [ ] **Step 2: Write lib/whoop-tokens.ts**

```ts
import { supabaseAdmin } from './supabase-admin'

export interface WhoopTokens {
  access_token: string
  refresh_token: string
  expires_at: string
}

export async function getWhoopTokens(): Promise<WhoopTokens | null> {
  const { data, error } = await supabaseAdmin
    .from('whoop_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('id', 1)
    .maybeSingle()
  if (error) {
    console.error('Failed to read Whoop tokens:', error)
    return null
  }
  return (data as WhoopTokens | null) ?? null
}

export async function saveWhoopTokens(tokens: WhoopTokens): Promise<void> {
  const { error } = await supabaseAdmin
    .from('whoop_tokens')
    .upsert({ id: 1, ...tokens, updated_at: new Date().toISOString() })
  if (error) {
    console.error('Failed to save Whoop tokens:', error)
    throw new Error('whoop_tokens upsert failed')
  }
}

export async function deleteWhoopTokens(): Promise<void> {
  const { error } = await supabaseAdmin.from('whoop_tokens').delete().eq('id', 1)
  if (error) {
    console.error('Failed to delete Whoop tokens:', error)
  }
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase-admin.ts lib/whoop-tokens.ts
git commit -m "Add server-only Supabase admin client and Whoop token store"
```

---

### Task 5: Connect route

**Files:**
- Create: `app/api/whoop/connect/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from 'next/server'
import { buildAuthUrl } from '@/lib/whoop'

export const dynamic = 'force-dynamic'

export function GET() {
  const clientId = process.env.WHOOP_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!clientId || !appUrl) {
    console.error('Missing WHOOP_CLIENT_ID or NEXT_PUBLIC_APP_URL')
    return NextResponse.redirect(new URL('/settings?whoop=error', appUrl ?? 'http://localhost:3000'))
  }

  const state = crypto.randomUUID()
  const authUrl = buildAuthUrl({
    clientId,
    redirectUri: `${appUrl}/api/whoop/callback`,
    state,
  })

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('whoop_oauth_state', state, {
    httpOnly: true,
    secure: appUrl.startsWith('https'),
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return response
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/whoop/connect/route.ts
git commit -m "Add Whoop OAuth connect route"
```

---

### Task 6: Callback route

**Files:**
- Create: `app/api/whoop/callback/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { WHOOP_TOKEN_URL, computeExpiresAt } from '@/lib/whoop'
import { saveWhoopTokens } from '@/lib/whoop-tokens'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const errorRedirect = NextResponse.redirect(new URL('/settings?whoop=error', appUrl))

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const cookieState = request.cookies.get('whoop_oauth_state')?.value

  if (!code || !state || !cookieState || state !== cookieState) {
    console.error('Whoop callback: missing code or state mismatch')
    return errorRedirect
  }

  const clientId = process.env.WHOOP_CLIENT_ID
  const clientSecret = process.env.WHOOP_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('Whoop callback: missing client credentials')
    return errorRedirect
  }

  try {
    const tokenResponse = await fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appUrl}/api/whoop/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Whoop token exchange failed:', tokenResponse.status, await tokenResponse.text())
      return errorRedirect
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string
      refresh_token: string
      expires_in: number
    }

    await saveWhoopTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: computeExpiresAt(Date.now(), tokens.expires_in),
    })

    const response = NextResponse.redirect(new URL('/settings?whoop=connected', appUrl))
    response.cookies.delete('whoop_oauth_state')
    return response
  } catch (error) {
    console.error('Whoop callback error:', error)
    return errorRedirect
  }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/whoop/callback/route.ts
git commit -m "Add Whoop OAuth callback route with state verification"
```

---

### Task 7: Summary route

**Files:**
- Create: `app/api/whoop/summary/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from 'next/server'
import { WHOOP_API_BASE, WHOOP_TOKEN_URL, computeExpiresAt, mapSummary, needsRefresh } from '@/lib/whoop'
import { deleteWhoopTokens, getWhoopTokens, saveWhoopTokens, type WhoopTokens } from '@/lib/whoop-tokens'

export const dynamic = 'force-dynamic'

const NOT_CONNECTED = { connected: false as const }

async function refreshTokens(tokens: WhoopTokens): Promise<WhoopTokens | null> {
  const clientId = process.env.WHOOP_CLIENT_ID
  const clientSecret = process.env.WHOOP_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('Whoop refresh: missing client credentials')
    return null
  }

  const response = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'offline',
    }),
  })

  if (!response.ok) {
    console.error('Whoop token refresh failed:', response.status, await response.text())
    return null
  }

  const fresh = (await response.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }
  const updated: WhoopTokens = {
    access_token: fresh.access_token,
    refresh_token: fresh.refresh_token,
    expires_at: computeExpiresAt(Date.now(), fresh.expires_in),
  }
  await saveWhoopTokens(updated)
  return updated
}

async function whoopGet(path: string, accessToken: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(`${WHOOP_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (!response.ok) {
      console.error(`Whoop API ${path} failed:`, response.status)
      return null
    }
    return (await response.json()) as Record<string, unknown>
  } catch (error) {
    console.error(`Whoop API ${path} error:`, error)
    return null
  }
}

export async function GET() {
  let tokens = await getWhoopTokens()
  if (!tokens) {
    return NextResponse.json(NOT_CONNECTED, { headers: { 'Cache-Control': 'no-store' } })
  }

  if (needsRefresh(tokens.expires_at, Date.now())) {
    const refreshed = await refreshTokens(tokens)
    if (!refreshed) {
      await deleteWhoopTokens()
      return NextResponse.json(NOT_CONNECTED, { headers: { 'Cache-Control': 'no-store' } })
    }
    tokens = refreshed
  }

  const [recovery, sleep, cycle] = await Promise.all([
    whoopGet('/recovery?limit=1', tokens.access_token),
    whoopGet('/activity/sleep?limit=1', tokens.access_token),
    whoopGet('/cycle?limit=1', tokens.access_token),
  ])

  return NextResponse.json(
    { connected: true, ...mapSummary(recovery, sleep, cycle) },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/whoop/summary/route.ts
git commit -m "Add Whoop summary route with token refresh"
```

---

### Task 8: Disconnect route

**Files:**
- Create: `app/api/whoop/disconnect/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { deleteWhoopTokens } from '@/lib/whoop-tokens'

export const dynamic = 'force-dynamic'

export async function POST() {
  await deleteWhoopTokens()
  return new Response(null, { status: 204 })
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/whoop/disconnect/route.ts
git commit -m "Add Whoop disconnect route"
```

---

### Task 9: WhoopCard on the home page

**Files:**
- Create: `components/WhoopCard.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write components/WhoopCard.tsx**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from './Card'
import type { WhoopSummaryData } from '@/lib/whoop'

type SummaryState =
  | { status: 'loading' }
  | { status: 'disconnected' }
  | ({ status: 'connected' } & WhoopSummaryData)

function recoveryColor(score: number): string {
  if (score >= 67) return 'text-accent'
  if (score >= 34) return 'text-warning'
  return 'text-danger'
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

export default function WhoopCard() {
  const [summary, setSummary] = useState<SummaryState>({ status: 'loading' })

  useEffect(() => {
    fetch('/api/whoop/summary')
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) {
          setSummary({ status: 'connected', recovery: data.recovery, sleep: data.sleep, strain: data.strain })
        } else {
          setSummary({ status: 'disconnected' })
        }
      })
      .catch((error) => {
        console.error('Failed to load Whoop summary:', error)
        setSummary({ status: 'disconnected' })
      })
  }, [])

  if (summary.status === 'loading') {
    return (
      <Card>
        <h2 className="text-sm font-medium text-text-secondary">Whoop</h2>
        <p className="mt-2 text-text-secondary">Chargement...</p>
      </Card>
    )
  }

  if (summary.status === 'disconnected') {
    return (
      <Card>
        <h2 className="text-sm font-medium text-text-secondary">Whoop</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Whoop non connecté —{' '}
          <Link href="/settings" className="text-accent underline-offset-2 hover:underline">
            connecter
          </Link>
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-sm font-medium text-text-secondary">Whoop</h2>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className={`text-xl font-semibold tabular-nums ${summary.recovery !== null ? recoveryColor(summary.recovery) : 'text-text-secondary'}`}>
            {summary.recovery !== null ? `${summary.recovery} %` : '—'}
          </p>
          <p className="text-xs text-text-secondary">Récupération</p>
        </div>
        <div>
          <p className="text-xl font-semibold tabular-nums text-text-primary">
            {summary.sleep ? formatDuration(summary.sleep.durationMinutes) : '—'}
          </p>
          <p className="text-xs text-text-secondary">
            {summary.sleep ? `Sommeil · ${summary.sleep.performance} %` : 'Sommeil'}
          </p>
        </div>
        <div>
          <p className="text-xl font-semibold tabular-nums text-text-primary">
            {summary.strain !== null ? summary.strain : '—'}
          </p>
          <p className="text-xs text-text-secondary">Strain</p>
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Add WhoopCard to app/page.tsx**

Replace `app/page.tsx` with:

```tsx
export const dynamic = 'force-dynamic'

import DateHeader from '@/components/DateHeader'
import WhoopCard from '@/components/WhoopCard'
import SportCard from '@/components/SportCard'
import FoodCard from '@/components/FoodCard'
import HabitsRow from '@/components/HabitsRow'

export default function HomePage() {
  return (
    <main className="flex flex-col gap-4 pb-8">
      <DateHeader />
      <div className="flex flex-col gap-4 px-4">
        <WhoopCard />
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
Expected: succeeds; `/` still shows as `ƒ` (Dynamic) and the new `/api/whoop/*` routes appear in the route table as `ƒ`.

- [ ] **Step 4: Commit**

```bash
git add components/WhoopCard.tsx app/page.tsx
git commit -m "Add WhoopCard with recovery/sleep/strain to home page"
```

---

### Task 10: Settings page with live Whoop status

**Files:**
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: Replace app/settings/page.tsx**

(The page becomes a Client Component: it now has state and effects. It reads `?whoop=` via `window.location.search` inside `useEffect` — NOT `useSearchParams`, which would require a Suspense boundary in Next 14.)

```tsx
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
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` then `npx next lint`
Expected: no errors, no warnings.

- [ ] **Step 3: Commit**

```bash
git add app/settings/page.tsx
git commit -m "Wire live Whoop connect/disconnect status into settings page"
```

---

### Task 11: Final verification and deployment

**Files:** none (verification + user-assisted external setup)

- [ ] **Step 1: Full local check**

Run: `npm run test && npx tsc --noEmit && npx next lint && npm run build`
Expected: all tests pass (10 previous + new whoop tests), zero type errors, zero lint warnings, build succeeds with `/api/whoop/connect|callback|summary|disconnect` all listed as `ƒ` in the route table.

- [ ] **Step 2: Apply migration 0002 to the real Supabase project (user does this)**

User pastes `supabase/migrations/0002_whoop.sql` into the Supabase SQL Editor and runs it. Verify in Table Editor: `whoop_tokens` exists and shows the RLS badge WITHOUT "unrestricted" (RLS enabled, unlike the Phase 1 tables). Independently verify lockdown from the dev machine:

```bash
curl -s "https://swxmvmagwxxcvsdclfny.supabase.co/rest/v1/whoop_tokens?select=*" -H "apikey: <ANON_KEY>"
```
Expected: `[]` (empty — anon key sees nothing even once tokens exist; RLS filters all rows).

- [ ] **Step 3: Add env vars to Vercel (user does this)**

In the Vercel project settings → Environment Variables, user adds:
- `WHOOP_CLIENT_ID` = `1fbdb943-69e0-43ab-a119-319460ecaa18`
- `WHOOP_CLIENT_SECRET` = (user's secret, typed by the user directly)
- `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase dashboard → Project Settings → API → service_role; typed by the user directly)
- `NEXT_PUBLIC_APP_URL` = `https://daily-eight-pi.vercel.app`

- [ ] **Step 4: Push and deploy**

```bash
git push
```
Vercel auto-deploys. Wait for the deployment to finish.

- [ ] **Step 5: End-to-end OAuth test in production (user-assisted)**

1. Open `https://daily-eight-pi.vercel.app/settings`, tap "Connecter Whoop"
2. Log into Whoop, approve the scopes
3. Expect redirect back to `/settings` with the "Whoop connecté avec succès" banner and the "Whoop connecté ✓" state
4. Open the home page: the Whoop card should show real recovery/sleep/strain values
5. Verify `curl "https://swxmvmagwxxcvsdclfny.supabase.co/rest/v1/whoop_tokens?select=*" -H "apikey: <ANON_KEY>"` still returns `[]` (tokens invisible to the public key)

- [ ] **Step 6: Confirm clean tree**

```bash
git status
```
Expected: clean (no stray `.env.local` committed).

---

## After this plan

Sub-projects B (workout memory), C (dashboard + goals), and D (meal prep) each get their own spec review → plan → implementation cycle, per the Phase 2 decomposition.
