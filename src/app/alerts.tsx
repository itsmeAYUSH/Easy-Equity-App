import Ionicons from "@expo/vector-icons/Ionicons"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { Alert, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { errorMessage } from "@/api/errors"
import { SignInPrompt } from "@/components/auth/SignInPrompt"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { InfoState } from "@/components/ui/InfoState"
import { HeaderIcon, TopBar } from "@/components/ui/TopBar"
import { Tappable } from "@/components/ui/Tappable"
import { Page } from "@/components/ui/Page"
import { ListShimmer } from "@/components/ui/Shimmer"
import { useDeletePriceAlert, usePriceAlerts } from "@/hooks/use-alerts"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useSession } from "@/lib/auth/session"
import { displaySymbol, fmtINR, timeAgo, toYahooSymbol } from "@/lib/format"
import { useColors } from "@/lib/appearance"
import type { PriceAlert } from "@/lib/types"

export default function PriceAlertsScreen() {
  const { userId, isPro } = useSession()
  const alerts = usePriceAlerts()
  const remove = useDeletePriceAlert()
  const p = useColors()
  const { refreshing, onRefresh } = usePullToRefresh(alerts.refetch)

  const confirmDelete = (a: PriceAlert) =>
    Alert.alert(`Delete alert for ${displaySymbol(a.symbol)}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove.mutate(a.id) },
    ])

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
          data={alerts.data ?? []}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <Tappable shrinkTo={0.98} onLongPress={() => confirmDelete(item)} onPress={() => router.push({ pathname: "/stock/[symbol]", params: { symbol: toYahooSymbol(item.symbol) } })} className="mx-4 flex-row items-center gap-3 border-b border-border py-3">
              <Ionicons
                name={item.direction === "above" ? "trending-up" : "trending-down"}
                size={22}
                color={item.is_triggered ? p.mutedForeground : item.direction === "above" ? p.bullish : p.bearish}
              />
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-foreground">{displaySymbol(item.symbol)}</Text>
                <Text className="text-xs text-muted-foreground">
                  {item.direction === "above" ? "Rises above" : "Falls below"} {fmtINR(item.target_price)}
                </Text>
              </View>
              {item.is_triggered ? (
                <View className="rounded-md bg-bullish-bg px-2 py-0.5">
                  <Text className="text-[11px] font-semibold text-bullish">Triggered {timeAgo(item.triggered_at)}</Text>
                </View>
              ) : (
                <View className="rounded-md bg-accent/15 px-2 py-0.5">
                  <Text className="text-[11px] font-semibold text-accent">Active</Text>
                </View>
              )}
            </Tappable>
          )}
          ListEmptyComponent={
            alerts.isPending ? (
              <ListShimmer rows={3} />
            ) : alerts.isError ? (
              <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load your alerts" body={errorMessage(alerts.error)} buttonLabel="Try again" onButtonPress={() => alerts.refetch()} />
            ) : (
              <InfoState icon="alarm-outline" title="No price alerts" body="We check prices every 5 minutes and notify you when your target is hit." buttonLabel="Create an alert" onButtonPress={() => router.push("/create-alert")} />
            )
          }
          ListFooterComponent={alerts.data?.length ? <Text className="px-4 py-4 text-center text-xs text-muted-foreground">Long-press an alert to delete it.</Text> : null}
          refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </Page>
  )
}
