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
import { HeaderIcon, TabHeader } from "@/components/ui/TopBar"
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

type Tab = "holdings" | "watchlist"

export default function PortfolioScreen() {
  const { userId } = useSession()
  const [tab, setTab] = useState<Tab>("holdings")

  return (
    <Page>
      <TabHeader
        title="Portfolio"
        right={
          userId && tab === "holdings" ? (
            <HeaderIcon icon="add-circle-outline" label="Add holding" onPress={() => router.push("/add-holding")} />
          ) : userId ? (
            <HeaderIcon icon="add-circle-outline" label="Add to watchlist" onPress={() => router.push("/search")} />
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
          <View className="px-4 pb-2">
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

  const renderItem = useCallback(
    ({ item }: { item: HoldingRow }) => <HoldingItem row={item} onLongPress={() => confirmRemove(item)} />,
    [confirmRemove],
  )

  return (
    <FlashList
      data={rows}
      renderItem={renderItem}
      keyExtractor={(r) => r.id}
      ListHeaderComponent={
        rows.length ? (
          <View className="mx-4 mb-2 gap-3 rounded-2xl bg-primary p-4">
            <Text className="text-xs font-medium text-primary-foreground/70">Current value</Text>
            <Text className="text-3xl font-bold text-primary-foreground">{fmtINR(value, 0)}</Text>
            <View className="flex-row justify-between">
              <SummaryCell label="Invested" value={fmtINR(invested, 0)} />
              <SummaryCell label="Total P&L" value={`${fmtINR(pnl, 0)} (${fmtPct(pnlPct)})`} tone={pnl} />
              <SummaryCell label="Today" value={fmtINR(dayChange, 0)} tone={dayChange} />
            </View>
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
      ListFooterComponent={rows.length ? <Text className="px-4 py-4 text-center text-xs text-muted-foreground">Long-press a holding to remove it.</Text> : null}
      refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  )
}

function SummaryCell({ label, value, tone }: { label: string; value: string; tone?: number }) {
  const color = tone == null || tone === 0 ? "text-primary-foreground" : tone > 0 ? "text-bullish" : "text-bearish"
  return (
    <View className="gap-0.5">
      <Text className="text-[11px] text-primary-foreground/70">{label}</Text>
      <Text className={`text-xs font-semibold ${color}`}>{value}</Text>
    </View>
  )
}

function HoldingItem({ row, onLongPress }: { row: HoldingRow; onLongPress: () => void }) {
  return (
    <Tappable
      shrinkTo={0.98}
      onPress={() => router.push({ pathname: "/stock/[symbol]", params: { symbol: row.yahoo } })}
      onLongPress={onLongPress}
      className="mx-4 gap-1 border-b border-border py-3"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-[15px] font-semibold text-foreground">{displaySymbol(row.symbol)}</Text>
        <Text className="text-[15px] font-semibold text-foreground">{row.value != null ? fmtINR(row.value, 0) : "—"}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-muted-foreground">
          {row.quantity} × {fmtINR(row.avg_price)}
          {row.price != null ? ` · LTP ${fmtINR(row.price)}` : ""}
        </Text>
        {row.pnlPct != null ? <PriceChange pct={row.pnlPct} size="xs" /> : null}
      </View>
    </Tappable>
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

  return (
    <FlashList
      data={watchlist.data ?? []}
      keyExtractor={(w) => w.symbol}
      renderItem={({ item }) => {
        const y = toYahooSymbol(item.symbol)
        const q = bySymbol.get(y.toUpperCase())
        return (
          <QuoteRow
            symbol={y}
            name={q?.name}
            price={q?.price}
            changePct={q?.changePercent}
            currency={q?.currency}
            right={
              <Tappable onPress={() => toggle(item.symbol, item)} hitSlop={10} accessibilityLabel={`Remove ${item.symbol} from watchlist`} className="pl-2">
                <Ionicons name="star" size={20} color={p.accent} />
              </Tappable>
            }
          />
        )
      }}
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
    />
  )
}
