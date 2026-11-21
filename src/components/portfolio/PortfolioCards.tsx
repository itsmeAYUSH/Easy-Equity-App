/**
 * The cards under the holdings list: allocation, Portfolio AI (Pro),
 * dividends and news about what you hold — the same sections as the
 * website's Portfolio page, laid out for a phone.
 */
import Ionicons from "@expo/vector-icons/Ionicons"
import { router } from "expo-router"
import { memo, useMemo } from "react"
import { ActivityIndicator, View } from "react-native"

import { errorMessage } from "@/api/errors"
import { CHART_COLORS, Donut } from "@/components/charts/Donut"
import { Button } from "@/components/ui/Button"
import { Card, Eyebrow, Notice } from "@/components/ui/Notice"
import { Pill } from "@/components/ui/Pill"
import { Shimmer } from "@/components/ui/Shimmer"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { SectionHeading } from "@/components/ui/TopBar"
import { useAiUsage, usePortfolioAnalysis } from "@/hooks/use-ai"
import { useArticles } from "@/hooks/use-articles"
import { useDividends } from "@/hooks/use-portfolio"
import { useColors } from "@/lib/appearance"
import { useSession } from "@/lib/auth/session"
import { displaySymbol, fmtINR, timeAgo } from "@/lib/format"
import { mentions, newsTermsFor } from "@/lib/news-terms"
import type { HoldingRow } from "@/lib/portfolio"
import { cleanNewsText } from "@/lib/text"
import type { Holding } from "@/lib/types"

const MAX_SLICES = 6

