import { NextRequest, NextResponse } from 'next/server'
import { WHOOP_TOKEN_URL, computeExpiresAt } from '@/lib/whoop'
import { saveWhoopTokens } from '@/lib/whoop-tokens'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  function errorRedirect() {
    const response = NextResponse.redirect(new URL('/settings?whoop=error', appUrl))
    response.cookies.delete('whoop_oauth_state')
    return response
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const cookieState = request.cookies.get('whoop_oauth_state')?.value
  const oauthError = request.nextUrl.searchParams.get('error')

  if (oauthError) {
    console.error('Whoop callback: authorization denied or failed:', oauthError)
    return errorRedirect()
  }

  if (!code || !state || !cookieState || state !== cookieState) {
    console.error('Whoop callback: missing code or state mismatch')
    return errorRedirect()
  }

  const clientId = process.env.WHOOP_CLIENT_ID
  const clientSecret = process.env.WHOOP_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('Whoop callback: missing client credentials')
    return errorRedirect()
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
      return errorRedirect()
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string
      refresh_token: string
      expires_in: number
    }

    console.error('DEBUG callback: expires_in=', tokens.expires_in, 'typeof=', typeof tokens.expires_in)

    const expiresAt = computeExpiresAt(Date.now(), tokens.expires_in)
    console.error('DEBUG callback: computed expires_at=', expiresAt, 'now=', new Date().toISOString())

    await saveWhoopTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
    })

    const response = NextResponse.redirect(new URL('/settings?whoop=connected', appUrl))
    response.cookies.delete('whoop_oauth_state')
    return response
  } catch (error) {
    console.error('Whoop callback error:', error)
    return errorRedirect()
  }
}
