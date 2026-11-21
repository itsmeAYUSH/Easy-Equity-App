import Ionicons from "@expo/vector-icons/Ionicons"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { Alert, View } from "react-native"

import { errorMessage } from "@/api/errors"
import { SignInPrompt } from "@/components/auth/SignInPrompt"
import { QuoteRow } from "@/components/market/QuoteRow"
import { AllocationCard, DividendsCard, HoldingsNews, PortfolioAiCard } from "@/components/portfolio/PortfolioCards"
import { Segmented } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { ListRow, groupPosition, type GroupPosition } from "@/components/ui/List"
import { Page } from "@/components/ui/Page"
import { PriceChange } from "@/components/ui/PriceChange"
import { ListShimmer } from "@/components/ui/Shimmer"
import { SwipeRow } from "@/components/ui/SwipeRow"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { HeaderIcon, SectionHeading, TabHeader } from "@/components/ui/TopBar"
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
          body="Sign in to keep a watchlist and see your portfolio's value, profit, dividends and news live — synced with the EasyEquity website."
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
  const { holdings, quotes, rows, invested, value, pnl, pnlPct, dayChange, dayChangePct, hasLivePrices, xirr } = usePortfolio()
  const remove = useRemoveHolding()
  const { refreshing, onRefresh } = usePullToRefresh(holdings.refetch, quotes.refetch)

  const confirmRemove = useCallback(
    (row: HoldingRow) =>
      Alert.alert(`Remove ${displaySymbol(row.symbol)}?`, "This deletes the holding from your portfolio, here and on the website.", [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => remove.mutate(row.id) },
      ]),
    [remove],
  )

  const count = rows.length
  const renderItem = useCallback(
    ({ item, index }: { item: HoldingRow; index: number }) => {
      const position = groupPosition(index, count)
      return (
        <SwipeRow key={item.id} position={position} onAction={() => confirmRemove(item)}>
          <HoldingItem row={item} position={position} onLongPress={() => confirmRemove(item)} />
        </SwipeRow>
      )
    },
    [confirmRemove, count],
  )

  const symbols = useMemo(() => rows.map((r) => r.symbol), [rows])
  const list = holdings.data ?? []

  return (
    <FlashList
      data={rows}
      renderItem={renderItem}
      keyExtractor={(r) => r.id}
      ListHeaderComponent={
        rows.length ? (
          <View>
            <View className="mx-5 gap-5 rounded-3xl bg-primary p-5">
              <View className="gap-1">
                <Text className="text-xs font-medium text-primary-foreground/70">Current value</Text>
                <Text className="text-[34px] font-bold leading-[42px] text-primary-foreground">{fmtINR(value, 0)}</Text>
                {hasLivePrices ? (
                  <View className="flex-row items-center gap-1.5">
                    <Text className={`text-sm font-semibold ${dayChange > 0 ? "text-bullish" : dayChange < 0 ? "text-bearish" : "text-primary-foreground"}`}>
                      {dayChange >= 0 ? "+" : ""}
                      {fmtINR(dayChange, 0)} ({fmtPct(dayChangePct)})
                    </Text>
                    <Text className="text-xs text-primary-foreground/70">today</Text>
                  </View>
                ) : (
                  <Text className="text-xs text-primary-foreground/70">Live prices are loading…</Text>
                )}
              </View>
              <View className="flex-row rounded-2xl bg-primary-foreground/10 p-3">
                <SummaryCell label="Invested" value={fmtINR(invested, 0)} />
                <View className="mx-2 w-px bg-primary-foreground/15" />
                <SummaryCell label="Total P&L" value={hasLivePrices ? `${pnl >= 0 ? "+" : ""}${fmtINR(pnl, 0)}` : "—"} sub={hasLivePrices ? fmtPct(pnlPct) : undefined} tone={pnl} />
                <View className="mx-2 w-px bg-primary-foreground/15" />
                <SummaryCell label="XIRR (approx.)" value={xirr != null ? `${xirr.toFixed(1)}%` : "—"} tone={xirr ?? undefined} />
              </View>
            </View>
            <SectionHeading title="Holdings" subtitle={`${rows.length} ${rows.length === 1 ? "stock" : "stocks"} · swipe left to remove`} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        holdings.isPending ? (
          <ListShimmer rows={4} />
        ) : holdings.isError ? (
          <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load your portfolio" body={errorMessage(holdings.error)} buttonLabel="Try again" onButtonPress={() => holdings.refetch()} />
        ) : (
          <InfoState icon="briefcase-outline" title="No holdings yet" body="Add the stocks you own to see their value, profit and dividends live." buttonLabel="Add a holding" onButtonPress={() => router.push("/add-holding")} />
        )
      }
      ListFooterComponent={
        rows.length ? (
          <View>
            <AllocationCard rows={rows} />
            <PortfolioAiCard holdings={list} />
            <DividendsCard holdings={list} />
            <HoldingsNews symbols={symbols} />
            <Text className="px-8 pt-6 text-center text-[11px] leading-4 text-muted-foreground">
              XIRR treats each holding as bought on the day it was added. Prices may be delayed.
            </Text>
          </View>
        ) : null
      }
      refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  )
}

