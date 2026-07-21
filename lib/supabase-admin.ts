import { createClient } from '@supabase/supabase-js'

// Server-only client. Bypasses RLS via the service_role key.
// NEVER import this from a component — route handlers only.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key',
  { auth: { persistSession: false } }
)
