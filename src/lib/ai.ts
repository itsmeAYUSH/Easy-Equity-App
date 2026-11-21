/**
 * Helpers for the API's AI responses. Pure, unit-tested.
 */

/**
 * The shared AI endpoints (market analysis, daily digest, sectors) answer
 * HTTP 200 with a placeholder while the AI warms up or is rate-limited. Those
 * must not be cached for long or saved to disk, and the screen shows "warming
 * up" with a retry instead of an empty report.
 */
export function isAiPlaceholder(data: unknown): boolean {
  if (!data || typeof data !== "object") return false
  const d = data as { success?: unknown; source?: unknown; aiStatus?: unknown }
  return d.success === false || d.source === "fallback" || d.source === "error_fallback" || d.source === "cold_start_cache" || d.aiStatus === "warming"
}

/** "Bullish" / "Bearish" / "Neutral" from any sentiment-ish string. */
export function toneOf(sentiment: string | null | undefined): "bullish" | "bearish" | "neutral" {
  if (!sentiment) return "neutral"
  if (/bull|positive|buy|up/i.test(sentiment)) return "bullish"
  if (/bear|negative|sell|down/i.test(sentiment)) return "bearish"
  return "neutral"
}

export interface PortfolioAnalysis {
  riskScore?: number
  diversificationScore?: number
  sectorAllocation?: { sector: string; weight: number }[]
  strongHoldings?: string[]
  weakHoldings?: string[]
  rebalancingSuggestions?: string[]
  overallOutlook?: string
}

type Loose = Record<string, unknown>
const obj = (v: unknown): Loose => (v && typeof v === "object" && !Array.isArray(v) ? (v as Loose) : {})
const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v.replace("%", "")) : NaN
  return Number.isFinite(n) ? n : undefined
}
const strings = (v: unknown): string[] =>
  Array.isArray(v)
    ? v
        .map((x) => (typeof x === "string" ? x : x && typeof x === "object" ? String((x as Loose).symbol ?? (x as Loose).name ?? (x as Loose).description ?? "") : ""))
        .filter(Boolean)
    : []

/**
 * Portfolio AI returns free-form JSON whose keys vary from run to run; map the
 * common shapes onto one (same rules as the website's PortfolioPage).
 */
export function normalizePortfolioAnalysis(raw: unknown): PortfolioAnalysis {
  const top = obj(raw)
  const data = Object.keys(obj(top.portfolio_analysis)).length ? obj(top.portfolio_analysis) : top
  const chars = obj(data.portfolio_characteristics)
  const risk = obj(data.risk_assessment)
  const insights = obj(data.strategic_insights)

  let riskScore = num(data.riskScore ?? data.risk_score)
  if (riskScore == null) {
    const profile = String(chars.risk_profile ?? risk.volatility_exposure ?? "")
    if (/very high|critical/i.test(profile)) riskScore = 85
    else if (/high/i.test(profile)) riskScore = 70
    else if (/moderate|medium/i.test(profile)) riskScore = 45
    else if (/low/i.test(profile)) riskScore = 20
  }

  let diversificationScore = num(data.diversificationScore ?? data.diversification_score)
  if (diversificationScore == null) {
    const match = String(chars.diversification_score ?? "").match(/(\d+)/)
    if (match) diversificationScore = parseInt(match[1], 10) * 10 // "6/10" → 60
  }

  let sectorAllocation: PortfolioAnalysis["sectorAllocation"]
  const rawSectors = data.sectorAllocation ?? data.sector_allocation
  if (Array.isArray(rawSectors)) {
    sectorAllocation = rawSectors
      .map((s) => ({ sector: String(obj(s).sector ?? obj(s).name ?? ""), weight: num(obj(s).weight ?? obj(s).percentage) ?? 0 }))
      .filter((s) => s.sector)
  } else if (rawSectors && typeof rawSectors === "object") {
    sectorAllocation = Object.entries(rawSectors as Loose).map(([sector, w]) => ({ sector, weight: num(w) ?? 0 }))
  } else if (chars.sector_exposure && typeof chars.sector_exposure === "object") {
    sectorAllocation = Object.entries(chars.sector_exposure as Loose).map(([sector, w]) => ({ sector, weight: num(w) ?? 0 }))
  }

  const strong = strings(insights.strengths ?? data.strongHoldings ?? data.strong_holdings)
  const weak = strings(insights.weaknesses ?? data.weakHoldings ?? data.weak_holdings)

  let rebalancing: string[] = []
  const rawRebalance = data.rebalancingSuggestions ?? data.rebalancing_suggestions
  if (Array.isArray(rawRebalance)) {
    rebalancing = rawRebalance
      .map((r) => (typeof r === "string" ? r : [obj(r).action, obj(r).description ?? obj(r).suggestion].filter(Boolean).join(": ")))
      .filter(Boolean)
  }

  const outlookRaw = data.overallOutlook ?? data.overall_outlook ?? data.verdict ?? data.summary ?? top.rawContent
  const overallOutlook = typeof outlookRaw === "string" ? outlookRaw : undefined

  const clamp = (v: number | undefined) => (v == null ? undefined : Math.max(0, Math.min(100, Math.round(v))))
  return {
    riskScore: clamp(riskScore),
    diversificationScore: clamp(diversificationScore),
    sectorAllocation: sectorAllocation?.length ? sectorAllocation : undefined,
    strongHoldings: strong.length ? strong : undefined,
    weakHoldings: weak.length ? weak : undefined,
    rebalancingSuggestions: rebalancing.length ? rebalancing : undefined,
    overallOutlook: overallOutlook || undefined,
  }
}
