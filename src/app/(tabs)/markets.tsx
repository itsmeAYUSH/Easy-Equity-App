import Ionicons from "@expo/vector-icons/Ionicons"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { ScrollView, View } from "react-native"

import { errorMessage } from "@/api/errors"
import { AiMeta, AiWarming } from "@/components/ai/AiWarming"
import { Sparkline } from "@/components/charts/Sparkline"
import { BreadthBar, SectorHeatmap } from "@/components/market/Heatmap"
import { MarketStatusPill } from "@/components/market/MarketStatusPill"
import { QuoteRow } from "@/components/market/QuoteRow"
import { TickerStrip } from "@/components/market/TickerStrip"
import { Segmented } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { groupPosition } from "@/components/ui/List"
import { Card, Eyebrow, KeyValue, Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { Pill, sentimentPill } from "@/components/ui/Pill"
import { PriceChange } from "@/components/ui/PriceChange"
import { ListShimmer, Shimmer } from "@/components/ui/Shimmer"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { ToolGrid, type Tool } from "@/components/ui/ToolGrid"
import { HeaderIcon, SectionHeading, TabHeader } from "@/components/ui/TopBar"
import { AI_DISCLAIMER } from "@/constants/legal"
import { useMarketAnalysis } from "@/hooks/use-ai"
import { useCommodities, useFearGreed, useForex, useMacro, useMovers, useScreener, useTickers } from "@/hooks/use-market"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useColors } from "@/lib/appearance"
import { timeAgo, toYahooSymbol } from "@/lib/format"
import type { Mover } from "@/lib/types"

type MoverTab = "gainers" | "losers" | "mostDiscussed"

