/**
 * Portfolio maths, the same as the website's PortfolioPage: holdings joined
 * with live quotes, totals, day change and an approximate XIRR. Pure (no React
 * Native), so it is unit-tested in plain Node.
 */
import { toYahooSymbol } from "./format"
import type { Holding } from "./types"

export type QuoteLike = {
  symbol: string
  name?: string | null
  price: number
  change: number
  changePercent: number
  currency?: string | null
}

export type HoldingRow = Holding & {
  yahoo: string
  name: string | null
  /** Last traded price, or null until a quote arrives. */
  price: number | null
  dayChangePct: number | null
  invested: number
  value: number | null
  pnl: number | null
  pnlPct: number | null
  /** Today's change in value (price change × quantity). */
  dayChange: number | null
  /** Share of the priced portfolio value, 0–1. */
  weight: number | null
}

export interface PortfolioSummary {
  rows: HoldingRow[]
  invested: number
  /** Live value; holdings without a quote count at their cost. */
  value: number
  pnl: number
  pnlPct: number
  dayChange: number
  dayChangePct: number
  /** At least one holding has a live price. */
  hasLivePrices: boolean
  /** Approximate XIRR in %, or null when it can't be worked out. */
  xirr: number | null
}

export function summarizePortfolio(holdings: Holding[], quotes: QuoteLike[], now: Date = new Date()): PortfolioSummary {
  const bySymbol = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]))
  const base = holdings.map((h) => {
    const yahoo = toYahooSymbol(h.symbol)
    const q = bySymbol.get(yahoo.toUpperCase())
    const invested = h.quantity * h.avg_price
    const value = q ? q.price * h.quantity : null
    const pnl = value != null ? value - invested : null
    return {
      ...h,
      yahoo,
      name: q?.name ?? null,
      price: q?.price ?? null,
      dayChangePct: q?.changePercent ?? null,
      invested,
      value,
      pnl,
      pnlPct: pnl != null && invested > 0 ? (pnl / invested) * 100 : null,
      dayChange: q ? q.change * h.quantity : null,
    }
  })

  const pricedValue = base.reduce((s, r) => s + (r.value ?? 0), 0)
  const rows: HoldingRow[] = base.map((r) => ({ ...r, weight: r.value != null && pricedValue > 0 ? r.value / pricedValue : null }))

  const invested = rows.reduce((s, r) => s + r.invested, 0)
  const value = rows.reduce((s, r) => s + (r.value ?? r.invested), 0)
  const pnl = value - invested
  const dayChange = rows.reduce((s, r) => s + (r.dayChange ?? 0), 0)
  const prevValue = value - dayChange
  const hasLivePrices = rows.some((r) => r.price != null)

  // Approximate XIRR: each holding invested as one outflow on the day it was
  // added, today's value as the inflow. (No per-lot dates are stored.)
  let irr: number | null = null
  const priced = rows.filter((r) => r.value != null)
  if (priced.length) {
    const flows = priced.map((r) => ({ amount: -r.invested, date: new Date(r.created_at) }))
    flows.push({ amount: priced.reduce((s, r) => s + (r.value ?? 0), 0), date: now })
    irr = xirr(flows)
  }

  return {
    rows,
    invested,
    value,
    pnl,
    pnlPct: invested > 0 ? (pnl / invested) * 100 : 0,
    dayChange,
    dayChangePct: prevValue > 0 ? (dayChange / prevValue) * 100 : 0,
    hasLivePrices,
    xirr: irr,
  }
}

/**
 * Extended internal rate of return (annualised) via Newton-Raphson.
 * Needs at least one negative (invest) and one positive (value) cash flow.
 * Returns a percentage, or null when it doesn't converge to a sane value.
 */
export function xirr(cashflows: { amount: number; date: Date }[]): number | null {
  const flows = cashflows.filter((c) => Number.isFinite(c.amount) && !isNaN(c.date.getTime()))
  if (flows.length < 2) return null
  if (!flows.some((c) => c.amount < 0) || !flows.some((c) => c.amount > 0)) return null

  const t0 = Math.min(...flows.map((c) => c.date.getTime()))
  const yrs = (d: Date) => (d.getTime() - t0) / (365.25 * 24 * 3600 * 1000)
  // Everything added today: there is no time to annualise over.
  if (Math.max(...flows.map((c) => yrs(c.date))) < 1 / 365) return null
  const npv = (r: number) => flows.reduce((s, cf) => s + cf.amount / Math.pow(1 + r, yrs(cf.date)), 0)
  const dnpv = (r: number) =>
    flows.reduce((s, cf) => {
      const t = yrs(cf.date)
      return s - (t * cf.amount) / Math.pow(1 + r, t + 1)
    }, 0)

  let r = 0.1
  for (let i = 0; i < 100; i++) {
    const f = npv(r)
    const df = dnpv(r)
    if (Math.abs(df) < 1e-10) break
    let nr = r - f / df
    if (!isFinite(nr)) return null
    if (nr <= -0.9999) nr = -0.9999
    if (Math.abs(nr - r) < 1e-7) {
      r = nr
      break
    }
    r = nr
  }
  // Very short holding periods annualise to absurd numbers: hide them.
  return isFinite(r) && Math.abs(r) < 100 ? r * 100 : null
}

/** Holdings as the Portfolio AI endpoint wants them: "SYMBOL:quantity@avgPrice". */
export function portfolioAiLines(holdings: Pick<Holding, "symbol" | "quantity" | "avg_price">[]): string[] {
  return holdings.map((h) => `${h.symbol}:${h.quantity}@${h.avg_price}`)
}