function SummaryCell({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: number }) {
  const color = tone == null || tone === 0 ? "text-primary-foreground" : tone > 0 ? "text-bullish" : "text-bearish"
  return (
    <View className="flex-1 gap-1">
      <Text numberOfLines={1} className="text-[11px] text-primary-foreground/70">
        {label}
      </Text>
      <Text numberOfLines={1} adjustsFontSizeToFit className={`text-[13px] font-semibold ${color}`}>
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
      accessibilityLabel={`${displaySymbol(row.symbol)}, ${row.quantity} shares`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-secondary">
        <Text className="text-[11px] font-bold text-foreground">{displaySymbol(row.symbol).slice(0, 4)}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className="flex-shrink text-[15px] font-semibold text-foreground">
            {displaySymbol(row.symbol)}
          </Text>
          {row.dayChangePct != null ? <PriceChange pct={row.dayChangePct} size="xs" /> : null}
        </View>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {row.quantity} × {fmtINR(row.avg_price)}
          {row.price != null ? ` · LTP ${fmtINR(row.price)}` : ""}
        </Text>
      </View>
      <View className="items-end gap-1">
        <Text className="text-[15px] font-semibold text-foreground">{row.value != null ? fmtINR(row.value, 0) : fmtINR(row.invested, 0)}</Text>
        {row.pnl != null ? (
          <Text className={`text-xs font-semibold ${row.pnl > 0 ? "text-bullish" : row.pnl < 0 ? "text-bearish" : "text-muted-foreground"}`}>
            {row.pnl >= 0 ? "+" : ""}
            {fmtINR(row.pnl, 0)} ({fmtPct(row.pnlPct)})
          </Text>
        ) : (
          <Text className="text-xs text-muted-foreground">at cost</Text>
        )}
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
      const position = groupPosition(index, count)
      return (
        <SwipeRow key={item.symbol} position={position} icon="star-outline" onAction={() => toggle(item.symbol, item)}>
          <QuoteRow
            position={position}
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
        </SwipeRow>
      )
    },
    [bySymbol, count, toggle, p.accent],
  )

  return (
    <FlashList
      data={watchlist.data ?? []}
      keyExtractor={(w) => w.symbol}
      renderItem={renderItem}
      ListHeaderComponent={count ? <SectionHeading first title="Watchlist" subtitle={`${count} ${count === 1 ? "symbol" : "symbols"} · swipe left or tap the star to remove`} /> : null}
      ListEmptyComponent={
        watchlist.isPending ? (
          <ListShimmer rows={4} />
        ) : watchlist.isError ? (
          <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load your watchlist" body={errorMessage(watchlist.error)} buttonLabel="Try again" onButtonPress={() => watchlist.refetch()} />
        ) : (
          <InfoState icon="star-outline" title="Your watchlist is empty" body="Search for a stock and tap the star to follow it." buttonLabel="Find stocks" onButtonPress={() => router.push("/search")} />
        )
      }
      ListFooterComponent={
        count ? (
          <View className="items-center pt-5">
            <Tappable onPress={() => router.push({ pathname: "/compare", params: { symbols: yahoo.slice(0, 4).join(",") } })} className="flex-row items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2">
              <Ionicons name="git-compare-outline" size={15} color={p.foreground} />
              <Text className="text-xs font-semibold text-foreground">Compare {Math.min(4, count)} side by side</Text>
            </Tappable>
          </View>
        ) : null
      }
      refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  )
}
