/**
 * Unit tests for the logic ported from the website (calculators, portfolio,
 * mutual funds, news matching, AI responses). Plain Node via tsx.
 */
import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { isAiPlaceholder, normalizePortfolioAnalysis, toneOf } from "../ai"
import { brokerage, cagr, capitalGains, heldMoreThanMonths, swp } from "../calculators"
import { navSeries, rangeReturn } from "../mutual-funds"
import { mentions, newsTermsForSymbol } from "../news-terms"
import { getNiftyStock, NIFTY50, SECTORS, stocksInSector } from "../nifty50"
import { summarizePortfolio, xirr } from "../portfolio"
import type { Holding } from "../types"

const close = (a: number, b: number, eps = 0.01) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`)

describe("calculators (same as the website)", () => {
  it("SWP lasts the whole period when withdrawals are below the return", () => {
    const r = swp({ corpus: 1_000_000, monthlyWithdrawal: 5000, annualReturnPct: 8, years: 10 })
    assert.equal(r.months, 120)
    assert.equal(r.runsOutInMonth, null)
    close(r.totalWithdrawn, 600_000)
    assert.ok(r.finalBalance > 1_000_000)
    assert.equal(r.yearly.length, 10)
  })
  it("SWP reports the month the money runs out", () => {
    const r = swp({ corpus: 100_000, monthlyWithdrawal: 10_000, annualReturnPct: 0, years: 2 })
    assert.equal(r.runsOutInMonth, 10)
    assert.equal(r.finalBalance, 0)
  })
  it("CAGR allows an end value of zero (a total loss)", () => {
    assert.equal(cagr(100, 0, 2)?.cagrPct, -100)
    assert.equal(cagr(0, 100, 2), null)
  })
  it("capital gains: long-term equity uses the ₹1.25 lakh exemption and 12.5%", () => {
    const r = capitalGains({ asset: "equity", buyPrice: 100, sellPrice: 300, quantity: 1000, buyDate: "2024-01-10", sellDate: "2025-06-10" })!
    assert.equal(r.isLongTerm, true)
    assert.equal(r.gain, 200_000)
    assert.equal(r.exemptionUsed, 125_000)
    assert.equal(r.tax, 9375)
    assert.equal(r.totalTax, 9750)
  })
  it("capital gains: short-term equity is 20%, held exactly 12 months is still short-term", () => {
    assert.equal(heldMoreThanMonths("2025-01-10", "2026-01-10", 12), false)
    const r = capitalGains({ asset: "equity", buyPrice: 100, sellPrice: 150, quantity: 100, buyDate: "2025-01-10", sellDate: "2026-01-10" })!
    assert.equal(r.isLongTerm, false)
    assert.equal(r.tax, 1000)
  })
  it("capital gains rejects a sell date before the buy date", () => {
    assert.equal(capitalGains({ asset: "equity", buyPrice: 1, sellPrice: 2, quantity: 1, buyDate: "2026-02-01", sellDate: "2026-01-01" }), null)
  })
  it("brokerage: delivery STT is 0.1% on both sides and the lower of flat/% brokerage applies", () => {
    const r = brokerage({ segment: "delivery", exchange: "NSE", buyPrice: 1000, sellPrice: 1100, quantity: 100, brokerageFlat: 20, brokeragePct: 0.03 })!
    assert.equal(r.turnover, 210_000)
    assert.equal(r.stt, 210)
    assert.equal(r.brokerage, 40)
    assert.equal(r.grossPnl, 10_000)
    assert.ok(r.netPnl < r.grossPnl)
  })
})

const holding = (symbol: string, quantity: number, avg_price: number, created_at = "2025-01-01T00:00:00Z"): Holding => ({
  id: symbol,
  symbol,
  quantity,
  avg_price,
  notes: null,
  created_at,
})

describe("portfolio summary", () => {
  it("joins quotes by Yahoo symbol and uses price change × quantity for the day", () => {
    const s = summarizePortfolio(
      [holding("RELIANCE", 10, 1000), holding("TCS.NS", 2, 3000)],
      [
        { symbol: "RELIANCE.NS", price: 1100, change: 10, changePercent: 0.92 },
        { symbol: "TCS.NS", price: 3300, change: -30, changePercent: -0.9 },
      ],
      new Date("2026-01-01T00:00:00Z"),
    )
    assert.equal(s.invested, 16_000)
    assert.equal(s.value, 17_600)
    assert.equal(s.pnl, 1600)
    assert.equal(s.dayChange, 100 - 60)
    close(s.rows[0].weight ?? 0, 11_000 / 17_600, 1e-9)
    assert.ok(s.xirr != null && s.xirr > 9 && s.xirr < 11)
  })
  it("counts unpriced holdings at cost", () => {
    const s = summarizePortfolio([holding("ABC", 5, 100)], [])
    assert.equal(s.value, 500)
    assert.equal(s.hasLivePrices, false)
    assert.equal(s.xirr, null)
  })
  it("XIRR needs an outflow and an inflow", () => {
    assert.equal(xirr([{ amount: 100, date: new Date("2025-01-01") }, { amount: 50, date: new Date("2026-01-01") }]), null)
    close(xirr([{ amount: -100, date: new Date("2025-01-01") }, { amount: 110, date: new Date("2026-01-01") }])!, 10, 0.05)
  })
})

describe("mutual fund periods", () => {
  const history = [
    { date: "10-06-2026", nav: 120 },
    { date: "09-05-2026", nav: 115 },
    { date: "10-01-2026", nav: 110 },
    { date: "10-06-2025", nav: 100 },
  ]
  it("starts a period at the NAV on or before its first day, oldest first", () => {
    const pts = navSeries(history, "1Y")
    assert.equal(pts.length, 4)
    assert.equal(pts[0].c, 100)
    assert.equal(pts[pts.length - 1].c, 120)
    assert.deepEqual(navSeries(history, "1M").map((p) => p.c), [115, 120])
  })
  it("reads the period's return from the API's fields", () => {
    assert.equal(rangeReturn({ returns: { r1y: 20, r3y: null, r5y: null } }, "1Y"), 20)
    assert.equal(rangeReturn({ returns: { r1y: 20, r3y: null, r5y: null } }, "1M"), null)
  })
})

describe("news terms", () => {
  it("uses the curated names for Nifty 50 stocks", () => {
    assert.deepEqual(newsTermsForSymbol("HDFCBANK.NS"), ["HDFC Bank"])
    assert.deepEqual(newsTermsForSymbol("SBIN"), ["State Bank of India", "SBI"])
  })
  it("falls back to the symbol and the company name without suffixes", () => {
    assert.deepEqual(newsTermsForSymbol("TATAELXSI.NS", "Tata Elxsi Limited"), ["TATAELXSI", "Tata Elxsi"])
    assert.deepEqual(newsTermsForSymbol("IT"), [])
  })
  it("matches whole words only", () => {
    assert.equal(mentions("Airtel shares jump", ["Airtel"]), true)
    assert.equal(mentions("Airtelecom launches", ["Airtel"]), false)
  })
})

describe("Nifty 50 data", () => {
  it("has 50 stocks, each in a known sector", () => {
    assert.equal(NIFTY50.length, 50)
    const slugs = new Set(SECTORS.map((s) => s.slug))
    for (const s of NIFTY50) assert.ok(slugs.has(s.sector), s.symbol)
    assert.ok(stocksInSector("information-technology").length >= 4)
    assert.equal(getNiftyStock("reliance.ns")?.short, "Reliance Industries")
  })
})

describe("AI responses", () => {
  it("spots warming-up placeholders", () => {
    assert.equal(isAiPlaceholder({ success: false }), true)
    assert.equal(isAiPlaceholder({ source: "fallback" }), true)
    assert.equal(isAiPlaceholder({ source: "cache", marketOutlook: "x" }), false)
    assert.equal(isAiPlaceholder(null), false)
  })
  it("maps sentiment words to a tone", () => {
    assert.equal(toneOf("Bullish"), "bullish")
    assert.equal(toneOf("Mildly Bearish"), "bearish")
    assert.equal(toneOf("Neutral"), "neutral")
  })
  it("normalises the common Portfolio AI shapes", () => {
    const a = normalizePortfolioAnalysis({
      portfolio_analysis: {
        portfolio_characteristics: { risk_profile: "Moderate", diversification_score: "6/10", sector_exposure: { IT: "60%", Banks: "40%" } },
        strategic_insights: { strengths: ["TCS"], weaknesses: [] },
        rebalancing_suggestions: [{ action: "Diversify", description: "Add another sector" }],
        verdict: "Concentrated in IT.",
      },
    })
    assert.equal(a.riskScore, 45)
    assert.equal(a.diversificationScore, 60)
    assert.deepEqual(a.sectorAllocation, [
      { sector: "IT", weight: 60 },
      { sector: "Banks", weight: 40 },
    ])
    assert.deepEqual(a.strongHoldings, ["TCS"])
    assert.equal(a.weakHoldings, undefined)
    assert.deepEqual(a.rebalancingSuggestions, ["Diversify: Add another sector"])
    assert.equal(a.overallOutlook, "Concentrated in IT.")
  })
})
