const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
]

function chunkToWords(n: number): string {
  if (n === 0) return ''
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')
  return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + chunkToWords(n % 100) : '')
}

/**
 * Converts a whole number into English words (e.g. 2650000 -> "Two Million,
 * Six Hundred and Fifty Thousand"). Supports up to trillions.
 */
export function numberToWords(value: number): string {
  const n = Math.round(Math.abs(value))
  if (n === 0) return 'Zero'

  const scales = [
    { value: 1_000_000_000_000, label: 'Trillion' },
    { value: 1_000_000_000, label: 'Billion' },
    { value: 1_000_000, label: 'Million' },
    { value: 1_000, label: 'Thousand' },
  ]

  let remainder = n
  const parts: string[] = []

  for (const scale of scales) {
    const count = Math.floor(remainder / scale.value)
    if (count > 0) {
      parts.push(`${chunkToWords(count)} ${scale.label}`)
      remainder %= scale.value
    }
  }

  if (remainder > 0) {
    parts.push(chunkToWords(remainder))
  }

  return parts.join(', ')
}

/** Converts a Naira amount into words, e.g. "Two Million, Six Hundred and Fifty Thousand Naira Only" */
export function nairaToWords(amount: number): string {
  const whole = Math.floor(amount)
  const kobo = Math.round((amount - whole) * 100)
  const words = numberToWords(whole)

  if (kobo > 0) {
    return `${words} Naira, ${numberToWords(kobo)} Kobo Only`
  }
  return `${words} Naira Only`
}
