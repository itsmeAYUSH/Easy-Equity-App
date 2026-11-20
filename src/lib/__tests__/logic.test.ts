/**
 * Unit tests for the pure logic (run: npm test). No React Native imports here,
 * so they run in plain Node through tsx.
 */
import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { shouldPersistQuery, qk } from "../../queries/keys"
import { cagr, sipProjection } from "../calculators"
import { displaySymbol, fmtINR, fmtMarketCap, fmtPct, toYahooSymbol, trendOf } from "../format"
import { nseStatus } from "../market-status"
import { cleanNewsText, repeatsTitle } from "../text"

describe("toYahooSymbol (same rules as the website)", () => {
  it("adds .NS to bare Indian tickers, including hyphenated NSE symbols", () => {
    assert.equal(toYahooSymbol("reliance"), "RELIANCE.NS")
    assert.equal(toYahooSymbol("BAJAJ-AUTO"), "BAJAJ-AUTO.NS")
  })
  it("leaves Yahoo symbols, indices and crypto pairs alone", () => {
    assert.equal(toYahooSymbol("TCS.NS"), "TCS.NS")
    assert.equal(toYahooSymbol("^NSEI"), "^NSEI")
    assert.equal(toYahooSymbol("BTC-USD"), "BTC-USD")
    assert.equal(toYahooSymbol("INR=X"), "INR=X")
  })
  it("matches the website's mixed watchlist forms to one stock", () => {
    assert.equal(toYahooSymbol("RELIANCE"), toYahooSymbol("RELIANCE.NS"))
  })
  it("displaySymbol strips exchange suffix and caret", () => {
    assert.equal(displaySymbol("RELIANCE.NS"), "RELIANCE")
    assert.equal(displaySymbol("^NSEI"), "NSEI")
  })
})

describe("formatting", () => {
  it("formats rupees with Indian grouping and sign", () => {
    assert.equal(fmtINR(1234567.5), "₹12,34,567.5")
    assert.equal(fmtINR(-500), "-₹500")
    assert.equal(fmtINR(null), "—")
  })
  it("formats market cap in crore / lakh crore", () => {
    assert.equal(fmtMarketCap(2e13), "₹20.00 L Cr")
    assert.equal(fmtMarketCap(5e9), "₹500 Cr")
  })
  it("signs percentages and classifies trend", () => {
    assert.equal(fmtPct(1.234), "+1.23%")
    assert.equal(fmtPct(-0.5), "-0.50%")
    assert.equal(trendOf(0), "flat")
    assert.equal(trendOf(-2), "down")
  })
})

describe("NSE status (India time, whatever the phone's zone)", () => {
  it("is open on a weekday at 11:00 IST", () => {
    assert.equal(nseStatus(new Date("2026-11-17T05:30:00Z")).state, "open") // Tue 11:00 IST
  })
  it("is pre-open at 09:05 IST", () => {
    assert.equal(nseStatus(new Date("2026-11-17T03:35:00Z")).state, "pre-open")
  })
  it("is closed after 15:30 IST and on weekends", () => {
    assert.equal(nseStatus(new Date("2026-11-17T10:30:00Z")).state, "closed") // 16:00 IST
    assert.equal(nseStatus(new Date("2026-11-15T05:30:00Z")).state, "closed") // Sunday
  })
  it("knows exchange holidays", () => {
    const s = nseStatus(new Date("2026-11-24T05:30:00Z"))
    assert.equal(s.state, "holiday")
    assert.match(s.label, /Guru Nanak/)
  })
})

describe("calculators (same formulas as the website)", () => {
  it("SIP: ₹5,000/month for 10 years at 12% ≈ ₹11.6 lakh", () => {
    const r = sipProjection("sip", 5000, 10, 12)
    assert.equal(r.invested, 600000)
    assert.ok(Math.abs(r.futureValue - 1161695) < 5, `got ${r.futureValue}`)
    assert.equal(r.series.length, 10)
  })
  it("SIP at 0% returns exactly what was invested", () => {
    const r = sipProjection("sip", 1000, 2, 0)
    assert.equal(r.futureValue, 24000)
    assert.equal(r.gains, 0)
  })
  it("lump sum compounds yearly", () => {
    const r = sipProjection("lumpsum", 100000, 2, 10)
    assert.ok(Math.abs(r.futureValue - 121000) < 0.01)
  })
  it("CAGR: 1L → 2L in 5 years ≈ 14.87%", () => {
    const r = cagr(100000, 200000, 5)
    assert.ok(r && Math.abs(r.cagrPct - 14.87) < 0.01)
    assert.equal(cagr(0, 100, 5), null)
  })
})

describe("news text", () => {
  it("decodes entities, strips tags and collapses spaces", () => {
    assert.equal(cleanNewsText("Sensex&nbsp;up <b>500</b>&amp;  Nifty"), "Sensex up 500 & Nifty")
    assert.equal(cleanNewsText("&amp;nbsp;"), " ".trim())
  })
  it("detects a summary that only repeats the headline", () => {
    assert.equal(repeatsTitle("Nifty hits record high", "Nifty hits record high"), true)
    assert.equal(repeatsTitle("Nifty hits record high", "Banks led the rally"), false)
  })
})

describe("persisted query cache", () => {
  it("persists public news/market/IPO data", () => {
    assert.equal(shouldPersistQuery(qk.articles({})), true)
    assert.equal(shouldPersistQuery(qk.tickers), true)
    assert.equal(shouldPersistQuery(qk.ipos), true)
  })
  it("never writes per-user or one-off data to disk", () => {
    assert.equal(shouldPersistQuery(qk.watchlist("u1")), false)
    assert.equal(shouldPersistQuery(qk.portfolio("u1")), false)
    assert.equal(shouldPersistQuery(qk.me("u1")), false)
    assert.equal(shouldPersistQuery(qk.search("rel")), false)
    assert.equal(shouldPersistQuery(qk.stockAnalysis("TCS.NS")), false)
  })
})
