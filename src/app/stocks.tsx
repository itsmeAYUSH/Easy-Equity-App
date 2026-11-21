import { FlashList } from "@shopify/flash-list"
import { useMemo, useState } from "react"
import { View } from "react-native"

import { QuoteRow } from "@/components/market/QuoteRow"
import { FilterChips, Segmented, type ChipOption } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { InputField } from "@/components/ui/InputField"
import { groupPosition } from "@/components/ui/List"
import { Page } from "@/components/ui/Page"
import { Text } from "@/components/ui/Text"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { TopBar } from "@/components/ui/TopBar"
import { useQuotes } from "@/hooks/use-market"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { fmtMarketCap } from "@/lib/format"
import { NIFTY50, NIFTY50_AS_OF, SECTORS, type NiftyStock, type SectorSlug } from "@/lib/nifty50"

type Sort = "az" | "gainers" | "losers" | "mcap"

const SECTOR_NAME = new Map(SECTORS.map((s) => [s.slug, s.name.split(" (")[0]]))
const ALL_SYMBOLS = NIFTY50.map((s) => `${s.symbol}.NS`)

/** The 50 Nifty companies with live prices: search, filter by sector, sort. */
export default function NiftyStocksScreen() {
  const [q, setQ] = useState("")
  const [sector, setSector] = useState<SectorSlug | "all">("all")
  const [sort, setSort] = useState<Sort>("az")
  const quotes = useQuotes(ALL_SYMBOLS)
  const bySymbol = useMemo(() => new Map((quotes.data ?? []).map((x) => [x.symbol.toUpperCase(), x])), [quotes.data])
  const { refreshing, onRefresh } = usePullToRefresh(quotes.refetch)

  const sectorChips: ChipOption<SectorSlug | "all">[] = useMemo(
    () => [{ value: "all", label: "All 50" }, ...SECTORS.map((s) => ({ value: s.slug, label: SECTOR_NAME.get(s.slug) ?? s.name }))],
    [],
  )

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const filtered = NIFTY50.filter(
      (s) => (sector === "all" || s.sector === sector) && (!term || s.symbol.toLowerCase().includes(term) || s.name.toLowerCase().includes(term)),
    )
    const quoteOf = (s: NiftyStock) => bySymbol.get(`${s.symbol}.NS`)
    const by: Record<Sort, (a: NiftyStock, b: NiftyStock) => number> = {
      az: (a, b) => a.short.localeCompare(b.short),
      gainers: (a, b) => (quoteOf(b)?.changePercent ?? -999) - (quoteOf(a)?.changePercent ?? -999),
      losers: (a, b) => (quoteOf(a)?.changePercent ?? 999) - (quoteOf(b)?.changePercent ?? 999),
      mcap: (a, b) => (quoteOf(b)?.marketCap ?? 0) - (quoteOf(a)?.marketCap ?? 0),
    }
    return [...filtered].sort(by[sort])
  }, [q, sector, sort, bySymbol])

  const advancing = (quotes.data ?? []).filter((x) => x.changePercent > 0).length
  const declining = (quotes.data ?? []).filter((x) => x.changePercent < 0).length

  return (
    <Page>
      <TopBar title="Nifty 50 stocks" subtitle={quotes.data?.length ? `▲ ${advancing} advancing · ▼ ${declining} declining` : `Index list as of ${NIFTY50_AS_OF}`} />
      <FlashList
        data={list}
        keyExtractor={(s) => s.symbol}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item, index }) => {
          const x = bySymbol.get(`${item.symbol}.NS`)
          return (
            <QuoteRow
              position={groupPosition(index, list.length)}
              symbol={`${item.symbol}.NS`}
              name={`${item.short} · ${sort === "mcap" && x?.marketCap ? fmtMarketCap(x.marketCap) : SECTOR_NAME.get(item.sector)}`}
              price={x?.price}
              changePct={x?.changePercent}
              currency="INR"
            />
          )
        }}
        ListHeaderComponent={
          <View className="gap-3 pb-4">
            <View className="px-5">
              <InputField icon="search" value={q} onChangeText={setQ} placeholder="Search the Nifty 50" autoCorrect={false} returnKeyType="search" />
            </View>
            <FilterChips options={sectorChips} value={sector} onChange={setSector} />
            <View className="px-5">
              <Segmented<Sort>
                options={[
                  { value: "az", label: "A–Z" },
                  { value: "gainers", label: "Gainers" },
                  { value: "losers", label: "Losers" },
                  { value: "mcap", label: "Market cap" },
                ]}
                value={sort}
                onChange={setSort}
              />
            </View>
          </View>
        }
        ListEmptyComponent={<InfoState icon="search-outline" title="No stocks match" body="Try another name or sector." small />}
        ListFooterComponent={<Text className="px-6 pt-5 text-center text-[11px] text-muted-foreground">Nifty 50 list as of {NIFTY50_AS_OF}. Prices may be delayed.</Text>}
        refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </Page>
  )
}
