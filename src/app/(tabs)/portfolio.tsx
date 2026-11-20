import Ionicons from "@expo/vector-icons/Ionicons"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { Alert, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { errorMessage } from "@/api/errors"
import { SignInPrompt } from "@/components/auth/SignInPrompt"
import { QuoteRow } from "@/components/market/QuoteRow"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { Segmented } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { ListRow, groupPosition, type GroupPosition } from "@/components/ui/List"
import { HeaderIcon, SectionHeading, TabHeader } from "@/components/ui/TopBar"
import { Tappable } from "@/components/ui/Tappable"
import { PriceChange } from "@/components/ui/PriceChange"
import { Page } from "@/components/ui/Page"
import { ListShimmer } from "@/components/ui/Shimmer"
import { useQuotes } from "@/hooks/use-market"
import { usePortfolio, useRemoveHolding, type HoldingRow } from "@/hooks/use-portfolio"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useToggleWatchlist, useWatchlist } from "@/hooks/use-watchlist"
import { useSession } from "@/lib/auth/session"
import { displaySymbol, fmtINR, fmtPct, toYahooSymbol } from "@/lib/format"
import { useColors } from "@/lib/appearance"
import type { WatchlistItem } from "@/lib/types"

type Tab = "holdings" | "watchlist"

export default function PortfolioScreen() {
  const { userId } = useSession()
  const [tab, setTab] = useState<Tab>("holdings")

  return (
    <Page>
      <TabHeader
        title="Portfolio"
        subtitle={userId ? "Your holdings and watchlist, live" : null}
        right={
          userId && tab === "holdings" ? (
            <HeaderIcon icon="add" label="Add holding" onPress={() => router.push("/add-holding")} />
          ) : userId ? (
            <HeaderIcon icon="add" label="Add to watchlist" onPress={() => router.push("/search")} />
          ) : null
        }
      />
      {!userId ? (
        <SignInPrompt
          icon="briefcase-outline"
          title="Track your investments"
          body="Sign in to keep a watchlist and see your portfolio's value and profit live — synced with the EasyEquity website."
        />
      ) : (
        <>
          <View className="px-5 pb-4">
            <Segmented
              options={[
                { value: "holdings", label: "Holdings" },
                { value: "watchlist", label: "Watchlist" },
              ]}
              value={tab}
              onChange={setTab}
            />
          </View>
          {tab === "holdings" ? <Holdings /> : <Watchlist />}
        </>
      )}
    </Page>
  )
}

function Holdings() {
  const { holdings, quotes, rows, invested, value, pnl, pnlPct, dayChange } = usePortfolio()
  const remove = useRemoveHolding()
  const { refreshing, onRefresh } = usePullToRefresh(holdings.refetch, quotes.refetch)

  const confirmRemove = useCallback(
    (row: HoldingRow) =>
      Alert.alert(`Remove ${displaySymbol(row.symbol)}?`, "This deletes the holding from your portfolio.", [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => remove.mutate(row.id) },
      ]),
    [remove],
  )

  const count = rows.length
  const renderItem = useCallback(
    ({ item, index }: { item: HoldingRow; index: number }) => (
      <HoldingItem row={item} position={groupPosition(index, count)} onLongPress={() => confirmRemove(item)} />
    ),
    [confirmRemove, count],
  )

  return (
    <FlashList
      data={rows}
      renderItem={renderItem}
      keyExtractor={(r) => r.id}
      ListHeaderComponent={
        rows.length ? (
          <View>
            <View className="mx-5 gap-4 rounded-3xl bg-primary p-5">
              <View className="gap-1">
                <Text className="text-xs font-medium text-primary-foreground/70">Current value</Text>
                <Text className="text-[32px] font-bold leading-10 text-primary-foreground">{fmtINR(value, 0)}</Text>
              </View>
              <View className="flex-row rounded-2xl bg-primary-foreground/10 p-3">
                <SummaryCell label="Invested" value={fmtINR(invested, 0)} />
                <View className="mx-2 w-px bg-primary-foreground/15" />
                <SummaryCell label="Total P&L" value={fmtINR(pnl, 0)} sub={fmtPct(pnlPct)} tone={pnl} />
                <View className="mx-2 w-px bg-primary-foreground/15" />
                <SummaryCell label="Today" value={fmtINR(dayChange, 0)} tone={dayChange} />
              </View>
            </View>
            <SectionHeading title="Holdings" subtitle={`${rows.length} ${rows.length === 1 ? "stock" : "stocks"}`} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        holdings.isPending ? (
          <ListShimmer rows={4} />
        ) : holdings.isError ? (
          <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load your portfolio" body={errorMessage(holdings.error)} buttonLabel="Try again" onButtonPress={() => holdings.refetch()} />
        ) : (
          <InfoState icon="briefcase-outline" title="No holdings yet" body="Add the stocks you own to see their value and profit live." buttonLabel="Add a holding" onButtonPress={() => router.push("/add-holding")} />
        )
      }
      ListFooterComponent={rows.length ? <Text className="px-5 pt-5 text-center text-xs text-muted-foreground">Long-press a holding to remove it.</Text> : null}
      refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  )
}

