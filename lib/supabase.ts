import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazily construct the client so that importing this module never throws.
// Client components (e.g. app/food/page.tsx, app/habits/page.tsx) that are
// not marked `force-dynamic` are still evaluated during `next build`'s
// static prerendering pass on the server, before any real env vars need to
// exist there. All actual usages of `supabase` happen inside event handlers
// or effects that only run in the browser, so deferring client creation
// until first property access avoids a hard crash at build time when env
// vars are absent, while behaving identically at runtime.
let client: SupabaseClient | undefined

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver)
  },
})
