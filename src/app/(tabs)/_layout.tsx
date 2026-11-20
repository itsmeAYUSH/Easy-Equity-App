import Ionicons from "@expo/vector-icons/Ionicons"
import { Tabs } from "expo-router"
import { Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { FontFamily } from "@/constants/fonts"
import { useNotifications } from "@/hooks/use-alerts"
import { useTickers } from "@/hooks/use-market"
import { haptics } from "@/lib/haptics"
import { useColors } from "@/lib/appearance"

type IconName = keyof typeof Ionicons.glyphMap

function icon(active: IconName, idle: IconName) {
  // eslint-disable-next-line react/display-name
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? active : idle} size={23} color={color} />
  )
}

/**
 * Five tabs: News · Markets · IPOs · Portfolio · More.
 *
 * Tickers and notifications are polled here and nowhere else. React Query
 * runs one interval per observer, so screens that show tickers or the bell
 * badge only read the shared cache — that keeps the app inside the API's
 * limit of 200 requests per 15 minutes per visitor.
 */
export default function MainTabs() {
  const p = useColors()
  const insets = useSafeAreaInsets()
  useTickers({ poll: true })
  useNotifications({ poll: true })

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: p.background },
        tabBarActiveTintColor: p.accent,
        tabBarInactiveTintColor: p.mutedForeground,
        tabBarLabelStyle: { fontFamily: FontFamily.medium, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: p.card,
          borderTopColor: p.border,
          height: (Platform.OS === "ios" ? 52 : 60) + insets.bottom,
          paddingTop: 6,
        },
        // Screens stay mounted after first visit: switching back is instant.
        lazy: true,
        freezeOnBlur: true,
      }}
      screenListeners={{ tabPress: () => haptics.tick() }}
    >
      <Tabs.Screen name="index" options={{ title: "News", tabBarIcon: icon("newspaper", "newspaper-outline") }} />
      <Tabs.Screen name="markets" options={{ title: "Markets", tabBarIcon: icon("stats-chart", "stats-chart-outline") }} />
      <Tabs.Screen name="ipo" options={{ title: "IPOs", tabBarIcon: icon("rocket", "rocket-outline") }} />
      <Tabs.Screen name="portfolio" options={{ title: "Portfolio", tabBarIcon: icon("briefcase", "briefcase-outline") }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: icon("grid", "grid-outline") }} />
    </Tabs>
  )
}
