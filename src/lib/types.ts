/**
 * Shapes returned by the EasyEquity API (easyEquity server/src/routes/*).
 * Mongo documents arrive with snake_case fields plus `id` (= _id).
 */

export type MarketImpact = "bullish" | "bearish" | "neutral"
export type NewsCategory = "crypto" | "indian-market" | "global" | "economy" | "market-moving"

export interface Article {
  id: string
  title: string
  summary: string
  content: string
  source: string
  source_url: string | null
  image_url: string | null
  published_at: string
  category: NewsCategory
  impact: MarketImpact
  impact_reason: string | null
  keywords: string[]
  tickers: string[]
  read_time: number | null
}

export interface AppUser {
  id: string
  auth_id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  phone: string | null
  country: string | null
  city: string | null
  experience_level: "Beginner" | "Intermediate" | "Advanced" | null
  onboarding_completed: boolean
  is_premium: boolean
  is_admin: boolean
  plan: string
  subscription_status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  terms_accepted_at: string | null
  created_at: string
}

export interface ProfileUpdate {
  display_name?: string
  avatar_url?: string | null
  phone?: string
  country?: string
  city?: string
  experience_level?: "Beginner" | "Intermediate" | "Advanced"
  onboarding_completed?: boolean
  accept_terms?: true
  terms_version?: string
}

export interface PremiumStatus {
  is_premium: boolean
  plan: "free" | "pro"
  subscription_status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  renews: boolean
}

export interface Ticker {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  type?: "index" | "stock" | "crypto"
  currency?: string | null
}

export interface Mover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  mentions?: number
}

export interface MoversResponse {
  gainers: Mover[]
  losers: Mover[]
  mostDiscussed: Mover[]
  updatedAt: string
}

export interface SymbolSearchResult {
  symbol: string
  base: string
  name: string
  exchange: string
  type: string
}

export interface Quote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  currency: string | null
  peRatio?: number | null
  eps?: number | null
  marketCap?: number | null
  high52?: number | null
  low52?: number | null
}

export type HistoryRange = "1D" | "5D" | "1M" | "6M" | "1Y" | "5Y"

export interface PriceHistory {
  symbol: string
  name: string
  currency: string | null
  price: number | null
  change: number
  changePercent: number
  points: { t: number; c: number }[]
  stats: {
    open: number | null
    dayHigh: number | null
    dayLow: number | null
    prevClose: number | null
    volume: number | null
    high52: number | null
    low52: number | null
  }
}

export interface ScreenerRow {
  symbol: string
  base: string
  name: string
  sector: string
  price: number
  changePercent: number
  peRatio: number | null
  marketCap: number | null
  high52: number | null
  low52: number | null
}

export interface WatchlistItem {
  id: string
  symbol: string
  added_at: string
}

export interface Holding {
  id: string
  symbol: string
  quantity: number
  avg_price: number
  notes: string | null
  created_at: string
}

export interface PriceAlert {
  id: string
  symbol: string
  target_price: number
  direction: "above" | "below"
  is_triggered: boolean
  triggered_at: string | null
  created_at: string
}

export interface AppNotification {
  id: string
  symbol: string
  alert_type: string
  title: string
  message: string | null
  is_read: boolean
  created_at: string
}

/** AI: "Stocks to watch" and sector outlook (GET /ai/market-analysis). */
export interface MarketAnalysis {
  success?: boolean
  stocksToWatch: {
    asset: string
    sentiment: string
    confidence: number
    reason: string
    targetSector?: string
    timeframe?: string
  }[]
  sectorAnalysis: { sector: string; outlook: string; reason: string }[]
  marketOutlook: string
  marketSentiment: string
  sentimentScore: number
  riskFactors: string[]
  opportunities: string[]
  disclaimer: string
  generatedAt: string
  loginHint?: string
}

/** AI: support/resistance analysis for one stock (POST /ai/stock-analysis). */
export interface StockAnalysis {
  stockName?: string
  exchange?: string
  currentPrice?: string | number
  currentTrend?: string
  riskLevel?: string
  confidenceScore?: number
  newsSentimentPercent?: number
  sectorMomentum?: string
  supports?: { level: string; price: string | number; strength?: string; note?: string }[]
  resistances?: { level: string; price: string | number; strength?: string; note?: string }[]
  pivotPoint?: string | number
  analysis?: string
  aiReasoning?: string
  disclaimer?: string
  generatedAt?: string
}

export interface SimpleExplanation {
  summary: string
  points: string[]
  whyItMatters: string
  terms: { term: string; meaning: string }[]
}

export interface MutualFundSearchResult {
  schemeCode: number
  schemeName: string
}

export interface MutualFund {
  schemeCode: number
  schemeName: string
  fundHouse: string | null
  category: string | null
  latestNav: number | null
  latestDate: string | null
  returns: { r1y: number | null; r3y: number | null; r5y: number | null }
  /** Newest first, dates as DD-MM-YYYY (mfapi.in). */
  history: { date: string; nav: number }[]
}

export interface EmailPrefs {
  price_alerts: boolean
  ipo_reminders: boolean
  daily_digest: boolean
}

export interface EmailPrefsResponse {
  configured: boolean
  email: string | null
  prefs: EmailPrefs
}
