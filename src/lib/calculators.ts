/** SIP / lump-sum / CAGR maths (same formulas as the website's SipCalculator and lib/calculators.ts). */

export type SipMode = "sip" | "lumpsum"

export interface SipResult {
  invested: number
  futureValue: number
  gains: number
  series: { year: number; invested: number; value: number }[]
}

export function sipProjection(mode: SipMode, amount: number, years: number, annualRatePct: number): SipResult {
  const P = Math.max(0, amount)
  const yrs = Math.max(0, years)
  const r = annualRatePct / 100
  const i = r / 12
  const n = Math.round(yrs * 12)
  const sipValue = (months: number) => (i > 0 ? P * ((Math.pow(1 + i, months) - 1) / i) * (1 + i) : P * months)

  const series: SipResult["series"] = []
  for (let y = 1; y <= Math.max(1, Math.round(yrs)); y++) {
    if (mode === "sip") series.push({ year: y, invested: P * y * 12, value: sipValue(y * 12) })
    else series.push({ year: y, invested: P, value: P * Math.pow(1 + r, y) })
  }
  const invested = mode === "sip" ? P * n : P
  const futureValue = mode === "sip" ? sipValue(n) : P * Math.pow(1 + r, yrs)
  return { invested, futureValue, gains: futureValue - invested, series }
}

/** Compound annual growth rate between two values. Null when it can't be computed. */
export function cagr(start: number, end: number, years: number): { cagrPct: number; absolutePct: number } | null {
  if (!(start > 0) || !(end > 0) || !(years > 0)) return null
  return {
    cagrPct: (Math.pow(end / start, 1 / years) - 1) * 100,
    absolutePct: (end / start - 1) * 100,
  }
}