function SummaryCell({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: number }) {
  const color = tone == null || tone === 0 ? "text-primary-foreground" : tone > 0 ? "text-bullish" : "text-bearish"
  return (
    <View className="flex-1 gap-1">
      <Text className="text-[11px] text-primary-foreground/70">{label}</Text>
      <Text numberOfLines={1} className={`text-[13px] font-semibold ${color}`}>
        {value}
      </Text>
      {sub ? <Text className={`text-[11px] font-semibold ${color}`}>{sub}</Text> : null}
    </View>
  )
}

function HoldingItem({ row, position, onLongPress }: { row: HoldingRow; position: GroupPosition; onLongPress: () => void }) {
  return (
    <ListRow
      position={position}
      onPress={() => router.push({ pathname: "/stock/[symbol]", params: { symbol: row.yahoo } })}
      onLongPress={onLongPress}
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-secondary">
        <Text className="text-[11px] font-bold text-foreground">{displaySymbol(row.symbol).slice(0, 4)}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="text-[15px] font-semibold text-foreground">
          {displaySymbol(row.symbol)}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {row.quantity} × {fmtINR(row.avg_price)}
          {row.price != null ? ` · LTP ${fmtINR(row.price)}` : ""}
        </Text>
      </View>
      <View className="items-end gap-1">
        <Text className="text-[15px] font-semibold text-foreground">{row.value != null ? fmtINR(row.value, 0) : "—"}</Text>
        {row.pnlPct != null ? <PriceChange pct={row.pnlPct} size="xs" variant="pill" /> : null}
      </View>
    </ListRow>
  )
}

function Watchlist() {
  const watchlist = useWatchlist()
  const { toggle } = useToggleWatchlist()
  const p = useColors()
  const yahoo = useMemo(() => (watchlist.data ?? []).map((w) => toYahooSymbol(w.symbol)), [watchlist.data])
  const quotes = useQuotes(yahoo)
  const bySymbol = useMemo(() => new Map((quotes.data ?? []).map((q) => [q.symbol.toUpperCase(), q])), [quotes.data])
  const { refreshing, onRefresh } = usePullToRefresh(watchlist.refetch, quotes.refetch)
  const count = watchlist.data?.length ?? 0

  const renderItem = useCallback(
    ({ item, index }: { item: WatchlistItem; index: number }) => {
      const y = toYahooSymbol(item.symbol)
      const q = bySymbol.get(y.toUpperCase())
      return (
        <QuoteRow
          position={groupPosition(index, count)}
          symbol={y}
          name={q?.name}
          price={q?.price}
          changePct={q?.changePercent}
          currency={q?.currency}
          right={
            <Tappable onPress={() => toggle(item.symbol, item)} hitSlop={10} accessibilityLabel={`Remove ${item.symbol} from watchlist`} className="pl-1">
              <Ionicons name="star" size={20} color={p.accent} />
            </Tappable>
          }
        />
      )
    },
    [bySymbol, count, toggle, p.accent],
  )

  return (
    <FlashList
      data={watchlist.data ?? []}
      keyExtractor={(w) => w.symbol}
      renderItem={renderItem}
      ListHeaderComponent={count ? <SectionHeading first title="Watchlist" subtitle={`${count} ${count === 1 ? "symbol" : "symbols"} · tap the star to remove`} /> : null}
      ListEmptyComponent={
        watchlist.isPending ? (
          <ListShimmer rows={4} />
        ) : watchlist.isError ? (
          <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load your watchlist" body={errorMessage(watchlist.error)} buttonLabel="Try again" onButtonPress={() => watchlist.refetch()} />
        ) : (
          <InfoState icon="star-outline" title="Your watchlist is empty" body="Search for a stock and tap the star to follow it." buttonLabel="Find stocks" onButtonPress={() => router.push("/search")} />
        )
      }
      refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  )
}
