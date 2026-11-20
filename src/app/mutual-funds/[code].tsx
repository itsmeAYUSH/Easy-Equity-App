import { useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
import { ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { errorMessage } from "@/api/errors"
import { LineChart } from "@/components/charts/LineChart"
import { InfoState } from "@/components/ui/InfoState"
import { Card, Notice, Metric } from "@/components/ui/Notice"
import { TopBar, SectionHeading } from "@/components/ui/TopBar"
import { Page } from "@/components/ui/Page"
import { ListShimmer } from "@/components/ui/Shimmer"
import { MF_RISK_LINE } from "@/constants/legal"
import { useFund } from "@/hooks/use-mutual-funds"
import { fmtINR, fmtPct } from "@/lib/format"

/** mfapi.in dates are DD-MM-YYYY. */
function parseDMY(d: string): number {
  const [dd, mm, yyyy] = d.split("-").map(Number)
  return Date.UTC(yyyy, (mm ?? 1) - 1, dd ?? 1)
}

export default function FundScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const fund = useFund(code)
  const f = fund.data

  // History arrives newest-first; the chart wants oldest-first.
  const points = useMemo(() => (f?.history ?? []).map((h) => ({ t: parseDMY(h.date), c: h.nav })).reverse(), [f?.history])

  return (
    <Page>
      <TopBar title="Fund" subtitle={f?.fundHouse ?? null} />
      {!f ? (
        fund.isError ? (
          <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load this fund" body={errorMessage(fund.error)} buttonLabel="Try again" onButtonPress={() => fund.refetch()} />
        ) : (
          <ListShimmer rows={4} />
        )
      ) : (
        <ScrollView contentContainerClassName="pb-12">
          <View className="gap-1 px-4">
            <Text className="text-lg font-bold leading-6 text-foreground">{f.schemeName}</Text>
            {f.category ? <Text className="text-xs text-muted-foreground">{f.category}</Text> : null}
            <Text className="mt-2 text-3xl font-bold text-foreground">{fmtINR(f.latestNav, 4)}</Text>
            <Text className="text-xs text-muted-foreground">NAV as of {f.latestDate ?? "—"}</Text>
          </View>
          {points.length > 1 ? (
            <View className="px-4 pt-4">
              <LineChart points={points} formatValue={(v) => fmtINR(v, 2)} />
            </View>
          ) : null}
          <SectionHeading title="Returns" />
          <Card className="mx-4">
            <View className="flex-row">
              <Ret label="1 year" v={f.returns.r1y} />
              <Ret label="3 years (CAGR)" v={f.returns.r3y} />
              <Ret label="5 years (CAGR)" v={f.returns.r5y} />
            </View>
          </Card>
          <View className="px-4 pt-6">
            <Notice text={`Past performance does not guarantee future returns. ${MF_RISK_LINE}`} />
          </View>
        </ScrollView>
      )}
    </Page>
  )
}

function Ret({ label, v }: { label: string; v: number | null }) {
  const color = v == null || v === 0 ? "" : v > 0 ? "text-bullish" : "text-bearish"
  return <Metric label={label} value={fmtPct(v)} valueClassName={color} />
}
