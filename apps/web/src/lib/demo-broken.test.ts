import { describe, it, expect } from 'vitest'
import { calculateTotal, getUserName } from './demo-broken'

describe('demo-broken (intentional failures)', () => {
  describe('calculateTotal', () => {
    it('should calculate total correctly', () => {
      const items = [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 3 },
      ]
      // This will fail because the function returns string concatenation
      expect(calculateTotal(items)).toBe(350)
    })
  })

  describe('getUserName', () => {
    it('should handle undefined name', () => {
      // This will throw runtime error
      expect(() => getUserName({})).not.toThrow()
    })
  })
})
