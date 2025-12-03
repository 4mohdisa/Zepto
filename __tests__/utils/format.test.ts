import { formatCurrency, formatDate, formatPercentage } from '@/utils/format'

describe('Format Utilities', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers as currency', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should format negative numbers as currency', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00')
    })
  })

  describe('formatDate', () => {
    it('should format date strings correctly', () => {
      const date = '2025-12-01'
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Dec 1, 2025|12\/1\/2025/)
    })

    it('should handle Date objects', () => {
      const date = new Date('2025-12-01')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Dec 1, 2025|12\/1\/2025/)
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages correctly with default 1 decimal place', () => {
      expect(formatPercentage(0.1234)).toBe('12.3%')
    })

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.0%')
    })

    it('should handle 100%', () => {
      expect(formatPercentage(1)).toBe('100.0%')
    })

    it('should format with custom decimal places', () => {
      expect(formatPercentage(0.1234, 2)).toBe('12.34%')
    })
  })
})
