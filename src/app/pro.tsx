import Ionicons from "@expo/vector-icons/Ionicons"
import { ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Card, Notice } from "@/components/ui/Notice"
import { TopBar } from "@/components/ui/TopBar"
import { Page } from "@/components/ui/Page"
import { usePremiumStatus } from "@/hooks/use-premium"
import { useSession } from "@/lib/auth/session"
import { useColors } from "@/lib/appearance"

/** Same rows as the website's lib/plans.ts — only what the server enforces. */
const PLAN_ROWS: { feature: string; free: string | boolean; pro: string | boolean }[] = [
  { feature: "AI stock analyses", free: "3 per day", pro: "Unlimited" },
  { feature: "Market, sector & digest updates", free: "Every 2 hours", pro: "Every 15 min" },
  { feature: "Portfolio AI analysis", free: false, pro: true },
  { feature: "Price alerts", free: "2 active", pro: "Unlimited" },
  { feature: "News feed", free: true, pro: true },
  { feature: "Watchlist", free: true, pro: true },
]

/**
 * Plan status and what Pro includes. Pro is bought on the website (Razorpay);
 * the app shows the same account's status. Store rules (Apple 3.1.1, Google
 * Play billing) don't allow an in-app link to an outside purchase, so there
 * is deliberately no "buy" button here — see README → Payments.
 */
export default function ProScreen() {
  const { userId, isPro } = useSession()
  const status = usePremiumStatus()
  const p = useColors()
  const s = status.data
  const until = s?.current_period_end ? new Date(s.current_period_end).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null

  return (
    <Page>
      <TopBar title="EasyEquity Pro" />
      <ScrollView contentContainerClassName="gap-4 px-4 pb-12">
        <View className="items-center gap-2 rounded-2xl bg-primary p-6">
          <Ionicons name="diamond" size={32} color={p.accent} />
          <Text className="text-xl font-bold text-primary-foreground">{isPro ? "You're on Pro" : "Free plan"}</Text>
          {isPro && until ? (
            <Text className="text-center text-sm text-primary-foreground/80">
              {s?.cancel_at_period_end || !s?.renews ? `Pro until ${until}` : `Renews on ${until}`}
            </Text>
          ) : (
            <Text className="text-center text-sm text-primary-foreground/80">Unlimited AI analyses, faster AI updates and unlimited alerts.</Text>
          )}
        </View>

        <Card className="gap-0 p-0">
          <View className="flex-row border-b border-border px-4 py-3">
            <Text className="flex-1 text-xs font-semibold uppercase text-muted-foreground">Feature</Text>
            <Text className="w-20 text-center text-xs font-semibold uppercase text-muted-foreground">Free</Text>
            <Text className="w-20 text-center text-xs font-semibold uppercase text-accent">Pro</Text>
          </View>
          {PLAN_ROWS.map((r) => (
            <View key={r.feature} className="flex-row items-center border-b border-border px-4 py-3">
              <Text className="flex-1 text-sm text-foreground">{r.feature}</Text>
              <Cell v={r.free} />
              <Cell v={r.pro} />
            </View>
          ))}
        </Card>

        {!isPro ? (
          <Notice
            icon="globe-outline"
            text={
              userId
                ? "Pro subscriptions are managed on the EasyEquity website. Once you're Pro there, sign in here with the same account and Pro unlocks automatically."
                : "Sign in with your EasyEquity account. If you have Pro on the website, it unlocks here automatically."
            }
          />
        ) : null}
      </ScrollView>
    </Page>
  )
}

function Cell({ v }: { v: string | boolean }) {
  const p = useColors()
  if (typeof v === "boolean") {
    return (
      <View className="w-20 items-center">
        <Ionicons name={v ? "checkmark-circle" : "close-circle-outline"} size={18} color={v ? p.bullish : p.mutedForeground} />
      </View>
    )
  }
  return <Text className="w-20 text-center text-xs font-medium text-foreground">{v}</Text>
}