const TOOLS: Tool[] = [
  { icon: "funnel-outline", label: "Screener", href: "/screener" },
  { icon: "list-outline", label: "Nifty 50", href: "/stocks" },
  { icon: "grid-outline", label: "Sectors", href: "/sectors" },
  { icon: "git-compare-outline", label: "Compare", href: "/compare" },
  { icon: "pie-chart-outline", label: "Mutual funds", href: "/mutual-funds" },
  { icon: "calendar-outline", label: "Calendar", href: "/calendar" },
  { icon: "calculator-outline", label: "Calculators", href: "/calculators" },
  { icon: "school-outline", label: "Learn", href: "/learn" },
]

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`

/** "NEAR_TERM" → "Near term". */
const prettyTimeframe = (t?: string) => {
  const s = (t ?? "").replace(/[_-]+/g, " ").trim().toLowerCase()
  return s ? s[0].toUpperCase() + s.slice(1) : ""
}

export default function MarketsScreen() {
  const p = useColors()
  const tickers = useTickers()
  const movers = useMovers()
  const screener = useScreener()
  const ai = useMarketAnalysis()
  const fearGreed = useFearGreed()
  const commodities = useCommodities()
  const forex = useForex()
  const macro = useMacro()
  const [tab, setTab] = useState<MoverTab>("gainers")
  const { refreshing, onRefresh } = usePullToRefresh(
    tickers.refetch,
    movers.refetch,
    screener.refetch,
    ai.refetch,
    fearGreed.refetch,
    commodities.refetch,
    forex.refetch,
  )

  const list: Mover[] = (movers.data?.[tab] ?? []).slice(0, 8)
  const breadth = useMemo(() => {
    const rows = screener.data?.rows ?? []
    return { adv: rows.filter((r) => r.changePercent > 0).length, dec: rows.filter((r) => r.changePercent < 0).length, total: rows.length }
  }, [screener.data])

  return (
    <Page>
      <TabHeader
        title="Markets"
        subtitle={<MarketStatusPill />}
        right={<HeaderIcon icon="search" label="Search stocks" onPress={() => router.push("/search")} />}
      />
      <ScrollView refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ paddingBottom: 40 }}>
        <TickerStrip />
        {tickers.data?.updatedAt ? <Text className="px-5 pt-2 text-[11px] text-muted-foreground">Prices updated {timeAgo(tickers.data.updatedAt)}</Text> : null}

        {breadth.total > 0 ? (
          <Tappable shrinkTo={0.99} onPress={() => router.push("/screener")} className="mx-5 mt-4 gap-3 rounded-2xl border border-border bg-card p-4">
            <View className="flex-row items-center justify-between">
              <Eyebrow>Market breadth</Eyebrow>
              <Text className="text-[11px] text-muted-foreground">{breadth.total} large caps</Text>
            </View>
            <BreadthBar {...breadth} />
          </Tappable>
        ) : null}

        <SectionHeading title="Explore" />
        <ToolGrid tools={TOOLS} />

        <SectionHeading title="Top movers" subtitle="NIFTY 50 stocks with the biggest moves today" action={{ label: "All 50", onPress: () => router.push("/stocks") }} />
        <View className="px-5 pb-4">
          <Segmented
            options={[
              { value: "gainers", label: "Gainers" },
              { value: "losers", label: "Losers" },
              { value: "mostDiscussed", label: "In the news" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>
        {movers.isPending ? (
          <ListShimmer rows={5} />
        ) : movers.isError ? (
          <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load movers" body={errorMessage(movers.error)} buttonLabel="Try again" onButtonPress={() => movers.refetch()} small />
        ) : list.length === 0 ? (
          <InfoState icon="pulse-outline" title="No movers yet" body="Movers refresh every 15 minutes in market hours." small />
        ) : (
          // Movers are NIFTY 50 stocks sent as bare NSE symbols (ITC): open the Yahoo form.
          list.map((m, i) => (
            <QuoteRow
              key={m.symbol}
              position={groupPosition(i, list.length)}
              symbol={toYahooSymbol(m.symbol)}
              name={tab === "mostDiscussed" && m.mentions ? `${m.name} · ${m.mentions} mentions` : m.name}
              price={m.price}
              changePct={m.changePercent}
            />
          ))
        )}

        {screener.data?.rows?.length ? (
          <>
            <SectionHeading title="Heatmap" subtitle="Today's move by sector · tap a stock" action={{ label: "Screener", onPress: () => router.push("/screener") }} />
            <SectorHeatmap rows={screener.data.rows} />
          </>
        ) : null}

        <AiInsights ai={ai} />

        <SectionHeading title="Global & macro" />
        <View className="gap-3 px-5">
          {fearGreed.data ? <FearGreedCard value={fearGreed.data.value} label={fearGreed.data.classification} history={fearGreed.data.history?.map((h) => h.value) ?? []} /> : null}
          <Card className="py-1">
            <View className="flex-row items-center gap-2 pb-1 pt-2">
              <Ionicons name="diamond-outline" size={15} color={p.accent} />
              <Text className="text-sm font-bold text-foreground">Commodities</Text>
              <Text className="text-[11px] text-muted-foreground">(USD futures)</Text>
            </View>
            {commodities.data?.commodities?.length ? (
              commodities.data.commodities.map((c, i, all) => (
                <KeyValue key={c.symbol} label={c.name} divider={i < all.length - 1} value={<ValueWithChange value={usd(c.price)} pct={c.changePercent} />} />
              ))
            ) : commodities.isPending ? (
              <Shimmer height={80} radius={12} style={{ marginVertical: 8 }} />
            ) : (
              <Text className="py-3 text-sm text-muted-foreground">Commodity prices are unavailable right now.</Text>
            )}
          </Card>
          <Card className="py-1">
            <View className="flex-row items-center gap-2 pb-1 pt-2">
              <Ionicons name="cash-outline" size={15} color={p.accent} />
              <Text className="text-sm font-bold text-foreground">Currencies</Text>
              <Text className="text-[11px] text-muted-foreground">(₹ per unit)</Text>
            </View>
            {forex.data?.rates && Object.keys(forex.data.rates).length ? (
              Object.entries(forex.data.rates).map(([cur, rate], i, all) => (
                <KeyValue key={cur} label={`1 ${cur}`} divider={i < all.length - 1} value={`₹${Number(rate).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`} />
              ))
            ) : forex.isPending ? (
              <Shimmer height={80} radius={12} style={{ marginVertical: 8 }} />
            ) : (
              <Text className="py-3 text-sm text-muted-foreground">Exchange rates are unavailable right now.</Text>
            )}
          </Card>
          {macro.data?.indicators?.length ? (
            <Card className="py-1">
              <View className="flex-row items-center gap-2 pb-1 pt-2">
                <Ionicons name="flag-outline" size={15} color={p.accent} />
                <Text className="text-sm font-bold text-foreground">India macro</Text>
                <Text className="text-[11px] text-muted-foreground">(World Bank)</Text>
              </View>
              {macro.data.indicators.map((m, i, all) => (
                <KeyValue
                  key={m.code}
                  label={m.indicator}
                  hint={m.year}
                  divider={i < all.length - 1}
                  value={m.value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                />
              ))}
            </Card>
          ) : null}
          <Tappable onPress={() => router.push("/market-holidays")} className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <Ionicons name="calendar-clear-outline" size={20} color={p.accent} />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">NSE holidays</Text>
              <Text className="text-xs text-muted-foreground">Days the market is closed this year</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={p.mutedForeground} />
          </Tappable>
        </View>

        <Text className="px-6 pt-6 text-center text-[11px] leading-4 text-muted-foreground">
          Data via Yahoo Finance, CoinGecko, Frankfurter, alternative.me and the World Bank; prices may be delayed. Information only, not investment
          advice. Crypto products are unregulated in India and can be highly risky.
        </Text>
      </ScrollView>
    </Page>
  )
}

function ValueWithChange({ value, pct }: { value: string; pct: number }) {
  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-sm font-semibold text-foreground">{value}</Text>
      <PriceChange pct={pct} size="xs" />
    </View>
  )
}

function AiInsights({ ai }: { ai: ReturnType<typeof useMarketAnalysis> }) {
  const p = useColors()
  const d = ai.data
  return (
    <>
      <SectionHeading title="AI market insights" subtitle="From live prices and today's news" action={{ label: "Digest", onPress: () => router.push("/digest") }} />
      <View className="gap-3 px-5">
        {ai.isPending ? (
          <Card className="gap-3">
            <Shimmer height={14} width="60%" />
            <Shimmer height={12} />
            <Shimmer height={12} width="85%" />
          </Card>
        ) : ai.isError ? (
          <InfoState kind="error" icon="sparkles-outline" title="AI insights are unavailable" body={errorMessage(ai.error)} buttonLabel="Try again" onButtonPress={() => ai.refetch()} small />
        ) : d && ai.warming ? (
          <AiWarming message={d.message} onRetry={() => ai.refetch()} retrying={ai.isFetching} />
        ) : d ? (
          <>
            {d.marketOutlook ? (
              <Card className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Eyebrow>Outlook</Eyebrow>
                  {d.marketSentiment ? (
                    <Pill
                      label={`${d.marketSentiment}${d.sentimentScore != null ? ` · ${d.sentimentScore}/100` : ""}`}
                      tone={sentimentPill(d.marketSentiment).tone}
                      icon={sentimentPill(d.marketSentiment).icon}
                      size="xs"
                    />
                  ) : null}
                </View>
                <Text className="text-sm leading-[22px] text-foreground">{d.marketOutlook}</Text>
                <AiMeta generatedAt={d.generatedAt} />
              </Card>
            ) : null}

            {d.stocksToWatch?.length ? (
              <>
                <Eyebrow className="px-1 pt-2">Stocks to watch</Eyebrow>
                {d.stocksToWatch.slice(0, 5).map((s) => {
                  const t = sentimentPill(s.sentiment)
                  return (
                    <Card key={s.asset} className="gap-2">
                      <View className="flex-row items-center justify-between gap-3">
                        <Text numberOfLines={1} className="flex-1 text-[15px] font-semibold text-foreground">
                          {s.asset}
                        </Text>
                        <Pill label={`${s.sentiment} · ${s.confidence}%`} tone={t.tone} icon={t.icon} size="xs" />
                      </View>
                      <Text className="text-[13px] leading-5 text-muted-foreground">{s.reason}</Text>
                      {s.targetSector || s.timeframe ? (
                        <Text className="text-[11px] text-muted-foreground">{[s.targetSector, prettyTimeframe(s.timeframe)].filter(Boolean).join(" · ")}</Text>
                      ) : null}
                    </Card>
                  )
                })}
              </>
            ) : null}

            {d.sectorAnalysis?.length ? (
              <Card className="py-1">
                <View className="flex-row items-center justify-between pb-1 pt-2">
                  <Text className="text-sm font-bold text-foreground">Sector outlook</Text>
                  <Tappable onPress={() => router.push("/sectors")} hitSlop={8}>
                    <Text className="text-xs font-semibold text-accent">Details</Text>
                  </Tappable>
                </View>
                {d.sectorAnalysis.slice(0, 6).map((s, i, all) => {
                  const t = sentimentPill(s.outlook)
                  return (
                    <View key={s.sector} className={`gap-1 py-2.5 ${i < all.length - 1 ? "border-b border-border/70" : ""}`}>
                      <View className="flex-row items-center justify-between gap-2">
                        <Text className="flex-1 text-sm font-semibold text-foreground">{s.sector}</Text>
                        <Pill label={s.outlook} tone={t.tone} icon={t.icon} size="xs" />
                      </View>
                      <Text numberOfLines={3} className="text-xs leading-[18px] text-muted-foreground">
                        {s.reason}
                      </Text>
                    </View>
                  )
                })}
              </Card>
            ) : null}

            {d.opportunities?.length || d.riskFactors?.length ? (
              <View className="flex-row gap-3">
                {d.opportunities?.length ? (
                  <View className="flex-1 gap-2 rounded-2xl bg-bullish-bg p-3.5">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="bulb-outline" size={14} color={p.bullish} />
                      <Text className="text-xs font-bold text-bullish">Opportunities</Text>
                    </View>
                    {d.opportunities.slice(0, 3).map((o, i) => (
                      <Text key={i} className="text-[11px] leading-4 text-foreground">
                        • {o}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {d.riskFactors?.length ? (
                  <View className="flex-1 gap-2 rounded-2xl bg-bearish-bg p-3.5">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="warning-outline" size={14} color={p.bearish} />
                      <Text className="text-xs font-bold text-bearish">Risks</Text>
                    </View>
                    {d.riskFactors.slice(0, 3).map((r, i) => (
                      <Text key={i} className="text-[11px] leading-4 text-foreground">
                        • {r}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
            <Notice text={AI_DISCLAIMER} />
          </>
        ) : null}
      </View>
    </>
  )
}

/** Crypto Fear & Greed (0–100): the number, a meter and the last 30 days. */
function FearGreedCard({ value, label, history }: { value: number; label: string; history: number[] }) {
  const p = useColors()
  const pct = Math.max(0, Math.min(100, value))
  const color = value >= 55 ? p.bullish : value < 45 ? p.bearish : p.accent
  return (
    <Card className="gap-4">
      <View className="flex-row items-center justify-between">
        <View className="gap-1">
          <Eyebrow>Crypto Fear & Greed</Eyebrow>
          <Text className="text-base font-semibold text-foreground">{label}</Text>
        </View>
        <Text className="text-3xl font-bold" style={{ color }}>
          {value}
        </Text>
      </View>
      <View className="h-2 flex-row overflow-hidden rounded-full">
        <View className="flex-1 bg-bearish" />
        <View className="flex-1 bg-bearish/50" />
        <View className="flex-1 bg-neutral/50" />
        <View className="flex-1 bg-bullish/50" />
        <View className="flex-1 bg-bullish" />
        <View className="absolute -top-1 h-4 w-1.5 rounded-full border border-card bg-foreground" style={{ left: `${pct}%`, marginLeft: -3 }} />
      </View>
      <View className="flex-row justify-between">
        <Text className="text-[11px] text-muted-foreground">Extreme fear</Text>
        <Text className="text-[11px] text-muted-foreground">Extreme greed</Text>
      </View>
      {history.length > 2 ? (
        <View className="gap-1">
          <Sparkline values={history} color={color} />
          <Text className="text-[11px] text-muted-foreground">Last {history.length} days</Text>
        </View>
      ) : null}
    </Card>
  )
}
