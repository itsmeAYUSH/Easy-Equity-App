import Ionicons from "@expo/vector-icons/Ionicons"
import { router, useLocalSearchParams } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { ScrollView, Share, View } from "react-native"

import { HttpError, errorMessage } from "@/api/errors"
import { LineChart, type ChartPoint } from "@/components/charts/LineChart"
import { RangeBar } from "@/components/charts/RangeBar"
import { NewsCard } from "@/components/news/NewsCard"
import { Button } from "@/components/ui/Button"
import { Segmented } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { Card, Metric, Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { Pill, sentimentPill, type Tone } from "@/components/ui/Pill"
import { PriceChange } from "@/components/ui/PriceChange"
import { Shimmer } from "@/components/ui/Shimmer"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { HeaderIcon, SectionHeading, TopBar } from "@/components/ui/TopBar"
import { AI_DISCLAIMER, CRYPTO_RISK_LINE } from "@/constants/legal"
import { useAiUsage, useStockAnalysis } from "@/hooks/use-ai"
import { useArticles } from "@/hooks/use-articles"
import { useHistory, useQuotes } from "@/hooks/use-market"
import { useToggleWatchlist, useWatchlist } from "@/hooks/use-watchlist"
import { useColors } from "@/lib/appearance"
import { useSession } from "@/lib/auth/session"
import { SITE_URL } from "@/lib/config"
import { displaySymbol, fmtCompact, fmtMarketCap, fmtNum, fmtPct, fmtPrice } from "@/lib/format"
import { newsTermsForSymbol } from "@/lib/news-terms"
import { getNiftyStock, getSector, stocksInSector } from "@/lib/nifty50"
import type { HistoryRange, StockAnalysis } from "@/lib/types"

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
  const isFx = symbol.includes("=")
  const nifty = !isIndex && !isCrypto && !isFx ? getNiftyStock(base) : undefined
  const p = useColors()

  const [range, setRange] = useState<HistoryRange>("1M")
  const [scrub, setScrub] = useState<ChartPoint | null>(null)
  const history = useHistory(symbol, range)
  const quote = useQuotes([symbol])
  const q = quote.data?.[0]
  const h = history.data

  const { userId } = useSession()
  const { find } = useWatchlist()
  const { toggle } = useToggleWatchlist()
  const stored = find(symbol)
  const watched = !!stored

  const name = h?.name ?? q?.name ?? nifty?.name ?? base
  const terms = useMemo(() => newsTermsForSymbol(symbol, q?.name ?? h?.name), [symbol, q?.name, h?.name])
  const news = useArticles({ terms: terms.join(","), limit: 6 }, { enabled: terms.length > 0 && !isIndex && !isFx })
  const ai = useStockAnalysis(symbol)

  // The quote's change is today's; the history's change covers the chosen range.
  const price = q?.price ?? h?.price ?? null
  const dayPct = q?.changePercent ?? (range === "1D" ? h?.changePercent : null) ?? null
  const dayAbs = q?.change ?? (range === "1D" ? h?.change : null) ?? null
  const rangePct = h?.changePercent ?? null
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? range
  const currency = h?.currency ?? q?.currency ?? null
  const fmt = useCallback((v: number | null | undefined) => (isIndex || isFx ? fmtNum(v) : fmtPrice(v, currency)), [isIndex, isFx, currency])

  const firstPoint = h?.points?.[0]?.c ?? null
  const scrubPct = scrub && firstPoint ? ((scrub.c - firstPoint) / firstPoint) * 100 : null
  const formatTime = useCallback(
    (t: number) =>
      range === "1D" || range === "5D"
        ? new Date(t).toLocaleString("en-IN", { weekday: range === "5D" ? "short" : undefined, hour: "numeric", minute: "2-digit" })
        : new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }),
    [range],
  )

  const sector = nifty ? getSector(nifty.sector) : undefined
  const peers = nifty ? stocksInSector(nifty.sector).filter((s) => s.symbol !== nifty.symbol) : []

  const share = () =>
    void Share.share({
      message: `${name} (${base})${price != null ? ` · ${fmt(price)}` : ""}${dayPct != null ? ` (${fmtPct(dayPct)} today)` : ""}\n${SITE_URL}/stock/${encodeURIComponent(base)}`,
    })

  return (
    <Page>
      <TopBar
        title={base}
        subtitle={name !== base ? name : null}
        right={
          !isIndex && !isFx ? (
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
          ) : (
            <HeaderIcon icon="share-outline" label="Share" onPress={share} />
          )
        }
      />
      <ScrollView contentContainerClassName="pb-12">
        {/* Price header: follows the scrubber while the chart is touched. */}
        <View className="gap-1.5 px-5 pt-1">
          {price == null && (history.isPending || quote.isPending) ? (
            <Shimmer height={36} width={170} />
          ) : (
            <Text className="text-[34px] font-bold leading-[42px] text-foreground">{fmt(scrub ? scrub.c : price)}</Text>
          )}
          <View className="min-h-[22px] flex-row flex-wrap items-center gap-x-3 gap-y-1">
            {scrub ? (
              <>
                {scrubPct != null ? <PriceChange pct={scrubPct} size="sm" /> : null}
                <Text className="text-xs text-muted-foreground">{formatTime(scrub.t)}</Text>
              </>
            ) : (
              <>
                {dayPct != null ? (
                  <View className="flex-row items-center gap-1.5">
                    <PriceChange pct={dayPct} size="md" />
                    {dayAbs != null ? (
                      <Text className={`text-sm font-medium ${dayAbs >= 0 ? "text-bullish" : "text-bearish"}`}>
                        ({dayAbs >= 0 ? "+" : ""}
                        {fmtNum(dayAbs)})
                      </Text>
                    ) : null}
                    <Text className="text-xs text-muted-foreground">today</Text>
                  </View>
                ) : null}
                {rangePct != null && range !== "1D" ? (
                  <View className="flex-row items-center gap-1">
                    <PriceChange pct={rangePct} size="sm" />
                    <Text className="text-xs text-muted-foreground">{rangeLabel}</Text>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>

        <View className="pt-3">
          <View className="px-5">
            {h?.points?.length ? (
              <LineChart
                points={h.points}
                height={220}
                formatValue={fmt}
                formatTime={formatTime}
                onScrub={setScrub}
                baseline={range === "1D" ? h.stats.prevClose : null}
              />
            ) : history.isError ? (
              <InfoState kind="error" icon="analytics-outline" title="No chart for this range" body={errorMessage(history.error)} small />
            ) : (
              <Shimmer height={220} radius={16} />
            )}
          </View>
          <View className="mt-3 px-5">
            <Segmented options={RANGES} value={range} onChange={setRange} />
          </View>
        </View>

        {/* Quick actions */}
        <View className="flex-row gap-2 px-5 pt-4">
          {!isIndex && !isFx ? (
            <ActionChip icon="git-compare-outline" label="Compare" onPress={() => router.push({ pathname: "/compare", params: { symbols: symbol } })} />
          ) : null}
          {sector ? <ActionChip icon="grid-outline" label={sector.name.split(" (")[0]} onPress={() => router.push({ pathname: "/sectors/[slug]", params: { slug: sector.slug } })} /> : null}
          {!isIndex && !isFx ? <ActionChip icon="share-outline" label="Share" onPress={share} /> : null}
        </View>

        <SectionHeading title="Key stats" />
        <Card className="mx-5 gap-5">
          <View className="flex-row flex-wrap gap-y-4">
            <Metric label="Open" value={fmt(h?.stats.open)} />
            <Metric label="Prev. close" value={fmt(h?.stats.prevClose)} />
            <Metric label="Day high" value={fmt(h?.stats.dayHigh)} />
            <Metric label="Day low" value={fmt(h?.stats.dayLow)} />
            {!isIndex && !isCrypto && !isFx ? (
              <>
                <Metric label="Market cap" value={fmtMarketCap(q?.marketCap)} />
                <Metric label="P/E" value={q?.peRatio != null ? q.peRatio.toFixed(2) : "—"} />
                <Metric label="EPS (TTM)" value={q?.eps != null ? q.eps.toFixed(2) : "—"} />
              </>
            ) : null}
            <Metric label="Volume" value={fmtCompact(h?.stats.volume)} />
          </View>
          <RangeBar low={h?.stats.low52 ?? q?.low52} high={h?.stats.high52 ?? q?.high52} value={price} format={fmt} />
        </Card>

        {nifty && sector ? (
          <>
            <SectionHeading title={`About ${nifty.short}`} subtitle={`NSE: ${nifty.symbol} · ISIN ${nifty.isin}`} />
            <Card className="mx-5 gap-3">
              <Text className="text-sm leading-[22px] text-foreground">{nifty.about}</Text>
              <Tappable
                onPress={() => router.push({ pathname: "/sectors/[slug]", params: { slug: sector.slug } })}
                className="flex-row items-center gap-2 self-start rounded-full bg-secondary px-3 py-1.5"
              >
                <Ionicons name="grid-outline" size={13} color={p.foreground} />
                <Text className="text-xs font-semibold text-foreground">{sector.name}</Text>
                <Ionicons name="chevron-forward" size={13} color={p.mutedForeground} />
              </Tappable>
            </Card>
            {peers.length ? (
              <>
                <Text className="px-5 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Same sector in the Nifty 50</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5">
                  {peers.map((s) => (
                    <Tappable
                      key={s.symbol}
                      onPress={() => router.push({ pathname: "/stock/[symbol]", params: { symbol: `${s.symbol}.NS` } })}
                      className="rounded-full border border-border bg-card px-3.5 py-2"
                    >
                      <Text className="text-xs font-semibold text-foreground">{s.short}</Text>
                    </Tappable>
                  ))}
                </ScrollView>
              </>
            ) : null}
          </>
        ) : null}

        {!isIndex && !isFx ? (
          <>
            <SectionHeading title="AI technical analysis" subtitle="Trend, support & resistance from live data and news" />
            <View className="mx-5 gap-3">
              {ai.data ? (
                <AiResult data={ai.data} fmt={fmt} />
              ) : (
                <Card className="gap-4">
                  <View className="flex-row items-start gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
                      <Ionicons name="sparkles" size={20} color={p.accent} />
                    </View>
                    <Text className="flex-1 text-sm leading-[21px] text-foreground">
                      Trend, support and resistance levels and a short summary of {base}&apos;s recent price behaviour. Observations only, not a
                      recommendation.
                    </Text>
                  </View>
                  {ai.run.isError ? <AiError error={ai.run.error} /> : null}
                  <Button title={ai.run.isPending ? "Analysing…" : "Run AI analysis"} icon="sparkles" variant="accent" onPress={() => ai.run.mutate()} loading={ai.run.isPending} />
                  <UsageNote pending={ai.run.isPending} />
                </Card>
              )}
              <Notice text={isCrypto ? `${AI_DISCLAIMER} ${CRYPTO_RISK_LINE}` : AI_DISCLAIMER} />
            </View>

            {news.data?.length ? (
              <>
                <SectionHeading title={`News about ${nifty?.short ?? base}`} />
                <View className="gap-3">
                  {news.data.map((a) => (
                    <NewsCard key={a.id} article={a} />
                  ))}
                </View>
              </>
            ) : null}
          </>
        ) : null}
        <Text className="px-6 pt-8 text-center text-[11px] leading-4 text-muted-foreground">
          Prices may be delayed. Check with your broker before trading. Information only, not investment advice.
        </Text>
      </ScrollView>
    </Page>
  )
}

function ActionChip({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const p = useColors()
  return (
    <Tappable onPress={onPress} accessibilityLabel={label} className="h-9 flex-row items-center gap-1.5 rounded-full border border-border bg-card px-3.5">
      <Ionicons name={icon} size={15} color={p.foreground} />
      <Text numberOfLines={1} className="text-xs font-semibold text-foreground">
        {label}
      </Text>
    </Tappable>
  )
}

/** "Uses 1 of your 3 daily analyses · 2 left today". */
function UsageNote({ pending }: { pending: boolean }) {
  const { userId } = useSession()
  const usage = useAiUsage()
  if (pending) return <Text className="text-center text-xs text-muted-foreground">This can take up to a minute…</Text>
  const u = usage.data
  const text = !userId
    ? "Uses 1 AI analysis. Sign in free for 3 a day; Pro is unlimited."
    : u?.unlimited
      ? "Unlimited AI analyses with Pro."
      : u
        ? `Uses 1 of your ${u.limit} daily AI analyses · ${u.remaining ?? 0} left today.`
        : "Uses 1 of your daily AI analyses (free accounts get 3 a day)."
  return <Text className="text-center text-xs leading-[18px] text-muted-foreground">{text}</Text>
}

function AiError({ error }: { error: unknown }) {
  const guestLimit = error instanceof HttpError && error.code === "GUEST_LIMIT_REACHED"
  const limit = error instanceof HttpError && (error.status === 402 || /LIMIT_REACHED/.test(error.code ?? ""))
  return (
    <View className="gap-2 rounded-xl bg-bearish-bg p-3">
      <Text className="text-sm text-destructive">{errorMessage(error, "AI analysis is temporarily unavailable.")}</Text>
      {guestLimit ? (
        <Button title="Sign in for more" variant="secondary" size="sm" onPress={() => router.push("/sign-in")} />
      ) : limit ? (
        <Button title="See Pro" variant="secondary" size="sm" onPress={() => router.push("/pro")} />
      ) : null}
    </View>
  )
}

const riskTone = (r?: string): Tone => (/low/i.test(r ?? "") ? "bullish" : /high/i.test(r ?? "") ? "bearish" : "accent")

function AiResult({ data, fmt }: { data: StockAnalysis; fmt: (v: number | null | undefined) => string }) {
  const trend = data.currentTrend ?? "—"
  const t = sentimentPill(trend)
  const conf = data.confidenceScore
  const pivot = typeof data.pivotPoint === "number" ? fmt(data.pivotPoint) : data.pivotPoint
  return (
    <Card className="gap-5">
      <View className="flex-row flex-wrap items-center gap-2">
        <Pill tone={t.tone} icon={t.icon} label={trend} />
        {data.riskLevel ? <Pill tone={riskTone(data.riskLevel)} label={`${data.riskLevel} risk`} /> : null}
        {conf != null ? <Pill tone={conf >= 70 ? "bullish" : conf >= 40 ? "accent" : "bearish"} label={`${conf}% confidence`} /> : null}
      </View>

      <View className="flex-row flex-wrap gap-y-4">
        {data.currentPrice != null ? <Metric label="Price used" value={String(data.currentPrice)} /> : null}
        {pivot ? <Metric label="Pivot point" value={String(pivot)} /> : null}
        {data.newsSentimentPercent != null ? <Metric label="News sentiment" value={`${data.newsSentimentPercent}% positive`} /> : null}
        {data.sectorMomentum ? <Metric label="Sector momentum" value={data.sectorMomentum} /> : null}
      </View>

      {data.resistances?.length ? <Levels title="Resistance" levels={data.resistances} tone="bearish" /> : null}
      {data.supports?.length ? <Levels title="Support" levels={data.supports} tone="bullish" /> : null}

      {data.analysis ? (
        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</Text>
          <Text className="text-sm leading-[22px] text-foreground">{data.analysis}</Text>
        </View>
      ) : null}
      {data.aiReasoning ? (
        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Technical reasoning</Text>
          <Text className="text-[13px] leading-5 text-muted-foreground">{data.aiReasoning}</Text>
        </View>
      ) : null}
      {data.generatedAt || data.dataSource ? (
        <Text className="text-[11px] text-muted-foreground">
          {[
            data.liveDataAvailable ? "● Market data" : null,
            data.dataSource,
            data.generatedAt ? `Updated ${new Date(data.generatedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      ) : null}
    </Card>
  )
}

function Levels({
  title,
  levels,
  tone,
}: {
  title: string
  levels: { level: string; price: string | number; strength?: string; note?: string }[]
  tone: "bullish" | "bearish"
}) {
  return (
    <View className="gap-2">
      <Text className={`text-xs font-semibold uppercase tracking-wider ${tone === "bullish" ? "text-bullish" : "text-bearish"}`}>{title} levels</Text>
      {levels.slice(0, 3).map((l) => (
        <View key={`${l.level}-${l.price}`} className={`gap-1 rounded-xl px-3 py-2.5 ${tone === "bullish" ? "bg-bullish-bg" : "bg-bearish-bg"}`}>
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-sm font-semibold text-foreground">
              {l.level} · {String(l.price)}
            </Text>
            {l.strength ? <Pill label={l.strength} size="xs" /> : null}
          </View>
          {l.note ? <Text className="text-xs leading-[18px] text-muted-foreground">{l.note}</Text> : null}
        </View>
      ))}
    </View>
  )
}
