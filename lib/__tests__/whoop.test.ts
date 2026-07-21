import { describe, it, expect } from 'vitest'
import { buildAuthUrl, computeExpiresAt, needsRefresh, mapSummary } from '../whoop'

describe('buildAuthUrl', () => {
  it('builds the Whoop authorize URL with all required params', () => {
    const url = new URL(
      buildAuthUrl({
        clientId: 'my-client',
        redirectUri: 'https://app.example/api/whoop/callback',
        state: 'abc123',
      })
    )
    expect(url.origin + url.pathname).toBe('https://api.prod.whoop.com/oauth/oauth2/auth')
    expect(url.searchParams.get('client_id')).toBe('my-client')
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.example/api/whoop/callback')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('state')).toBe('abc123')
    expect(url.searchParams.get('scope')).toBe(
      'offline read:recovery read:sleep read:cycles read:workout'
    )
  })
})

describe('computeExpiresAt', () => {
  it('adds expires_in seconds to now and returns an ISO string', () => {
    const now = Date.parse('2026-07-21T10:00:00.000Z')
    expect(computeExpiresAt(now, 3600)).toBe('2026-07-21T11:00:00.000Z')
  })
})

describe('needsRefresh', () => {
  const now = Date.parse('2026-07-21T10:00:00.000Z')

  it('returns false when expiry is comfortably in the future', () => {
    expect(needsRefresh('2026-07-21T11:00:00.000Z', now)).toBe(false)
  })

  it('returns true within the 60s safety margin', () => {
    expect(needsRefresh('2026-07-21T10:00:30.000Z', now)).toBe(true)
  })

  it('returns true when already expired', () => {
    expect(needsRefresh('2026-07-21T09:00:00.000Z', now)).toBe(true)
  })
})

describe('mapSummary', () => {
  const recovery = {
    records: [
      { score_state: 'SCORED', score: { recovery_score: 67, resting_heart_rate: 52 } },
    ],
  }
  const sleep = {
    records: [
      {
        score_state: 'SCORED',
        score: {
          sleep_performance_percentage: 85,
          stage_summary: {
            total_in_bed_time_milli: 28_800_000,
            total_awake_time_milli: 1_800_000,
          },
        },
      },
    ],
  }
  const cycle = {
    records: [{ score_state: 'SCORED', score: { strain: 12.437 } }],
  }

  it('maps full responses to the compact summary shape', () => {
    expect(mapSummary(recovery, sleep, cycle)).toEqual({
      recovery: 67,
      sleep: { durationMinutes: 450, performance: 85 },
      strain: 12.4,
    })
  })

  it('returns null blocks for null inputs', () => {
    expect(mapSummary(null, null, null)).toEqual({ recovery: null, sleep: null, strain: null })
  })

  it('returns null blocks for empty record lists', () => {
    expect(mapSummary({ records: [] }, { records: [] }, { records: [] })).toEqual({
      recovery: null,
      sleep: null,
      strain: null,
    })
  })

  it('returns null blocks when score_state is not SCORED', () => {
    const pending = { records: [{ score_state: 'PENDING_SCORE', score: null }] }
    expect(mapSummary(pending, pending, pending)).toEqual({
      recovery: null,
      sleep: null,
      strain: null,
    })
  })
})
