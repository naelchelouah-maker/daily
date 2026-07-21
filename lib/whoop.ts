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
