import { describe, it, expect } from 'vitest'
import { formatDate, sum, isValidEmail } from './utils'

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date)).toBe('2024-01-15')
  })

  it('should pad single digit months and days', () => {
    const date = new Date('2024-03-05')
    expect(formatDate(date)).toBe('2024-03-05')
  })
})

describe('sum', () => {
  it('should return sum of numbers', () => {
    expect(sum([1, 2, 3])).toBe(6)
  })

  it('should return 0 for empty array', () => {
    expect(sum([])).toBe(0)
  })

  it('should handle negative numbers', () => {
    expect(sum([-1, 1, 5])).toBe(5)
  })
})

describe('isValidEmail', () => {
  it('should return true for valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
  })

  it('should return false for invalid email', () => {
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('test@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
  })
})
