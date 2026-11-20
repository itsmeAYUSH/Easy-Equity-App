import Ionicons from "@expo/vector-icons/Ionicons"
import Constants from "expo-constants"
import { Image } from "expo-image"
import { router, type Href } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import type { ReactNode } from "react"
import { Alert, ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Segmented } from "@/components/ui/Chips"
import { TabHeader } from "@/components/ui/TopBar"
import { Tappable } from "@/components/ui/Tappable"
import { Page } from "@/components/ui/Page"
import { LEGAL_PAGES } from "@/constants/legal"
import { useNotifications } from "@/hooks/use-alerts"
import { useSession } from "@/lib/auth/session"
import { useAppearance, type ThemeMode } from "@/lib/appearance"

type IconName = keyof typeof Ionicons.glyphMap

export default function MoreScreen() {
  const { userId, profile, isPro, signOut } = useSession()
  const { mode, setMode, colors: p } = useAppearance()
  const { unread } = useNotifications()

  const name = profile?.display_name || profile?.email?.split("@")[0] || "Investor"

  return (
    <Page>
      <TabHeader title="More" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {userId ? (
          <Tappable onPress={() => router.push("/profile")} className="mx-4 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={{ width: 48, height: 48, borderRadius: 24 }} />
            ) : (
              <View className="h-12 w-12 items-center justify-center rounded-full bg-accent/15">
                <Text className="text-lg font-bold text-accent">{name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">{name}</Text>
              <Text className="text-xs text-muted-foreground">{profile?.email ?? ""}</Text>
            </View>
            <View className={`rounded-md px-2 py-0.5 ${isPro ? "bg-accent" : "bg-secondary"}`}>
              <Text className={`text-[11px] font-bold ${isPro ? "text-accent-foreground" : "text-foreground"}`}>{isPro ? "PRO" : "FREE"}</Text>
            </View>
          </Tappable>
        ) : (
          <View className="mx-4 gap-3 rounded-2xl border border-border bg-card p-4">
            <Text className="text-base font-semibold text-foreground">Sign in to EasyEquity</Text>
            <Text className="text-sm text-muted-foreground">Use the same account as the website: your watchlist, portfolio and alerts sync everywhere.</Text>
            <View className="flex-row gap-2">
              <Tappable onPress={() => router.push("/sign-in")} className="h-11 flex-1 items-center justify-center rounded-xl bg-primary">
                <Text className="font-semibold text-primary-foreground">Sign in</Text>
              </Tappable>
              <Tappable onPress={() => router.push("/sign-up")} className="h-11 flex-1 items-center justify-center rounded-xl border border-border">
                <Text className="font-semibold text-foreground">Sign up</Text>
              </Tappable>
            </View>
          </View>
        )}

        <Group title="Your tools">
          <Row icon="notifications-outline" label="Notifications" badge={userId ? unread : 0} href={userId ? "/notifications" : "/sign-in"} />
          <Row icon="alarm-outline" label="Price alerts" href={userId ? "/alerts" : "/sign-in"} />
          <Row icon="diamond-outline" label={isPro ? "EasyEquity Pro" : "Upgrade to Pro"} href="/pro" />
        </Group>

        <Group title="Research">
          <Row icon="search-outline" label="Search stocks & crypto" href="/search" />
          <Row icon="funnel-outline" label="Stock screener" href="/screener" />
          <Row icon="pie-chart-outline" label="Mutual funds" href="/mutual-funds" />
          <Row icon="calculator-outline" label="SIP & CAGR calculators" href="/calculators" />
        </Group>

        <Group title="Appearance">
          <View className="px-4 py-3">
            <Segmented<ThemeMode>
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
              value={mode}
              onChange={setMode}
            />
          </View>
        </Group>

        <Group title="About">
          <Row icon="sparkles-outline" label="How our AI works" url={LEGAL_PAGES.howOurAiWorks} />
          <Row icon="document-text-outline" label="Terms of Service" url={LEGAL_PAGES.terms} />
          <Row icon="shield-checkmark-outline" label="Privacy Policy" url={LEGAL_PAGES.privacy} />
          <Row icon="alert-circle-outline" label="Disclaimer" url={LEGAL_PAGES.disclaimer} />
          <Row icon="mail-outline" label="Contact us" url={LEGAL_PAGES.contact} />
        </Group>

        {userId ? (
          <View className="mx-4 mt-6">
            <Tappable
              onPress={() =>
                Alert.alert("Sign out?", undefined, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Sign out", style: "destructive", onPress: () => void signOut() },
                ])
              }
              className="h-12 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card"
            >
              <Ionicons name="log-out-outline" size={18} color={p.destructive} />
              <Text className="font-semibold text-destructive">Sign out</Text>
            </Tappable>
          </View>
        ) : null}

        <Text className="mt-6 text-center text-xs text-muted-foreground">
          EasyEquity v{Constants.expoConfig?.version ?? "1.0.0"} · Information only, not investment advice.
        </Text>
      </ScrollView>
    </Page>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-6">
      <Text className="px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</Text>
      <View className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">{children}</View>
    </View>
  )
}

function Row({ icon, label, href, url, badge }: { icon: IconName; label: string; href?: Href; url?: string; badge?: number }) {
  const { colors: p } = useAppearance()
  return (
    <Tappable
      shrinkTo={0.98}
      onPress={() => {
        if (href) router.push(href)
        else if (url) void WebBrowser.openBrowserAsync(url, { controlsColor: p.accent })
      }}
      className="flex-row items-center gap-3 border-b border-border px-4 py-3.5"
    >
      <Ionicons name={icon} size={20} color={p.foreground} />
      <Text className="flex-1 text-[15px] text-foreground">{label}</Text>
      {badge ? (
        <View className="min-w-[20px] items-center rounded-full bg-destructive px-1.5">
          <Text className="text-[11px] font-bold text-white">{badge}</Text>
        </View>
      ) : null}
      <Ionicons name={url ? "open-outline" : "chevron-forward"} size={16} color={p.mutedForeground} />
    </Tappable>
  )
}
