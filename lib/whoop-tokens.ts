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
