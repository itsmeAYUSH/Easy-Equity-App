/**
 * Which words identify a stock in news headlines — the same rules as the
 * website's HoldingsNews: our list for Nifty 50 companies ("HDFC Bank",
 * "Airtel"), otherwise the symbol itself when it is long enough not to match
 * ordinary words. Pure, unit-tested.
 */
import { displaySymbol } from "./format"
import { getNiftyStock } from "./nifty50"

const SUFFIXES = /\b(limited|ltd\.?|inc\.?|corp\.?|corporation|plc|co\.?|company|& co\.?)$/i

/** Terms for one holding / stock. Empty when nothing safe to match on. */
export function newsTermsForSymbol(symbol: string, companyName?: string | null): string[] {
  const base = displaySymbol(symbol.toUpperCase())
  const nifty = getNiftyStock(base)
  if (nifty) return nifty.news.slice(0, 2)
  const terms: string[] = []
  // Very short codes (e.g. "IT") would match unrelated words.
  if (base.length >= 3 && /^[A-Z&]+$/.test(base)) terms.push(base)
  if (companyName) {
    let name = companyName.trim()
    for (let i = 0; i < 3; i++) name = name.replace(SUFFIXES, "").replace(/[\s,.]+$/, "")
    if (name.length >= 4 && name.toUpperCase() !== base) terms.push(name)
  }
  return terms
}

export function newsTermsFor(symbols: string[]): { symbol: string; terms: string[] }[] {
  return symbols.map((raw) => ({ symbol: displaySymbol(raw.toUpperCase()), terms: newsTermsForSymbol(raw) }))
}

const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** True when `text` mentions one of `terms` as a whole word (no lookbehind: Hermes-safe). */
export function mentions(text: string, terms: string[]): boolean {
  if (!terms.length) return false
  return new RegExp(`(^|[^A-Za-z0-9])(?:${terms.map(escape).join("|")})(?![A-Za-z0-9])`, "i").test(text)
}
