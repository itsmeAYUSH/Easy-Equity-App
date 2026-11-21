/**
 * Maths for the calculators — the same formulas as the website's SipCalculator
 * and lib/calculators.ts. Pure functions (no React Native), unit-tested.
 * Tax and charge rates live in the two RULES objects below: UPDATE THEM AFTER
 * EACH UNION BUDGET (February) OR EXCHANGE CIRCULAR, together with the website.
 */

// ─── Rates ──────────────────────────────────────────────────────────────────

/** Capital gains on listed equity shares and equity mutual funds (STT paid). */
export const TAX_RULES = {
  asOf: "FY 2026-27 (rates from 23 July 2024, unchanged by Budget 2026)",
  equityLongTermAfterMonths: 12,
  equityLtcgRate: 0.125,
  equityLtcgExemption: 125_000,
  equityStcgRate: 0.2,
  /** Health and education cess, charged on the tax. */
  cess: 0.04,
  /** Debt mutual funds bought from this date are taxed at slab rates, whatever the holding period. */
  debtSlabFrom: "2023-04-01",
} as const

/** Statutory charges on equity trades (exchange, government, regulator). */
export const CHARGE_RULES = {
  asOf: "November 2026",
  sttDeliveryBothSides: 0.001, // 0.1% on buy and sell
  sttIntradaySell: 0.00025, // 0.025% on sell
  exchangeTxn: { NSE: 0.0000307, BSE: 0.0000375 }, // NSE 0.00307% (incl. IPFT), BSE 0.00375%
  sebiFee: 0.000001, // ₹10 per crore
  stampBuy: { delivery: 0.00015, intraday: 0.00003 }, // 0.015% / 0.003% on buy
  gst: 0.18, // on brokerage + exchange + SEBI charges
} as const

const round2 = (n: number) => Math.round(n * 100) / 100

// ─── SIP / lump sum ─────────────────────────────────────────────────────────

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

// ─── SWP ────────────────────────────────────────────────────────────────────

export interface SwpInput {
  corpus: number
  monthlyWithdrawal: number
  annualReturnPct: number
  years: number
}

export interface SwpResult {
  months: number
  totalWithdrawn: number
  finalBalance: number
  /** Month in which the money ran out, or null if it lasted the whole period. */
  runsOutInMonth: number | null
  yearly: { year: number; withdrawn: number; balance: number }[]
}

/**
 * Systematic withdrawal plan. Each month the balance first earns its monthly
 * return (annual rate / 12), then the withdrawal is taken out.
 */
export function swp({ corpus, monthlyWithdrawal, annualReturnPct, years }: SwpInput): SwpResult {
  const months = Math.min(600, Math.max(0, Math.round(years * 12)))
  const i = annualReturnPct / 100 / 12
  let balance = Math.max(0, corpus)
  let total = 0
  let yearWithdrawn = 0
  let runsOutInMonth: number | null = null
  const yearly: SwpResult["yearly"] = []

  for (let m = 1; m <= months; m++) {
    balance *= 1 + i
    const w = Math.min(Math.max(0, monthlyWithdrawal), balance)
    balance -= w
    total += w
    yearWithdrawn += w
    if (balance <= 0.005 && runsOutInMonth === null && m < months) runsOutInMonth = m
    if (m % 12 === 0 || m === months) {
      yearly.push({ year: Math.ceil(m / 12), withdrawn: round2(yearWithdrawn), balance: round2(Math.max(0, balance)) })
      yearWithdrawn = 0
    }
  }
  return { months, totalWithdrawn: round2(total), finalBalance: round2(Math.max(0, balance)), runsOutInMonth, yearly }
}

// ─── CAGR ───────────────────────────────────────────────────────────────────

/** Compound annual growth rate and absolute return, in %. Null when the inputs can't give one. */
export function cagr(start: number, end: number, years: number): { cagrPct: number; absolutePct: number } | null {
  if (!(start > 0) || !(end >= 0) || !(years > 0)) return null
  return {
    cagrPct: (Math.pow(end / start, 1 / years) - 1) * 100,
    absolutePct: (end / start - 1) * 100,
  }
}

// ─── Capital gains ──────────────────────────────────────────────────────────

export interface CapitalGainsInput {
  asset: "equity" | "debt"
  buyPrice: number
  sellPrice: number
  quantity: number
  /** YYYY-MM-DD */
  buyDate: string
  /** YYYY-MM-DD */
  sellDate: string
  /** Long-term equity gains already made this financial year (uses up the ₹1.25 lakh exemption). */
  otherLtcgThisYear?: number
  /** Your income-tax slab rate in %, for debt funds. */
  slabRatePct?: number
}

export interface CapitalGainsResult {
  gain: number
  isLongTerm: boolean
  holdingDays: number
  /** Tax rate applied (0.2 = 20%). */
  rate: number
  exemptionUsed: number
  taxableGain: number
  tax: number
  cess: number
  totalTax: number
  /** Plain-language label, e.g. "Long-term (held over 12 months)". */
  label: string
}

