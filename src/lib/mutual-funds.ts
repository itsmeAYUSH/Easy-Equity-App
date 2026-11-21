/**
 * Mutual fund chart periods and returns, the same as the website's
 * lib/mutualFunds.ts (shapes from the server's services/mutualFunds.ts).
 * Pure, unit-tested.
 */
import type { MutualFund } from "./types"

export type MFRange = "1M" | "6M" | "1Y" | "3Y" | "5Y" | "All"

type ReturnKey = keyof MutualFund["returns"]

export const MF_RANGES: { id: MFRange; months: number | null; key: ReturnKey }[] = [
  { id: "1M", months: 1, key: "r1m" },
  { id: "6M", months: 6, key: "r6m" },
  { id: "1Y", months: 12, key: "r1y" },
  { id: "3Y", months: 36, key: "r3y" },
  { id: "5Y", months: 60, key: "r5y" },
  { id: "All", months: null, key: "rAll" },
]

const rangeInfo = (range: MFRange) => MF_RANGES.find((r) => r.id === range)!

/** Parse mfapi's dd-mm-yyyy date to epoch ms (local midnight). */
export function parseNavDate(s: string): number {
  const [d, m, y] = s.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1).getTime()
}

/** Same day `months` calendar months earlier (31 Mar → 28/29 Feb, not 3 Mar). */
export function monthsBefore(ms: number, months: number): number {
  const d = new Date(ms)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() - months)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  return d.getTime()
}

export function rangeReturn(fund: Pick<MutualFund, "returns"> | undefined, range: MFRange): number | null {
  const v = fund?.returns?.[rangeInfo(range).key]
  return typeof v === "number" && Number.isFinite(v) ? v : null
}

/** A period is available once the fund has a return for it ("All" always is). */
export function isRangeAvailable(fund: Pick<MutualFund, "returns" | "history"> | undefined, range: MFRange): boolean {
  if (!fund) return false
  if (range === "All") return fund.history.length > 1
  return rangeReturn(fund, range) !== null
}

/** 3Y/5Y are CAGR; "All" is too once the fund has a year of history. */
export function isAnnualised(fund: Pick<MutualFund, "latestDate" | "inceptionDate"> | undefined, range: MFRange): boolean {
  if (range === "3Y" || range === "5Y") return true
  if (range !== "All" || !fund?.latestDate || !fund.inceptionDate) return false
  return parseNavDate(fund.inceptionDate) <= monthsBefore(parseNavDate(fund.latestDate), 12)
}

/**
 * Chart points for a period, oldest-first. Starts at the last NAV on or before
 * the period's start: the same NAV the period's return is measured from.
 */
export function navSeries(history: MutualFund["history"], range: MFRange): { t: number; c: number }[] {
  const points = history.map((p) => ({ t: parseNavDate(p.date), c: p.nav })).filter((p) => Number.isFinite(p.t) && Number.isFinite(p.c))
  if (!points.length) return []

  const { months } = rangeInfo(range)
  let slice = points
  if (months !== null) {
    const start = monthsBefore(points[0].t, months)
    const i = points.findIndex((p) => p.t <= start)
    if (i !== -1) slice = points.slice(0, i + 1)
  }
  return [...slice].reverse()
}
