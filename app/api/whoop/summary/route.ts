import { NextResponse } from 'next/server'
import { WHOOP_API_BASE, WHOOP_TOKEN_URL, computeExpiresAt, mapSummary, needsRefresh } from '@/lib/whoop'
import { deleteWhoopTokens, getWhoopTokens, saveWhoopTokens, type WhoopTokens } from '@/lib/whoop-tokens'

export const dynamic = 'force-dynamic'

const NOT_CONNECTED = { connected: false as const }

function notConnectedResponse() {
  return NextResponse.json(NOT_CONNECTED, { headers: { 'Cache-Control': 'no-store' } })
}

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
    return notConnectedResponse()
  }

  if (needsRefresh(tokens.expires_at, Date.now())) {
    let refreshed: WhoopTokens | null = null
    try {
      refreshed = await refreshTokens(tokens)
    } catch (error) {
      console.error('Whoop refresh error:', error)
    }
    if (!refreshed) {
      await deleteWhoopTokens()
      return notConnectedResponse()
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
