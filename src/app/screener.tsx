import { FlashList } from "@shopify/flash-list"
import { useMemo, useState } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { errorMessage } from "@/api/errors"
import { QuoteRow } from "@/components/market/QuoteRow"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { FilterChips, Segmented, type ChipOption } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { TopBar } from "@/components/ui/TopBar"
import { Page } from "@/components/ui/Page"
import { ListShimmer } from "@/components/ui/Shimmer"
import { useScreener } from "@/hooks/use-market"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { fmtMarketCap } from "@/lib/format"
import type { ScreenerRow } from "@/lib/types"

type Sort = "change" | "mcap" | "pe" | "near52"

/** The website's screener: a curated large-cap universe, filtered and sorted on the device. */
export default function ScreenerScreen() {
  const screener = useScreener()
  const [sector, setSector] = useState("All")
  const [sort, setSort] = useState<Sort>("change")
  const { refreshing, onRefresh } = usePullToRefresh(screener.refetch)

  const sectors: ChipOption<string>[] = useMemo(
    () => ["All", ...(screener.data?.sectors ?? [])].map((s) => ({ value: s, label: s })),
    [screener.data?.sectors],
  )

  const rows = useMemo(() => {
    const all = screener.data?.rows ?? []
    const filtered = sector === "All" ? all : all.filter((r) => r.sector === sector)
    const key: Record<Sort, (r: ScreenerRow) => number> = {
      change: (r) => -r.changePercent,
      mcap: (r) => -(r.marketCap ?? 0),
      pe: (r) => r.peRatio ?? Number.MAX_SAFE_INTEGER,
      near52: (r) => (r.high52 ? -(r.price / r.high52) : 0),
    }
    return [...filtered].sort((a, b) => key[sort](a) - key[sort](b))
  }, [screener.data?.rows, sector, sort])

  return (
    <Page>
      <TopBar title="Screener" subtitle={screener.data ? `${rows.length} large-cap stocks` : null} />
      <FlashList
        data={rows}
        keyExtractor={(r) => r.symbol}
        renderItem={({ item }) => (
          <QuoteRow
            symbol={item.symbol}
            name={`${item.sector} · ${sort === "pe" ? `P/E ${item.peRatio?.toFixed(1) ?? "—"}` : fmtMarketCap(item.marketCap)}`}
            price={item.price}
            changePct={item.changePercent}
          />
        )}
        ListHeaderComponent={
          <View>
            <FilterChips options={sectors} value={sector} onChange={setSector} />
            <View className="px-4 pb-2">
              <Segmented<Sort>
                options={[
                  { value: "change", label: "Top gainers" },
                  { value: "mcap", label: "Market cap" },
                  { value: "pe", label: "Low P/E" },
                  { value: "near52", label: "Near 52W high" },
                ]}
                value={sort}
                onChange={setSort}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          screener.isPending ? (
            <ListShimmer rows={8} />
          ) : screener.isError ? (
            <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load the screener" body={errorMessage(screener.error)} buttonLabel="Try again" onButtonPress={() => screener.refetch()} />
          ) : (
            <InfoState icon="funnel-outline" title="No stocks match" />
          )
        }
        ListFooterComponent={<Text className="px-4 py-4 text-center text-xs text-muted-foreground">For research only — not a recommendation to buy or sell.</Text>}
        refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </Page>
  )
}
