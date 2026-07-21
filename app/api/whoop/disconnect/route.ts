import { deleteWhoopTokens } from '@/lib/whoop-tokens'

export const dynamic = 'force-dynamic'

export async function POST() {
  await deleteWhoopTokens()
  return new Response(null, { status: 204 })
}
