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

/** Crypto Fear & Greed (GET /market/fear-greed), history oldest-first. */
export interface FearGreed {
  value: number
  classification: string
  history?: { value: number; timestamp: string }[]
}

/** ₹ per one unit of each currency (GET /market/forex). */
export interface ForexResponse {
  base: string
  rates: Record<string, number>
  updatedAt: string
}

/** India macro indicators from the World Bank (GET /market/macro). */
export interface MacroResponse {
  country: string
  indicators: { indicator: string; code: string; value: number; year: string }[]
  updatedAt: string
}

/** GET /calendar/earnings (Finnhub, next ~2 weeks). */
export interface EarningsEvent {
  symbol: string
  date: string
  epsEstimate: number | null
  epsActual: number | null
  hour: string | null
}

/** GET /usage: today's AI analyses. remaining/used are null for Pro (no limit). */
export interface UsageInfo {
  limit: number
  remaining: number | null
  used: number | null
  unlimited: boolean
}

/** GET /portfolio/dividends (server services/dividends.ts). */
export interface PortfolioDividends {
  holdings: {
    symbol: string
    quantity: number
    avgPrice: number
    /** Dividend per share paid in the last 12 months. */
    last12mPerShare: number
    /** last12mPerShare × quantity: a rough yearly figure if dividends repeat. */
    estAnnualIncome: number
    /** Dividend per share as % of your average price. */
    yieldOnCostPct: number | null
    payments: { date: string; amount: number }[]
  }[]
  totalEstAnnualIncome: number
  /** Holdings we couldn't get dividend data for. */
  unavailable: string[]
}

/** POST /ai/query (Portfolio AI, Pro). `result` is the model's free-form JSON. */
export interface PortfolioAiResponse {
  type: string
  result: Record<string, unknown>
  generatedAt: string
  disclaimer: string
  success?: false
  message?: string
}

/** AI fields every shared analysis carries (GET /ai/*). */
interface SharedAiMeta {
  success?: boolean
  source?: string
  aiStatus?: string
  message?: string
  disclaimer: string
  generatedAt: string
  articlesAnalyzed?: number
  loginHint?: string
}

export type Sentiment = "Bullish" | "Bearish" | "Neutral"

/** GET /ai/daily-digest */
export interface DailyDigest extends SharedAiMeta {
  executiveSummary: string
  overallSentiment: Sentiment
  sentimentScore: number
  sections: {
    title: string
    category: string
    sentiment: Sentiment
    summary: string
    highlights: string[]
    watchlist: string[]
    impactLevel: "High" | "Medium" | "Low"
  }[]
  keyTakeaways: string[]
}

/** GET /ai/sector-analysis */
export interface SectorIntelligence extends SharedAiMeta {
  sectors: {
    name: string
    outlook: Sentiment
    confidence: number
    summary: string
    keyDrivers: string[]
    momentumStocks: string[]
    riskFactors: string[]
    shortTermView: string
    longTermView: string
    trendStrength: "Strong" | "Moderate" | "Weak"
  }[]
  crossSectorInsights: string[]
  topSectorToWatch: string
  weakestSector: string
}

/** AI: "Stocks to watch" and sector outlook (GET /ai/market-analysis). */
export interface MarketAnalysis {
  success?: boolean
  source?: string
  aiStatus?: string
  message?: string
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
  liveDataAvailable?: boolean
  dataSource?: string
  currency?: string | null
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
  inceptionDate?: string | null
  /** 1M/6M/1Y absolute %; 3Y/5Y annualised (CAGR); All annualised once a year old. */
  returns: {
    r1m?: number | null
    r6m?: number | null
    r1y: number | null
    r3y: number | null
    r5y: number | null
    rAll?: number | null
  }
  /** Newest first, dates as DD-MM-YYYY (mfapi.in). Daily for a year, thinned before. */
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
