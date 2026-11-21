import Ionicons from "@expo/vector-icons/Ionicons"
import { FlashList } from "@shopify/flash-list"
import { useMemo, useState } from "react"
import { View } from "react-native"

import { errorMessage } from "@/api/errors"
import { QuoteRow } from "@/components/market/QuoteRow"
import { FilterChips, Segmented, type ChipOption } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { InputField } from "@/components/ui/InputField"
import { groupPosition } from "@/components/ui/List"
import { Page } from "@/components/ui/Page"
import { ListShimmer } from "@/components/ui/Shimmer"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { TopBar } from "@/components/ui/TopBar"
import { useScreener } from "@/hooks/use-market"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useColors } from "@/lib/appearance"
import { fmtMarketCap, timeAgo } from "@/lib/format"
import type { ScreenerRow } from "@/lib/types"

type Sort = "change" | "mcap" | "pe" | "near52"

const parse = (s: string) => {
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

/** The website's screener: a curated large-cap universe, filtered and sorted on the device. */
export default function ScreenerScreen() {
  const p = useColors()
  const screener = useScreener()
  const [sector, setSector] = useState("All")
  const [sort, setSort] = useState<Sort>("change")
  const [showFilters, setShowFilters] = useState(false)
  const [maxPe, setMaxPe] = useState("")
  const [minCapCr, setMinCapCr] = useState("")
  const [minMove, setMinMove] = useState("")
  const { refreshing, onRefresh } = usePullToRefresh(screener.refetch)

  const sectors: ChipOption<string>[] = useMemo(
    () => ["All", ...(screener.data?.sectors ?? [])].map((s) => ({ value: s, label: s })),
    [screener.data?.sectors],
  )
  const activeFilters = [maxPe, minCapCr, minMove].filter((v) => parse(v) != null).length

  const rows = useMemo(() => {
    const pe = parse(maxPe)
    const cap = parse(minCapCr)
    const move = parse(minMove)
    const filtered = (screener.data?.rows ?? []).filter(
      (r) =>
        (sector === "All" || r.sector === sector) &&
        (pe == null || (r.peRatio != null && r.peRatio > 0 && r.peRatio <= pe)) &&
        (cap == null || (r.marketCap ?? 0) / 1e7 >= cap) &&
        (move == null || r.changePercent >= move),
    )
    const key: Record<Sort, (r: ScreenerRow) => number> = {
      change: (r) => -r.changePercent,
      mcap: (r) => -(r.marketCap ?? 0),
      pe: (r) => (r.peRatio != null && r.peRatio > 0 ? r.peRatio : Number.MAX_SAFE_INTEGER),
      near52: (r) => (r.high52 ? -(r.price / r.high52) : 0),
    }
    return [...filtered].sort((a, b) => key[sort](a) - key[sort](b))
  }, [screener.data?.rows, sector, sort, maxPe, minCapCr, minMove])

  const detail = (r: ScreenerRow) =>
    sort === "pe"
      ? `P/E ${r.peRatio?.toFixed(1) ?? "—"}`
      : sort === "near52" && r.high52
        ? `${((r.price / r.high52) * 100).toFixed(0)}% of 52W high`
        : fmtMarketCap(r.marketCap)

  return (
    <Page>
      <TopBar
        title="Screener"
        subtitle={screener.data ? `${rows.length} of ${screener.data.rows.length} large caps · updated ${timeAgo(screener.data.updatedAt)}` : null}
      />
      <FlashList
        data={rows}
        keyExtractor={(r) => r.symbol}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <QuoteRow
            position={groupPosition(index, rows.length)}
            symbol={item.symbol}
            name={`${item.sector} · ${detail(item)}`}
            price={item.price}
            changePct={item.changePercent}
          />
        )}
        ListHeaderComponent={
          <View className="gap-3 pb-4">
            <FilterChips options={sectors} value={sector} onChange={setSector} />
            <View className="px-5">
              <Segmented<Sort>
                options={[
                  { value: "change", label: "Gainers" },
                  { value: "mcap", label: "Market cap" },
                  { value: "pe", label: "Low P/E" },
                  { value: "near52", label: "Near high" },
                ]}
                value={sort}
                onChange={setSort}
              />
            </View>
            <Tappable onPress={() => setShowFilters((v) => !v)} className="mx-5 flex-row items-center gap-2 self-start rounded-full border border-border bg-card px-3.5 py-2">
              <Ionicons name="options-outline" size={15} color={p.foreground} />
              <Text className="text-xs font-semibold text-foreground">Filters{activeFilters ? ` · ${activeFilters}` : ""}</Text>
              <Ionicons name={showFilters ? "chevron-up" : "chevron-down"} size={14} color={p.mutedForeground} />
            </Tappable>
            {showFilters ? (
              <View className="mx-5 gap-3 rounded-2xl border border-border bg-card p-4">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <InputField label="Max P/E" value={maxPe} onChangeText={setMaxPe} keyboardType="decimal-pad" placeholder="e.g. 30" />
                  </View>
                  <View className="flex-1">
                    <InputField label="Min day move %" value={minMove} onChangeText={setMinMove} keyboardType="numbers-and-punctuation" placeholder="e.g. 0" />
                  </View>
                </View>
                <InputField label="Min market cap (₹ crore)" value={minCapCr} onChangeText={setMinCapCr} keyboardType="number-pad" placeholder="e.g. 50000" />
                {activeFilters ? (
                  <Tappable
                    onPress={() => {
                      setMaxPe("")
                      setMinCapCr("")
                      setMinMove("")
                    }}
                    className="self-start"
                  >
                    <Text className="text-xs font-semibold text-accent">Clear filters</Text>
                  </Tappable>
                ) : null}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          screener.isPending ? (
            <ListShimmer rows={8} />
          ) : screener.isError ? (
            <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load the screener" body={errorMessage(screener.error)} buttonLabel="Try again" onButtonPress={() => screener.refetch()} />
          ) : (
            <InfoState icon="funnel-outline" title="No stocks match" body={activeFilters ? "Loosen a filter." : "Try another sector."} />
          )
        }
        ListFooterComponent={<Text className="px-6 py-5 text-center text-[11px] text-muted-foreground">For research only — not a recommendation to buy or sell.</Text>}
        refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </Page>
  )
}
