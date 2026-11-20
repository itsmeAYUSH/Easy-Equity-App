import Ionicons from "@expo/vector-icons/Ionicons"
import { router, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { HttpError, errorMessage } from "@/api/errors"
import { LineChart } from "@/components/charts/LineChart"
import { NewsCard } from "@/components/news/NewsCard"
import { Button } from "@/components/ui/Button"
import { Segmented } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { Card, Notice, Metric } from "@/components/ui/Notice"
import { HeaderIcon, TopBar, SectionHeading } from "@/components/ui/TopBar"
import { PriceChange } from "@/components/ui/PriceChange"
import { Page } from "@/components/ui/Page"
import { Shimmer } from "@/components/ui/Shimmer"
import { AI_DISCLAIMER, CRYPTO_RISK_LINE } from "@/constants/legal"
import { useStockAnalysis } from "@/hooks/use-ai"
import { useArticles } from "@/hooks/use-articles"
import { useHistory, useQuotes } from "@/hooks/use-market"
import { useToggleWatchlist, useWatchlist } from "@/hooks/use-watchlist"
import { useSession } from "@/lib/auth/session"
import { displaySymbol, fmtCompact, fmtMarketCap, fmtNum, fmtPrice } from "@/lib/format"
import { useColors } from "@/lib/appearance"
import type { HistoryRange } from "@/lib/types"

const RANGES: { value: HistoryRange; label: string }[] = [
  { value: "1D", label: "1D" },
  { value: "5D", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
  { value: "5Y", label: "5Y" },
]

export default function StockScreen() {
  const { symbol: raw } = useLocalSearchParams<{ symbol: string }>()
  const symbol = decodeURIComponent(raw ?? "").toUpperCase()
  const base = displaySymbol(symbol)
  const isCrypto = /-USD$/.test(symbol)
  const isIndex = symbol.startsWith("^")
  const p = useColors()

  const [range, setRange] = useState<HistoryRange>("1M")
  const history = useHistory(symbol, range)
  const quote = useQuotes([symbol])
  const q = quote.data?.[0]
  const h = history.data

  const { userId } = useSession()
  const { find } = useWatchlist()
  const { toggle } = useToggleWatchlist()
  const stored = find(symbol)
  const watched = !!stored

  const news = useArticles({ terms: [base, q?.name?.split(" ")[0]].filter(Boolean).join(","), limit: 5 }, { enabled: !!base && !isIndex })
  const ai = useStockAnalysis(symbol)

  // The quote's change is today's; the history's change covers the chosen range.
  const price = q?.price ?? h?.price ?? null
  const dayPct = q?.changePercent ?? (range === "1D" ? h?.changePercent : null) ?? null
  const rangePct = h?.changePercent ?? null
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? range
  const currency = h?.currency ?? q?.currency ?? null
  const name = h?.name ?? q?.name ?? base

  const fmt = (v: number | null | undefined) => (isIndex ? fmtNum(v) : fmtPrice(v, currency))

  return (
    <Page>
      <TopBar
        title={base}
        subtitle={name !== base ? name : null}
        right={
          !isIndex ? (
            <>
              <HeaderIcon
                icon="alarm-outline"
                label="Create price alert"
                onPress={() => router.push(userId ? { pathname: "/create-alert", params: { symbol, price: price != null ? String(price) : "" } } : "/sign-in")}
              />
              <HeaderIcon
                icon={watched ? "star" : "star-outline"}
                label={watched ? "Remove from watchlist" : "Add to watchlist"}
                color={watched ? p.accent : undefined}
                onPress={() => (userId ? toggle(symbol, stored) : router.push("/sign-in"))}
              />
            </>
          ) : null
        }
      />
      <ScrollView contentContainerClassName="pb-12">
        <View className="gap-1 px-4 pt-1">
          {price == null && (history.isPending || quote.isPending) ? (
            <Shimmer height={34} width={160} />
          ) : (
            <Text className="text-3xl font-bold text-foreground">{fmt(price)}</Text>
          )}
          <View className="flex-row items-center gap-3">
            {dayPct != null ? (
              <View className="flex-row items-center gap-1">
                <PriceChange pct={dayPct} size="md" />
                <Text className="text-xs text-muted-foreground">today</Text>
              </View>
            ) : null}
            {rangePct != null && range !== "1D" ? (
              <View className="flex-row items-center gap-1">
                <PriceChange pct={rangePct} size="sm" />
                <Text className="text-xs text-muted-foreground">{rangeLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="px-4 pt-4">
          {h?.points?.length ? (
            <LineChart
              points={h.points}
              formatValue={(v) => fmt(v)}
              formatTime={(t) =>
                range === "1D" || range === "5D"
                  ? new Date(t).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
                  : new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
              }
            />
          ) : history.isError ? (
            <InfoState kind="error" icon="analytics-outline" title="No chart for this range" body={errorMessage(history.error)} small />
          ) : (
            <Shimmer height={200} radius={16} />
          )}
          <View className="mt-3">
            <Segmented options={RANGES} value={range} onChange={setRange} />
          </View>
        </View>

        <SectionHeading title="Key stats" />
        <Card className="mx-4">
          <View className="flex-row flex-wrap gap-y-4">
            <Metric label="Open" value={fmt(h?.stats.open)} />
            <Metric label="Prev. close" value={fmt(h?.stats.prevClose)} />
            <Metric label="Day high" value={fmt(h?.stats.dayHigh)} />
            <Metric label="Day low" value={fmt(h?.stats.dayLow)} />
            <Metric label="52W high" value={fmt(h?.stats.high52 ?? q?.high52)} />
            <Metric label="52W low" value={fmt(h?.stats.low52 ?? q?.low52)} />
            {!isIndex && !isCrypto ? (
              <>
                <Metric label="Market cap" value={fmtMarketCap(q?.marketCap)} />
                <Metric label="P/E" value={q?.peRatio != null ? q.peRatio.toFixed(2) : "—"} />
              </>
            ) : null}
            <Metric label="Volume" value={fmtCompact(h?.stats.volume)} />
          </View>
        </Card>

        {!isIndex ? (
          <>
            <SectionHeading title="AI analysis" />
            <View className="mx-4 gap-3">
              {ai.data ? (
                <AiResult data={ai.data} />
              ) : (
                <Card className="gap-3">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="sparkles" size={18} color={p.accent} />
                    <Text className="flex-1 text-sm text-foreground">Support & resistance levels, trend and risk — generated by AI from live data and news.</Text>
                  </View>
                  {ai.run.isError ? <AiError error={ai.run.error} /> : null}
                  <Button title="Analyse with AI" variant="accent" onPress={() => ai.run.mutate()} loading={ai.run.isPending} />
                  {ai.run.isPending ? <Text className="text-center text-xs text-muted-foreground">This can take up to a minute…</Text> : null}
                </Card>
              )}
              <Notice text={isCrypto ? `${AI_DISCLAIMER} ${CRYPTO_RISK_LINE}` : AI_DISCLAIMER} />
            </View>

            {news.data?.length ? (
              <>
                <SectionHeading title={`News about ${base}`} />
                {news.data.map((a) => (
                  <NewsCard key={a.id} article={a} />
                ))}
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Page>
  )
}

function AiError({ error }: { error: unknown }) {
  const limit = error instanceof HttpError && (error.status === 402 || /LIMIT_REACHED/.test(error.code ?? ""))
  return (
    <View className="gap-2">
      <Text className="text-sm text-destructive">{errorMessage(error, "AI analysis is temporarily unavailable.")}</Text>
      {limit ? <Button title="See Pro" variant="secondary" size="sm" onPress={() => router.push("/pro")} /> : null}
    </View>
  )
}

function AiResult({ data }: { data: NonNullable<ReturnType<typeof useStockAnalysis>["data"]> }) {
  const trend = data.currentTrend ?? "—"
  const tone = /bull/i.test(trend) ? "text-bullish" : /bear/i.test(trend) ? "text-bearish" : "text-foreground"
  return (
    <Card className="gap-4">
      <View className="flex-row flex-wrap gap-y-3">
        <Metric label="Trend" value={trend} valueClassName={tone} />
        <Metric label="Risk" value={data.riskLevel ?? "—"} />
        <Metric label="Confidence" value={data.confidenceScore != null ? `${data.confidenceScore}%` : "—"} />
        <Metric label="Pivot" value={data.pivotPoint != null ? String(data.pivotPoint) : "—"} />
      </View>
      {data.supports?.length || data.resistances?.length ? (
        <View className="flex-row gap-3">
          <Levels title="Support" levels={data.supports ?? []} className="text-bullish" />
          <Levels title="Resistance" levels={data.resistances ?? []} className="text-bearish" />
        </View>
      ) : null}
      {data.analysis ? <Text className="text-sm leading-5 text-foreground">{data.analysis}</Text> : null}
      {data.aiReasoning ? <Text className="text-xs leading-5 text-muted-foreground">{data.aiReasoning}</Text> : null}
    </Card>
  )
}

function Levels({ title, levels, className }: { title: string; levels: { level: string; price: string | number }[]; className: string }) {
  return (
    <View className="flex-1 gap-1 rounded-xl bg-secondary p-3">
      <Text className="text-xs font-semibold text-muted-foreground">{title}</Text>
      {levels.slice(0, 3).map((l) => (
        <View key={l.level} className="flex-row justify-between">
          <Text className="text-xs text-muted-foreground">{l.level}</Text>
          <Text className={`text-xs font-semibold ${className}`}>{String(l.price)}</Text>
        </View>
      ))}
    </View>
  )
}
