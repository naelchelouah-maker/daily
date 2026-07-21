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
