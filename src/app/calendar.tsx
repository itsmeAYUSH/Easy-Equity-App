import Ionicons from "@expo/vector-icons/Ionicons"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { ScrollView, View } from "react-native"

import { errorMessage } from "@/api/errors"
import { IpoCard } from "@/components/ipo/IpoCard"
import { Segmented } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { Card } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { ListShimmer } from "@/components/ui/Shimmer"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { SectionHeading, TopBar } from "@/components/ui/TopBar"
import { useIpos } from "@/hooks/use-ipo"
import { useEarnings } from "@/hooks/use-market"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useColors } from "@/lib/appearance"
import type { EarningsEvent } from "@/lib/types"

type Tab = "earnings" | "ipos"

const HOUR: Record<string, string> = { bmo: "Before open", amc: "After close", dmh: "During hours" }

const dayLabel = (d: string) => {
  const parsed = new Date(`${d.slice(0, 10)}T00:00:00Z`)
  return isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })
}

/** Market calendar: upcoming earnings and open / upcoming IPOs (the website's /calendar). */
export default function CalendarScreen() {
  const [tab, setTab] = useState<Tab>("earnings")
  const earnings = useEarnings()
  const ipos = useIpos()
  const { refreshing, onRefresh } = usePullToRefresh(earnings.refetch, ipos.refetch)

  const byDay = useMemo(() => {
    const groups = new Map<string, EarningsEvent[]>()
    for (const e of [...(earnings.data?.events ?? [])].sort((a, b) => a.date.localeCompare(b.date))) {
      const k = e.date.slice(0, 10)
      groups.set(k, [...(groups.get(k) ?? []), e])
    }
    return [...groups.entries()]
  }, [earnings.data])

  const live = useMemo(() => {
    const all = ipos.data?.ipos ?? []
    return [...all.filter((i) => i.status === "open"), ...all.filter((i) => i.status === "upcoming")]
  }, [ipos.data])

  return (
    <Page>
      <TopBar title="Market calendar" subtitle="Earnings and IPO dates" />
      <View className="px-5 pb-3">
        <Segmented<Tab>
          options={[
            { value: "earnings", label: "Earnings" },
            { value: "ipos", label: `IPOs${live.length ? ` (${live.length})` : ""}` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <ScrollView refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerClassName="pb-12">
        {tab === "earnings" ? (
          earnings.isPending ? (
            <ListShimmer rows={5} />
          ) : earnings.isError ? (
            <InfoState kind="error" icon="calendar-outline" title="Earnings calendar unavailable" body={errorMessage(earnings.error)} buttonLabel="Try again" onButtonPress={() => earnings.refetch()} />
          ) : !byDay.length ? (
            <InfoState icon="calendar-outline" title="No upcoming earnings" body="Check back closer to results season." />
          ) : (
            byDay.map(([day, events], i) => (
              <View key={day}>
                <SectionHeading first={i === 0} title={dayLabel(day)} subtitle={`${events.length} ${events.length === 1 ? "company" : "companies"}`} />
                <Card className="mx-5 py-1">
                  {events.map((e, j) => (
                    <EarningsRow key={`${e.symbol}-${j}`} e={e} last={j === events.length - 1} />
                  ))}
                </Card>
              </View>
            ))
          )
        ) : ipos.isPending ? (
          <ListShimmer rows={4} />
        ) : ipos.isError ? (
          <InfoState kind="error" icon="rocket-outline" title="IPO calendar unavailable" body={errorMessage(ipos.error)} buttonLabel="Try again" onButtonPress={() => ipos.refetch()} />
        ) : !live.length ? (
          <InfoState icon="rocket-outline" title={ipos.data?.warming ? "Fetching the latest IPOs…" : "No open or upcoming IPOs"} buttonLabel="All IPOs" onButtonPress={() => router.push("/ipo")} />
        ) : (
          <View className="gap-3">
            {live.map((ipo) => (
              <IpoCard key={ipo.slug} ipo={ipo} />
            ))}
          </View>
        )}
        <Text className="px-6 pt-6 text-center text-[11px] text-muted-foreground">
          Earnings via Finnhub; IPOs via IPO Guru. Information only — not investment advice.
        </Text>
      </ScrollView>
    </Page>
  )
}

function EarningsRow({ e, last }: { e: EarningsEvent; last: boolean }) {
  const p = useColors()
  return (
    <Tappable
      shrinkTo={1}
      onPress={() => router.push({ pathname: "/stock/[symbol]", params: { symbol: e.symbol } })}
      className={`flex-row items-center gap-3 py-3 ${last ? "" : "border-b border-border/70"}`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-secondary">
        <Ionicons name="bar-chart-outline" size={16} color={p.foreground} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{e.symbol}</Text>
        <Text className="text-xs text-muted-foreground">{e.hour ? (HOUR[e.hour] ?? e.hour) : "Time not announced"}</Text>
      </View>
      <View className="items-end">
        <Text className="text-[11px] text-muted-foreground">{e.epsActual != null ? "EPS actual" : "EPS estimate"}</Text>
        <Text className="text-sm font-semibold text-foreground">{(e.epsActual ?? e.epsEstimate)?.toFixed(2) ?? "—"}</Text>
      </View>
    </Tappable>
  )
}
