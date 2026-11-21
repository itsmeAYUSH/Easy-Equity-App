import Ionicons from "@expo/vector-icons/Ionicons"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { errorMessage } from "@/api/errors"
import { SignInPrompt } from "@/components/auth/SignInPrompt"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { InfoState } from "@/components/ui/InfoState"
import { TopBar } from "@/components/ui/TopBar"
import { Tappable } from "@/components/ui/Tappable"
import { Page } from "@/components/ui/Page"
import { ListShimmer } from "@/components/ui/Shimmer"
import { useMarkNotificationsRead, useNotifications } from "@/hooks/use-alerts"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useSession } from "@/lib/auth/session"
import { timeAgo, toYahooSymbol } from "@/lib/format"
import { useColors } from "@/lib/appearance"

const isIpoNotification = (type: string) => /^ipo[_-]/i.test(type)

export default function NotificationsScreen() {
  const { userId } = useSession()
  const notifications = useNotifications()
  const markRead = useMarkNotificationsRead()
  const p = useColors()
  const { refreshing, onRefresh } = usePullToRefresh(notifications.refetch)

  return (
    <Page>
      <TopBar
        title="Notifications"
        right={
          notifications.unread ? (
            <Tappable onPress={() => markRead.mutate(undefined)} hitSlop={8} className="px-2">
              <Text className="text-sm font-semibold text-accent">Mark all read</Text>
            </Tappable>
          ) : null
        }
      />
      {!userId ? (
        <SignInPrompt icon="notifications-outline" title="Your alerts live here" body="Sign in to see triggered price alerts and IPO reminders." />
      ) : (
        <FlashList
          data={notifications.data ?? []}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <Tappable
              shrinkTo={0.98}
              onPress={() => {
                if (!item.is_read) markRead.mutate(item.id)
                if (!item.symbol) return
                // IPO reminders (ipo_open, ipo_close, ipo_allotment, ipo_listing) carry the IPO's slug.
                if (isIpoNotification(item.alert_type)) router.push({ pathname: "/ipo/[slug]", params: { slug: item.symbol } })
                else router.push({ pathname: "/stock/[symbol]", params: { symbol: toYahooSymbol(item.symbol) } })
              }}
              className={`mx-4 flex-row gap-3 border-b border-border py-3 ${item.is_read ? "opacity-70" : ""}`}
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-accent/15">
                <Ionicons name={isIpoNotification(item.alert_type) ? "rocket-outline" : "alarm-outline"} size={18} color={p.accent} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className={`text-sm text-foreground ${item.is_read ? "" : "font-semibold"}`}>{item.title}</Text>
                {item.message ? <Text className="text-xs leading-5 text-muted-foreground">{item.message}</Text> : null}
                <Text className="text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</Text>
              </View>
              {!item.is_read ? <View className="mt-1.5 h-2 w-2 rounded-full bg-accent" /> : null}
            </Tappable>
          )}
          ListEmptyComponent={
            notifications.isPending ? (
              <ListShimmer rows={4} />
            ) : notifications.isError ? (
              <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load notifications" body={errorMessage(notifications.error)} buttonLabel="Try again" onButtonPress={() => notifications.refetch()} />
            ) : (
              <InfoState icon="notifications-off-outline" title="All quiet" body="Triggered price alerts and IPO reminders will show up here." />
            )
          }
          refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </Page>
  )
}
