import { describe, it, expect } from 'vitest'
import { getDayKey, toISODate, formatDateFR } from '../date'

describe('getDayKey', () => {
  it('returns monday for a known Monday', () => {
    expect(getDayKey(new Date(2026, 6, 20))).toBe('monday')
  })

  it('returns sunday for a known Sunday', () => {
    expect(getDayKey(new Date(2026, 6, 19))).toBe('sunday')
  })
})

describe('toISODate', () => {
  it('formats a date as YYYY-MM-DD using local date parts', () => {
    expect(toISODate(new Date(2026, 6, 20))).toBe('2026-07-20')
  })

  it('pads single-digit month and day', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('formatDateFR', () => {
  it('formats with a capitalized weekday in French', () => {
    expect(formatDateFR(new Date(2026, 6, 20))).toBe('lundi 20 juillet 2026'.replace(/^./, (c) => c.toUpperCase()))
  })
})
