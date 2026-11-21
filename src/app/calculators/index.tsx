import Ionicons from "@expo/vector-icons/Ionicons"
import { router, type Href } from "expo-router"
import { ScrollView, View } from "react-native"

import { Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { TopBar } from "@/components/ui/TopBar"
import { useColors } from "@/lib/appearance"

/** Same calculators as the website's /calculators hub. */
const CALCULATORS: { href: Href; icon: keyof typeof Ionicons.glyphMap; name: string; description: string }[] = [
  { href: "/calculators/sip", icon: "trending-up-outline", name: "SIP calculator", description: "What a monthly SIP or a lump sum could grow to." },
  { href: "/calculators/swp", icon: "cash-outline", name: "SWP calculator", description: "How long monthly withdrawals from an investment can last." },
  { href: "/calculators/cagr", icon: "speedometer-outline", name: "CAGR calculator", description: "The yearly growth rate between two values." },
  { href: "/calculators/capital-gains", icon: "receipt-outline", name: "Capital gains tax", description: "Estimate tax on selling shares or mutual funds." },
  { href: "/calculators/brokerage", icon: "swap-horizontal-outline", name: "Brokerage & charges", description: "Every charge on a delivery or intraday trade, and your net profit." },
]

export default function CalculatorsScreen() {
  const p = useColors()
  return (
    <Page>
      <TopBar title="Calculators" subtitle="Worked out on your phone, instantly" />
      <ScrollView contentContainerClassName="gap-3 px-5 pb-12">
        {CALCULATORS.map((c) => (
          <Tappable key={c.name} onPress={() => router.push(c.href)} accessibilityLabel={c.name} className="flex-row items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent/15">
              <Ionicons name={c.icon} size={22} color={p.accent} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-[15px] font-semibold text-foreground">{c.name}</Text>
              <Text className="text-xs leading-[18px] text-muted-foreground">{c.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={p.mutedForeground} />
          </Tappable>
        ))}
        <Notice text="Illustrations only. Returns are assumed constant and tax rules simplified; real results vary. Not investment or tax advice." />
      </ScrollView>
    </Page>
  )
}
