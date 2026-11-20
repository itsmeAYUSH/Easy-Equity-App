import Ionicons from "@expo/vector-icons/Ionicons"
import { router } from "expo-router"
import { useState } from "react"
import { ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { errorMessage } from "@/api/errors"
import { QuoteRow } from "@/components/market/QuoteRow"
import { TickerStrip } from "@/components/market/TickerStrip"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { Segmented } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { groupPosition } from "@/components/ui/List"
import { Card, Eyebrow, Notice } from "@/components/ui/Notice"
import { HeaderIcon, SectionHeading, TabHeader } from "@/components/ui/TopBar"
import { Tappable } from "@/components/ui/Tappable"
import { Page } from "@/components/ui/Page"
import { ListShimmer, Shimmer } from "@/components/ui/Shimmer"
import { AI_DISCLAIMER } from "@/constants/legal"
import { useMarketAnalysis } from "@/hooks/use-ai"
import { useFearGreed, useMovers, useTickers } from "@/hooks/use-market"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useColors } from "@/lib/appearance"
import { timeAgo, toYahooSymbol } from "@/lib/format"
import type { Mover } from "@/lib/types"

type MoverTab = "gainers" | "losers" | "mostDiscussed"

// Full class names (not built from strings) so Tailwind keeps them.
const SENTIMENT = {
  bullish: { box: "bg-bullish-bg", text: "text-bullish" },
  bearish: { box: "bg-bearish-bg", text: "text-bearish" },
  neutral: { box: "bg-neutral-bg", text: "text-neutral" },
} as const

export default function MarketsScreen() {
  const tickers = useTickers()
  const movers = useMovers()
  const ai = useMarketAnalysis()
  const fearGreed = useFearGreed()
  const [tab, setTab] = useState<MoverTab>("gainers")
  const { refreshing, onRefresh } = usePullToRefresh(tickers.refetch, movers.refetch, ai.refetch, fearGreed.refetch)

  const list: Mover[] = (movers.data?.[tab] ?? []).slice(0, 10)

  return (
    <Page>
      <TabHeader
        title="Markets"
        subtitle={tickers.data?.updatedAt ? `Updated ${timeAgo(tickers.data.updatedAt)}` : "Indices, movers and AI insights"}
        right={<HeaderIcon icon="search" label="Search stocks" onPress={() => router.push("/search")} />}
      />
      <ScrollView
        refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <TickerStrip />

        <SectionHeading title="Explore" />
        <View className="gap-3 px-5">
          <View className="flex-row gap-3">
            <ShortcutTile icon="funnel-outline" title="Screener" subtitle="Filter large caps" onPress={() => router.push("/screener")} />
            <ShortcutTile icon="pie-chart-outline" title="Mutual funds" subtitle="NAV & returns" onPress={() => router.push("/mutual-funds")} />
          </View>
          <View className="flex-row gap-3">
            <ShortcutTile icon="calculator-outline" title="Calculators" subtitle="SIP & CAGR" onPress={() => router.push("/calculators")} />
            <ShortcutTile icon="search-outline" title="Search" subtitle="Stocks & crypto" onPress={() => router.push("/search")} />
          </View>
        </View>

        {fearGreed.data ? <FearGreedCard value={fearGreed.data.value} label={fearGreed.data.classification} /> : null}

        <SectionHeading title="Top movers" subtitle="NIFTY 50 stocks with the biggest moves today" />
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
              name={m.name}
              price={m.price}
              changePct={m.changePercent}
            />
          ))
        )}

        <SectionHeading title="AI market insights" subtitle="Generated from live prices and today's news" />
        <View className="gap-3 px-5">
          {ai.isPending ? (
            <Card className="gap-3">
              <Shimmer height={14} width="60%" />
              <Shimmer height={12} />
              <Shimmer height={12} width="85%" />
            </Card>
          ) : ai.data ? (
            <>
              <Card className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Eyebrow>Outlook</Eyebrow>
                  <View className="rounded-full bg-accent/15 px-2.5 py-1">
                    <Text className="text-[11px] font-semibold text-accent">
                      {ai.data.marketSentiment} · {ai.data.sentimentScore}/100
                    </Text>
                  </View>
                </View>
                <Text className="text-sm leading-[22px] text-foreground">{ai.data.marketOutlook}</Text>
              </Card>
              {ai.data.stocksToWatch.slice(0, 5).map((s) => {
                const tone = SENTIMENT[/bull/i.test(s.sentiment) ? "bullish" : /bear/i.test(s.sentiment) ? "bearish" : "neutral"]
                return (
                  <Card key={s.asset} className="gap-2">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text numberOfLines={1} className="flex-1 text-[15px] font-semibold text-foreground">
                        {s.asset}
                      </Text>
                      <View className={`rounded-full px-2.5 py-1 ${tone.box}`}>
                        <Text className={`text-[11px] font-semibold ${tone.text}`}>
                          {s.sentiment} · {s.confidence}%
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[13px] leading-5 text-muted-foreground">{s.reason}</Text>
                  </Card>
                )
              })}
              <Notice text={AI_DISCLAIMER} />
            </>
          ) : (
            <InfoState icon="sparkles-outline" title="AI insights are resting" body="Please try again shortly." small />
          )}
        </View>
      </ScrollView>
    </Page>
  )
}

function ShortcutTile({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle: string
  onPress: () => void
}) {
  const p = useColors()
  return (
    <Tappable onPress={onPress} accessibilityLabel={title} className="flex-1 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
        <Ionicons name={icon} size={20} color={p.accent} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="text-[13px] font-semibold text-foreground">
          {title}
        </Text>
        <Text numberOfLines={1} className="text-[11px] text-muted-foreground">
          {subtitle}
        </Text>
      </View>
    </Tappable>
  )
}

/** Crypto Fear & Greed (0–100) as a number and a meter. */
function FearGreedCard({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <View className="px-5 pt-4">
      <Card className="gap-4">
        <View className="flex-row items-center justify-between">
          <View className="gap-1">
            <Eyebrow>Crypto Fear & Greed</Eyebrow>
            <Text className="text-base font-semibold text-foreground">{label}</Text>
          </View>
          <Text className="text-3xl font-bold text-accent">{value}</Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-secondary">
          <View className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-[11px] text-muted-foreground">Extreme fear</Text>
          <Text className="text-[11px] text-muted-foreground">Extreme greed</Text>
        </View>
      </Card>
    </View>
  )
}