/** Where the money is: a ring of the biggest holdings and a legend. */
export const AllocationCard = memo(function AllocationCard({ rows }: { rows: HoldingRow[] }) {
  const slices = useMemo(() => {
    const priced = rows.filter((r) => (r.value ?? 0) > 0).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    const total = priced.reduce((s, r) => s + (r.value ?? 0), 0)
    const top = priced.slice(0, MAX_SLICES).map((r, i) => ({
      label: displaySymbol(r.symbol),
      value: r.value ?? 0,
      pct: total > 0 ? ((r.value ?? 0) / total) * 100 : 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
    const rest = priced.slice(MAX_SLICES).reduce((s, r) => s + (r.value ?? 0), 0)
    if (rest > 0) top.push({ label: `${priced.length - MAX_SLICES} others`, value: rest, pct: (rest / total) * 100, color: "#9CA3AF" })
    return { top, count: priced.length }
  }, [rows])

  if (!slices.top.length) return null
  return (
    <>
      <SectionHeading title="Allocation" subtitle="Share of your portfolio's current value" />
      <Card className="mx-5 flex-row items-center gap-5">
        <Donut segments={slices.top} size={132} thickness={16}>
          <Text className="text-xl font-bold text-foreground">{slices.count}</Text>
          <Text className="text-[11px] text-muted-foreground">{slices.count === 1 ? "stock" : "stocks"}</Text>
        </Donut>
        <View className="flex-1 gap-2">
          {slices.top.map((s) => (
            <View key={s.label} className="flex-row items-center gap-2">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <Text numberOfLines={1} className="flex-1 text-xs font-medium text-foreground">
                {s.label}
              </Text>
              <Text className="text-xs font-semibold text-muted-foreground">{s.pct.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      </Card>
    </>
  )
})

function ScoreBar({ label, value, goodHigh }: { label: string; value: number; goodHigh: boolean }) {
  const good = goodHigh ? value >= 70 : value <= 30
  const bad = goodHigh ? value < 40 : value > 60
  const color = good ? "bg-bullish" : bad ? "bg-bearish" : "bg-accent"
  return (
    <View className="flex-1 gap-2 rounded-2xl bg-secondary p-3">
      <Text className="text-[11px] text-muted-foreground">{label}</Text>
      <Text className="text-xl font-bold text-foreground">
        {value}
        <Text className="text-xs text-muted-foreground">/100</Text>
      </Text>
      <View className="h-1.5 overflow-hidden rounded-full bg-background">
        <View className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </View>
    </View>
  )
}

/** Portfolio AI (Pro): diversification, sector mix, risks. */
export function PortfolioAiCard({ holdings }: { holdings: Holding[] }) {
  const { isPro } = useSession()
  const p = useColors()
  const { data, run } = usePortfolioAnalysis()
  const usage = useAiUsage()

  return (
    <>
      <SectionHeading title="Portfolio AI" subtitle="Diversification, sector mix and risks" />
      <View className="mx-5 gap-3">
        {!isPro ? (
          <Card className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
                <Ionicons name="diamond-outline" size={20} color={p.accent} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">A Pro feature</Text>
                <Text className="text-xs leading-[18px] text-muted-foreground">AI reads your holdings and describes concentration, sector mix and risks.</Text>
              </View>
            </View>
            <Button title="See Pro" variant="secondary" size="sm" onPress={() => router.push("/pro")} />
          </Card>
        ) : data ? (
          <Card className="gap-4">
            {data.riskScore != null || data.diversificationScore != null ? (
              <View className="flex-row gap-3">
                {data.riskScore != null ? <ScoreBar label="Risk score" value={data.riskScore} goodHigh={false} /> : null}
                {data.diversificationScore != null ? <ScoreBar label="Diversification" value={data.diversificationScore} goodHigh /> : null}
              </View>
            ) : null}
            {data.overallOutlook ? <Text className="text-sm leading-[22px] text-foreground">{data.overallOutlook}</Text> : null}
            {data.sectorAllocation?.length ? (
              <View className="gap-2">
                <Eyebrow>Sector mix</Eyebrow>
                {data.sectorAllocation.slice(0, 8).map((s) => (
                  <View key={s.sector} className="flex-row items-center gap-3">
                    <Text numberOfLines={1} className="w-28 text-xs text-foreground">
                      {s.sector}
                    </Text>
                    <View className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <View className="h-full rounded-full bg-accent" style={{ width: `${Math.max(0, Math.min(100, s.weight))}%` }} />
                    </View>
                    <Text className="w-11 text-right text-xs font-semibold text-muted-foreground">{Math.round(s.weight)}%</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {data.strongHoldings?.length ? (
              <View className="gap-1 rounded-xl bg-bullish-bg p-3">
                <Text className="text-xs font-semibold text-bullish">Strengths</Text>
                <Text className="text-xs leading-[18px] text-foreground">{data.strongHoldings.join(" · ")}</Text>
              </View>
            ) : null}
            {data.weakHoldings?.length ? (
              <View className="gap-1 rounded-xl bg-bearish-bg p-3">
                <Text className="text-xs font-semibold text-bearish">Weaknesses</Text>
                <Text className="text-xs leading-[18px] text-foreground">{data.weakHoldings.join(" · ")}</Text>
              </View>
            ) : null}
            {data.rebalancingSuggestions?.length ? (
              <View className="gap-1.5">
                <Eyebrow>Things to consider</Eyebrow>
                {data.rebalancingSuggestions.map((s, i) => (
                  <View key={i} className="flex-row gap-2">
                    <Text className="text-accent">•</Text>
                    <Text className="flex-1 text-xs leading-[18px] text-muted-foreground">{s}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <Button title="Run again" variant="ghost" size="sm" icon="refresh" onPress={() => run.mutate(holdings)} loading={run.isPending} />
          </Card>
        ) : (
          <Card className="gap-3">
            <Text className="text-sm leading-[21px] text-foreground">Get an AI read of how concentrated your portfolio is and where its risks sit.</Text>
            {run.isError ? <Text className="text-sm text-destructive">{errorMessage(run.error, "Portfolio analysis failed.")}</Text> : null}
            <Button title="Analyse my portfolio" icon="sparkles" variant="accent" onPress={() => run.mutate(holdings)} loading={run.isPending} />
            <Text className="text-center text-[11px] text-muted-foreground">
              {run.isPending ? "This can take up to a minute…" : usage.data?.unlimited ? "Unlimited with Pro." : "Uses 1 AI analysis."}
            </Text>
          </Card>
        )}
        <Notice text="AI-generated from your holdings, which are sent to Google Gemini to produce it. It can be wrong. Information only, not investment advice; EasyEquity is not SEBI-registered." />
      </View>
    </>
  )
}

const fmtDay = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })

/** Dividends paid in the last 12 months on what you hold. */
export function DividendsCard({ holdings }: { holdings: Holding[] }) {
  const p = useColors()
  const dividends = useDividends(holdings)
  const d = dividends.data
  const payers = d?.holdings.filter((h) => h.last12mPerShare > 0) ?? []
  const recent = (d?.holdings ?? [])
    .flatMap((h) => h.payments.map((pay) => ({ ...pay, symbol: h.symbol, received: pay.amount * h.quantity })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  return (
    <>
      <SectionHeading title="Dividends" subtitle="Paid in the last 12 months, before TDS" />
      <Card className="mx-5 gap-4">
        {dividends.isPending ? (
          <View className="gap-2">
            <Shimmer height={44} radius={12} />
            <Shimmer height={12} width="70%" />
          </View>
        ) : dividends.isError || !d ? (
          <View className="flex-row items-center gap-2">
            <Ionicons name="cloud-offline-outline" size={16} color={p.mutedForeground} />
            <Text className="flex-1 text-sm text-muted-foreground">Dividend data is unavailable right now.</Text>
          </View>
        ) : (
          <>
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1 rounded-2xl bg-secondary p-3">
                <Text className="text-[11px] text-muted-foreground">Est. yearly income</Text>
                <Text className="text-lg font-bold text-foreground">{fmtINR(d.totalEstAnnualIncome, 0)}</Text>
              </View>
              <View className="flex-1 gap-1 rounded-2xl bg-secondary p-3">
                <Text className="text-[11px] text-muted-foreground">Holdings that paid</Text>
                <Text className="text-lg font-bold text-foreground">
                  {payers.length} of {d.holdings.length + d.unavailable.length}
                </Text>
              </View>
            </View>
            {payers.length ? (
              <View>
                {payers.slice(0, 8).map((h, i) => (
                  <View key={h.symbol} className={`flex-row items-center gap-3 py-2.5 ${i < Math.min(payers.length, 8) - 1 ? "border-b border-border/70" : ""}`}>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">{displaySymbol(h.symbol)}</Text>
                      <Text className="text-[11px] text-muted-foreground">
                        {fmtINR(h.last12mPerShare)}/share{h.yieldOnCostPct != null ? ` · ${h.yieldOnCostPct.toFixed(2)}% on cost` : ""}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold text-bullish">{fmtINR(h.estAnnualIncome, 0)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-muted-foreground">None of your holdings paid a dividend in the last 12 months.</Text>
            )}
            {recent.length ? (
              <View className="gap-1.5">
                <Eyebrow>Recent payments</Eyebrow>
                {recent.map((r) => (
                  <Text key={`${r.symbol}-${r.date}`} className="text-xs text-muted-foreground">
                    <Text className="text-xs font-semibold text-foreground">{displaySymbol(r.symbol)}</Text> · ex-date {fmtDay(r.date)} · {fmtINR(r.amount)}/share (≈{" "}
                    {fmtINR(r.received, 0)})
                  </Text>
                ))}
              </View>
            ) : null}
            {d.unavailable.length ? <Text className="text-[11px] text-muted-foreground">No dividend data for: {d.unavailable.join(", ")}.</Text> : null}
            <Text className="text-[11px] leading-4 text-muted-foreground">Estimates assume your current quantity and that past dividends repeat, which they may not.</Text>
          </>
        )}
      </Card>
    </>
  )
}

/** Recent news that mentions the stocks you hold. */
export function HoldingsNews({ symbols }: { symbols: string[] }) {
  const p = useColors()
  const groups = useMemo(() => newsTermsFor(symbols).filter((g) => g.terms.length), [symbols])
  const allTerms = useMemo(() => [...new Set(groups.flatMap((g) => g.terms))].slice(0, 24), [groups])
  const articles = useArticles({ terms: allTerms.join(","), limit: 15 }, { enabled: allTerms.length > 0 })

  const items = useMemo(
    () =>
      (articles.data ?? [])
        .map((a) => ({ article: a, matched: groups.filter((g) => mentions(`${a.title} ${a.summary ?? ""}`, g.terms)).map((g) => g.symbol) }))
        .slice(0, 8),
    [articles.data, groups],
  )

  if (!allTerms.length) return null
  return (
    <>
      <SectionHeading title="News about your holdings" />
      <Card className="mx-5 py-1">
        {articles.isPending ? (
          <View className="items-center py-6">
            <ActivityIndicator color={p.mutedForeground} />
          </View>
        ) : !items.length ? (
          <Text className="py-4 text-sm text-muted-foreground">No recent news about your holdings in our feed.</Text>
        ) : (
          items.map(({ article: a, matched }, i) => (
            <Tappable
              key={a.id}
              shrinkTo={1}
              onPress={() => router.push({ pathname: "/article/[id]", params: { id: a.id } })}
              className={`gap-1.5 py-3 ${i < items.length - 1 ? "border-b border-border/70" : ""}`}
            >
              <Text numberOfLines={2} className="text-sm font-semibold leading-5 text-foreground">
                {cleanNewsText(a.title)}
              </Text>
              <View className="flex-row flex-wrap items-center gap-1.5">
                {matched.slice(0, 3).map((s) => (
                  <Pill key={s} label={s} tone="accent" size="xs" />
                ))}
                <Text className="text-[11px] text-muted-foreground">
                  {a.source} · {timeAgo(a.published_at)}
                </Text>
              </View>
            </Tappable>
          ))
        )}
      </Card>
    </>
  )
}