const parseDay = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T00:00:00Z`)
  return isNaN(d.getTime()) ? null : d
}

/** True when `sell` is more than `months` months after `buy` (the law's "held for more than 12 months"). */
export function heldMoreThanMonths(buyDate: string, sellDate: string, months: number): boolean {
  const buy = parseDay(buyDate)
  const sell = parseDay(sellDate)
  if (!buy || !sell) return false
  const limit = new Date(buy)
  limit.setUTCMonth(limit.getUTCMonth() + months)
  return sell.getTime() > limit.getTime()
}

export function capitalGains(input: CapitalGainsInput): CapitalGainsResult | null {
  const buy = parseDay(input.buyDate)
  const sell = parseDay(input.sellDate)
  if (!buy || !sell || sell < buy || !(input.quantity > 0) || !(input.buyPrice >= 0) || !(input.sellPrice >= 0)) return null

  const holdingDays = Math.round((sell.getTime() - buy.getTime()) / 86_400_000)
  const gain = (input.sellPrice - input.buyPrice) * input.quantity
  let isLongTerm = false
  let rate = 0
  let exemptionUsed = 0
  let taxableGain = Math.max(0, gain)
  let label: string

  if (input.asset === "debt") {
    rate = Math.max(0, input.slabRatePct ?? 0) / 100
    label = "Taxed at your income-tax slab (debt fund bought on or after 1 April 2023)"
  } else {
    isLongTerm = heldMoreThanMonths(input.buyDate, input.sellDate, TAX_RULES.equityLongTermAfterMonths)
    if (isLongTerm) {
      rate = TAX_RULES.equityLtcgRate
      const remaining = Math.max(0, TAX_RULES.equityLtcgExemption - Math.max(0, input.otherLtcgThisYear ?? 0))
      exemptionUsed = Math.min(remaining, taxableGain)
      taxableGain -= exemptionUsed
      label = "Long-term (held more than 12 months)"
    } else {
      rate = TAX_RULES.equityStcgRate
      label = "Short-term (held 12 months or less)"
    }
  }

  const tax = taxableGain * rate
  const cess = tax * TAX_RULES.cess
  return {
    gain: round2(gain),
    isLongTerm,
    holdingDays,
    rate,
    exemptionUsed: round2(exemptionUsed),
    taxableGain: round2(taxableGain),
    tax: round2(tax),
    cess: round2(cess),
    totalTax: round2(tax + cess),
    label,
  }
}

// ─── Brokerage & charges ────────────────────────────────────────────────────

export interface BrokerageInput {
  segment: "delivery" | "intraday"
  exchange: "NSE" | "BSE"
  buyPrice: number
  sellPrice: number
  quantity: number
  /** Flat brokerage per executed order (₹). Leave undefined for none. */
  brokerageFlat?: number
  /** Brokerage as % of order value; if both are set, the lower one applies (common "0.03% or ₹20"). */
  brokeragePct?: number
  /** Depository charge per stock sold from your demat account, incl. GST (delivery sells only). */
  dpCharge?: number
}

export interface BrokerageResult {
  turnover: number
  brokerage: number
  stt: number
  exchangeTxn: number
  sebi: number
  stamp: number
  gst: number
  dp: number
  totalCharges: number
  grossPnl: number
  netPnl: number
  /** How much the price must rise per share just to cover the charges. */
  breakevenPerShare: number
}

function orderBrokerage(value: number, flat?: number, pct?: number): number {
  if (value <= 0) return 0
  const options: number[] = []
  if (flat != null && flat >= 0) options.push(flat)
  if (pct != null && pct >= 0) options.push((value * pct) / 100)
  return options.length ? Math.min(...options) : 0
}

export function brokerage(input: BrokerageInput): BrokerageResult | null {
  const { segment, exchange, buyPrice, sellPrice, quantity } = input
  if (!(quantity > 0) || !(buyPrice >= 0) || !(sellPrice >= 0)) return null
  const R = CHARGE_RULES
  const buyValue = buyPrice * quantity
  const sellValue = sellPrice * quantity
  const turnover = buyValue + sellValue

  const brokerageAmt =
    orderBrokerage(buyValue, input.brokerageFlat, input.brokeragePct) + orderBrokerage(sellValue, input.brokerageFlat, input.brokeragePct)
  const stt = segment === "delivery" ? turnover * R.sttDeliveryBothSides : sellValue * R.sttIntradaySell
  const exchangeTxn = turnover * R.exchangeTxn[exchange]
  const sebi = turnover * R.sebiFee
  const stamp = buyValue * R.stampBuy[segment]
  const gst = (brokerageAmt + exchangeTxn + sebi) * R.gst
  const dp = segment === "delivery" && sellValue > 0 ? Math.max(0, input.dpCharge ?? 0) : 0
  const totalCharges = brokerageAmt + stt + exchangeTxn + sebi + stamp + gst + dp
  const grossPnl = sellValue - buyValue

  return {
    turnover: round2(turnover),
    brokerage: round2(brokerageAmt),
    stt: round2(stt),
    exchangeTxn: round2(exchangeTxn),
    sebi: round2(sebi),
    stamp: round2(stamp),
    gst: round2(gst),
    dp: round2(dp),
    totalCharges: round2(totalCharges),
    grossPnl: round2(grossPnl),
    netPnl: round2(grossPnl - totalCharges),
    breakevenPerShare: round2(totalCharges / quantity),
  }
}
