import { useLocalSearchParams } from "expo-router"
import { useMemo, useState } from "react"
import { ScrollView, View } from "react-native"

import { errorMessage } from "@/api/errors"
import { LineChart } from "@/components/charts/LineChart"
import { Segmented } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { Card, KeyValue, Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { PriceChange } from "@/components/ui/PriceChange"
import { ListShimmer } from "@/components/ui/Shimmer"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { SectionHeading, TopBar } from "@/components/ui/TopBar"
import { MF_RISK_LINE } from "@/constants/legal"
import { useFund } from "@/hooks/use-mutual-funds"
import { fmtINR } from "@/lib/format"
import { haptics } from "@/lib/haptics"
import { isAnnualised, isRangeAvailable, MF_RANGES, navSeries, rangeReturn, type MFRange } from "@/lib/mutual-funds"

const fmtDay = (t: number) => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

export default function FundScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const fund = useFund(code)
  const f = fund.data
  const [picked, setPicked] = useState<MFRange>("1Y")
  // Fall back to the longest period the fund has when it is younger than a year.
  const range: MFRange = f && !isRangeAvailable(f, picked) ? (MF_RANGES.find((r) => isRangeAvailable(f, r.id))?.id ?? "All") : picked

  const points = useMemo(() => (f ? navSeries(f.history, range) : []), [f, range])
  const ret = f ? rangeReturn(f, range) : null
  const annual = f ? isAnnualised(f, range) : false

  return (
    <Page>
      <TopBar title="Mutual fund" subtitle={f?.fundHouse ?? null} />
      {!f ? (
        fund.isError ? (
          <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load this fund" body={errorMessage(fund.error)} buttonLabel="Try again" onButtonPress={() => fund.refetch()} />
        ) : (
          <ListShimmer rows={4} />
        )
      ) : (
        <ScrollView contentContainerClassName="pb-12">
          <View className="gap-1 px-5">
            <Text className="text-lg font-bold leading-6 text-foreground">{f.schemeName}</Text>
            {f.category ? <Text className="text-xs text-muted-foreground">{f.category}</Text> : null}
            <View className="mt-3 flex-row items-end gap-3">
              <Text className="text-[32px] font-bold leading-10 text-foreground">{fmtINR(f.latestNav, 4)}</Text>
              {ret != null ? (
                <View className="flex-row items-center gap-1 pb-1.5">
                  <PriceChange pct={ret} size="sm" />
                  <Text className="text-xs text-muted-foreground">
                    {range}
                    {annual ? " a year" : ""}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="text-xs text-muted-foreground">NAV as of {f.latestDate ?? "—"}</Text>
          </View>

          {points.length > 1 ? (
            <View className="px-5 pt-4">
              <LineChart points={points} height={210} formatValue={(v) => fmtINR(v, 2)} formatTime={fmtDay} />
            </View>
          ) : null}
          <View className="px-5 pt-3">
            <Segmented<MFRange>
              options={MF_RANGES.map((r) => ({ value: r.id, label: r.id }))}
              value={range}
              onChange={(r) => {
                if (isRangeAvailable(f, r)) setPicked(r)
                else haptics.fail()
              }}
            />
          </View>

          <SectionHeading title="Returns" subtitle="1M–1Y absolute · 3Y, 5Y annualised (CAGR)" />
          <View className="mx-5 flex-row flex-wrap gap-2">
            {MF_RANGES.map((r) => {
              const v = rangeReturn(f, r.id)
              const active = r.id === range
              return (
                <Tappable
                  key={r.id}
                  disabled={!isRangeAvailable(f, r.id)}
                  onPress={() => setPicked(r.id)}
                  className={`w-[31.8%] gap-1 rounded-2xl border p-3 ${active ? "border-accent bg-accent/10" : "border-border bg-card"}`}
                >
                  <Text className="text-[11px] text-muted-foreground">{r.id === "All" ? "Since launch" : r.id}</Text>
                  <Text className={`text-base font-bold ${v == null ? "text-muted-foreground" : v >= 0 ? "text-bullish" : "text-bearish"}`}>
                    {v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
                  </Text>
                </Tappable>
              )
            })}
          </View>

          <SectionHeading title="Fund details" />
          <Card className="mx-5 py-1">
            <KeyValue label="Fund house" value={f.fundHouse ?? "—"} />
            <KeyValue label="Category" value={f.category ?? "—"} />
            <KeyValue label="Scheme code" value={String(f.schemeCode)} />
            <KeyValue label="Launched (first NAV)" value={f.inceptionDate ?? "—"} divider={false} />
          </Card>

          <View className="px-5 pt-6">
            <Notice text={`NAV & returns via AMFI (mfapi.in). Past performance does not guarantee future returns. ${MF_RISK_LINE}`} />
          </View>
        </ScrollView>
      )}
    </Page>
  )
}
