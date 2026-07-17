import { describe, it, expect } from 'vitest'
import { useCurrency } from '@/composables/useCurrency'

describe('useCurrency', () => {
  it('formats amounts in the fixed BYN currency', () => {
    const { format } = useCurrency()
    expect(format(12.5)).toBe('12.50 BYN')
    expect(format(0)).toBe('0.00 BYN')
  })
})
