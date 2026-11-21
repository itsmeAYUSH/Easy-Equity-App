import Ionicons from "@expo/vector-icons/Ionicons"
import { ScrollView, View } from "react-native"

import { Card, Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { Pill } from "@/components/ui/Pill"
import { Text } from "@/components/ui/Text"
import { SectionHeading, TopBar } from "@/components/ui/TopBar"
import { MarketStatusPill } from "@/components/market/MarketStatusPill"
import { useColors } from "@/lib/appearance"
import { MARKET_HOLIDAYS, MARKET_HOLIDAYS_YEAR, todayInIndia } from "@/lib/market-status"

const fmt = (d: string, opts: Intl.DateTimeFormatOptions) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { ...opts, timeZone: "UTC" })

/** NSE trading holidays for the year (same list as the website's /market-holidays). */
export default function MarketHolidaysScreen() {
  const p = useColors()
  const today = todayInIndia()
  const next = MARKET_HOLIDAYS.find((h) => h.date >= today)
  const daysTo = next ? Math.round((Date.parse(`${next.date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000) : null

  return (
    <Page>
      <TopBar title="Market holidays" subtitle={`NSE equity segment · ${MARKET_HOLIDAYS_YEAR}`} />
      <ScrollView contentContainerClassName="pb-12">
        <View className="px-5">
          <MarketStatusPill />
        </View>
        {next ? (
          <View className="mx-5 mt-4 gap-1 rounded-3xl bg-primary p-5">
            <Text className="text-xs font-medium text-primary-foreground/70">Next holiday</Text>
            <Text className="text-xl font-bold text-primary-foreground">{next.name}</Text>
            <Text className="text-sm text-primary-foreground/80">
              {fmt(next.date, { weekday: "long", day: "numeric", month: "long" })}
              {daysTo === 0 ? " · today" : daysTo === 1 ? " · tomorrow" : daysTo != null ? ` · in ${daysTo} days` : ""}
            </Text>
          </View>
        ) : null}

        <SectionHeading title="All holidays" subtitle="Markets are also closed on Saturdays and Sundays" />
        <Card className="mx-5 py-1">
          {MARKET_HOLIDAYS.map((h, i) => {
            const past = h.date < today
            const isNext = h.date === next?.date
            return (
              <View key={h.date} className={`flex-row items-center gap-3 py-3 ${i < MARKET_HOLIDAYS.length - 1 ? "border-b border-border/70" : ""} ${past ? "opacity-50" : ""}`}>
                <View className={`h-12 w-12 items-center justify-center rounded-xl ${isNext ? "bg-accent/15" : "bg-secondary"}`}>
                  <Text className={`text-[10px] font-semibold uppercase ${isNext ? "text-accent" : "text-muted-foreground"}`}>{fmt(h.date, { month: "short" })}</Text>
                  <Text className={`text-base font-bold ${isNext ? "text-accent" : "text-foreground"}`}>{fmt(h.date, { day: "numeric" })}</Text>
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-semibold text-foreground">{h.name}</Text>
                  <Text className="text-xs text-muted-foreground">{fmt(h.date, { weekday: "long" })}</Text>
                </View>
                {isNext ? <Pill label="Next" tone="accent" size="xs" /> : past ? <Ionicons name="checkmark" size={16} color={p.mutedForeground} /> : null}
              </View>
            )
          })}
        </Card>
        <View className="px-5 pt-5">
          <Notice text="From NSE's holiday circulars. Trading runs 9:15 am – 3:30 pm IST on other weekdays, after a pre-open session from 9:00 am. Check NSE for special sessions such as Muhurat trading." />
        </View>
      </ScrollView>
    </Page>
  )
}
