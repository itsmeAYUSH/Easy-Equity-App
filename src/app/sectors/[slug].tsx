import { useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
import { ScrollView, View } from "react-native"

import { SectorCard } from "@/components/ai/SectorCard"
import { QuoteRow } from "@/components/market/QuoteRow"
import { InfoState } from "@/components/ui/InfoState"
import { groupPosition } from "@/components/ui/List"
import { Card, Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { PriceChange } from "@/components/ui/PriceChange"
import { Text } from "@/components/ui/Text"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { SectionHeading, TopBar } from "@/components/ui/TopBar"
import { AI_DISCLAIMER } from "@/constants/legal"
import { useSectorIntelligence } from "@/hooks/use-ai"
import { useQuotes } from "@/hooks/use-market"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { fmtMarketCap } from "@/lib/format"
import { getSector, NIFTY50_AS_OF, stocksInSector } from "@/lib/nifty50"

/** Loose match between our NSE sector names and the AI report's ("IT" ↔ "Information Technology"). */
function sameSector(aiName: string, sectorName: string, slug: string): boolean {
  const a = aiName.toLowerCase()
  const b = sectorName.toLowerCase()
  if (a.includes(b.split(" (")[0]) || b.includes(a)) return true
  const aliases: Record<string, string[]> = {
    "information-technology": ["it", "tech", "technology"],
    "financial-services": ["bank", "banking", "financ", "nbfc", "insurance"],
    "oil-gas": ["oil", "energy", "gas"],
    automobile: ["auto"],
    fmcg: ["fmcg", "consumer goods", "consumer staples"],
    healthcare: ["pharma", "health"],
    "metals-mining": ["metal", "mining", "steel"],
    power: ["power", "utilit"],
    telecom: ["telecom"],
    "capital-goods": ["capital goods", "defence", "industrial"],
    "construction-materials": ["cement"],
    construction: ["infra", "construction"],
    "consumer-durables": ["durable"],
    "consumer-services": ["retail", "consumer services"],
    services: ["aviation", "ports", "logistics"],
  }
  return (aliases[slug] ?? []).some((k) => (k.length <= 3 ? new RegExp(`\\b${k}\\b`).test(a) : a.includes(k)))
}

export default function SectorScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const sector = getSector(slug ?? "")
  const stocks = useMemo(() => (sector ? stocksInSector(sector.slug) : []), [sector])
  const symbols = useMemo(() => stocks.map((s) => `${s.symbol}.NS`), [stocks])
  const quotes = useQuotes(symbols)
  const ai = useSectorIntelligence()
  const { refreshing, onRefresh } = usePullToRefresh(quotes.refetch)
  const bySymbol = useMemo(() => new Map((quotes.data ?? []).map((x) => [x.symbol.toUpperCase(), x])), [quotes.data])

  if (!sector) {
    return (
      <Page>
        <TopBar title="Sector" />
        <InfoState icon="grid-outline" title="Sector not found" />
      </Page>
    )
  }

  const moves = stocks.map((s) => bySymbol.get(`${s.symbol}.NS`)?.changePercent).filter((v): v is number => v != null)
  const avg = moves.length ? moves.reduce((a, b) => a + b, 0) / moves.length : null
  const cap = (symbol: string) => bySymbol.get(`${symbol}.NS`)?.marketCap ?? 0
  const hasCaps = stocks.some((s) => cap(s.symbol) > 0)
  const sorted = [...stocks].sort((a, b) => cap(b.symbol) - cap(a.symbol) || a.short.localeCompare(b.short))
  const aiSector = ai.data?.sectors?.find((s) => sameSector(s.name, sector.name, sector.slug))

  return (
    <Page>
      <TopBar title={sector.name.split(" (")[0]} subtitle={`${stocks.length} Nifty 50 ${stocks.length === 1 ? "stock" : "stocks"} · NSE: ${sector.nseIndustry}`} />
      <ScrollView refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerClassName="pb-12">
        <Card className="mx-5 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today, on average</Text>
            {avg != null ? <PriceChange pct={avg} size="sm" variant="pill" /> : null}
          </View>
          <Text className="text-sm leading-[22px] text-foreground">{sector.about}</Text>
        </Card>

        <SectionHeading title="Stocks" subtitle={hasCaps ? "Largest first" : null} />
        {sorted.map((s, i) => {
          const x = bySymbol.get(`${s.symbol}.NS`)
          return (
            <QuoteRow
              key={s.symbol}
              position={groupPosition(i, sorted.length)}
              symbol={`${s.symbol}.NS`}
              name={`${s.short}${x?.marketCap ? ` · ${fmtMarketCap(x.marketCap)}` : ""}`}
              price={x?.price}
              changePct={x?.changePercent}
              currency="INR"
            />
          )
        })}

        {aiSector ? (
          <>
            <SectionHeading title="AI outlook" subtitle="From today's sector intelligence report" />
            <View className="gap-3 px-5">
              <SectorCard sector={aiSector} />
              <Notice text={AI_DISCLAIMER} />
            </View>
          </>
        ) : null}
        <Text className="px-6 pt-6 text-center text-[11px] text-muted-foreground">
          Nifty 50 list as of {NIFTY50_AS_OF}. Educational description, not a view on the sector.
        </Text>
      </ScrollView>
    </Page>
  )
}
