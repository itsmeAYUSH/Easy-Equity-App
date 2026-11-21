import Ionicons from "@expo/vector-icons/Ionicons"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { ScrollView, View } from "react-native"

import { errorMessage } from "@/api/errors"
import { AiMeta, AiWarming } from "@/components/ai/AiWarming"
import { SectorCard } from "@/components/ai/SectorCard"
import { Segmented } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { ListRow, groupPosition } from "@/components/ui/List"
import { Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { PriceChange } from "@/components/ui/PriceChange"
import { Shimmer } from "@/components/ui/Shimmer"
import { Text } from "@/components/ui/Text"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { SectionHeading, TopBar } from "@/components/ui/TopBar"
import { useSectorIntelligence } from "@/hooks/use-ai"
import { useQuotes } from "@/hooks/use-market"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useColors } from "@/lib/appearance"
import { NIFTY50, SECTORS, stocksInSector } from "@/lib/nifty50"

type Tab = "ai" | "nifty"
const ALL_SYMBOLS = NIFTY50.map((s) => `${s.symbol}.NS`)

/** Sectors: the AI outlook (same report as the website's /sectors dashboard) and the Nifty 50 by NSE sector. */
export default function SectorsScreen() {
  const [view, setView] = useState<Tab>("ai")
  return (
    <Page>
      <TopBar title="Sectors" subtitle={view === "ai" ? "AI outlook, drivers and risks" : "The Nifty 50 grouped by NSE sector"} />
      <View className="px-5 pb-3">
        <Segmented<Tab>
          options={[
            { value: "ai", label: "AI outlook" },
            { value: "nifty", label: "Nifty 50 sectors" },
          ]}
          value={view}
          onChange={setView}
        />
      </View>
      {view === "ai" ? <AiSectors /> : <NiftySectors />}
    </Page>
  )
}

function AiSectors() {
  const p = useColors()
  const report = useSectorIntelligence()
  const { refreshing, onRefresh } = usePullToRefresh(report.refetch)
  const d = report.data

  return (
    <ScrollView refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerClassName="gap-3 px-5 pb-12">
      {report.isPending ? (
        [0, 1, 2].map((i) => <Shimmer key={i} height={180} radius={16} />)
      ) : report.isError ? (
        <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load sector analysis" body={errorMessage(report.error)} buttonLabel="Try again" onButtonPress={() => report.refetch()} />
      ) : !d ? null : (
        <>
          {report.warming ? <AiWarming message={d.message} onRetry={() => report.refetch()} retrying={report.isFetching} /> : null}
          {d.loginHint && !d.sectors?.length ? <Notice icon="person-circle-outline" text={d.loginHint} /> : null}
          {d.topSectorToWatch || d.weakestSector ? (
            <View className="flex-row gap-3">
              {d.topSectorToWatch ? (
                <View className="flex-1 gap-1 rounded-2xl bg-bullish-bg p-4">
                  <Ionicons name="trending-up" size={18} color={p.bullish} />
                  <Text className="text-[11px] text-muted-foreground">Sector to watch</Text>
                  <Text className="text-sm font-bold text-bullish">{d.topSectorToWatch}</Text>
                </View>
              ) : null}
              {d.weakestSector ? (
                <View className="flex-1 gap-1 rounded-2xl bg-bearish-bg p-4">
                  <Ionicons name="trending-down" size={18} color={p.bearish} />
                  <Text className="text-[11px] text-muted-foreground">Under pressure</Text>
                  <Text className="text-sm font-bold text-bearish">{d.weakestSector}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <AiMeta generatedAt={d.generatedAt} articles={d.articlesAnalyzed} />
          {(d.sectors ?? []).map((s) => (
            <SectorCard key={s.name} sector={s} />
          ))}
          {d.crossSectorInsights?.length ? (
            <View className="gap-2 rounded-2xl border border-accent/30 bg-accent/10 p-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="sparkles" size={16} color={p.accent} />
                <Text className="text-sm font-bold text-foreground">Cross-sector insights</Text>
              </View>
              {d.crossSectorInsights.map((s, i) => (
                <View key={i} className="flex-row gap-2">
                  <Ionicons name="arrow-forward" size={13} color={p.accent} style={{ marginTop: 3 }} />
                  <Text className="flex-1 text-[13px] leading-5 text-muted-foreground">{s}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Notice text={d.disclaimer} />
        </>
      )}
    </ScrollView>
  )
}

function NiftySectors() {
  const quotes = useQuotes(ALL_SYMBOLS)
  const { refreshing, onRefresh } = usePullToRefresh(quotes.refetch)
  const bySymbol = useMemo(() => new Map((quotes.data ?? []).map((x) => [x.symbol.toUpperCase(), x])), [quotes.data])

  const rows = useMemo(
    () =>
      SECTORS.map((s) => {
        const stocks = stocksInSector(s.slug)
        const moves = stocks.map((st) => bySymbol.get(`${st.symbol}.NS`)?.changePercent).filter((v): v is number => v != null)
        return { sector: s, count: stocks.length, avg: moves.length ? moves.reduce((a, b) => a + b, 0) / moves.length : null }
      }).sort((a, b) => b.count - a.count),
    [bySymbol],
  )

  return (
    <ScrollView refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerClassName="pb-12">
      <SectionHeading first title="By NSE sector" subtitle="Average day move of each sector's Nifty 50 stocks" />
      {rows.map((r, i) => (
        <ListRow
          key={r.sector.slug}
          position={groupPosition(i, rows.length)}
          onPress={() => router.push({ pathname: "/sectors/[slug]", params: { slug: r.sector.slug } })}
          accessibilityLabel={r.sector.name}
        >
          <View className="flex-1 gap-0.5">
            <Text numberOfLines={1} className="text-[15px] font-semibold text-foreground">
              {r.sector.name}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {r.count} {r.count === 1 ? "stock" : "stocks"}
            </Text>
          </View>
          {r.avg != null ? <PriceChange pct={r.avg} size="xs" variant="pill" /> : quotes.isPending ? <Shimmer width={52} height={18} /> : null}
        </ListRow>
      ))}
    </ScrollView>
  )
}
