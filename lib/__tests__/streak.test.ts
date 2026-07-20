import { describe, it, expect } from 'vitest'
import { calculateStreak } from '../streak'

describe('calculateStreak', () => {
  it('returns 0 when today is not completed', () => {
    const logs = [{ date: '2026-07-19', completed: true }]
    expect(calculateStreak(logs, new Date(2026, 6, 20))).toBe(0)
  })

  it('counts consecutive completed days ending today', () => {
    const logs = [
      { date: '2026-07-20', completed: true },
      { date: '2026-07-19', completed: true },
      { date: '2026-07-18', completed: true },
      { date: '2026-07-17', completed: false },
    ]
    expect(calculateStreak(logs, new Date(2026, 6, 20))).toBe(3)
  })

  it('stops at the first gap', () => {
    const logs = [
      { date: '2026-07-20', completed: true },
      { date: '2026-07-18', completed: true },
    ]
    expect(calculateStreak(logs, new Date(2026, 6, 20))).toBe(1)
  })

  it('ignores completed=false entries', () => {
    const logs = [{ date: '2026-07-20', completed: false }]
    expect(calculateStreak(logs, new Date(2026, 6, 20))).toBe(0)
  })

  it('returns 0 for an empty log list', () => {
    expect(calculateStreak([], new Date(2026, 6, 20))).toBe(0)
  })
})
