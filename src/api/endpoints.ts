/**
 * Every EasyEquity API call the app makes, grouped by area — the same
 * endpoints as the website's src/lib/api.ts, typed. Screens never call
 * `request` directly; hooks in src/hooks wrap these in React Query.
 */
import { AI_TIMEOUT_MS, request } from "@/api/client"
import { HttpError } from "@/api/errors"
import type { IpoDetailResponse, IpoListResponse } from "@/lib/ipo"
import type {
  AppNotification,
  AppUser,
  Article,
  EmailPrefs,
  EmailPrefsResponse,
  Holding,
  HistoryRange,
  MarketAnalysis,
  MoversResponse,
  MutualFund,
  MutualFundSearchResult,
  PremiumStatus,
  PriceAlert,
  PriceHistory,
  ProfileUpdate,
  Quote,
  ScreenerRow,
  SimpleExplanation,
  StockAnalysis,
  SymbolSearchResult,
  Ticker,
  WatchlistItem,
} from "@/lib/types"

export const authApi = {
  me: () => request<{ user: AppUser }>("/auth/me"),
  updateProfile: (data: ProfileUpdate) => request<{ user: AppUser }>("/auth/profile", { method: "PATCH", body: data }),
}

export const articlesApi = {
  list: (params: { limit?: number; category?: string; search?: string; terms?: string } = {}, signal?: AbortSignal) =>
    request<Article[]>("/articles", { query: params, signal, anonymous: true }),
  get: (id: string, signal?: AbortSignal) => request<Article>(`/articles/${encodeURIComponent(id)}`, { signal, anonymous: true }),
}

export const marketApi = {
  tickers: (signal?: AbortSignal) =>
    request<{ tickers: Ticker[]; updatedAt: string }>("/market/tickers", { signal, anonymous: true }),
  movers: (signal?: AbortSignal) => request<MoversResponse>("/market/movers", { signal, anonymous: true }),
  search: (q: string, includeCrypto = false, signal?: AbortSignal) =>
    request<SymbolSearchResult[]>("/market/search", { query: { q, crypto: includeCrypto ? 1 : undefined }, signal, anonymous: true }),
  quotes: (symbols: string[], signal?: AbortSignal) =>
    request<Quote[]>("/market/quotes", { query: { symbols: symbols.join(",") }, signal, anonymous: true }),
  history: (symbol: string, range: HistoryRange, signal?: AbortSignal) =>
    request<PriceHistory>("/market/history", { query: { symbol, range }, signal, anonymous: true }),
  screener: (signal?: AbortSignal) =>
    request<{ rows: ScreenerRow[]; sectors: string[]; updatedAt: string }>("/market/screener", { signal, anonymous: true }),
  commodities: (signal?: AbortSignal) =>
    request<{ commodities: Ticker[]; updatedAt: string }>("/market/commodities", { signal, anonymous: true }),
  fearGreed: (signal?: AbortSignal) =>
    request<{ value: number; classification: string }>("/market/fear-greed", { signal, anonymous: true }),
}

export const aiApi = {
  marketAnalysis: (signal?: AbortSignal) =>
    request<MarketAnalysis>("/ai/market-analysis", { signal, timeoutMs: AI_TIMEOUT_MS }),
  stockAnalysis: async (stock: string) => {
    const data = await request<StockAnalysis & { success?: boolean; message?: string }>("/ai/stock-analysis", {
      method: "POST",
      body: { stock },
      timeoutMs: AI_TIMEOUT_MS,
    })
    // AI failures come back as HTTP 200 { success: false, message } (AI busy, unknown symbol).
    if (data?.success === false) {
      throw new HttpError(data.message || "AI analysis is temporarily unavailable. Please try again shortly.", 503)
    }
    return data
  },
  explainArticle: (articleId: string) =>
    request<{ explanation: SimpleExplanation; cached: boolean; disclaimer: string }>(
      `/ai/explain/${encodeURIComponent(articleId)}`,
      { method: "POST", timeoutMs: AI_TIMEOUT_MS },
    ),
}

export const watchlistApi = {
  list: () => request<WatchlistItem[]>("/watchlist"),
  add: (symbol: string) => request<WatchlistItem>("/watchlist", { method: "POST", body: { symbol } }),
  remove: (symbol: string) => request<{ message: string }>(`/watchlist/${encodeURIComponent(symbol)}`, { method: "DELETE" }),
}

export const portfolioApi = {
  list: () => request<Holding[]>("/portfolio"),
  add: (holding: { symbol: string; quantity: number; avg_price: number; notes?: string }) =>
    request<Holding>("/portfolio", { method: "POST", body: holding }),
  remove: (id: string) => request<{ message: string }>(`/portfolio/${encodeURIComponent(id)}`, { method: "DELETE" }),
}

export const alertsApi = {
  priceList: () => request<PriceAlert[]>("/alerts/price"),
  priceCreate: (data: { symbol: string; target_price: number; direction: "above" | "below" }) =>
    request<PriceAlert>("/alerts/price", { method: "POST", body: data }),
  priceDelete: (id: string) => request<{ message: string }>(`/alerts/price/${encodeURIComponent(id)}`, { method: "DELETE" }),
  notifications: () => request<AppNotification[]>("/alerts/notifications"),
  markRead: (id: string) => request<{ message: string }>(`/alerts/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" }),
  markAllRead: () => request<{ message: string }>("/alerts/notifications/read-all", { method: "PATCH" }),
}

export const premiumApi = {
  status: () => request<PremiumStatus>("/premium/status"),
}

export const ipoApi = {
  list: (signal?: AbortSignal) => request<IpoListResponse>("/ipo", { signal, anonymous: true }),
  get: (slug: string, signal?: AbortSignal) =>
    request<IpoDetailResponse>(`/ipo/${encodeURIComponent(slug)}`, { signal, anonymous: true }),
}

export const ipoRemindersApi = {
  list: () => request<{ slugs: string[] }>("/ipo-reminders"),
  add: (slug: string) => request<unknown>("/ipo-reminders", { method: "POST", body: { slug } }),
  remove: (slug: string) => request<unknown>(`/ipo-reminders/${encodeURIComponent(slug)}`, { method: "DELETE" }),
}

export const mfApi = {
  search: (q: string, signal?: AbortSignal) =>
    request<MutualFundSearchResult[]>("/mf/search", { query: { q }, signal, anonymous: true }),
  get: (code: string, signal?: AbortSignal) => request<MutualFund>(`/mf/${encodeURIComponent(code)}`, { signal, anonymous: true }),
}

export const emailApi = {
  prefs: () => request<EmailPrefsResponse>("/email/prefs"),
  updatePrefs: (changes: Partial<EmailPrefs>) => request<EmailPrefsResponse>("/email/prefs", { method: "PUT", body: changes }),
}

export const accountApi = {
  /** Permanently delete the account (App Store rule 5.1.1(v)). `confirm` must be "DELETE". */
  delete: (confirm: string) => request<{ deleted: boolean }>("/account", { method: "DELETE", body: { confirm } }),
}
