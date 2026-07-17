const CURRENCY = 'BYN'

export function useCurrency() {
  function format(amount: number): string {
    return `${amount.toFixed(2)} ${CURRENCY}`
  }

  return { format }
}
