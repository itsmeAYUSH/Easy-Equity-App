/** Finance and display formatting (ported from the website's lib/finance.ts and lib/utils.ts). */

/** Resolve a user-entered symbol to a Yahoo symbol (bare Indian tickers are NSE). */
export function toYahooSymbol(symbol: string): string {
  const s = symbol.trim().toUpperCase()
  if (!s) return s
  // A hyphen marks a Yahoo symbol only for crypto/forex pairs (BTC-USD); NSE
  // symbols such as BAJAJ-AUTO contain one too and still need ".NS".
  if (s.includes(".") || s.includes("=") || s.startsWith("^") || /-(USD|USDT|INR|EUR|GBP|JPY|BTC|ETH)$/.test(s)) return s
  return `${s}.NS`
}

/** "RELIANCE.NS" → "RELIANCE", "^NSEI" → "NSEI". */
export function displaySymbol(symbol: string): string {
  return symbol.replace(/\.(NS|BO)$/i, "").replace(/^\^/, "")
}

export function fmtINR(v: number | null | undefined, maxFrac = 2): string {
  if (v == null || isNaN(v)) return "—"
  const sign = v < 0 ? "-" : ""
  return `${sign}₹${Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: maxFrac })}`
}

export function fmtPrice(v: number | null | undefined, currency?: string | null): string {
  if (v == null || isNaN(v)) return "—"
  if (currency === "USD") return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 2 })
  if (currency === "INR" || !currency) return fmtINR(v)
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

/** Plain number with Indian grouping (indices are points, not rupees). */
export function fmtNum(v: number | null | undefined, maxFrac = 2): string {
  if (v == null || isNaN(v)) return "—"
  return v.toLocaleString("en-IN", { maximumFractionDigits: maxFrac })
}

/** Market cap (absolute currency units) as ₹ Cr / L Cr. */
export function fmtMarketCap(v: number | null | undefined): string {
  if (v == null || isNaN(v) || v <= 0) return "—"
  const cr = v / 1e7
  if (cr >= 1e5) return `₹${(cr / 1e5).toFixed(2)} L Cr`
  if (cr >= 1) return `₹${cr.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

/** Compact Indian number (Cr / L / K) — volumes etc. */
export function fmtCompact(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return "—"
  if (v >= 1e7) return `${(v / 1e7).toFixed(2)} Cr`
  if (v >= 1e5) return `${(v / 1e5).toFixed(2)} L`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)} K`
  return v.toLocaleString("en-IN")
}

export function fmtPct(v: number | null | undefined, withSign = true): string {
  if (v == null || isNaN(v)) return "—"
  const sign = withSign && v > 0 ? "+" : ""
  return `${sign}${v.toFixed(2)}%`
}

/** "5m ago", "3h ago", "2d ago", else a date. */
export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return ""
  const t = new Date(iso).getTime()
  if (isNaN(t)) return ""
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 60) return "just now"
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST"
}

export type Trend = "up" | "down" | "flat"
export function trendOf(v: number | null | undefined): Trend {
  if (v == null || isNaN(v) || v === 0) return "flat"
  return v > 0 ? "up" : "down"
}

export const CATEGORY_LABEL: Record<string, string> = {
  "indian-market": "Indian Markets",
  "market-moving": "Market Moving",
  global: "Global",
  economy: "Economy",
  crypto: "Crypto",
}
