import { describe, it, expect } from 'vitest'
import { getDashboardStats, calculateGrowthRate, formatCurrency } from './stats'

describe('getDashboardStats', () => {
  it('should return dashboard stats object', () => {
    const stats = getDashboardStats()
    expect(stats).toHaveProperty('totalUsers')
    expect(stats).toHaveProperty('activeSessions')
    expect(stats).toHaveProperty('revenue')
  })

  it('should return positive numbers', () => {
    const stats = getDashboardStats()
    expect(stats.totalUsers).toBeGreaterThan(0)
    expect(stats.activeSessions).toBeGreaterThanOrEqual(0)
    expect(stats.revenue).toBeGreaterThan(0)
  })
})

describe('calculateGrowthRate', () => {
  it('should calculate positive growth', () => {
    expect(calculateGrowthRate(150, 100)).toBe(50)
  })

  it('should calculate negative growth', () => {
    expect(calculateGrowthRate(50, 100)).toBe(-50)
  })

  it('should return 0 when previous is 0', () => {
    expect(calculateGrowthRate(100, 0)).toBe(0)
  })

  it('should handle same values', () => {
    expect(calculateGrowthRate(100, 100)).toBe(0)
  })
})

describe('formatCurrency', () => {
  it('should format as JPY', () => {
    const formatted = formatCurrency(1000)
    expect(formatted).toContain('1,000')
    // Check for yen symbol (either ¥ or ￥ depending on locale)
    expect(formatted).toMatch(/[¥￥]/)
  })

  it('should handle large numbers', () => {
    const formatted = formatCurrency(4580000)
    expect(formatted).toContain('4,580,000')
  })
})
