import { NextRequest, NextResponse } from 'next/server'
import { buildAuthUrl } from '@/lib/whoop'

export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  const clientId = process.env.WHOOP_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!clientId || !appUrl) {
    console.error('Missing WHOOP_CLIENT_ID or NEXT_PUBLIC_APP_URL')
    return NextResponse.redirect(new URL('/settings?whoop=error', appUrl ?? 'http://localhost:3000'))
  }

  // Vercel serves this route from both the stable app URL and per-deployment
  // URLs (e.g. daily-<hash>-<team>.vercel.app). The OAuth state cookie is
  // host-scoped, but the callback always returns to NEXT_PUBLIC_APP_URL (the
  // only redirect_uri registered with Whoop). If a request arrives on a
  // different host, bounce to the canonical host first so the cookie set
  // here is actually visible when the callback runs there.
  // Note: `request.nextUrl.origin` reflects the server's bind address, not
  // the incoming Host header, so the actual request host must be read
  // directly from the `host` header instead.
  const canonicalHost = new URL(appUrl).host
  const requestHost = request.headers.get('host')
  if (requestHost !== canonicalHost) {
    const canonicalOrigin = new URL(appUrl).origin
    return NextResponse.redirect(`${canonicalOrigin}/api/whoop/connect`)
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
