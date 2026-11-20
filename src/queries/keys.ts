/**
 * Query keys in one place, so invalidation never misses a reader.
 *
 * Keys that start with a user id are per-account; the persister below never
 * writes them to disk, and sign-out clears the whole cache.
 */
export const qk = {
  me: (uid: string | undefined) => ["me", uid] as const,
  premium: (uid: string | undefined) => ["premium", uid] as const,

  articles: (params: { category?: string; search?: string; terms?: string; limit?: number } = {}) =>
    ["articles", params] as const,
  article: (id: string) => ["article", id] as const,
  explain: (id: string) => ["explain", id] as const,

  tickers: ["market", "tickers"] as const,
  movers: ["market", "movers"] as const,
  quotes: (symbols: string[]) => ["market", "quotes", [...symbols].sort().join(",")] as const,
  history: (symbol: string, range: string) => ["market", "history", symbol, range] as const,
  search: (q: string) => ["market", "search", q.toLowerCase()] as const,
  screener: ["market", "screener"] as const,
  commodities: ["market", "commodities"] as const,
  fearGreed: ["market", "fear-greed"] as const,

  marketAnalysis: ["ai", "market-analysis"] as const,
  stockAnalysis: (symbol: string) => ["ai", "stock-analysis", symbol] as const,

  ipos: ["ipo", "list"] as const,
  ipo: (slug: string) => ["ipo", "detail", slug] as const,
  ipoReminders: (uid: string | undefined) => ["ipo-reminders", uid] as const,

  mfSearch: (q: string) => ["mf", "search", q.toLowerCase()] as const,
  mf: (code: string) => ["mf", "detail", code] as const,

  watchlist: (uid: string | undefined) => ["watchlist", uid] as const,
  portfolio: (uid: string | undefined) => ["portfolio", uid] as const,
  priceAlerts: (uid: string | undefined) => ["alerts", "price", uid] as const,
  notifications: (uid: string | undefined) => ["alerts", "notifications", uid] as const,
  emailPrefs: (uid: string | undefined) => ["email-prefs", uid] as const,
}

/**
 * Public data that is worth painting from disk on a cold start (news, tickers,
 * movers, IPOs). Everything else is fetched fresh.
 */
const PERSISTED_ROOTS = new Set(["articles", "market", "ipo", "ai"])
export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  const root = queryKey[0]
  if (typeof root !== "string" || !PERSISTED_ROOTS.has(root)) return false
  // Search results and per-symbol AI analyses are one-offs: not worth the disk.
  if (root === "market" && (queryKey[1] === "search" || queryKey[1] === "history")) return false
  if (root === "ai" && queryKey[1] === "stock-analysis") return false
  return true
}
