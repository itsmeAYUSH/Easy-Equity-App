import Ionicons from "@expo/vector-icons/Ionicons"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { useMemo } from "react"
import { Alert, View } from "react-native"

import { errorMessage } from "@/api/errors"
import { SignInPrompt } from "@/components/auth/SignInPrompt"
import { InfoState } from "@/components/ui/InfoState"
import { ListRow, groupPosition } from "@/components/ui/List"
import { Page } from "@/components/ui/Page"
import { Pill } from "@/components/ui/Pill"
import { ListShimmer } from "@/components/ui/Shimmer"
import { SwipeRow } from "@/components/ui/SwipeRow"
import { Text } from "@/components/ui/Text"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { HeaderIcon, SectionHeading, TopBar } from "@/components/ui/TopBar"
import { useDeletePriceAlert, usePriceAlerts } from "@/hooks/use-alerts"
import { useQuotes } from "@/hooks/use-market"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useColors } from "@/lib/appearance"
import { useSession } from "@/lib/auth/session"
import { displaySymbol, fmtPrice, guessCurrency, timeAgo, toYahooSymbol } from "@/lib/format"
import type { PriceAlert } from "@/lib/types"

type Row = { kind: "heading"; key: string; title: string; subtitle?: string } | { kind: "alert"; key: string; alert: PriceAlert; index: number; count: number }

export default function PriceAlertsScreen() {
  const { userId, isPro } = useSession()
  const alerts = usePriceAlerts()
  const remove = useDeletePriceAlert()
  const p = useColors()
  const yahoo = useMemo(() => (alerts.data ?? []).filter((a) => !a.is_triggered).map((a) => toYahooSymbol(a.symbol)), [alerts.data])
  const quotes = useQuotes(yahoo)
  const bySymbol = useMemo(() => new Map((quotes.data ?? []).map((q) => [q.symbol.toUpperCase(), q])), [quotes.data])
  const { refreshing, onRefresh } = usePullToRefresh(alerts.refetch, quotes.refetch)

  const confirmDelete = (a: PriceAlert) =>
    Alert.alert(`Delete alert for ${displaySymbol(a.symbol)}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove.mutate(a.id) },
    ])

  // Active alerts first, then the ones that already fired.
  const rows = useMemo<Row[]>(() => {
    const list = alerts.data ?? []
    const active = list.filter((a) => !a.is_triggered)
    const fired = list.filter((a) => a.is_triggered)
    const out: Row[] = []
    if (active.length) {
      out.push({ kind: "heading", key: "h-active", title: "Active", subtitle: "Swipe left to delete" })
      active.forEach((a, i) => out.push({ kind: "alert", key: a.id, alert: a, index: i, count: active.length }))
    }
    if (fired.length) {
      out.push({ kind: "heading", key: "h-fired", title: "Triggered" })
      fired.forEach((a, i) => out.push({ kind: "alert", key: a.id, alert: a, index: i, count: fired.length }))
    }
    return out
  }, [alerts.data])

  return (
    <Page>
      <TopBar
        title="Price alerts"
        subtitle={userId ? (isPro ? "Unlimited alerts with Pro" : "Free plan: 2 active alerts") : null}
        right={userId ? <HeaderIcon icon="add" label="New alert" onPress={() => router.push("/create-alert")} /> : null}
      />
      {!userId ? (
        <SignInPrompt icon="alarm-outline" title="Never miss a price" body="Sign in to get notified when a stock crosses your target price." />
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(r) => r.key}
          getItemType={(r) => r.kind}
          renderItem={({ item }) => {
            if (item.kind === "heading") return <SectionHeading first={item.key === "h-active"} title={item.title} subtitle={item.subtitle} />
            const a = item.alert
            const position = groupPosition(item.index, item.count)
            const q = bySymbol.get(toYahooSymbol(a.symbol).toUpperCase())
            const currency = q?.currency ?? guessCurrency(a.symbol)
            const gap = q && !a.is_triggered ? ((a.target_price - q.price) / q.price) * 100 : null
            return (
              <SwipeRow key={a.id} position={position} label="Delete" onAction={() => remove.mutate(a.id)}>
                <ListRow
                  position={position}
                  onPress={() => router.push({ pathname: "/stock/[symbol]", params: { symbol: toYahooSymbol(a.symbol) } })}
                  onLongPress={() => confirmDelete(a)}
                  accessibilityLabel={`${displaySymbol(a.symbol)} alert`}
                >
                  <View className={`h-10 w-10 items-center justify-center rounded-xl ${a.is_triggered ? "bg-secondary" : a.direction === "above" ? "bg-bullish-bg" : "bg-bearish-bg"}`}>
                    <Ionicons
                      name={a.direction === "above" ? "trending-up" : "trending-down"}
                      size={20}
                      color={a.is_triggered ? p.mutedForeground : a.direction === "above" ? p.bullish : p.bearish}
                    />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-[15px] font-semibold text-foreground">{displaySymbol(a.symbol)}</Text>
                    <Text numberOfLines={1} className="text-xs text-muted-foreground">
                      {a.direction === "above" ? "Rises above" : "Falls below"} {fmtPrice(a.target_price, currency)}
                      {q && !a.is_triggered ? ` · now ${fmtPrice(q.price, currency)}` : ""}
                    </Text>
                  </View>
                  {a.is_triggered ? (
                    <Pill tone="bullish" icon="checkmark" label={`Hit ${timeAgo(a.triggered_at)}`} size="xs" />
                  ) : gap != null ? (
                    <Pill tone="accent" label={`${Math.abs(gap).toFixed(1)}% away`} size="xs" />
                  ) : (
                    <Pill tone="accent" label="Active" size="xs" />
                  )}
                </ListRow>
              </SwipeRow>
            )
          }}
          ListEmptyComponent={
            alerts.isPending ? (
              <ListShimmer rows={3} />
            ) : alerts.isError ? (
              <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load your alerts" body={errorMessage(alerts.error)} buttonLabel="Try again" onButtonPress={() => alerts.refetch()} />
            ) : (
              <InfoState icon="alarm-outline" title="No price alerts" body="We check prices every 5 minutes and notify you when your target is hit." buttonLabel="Create an alert" onButtonPress={() => router.push("/create-alert")} />
            )
          }
          refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </Page>
  )
}
