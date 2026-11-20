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
import { Notice } from "@/components/ui/Notice"
import { HeaderIcon, SectionHeading, TabHeader } from "@/components/ui/TopBar"
import { Tappable } from "@/components/ui/Tappable"
import { Page } from "@/components/ui/Page"
import { ListShimmer, Shimmer } from "@/components/ui/Shimmer"
import { AI_DISCLAIMER } from "@/constants/legal"
import { useMarketAnalysis } from "@/hooks/use-ai"
import { useFearGreed, useMovers, useTickers } from "@/hooks/use-market"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { timeAgo, toYahooSymbol } from "@/lib/format"
import type { Mover } from "@/lib/types"

type MoverTab = "gainers" | "losers" | "mostDiscussed"

export default function MarketsScreen() {
  const tickers = useTickers()
  const movers = useMovers()
  const ai = useMarketAnalysis()
  const fearGreed = useFearGreed()
  const [tab, setTab] = useState<MoverTab>("gainers")
  const { refreshing, onRefresh } = usePullToRefresh(tickers.refetch, movers.refetch, ai.refetch, fearGreed.refetch)

  const list: Mover[] = movers.data?.[tab] ?? []

  return (
    <Page>
      <TabHeader
        title="Markets"
        subtitle={tickers.data?.updatedAt ? `Updated ${timeAgo(tickers.data.updatedAt)}` : null}
        right={<HeaderIcon icon="search" label="Search stocks" onPress={() => router.push("/search")} />}
      />
      <ScrollView
        refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <TickerStrip />

        <View className="flex-row gap-3 px-4 pt-3">
          <ShortcutTile icon="📊" title="Screener" onPress={() => router.push("/screener")} />
          <ShortcutTile icon="🏦" title="Mutual funds" onPress={() => router.push("/mutual-funds")} />
          <ShortcutTile icon="🧮" title="Calculators" onPress={() => router.push("/calculators")} />
        </View>

        {fearGreed.data ? (
          <View className="mx-4 mt-4 flex-row items-center justify-between rounded-2xl border border-border bg-card p-4">
            <View>
              <Text className="text-xs text-muted-foreground">Crypto Fear & Greed</Text>
              <Text className="text-base font-semibold text-foreground">{fearGreed.data.classification}</Text>
            </View>
            <Text className="text-3xl font-bold text-accent">{fearGreed.data.value}</Text>
          </View>
        ) : null}

        <SectionHeading title="Top movers" />
        <View className="px-4 pb-2">
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
          list.slice(0, 10).map((m) => <QuoteRow key={m.symbol} symbol={toYahooSymbol(m.symbol)} name={m.name} price={m.price} changePct={m.changePercent} />)
        )}

        <SectionHeading title="AI market insights" />
        <View className="gap-3 px-4">
          {ai.isPending ? (
            <View className="gap-2 rounded-2xl border border-border bg-card p-4">
              <Shimmer height={14} width="60%" />
              <Shimmer height={12} />
              <Shimmer height={12} width="85%" />
            </View>
          ) : ai.data ? (
            <>
              <View className="gap-2 rounded-2xl border border-border bg-card p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outlook</Text>
                  <Text className="text-xs font-semibold text-accent">
                    {ai.data.marketSentiment} · {ai.data.sentimentScore}/100
                  </Text>
                </View>
                <Text className="text-sm leading-5 text-foreground">{ai.data.marketOutlook}</Text>
              </View>
              {ai.data.stocksToWatch.slice(0, 5).map((s) => (
                <View key={s.asset} className="gap-1 rounded-2xl border border-border bg-card p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-[15px] font-semibold text-foreground">{s.asset}</Text>
                    <Text className={`text-xs font-semibold ${/bull/i.test(s.sentiment) ? "text-bullish" : /bear/i.test(s.sentiment) ? "text-bearish" : "text-neutral"}`}>
                      {s.sentiment} · {s.confidence}%
                    </Text>
                  </View>
                  <Text className="text-xs leading-5 text-muted-foreground">{s.reason}</Text>
                </View>
              ))}
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

function ShortcutTile({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) {
  return (
    <Tappable onPress={onPress} className="flex-1 items-center gap-1 rounded-2xl border border-border bg-card py-3">
      <Text className="text-xl">{icon}</Text>
      <Text className="text-xs font-semibold text-foreground">{title}</Text>
    </Tappable>
  )
}
