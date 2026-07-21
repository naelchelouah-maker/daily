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
