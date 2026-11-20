import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Segmented } from "@/components/ui/Chips"
import { Card, Notice } from "@/components/ui/Notice"
import { TopBar, SectionHeading } from "@/components/ui/TopBar"
import { Page } from "@/components/ui/Page"
import { InputField } from "@/components/ui/InputField"
import { cagr, sipProjection, type SipMode } from "@/lib/calculators"
import { fmtINR, fmtPct } from "@/lib/format"

const num = (s: string) => {
  const n = parseFloat(s.replace(/,/g, ""))
  return Number.isFinite(n) ? n : 0
}

/** Pure on-device maths: no network, instant as you type. */
export default function CalculatorsScreen() {
  const [tool, setTool] = useState<"sip" | "cagr">("sip")
  return (
    <Page>
      <TopBar title="Calculators" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-12">
          <View className="px-4 pb-2">
            <Segmented
              options={[
                { value: "sip", label: "SIP / Lump sum" },
                { value: "cagr", label: "CAGR" },
              ]}
              value={tool}
              onChange={setTool}
            />
          </View>
          {tool === "sip" ? <Sip /> : <Cagr />}
          <View className="px-4 pt-6">
            <Notice text="Illustrations assume a constant return. Real returns vary and are not guaranteed." />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  )
}

function Sip() {
  const [mode, setMode] = useState<SipMode>("sip")
  const [amount, setAmount] = useState("5000")
  const [years, setYears] = useState("10")
  const [rate, setRate] = useState("12")
  const r = useMemo(() => sipProjection(mode, num(amount), num(years), num(rate)), [mode, amount, years, rate])
  const maxValue = Math.max(1, ...r.series.map((s) => s.value))

  return (
    <View className="gap-4 px-4 pt-2">
      <Segmented
        options={[
          { value: "sip", label: "Monthly SIP" },
          { value: "lumpsum", label: "Lump sum" },
        ]}
        value={mode}
        onChange={setMode}
      />
      <InputField label={mode === "sip" ? "Monthly investment (₹)" : "Investment (₹)"} value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <InputField label="Years" value={years} onChangeText={setYears} keyboardType="numeric" />
        </View>
        <View className="flex-1">
          <InputField label="Expected return (% p.a.)" value={rate} onChangeText={setRate} keyboardType="decimal-pad" />
        </View>
      </View>

      <Card className="gap-3">
        <Text className="text-xs text-muted-foreground">Estimated value</Text>
        <Text className="text-3xl font-bold text-foreground">{fmtINR(r.futureValue, 0)}</Text>
        <View className="flex-row justify-between">
          <View>
            <Text className="text-xs text-muted-foreground">Invested</Text>
            <Text className="text-sm font-semibold text-foreground">{fmtINR(r.invested, 0)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-muted-foreground">Est. gains</Text>
            <Text className="text-sm font-semibold text-bullish">{fmtINR(r.gains, 0)}</Text>
          </View>
        </View>
      </Card>

      {r.series.length > 1 ? (
        <>
          <SectionHeading title="Year by year" />
          <View className="h-40 flex-row items-end gap-1">
            {r.series.slice(-30).map((s) => (
              // One stacked bar per year: gains on top of the amount invested.
              <View key={s.year} className="flex-1 overflow-hidden rounded-t" style={{ height: `${(s.value / maxValue) * 100}%` }}>
                <View className="bg-accent" style={{ flex: Math.max(0, s.value - s.invested) }} />
                <View className="bg-primary/60" style={{ flex: Math.max(0, Math.min(s.invested, s.value)) }} />
              </View>
            ))}
          </View>
          <View className="flex-row gap-4">
            <Legend className="bg-primary/60" label="Invested" />
            <Legend className="bg-accent" label="Gains" />
          </View>
        </>
      ) : null}
    </View>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`h-2.5 w-2.5 rounded-sm ${className}`} />
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  )
}

function Cagr() {
  const [start, setStart] = useState("100000")
  const [end, setEnd] = useState("250000")
  const [years, setYears] = useState("5")
  const r = cagr(num(start), num(end), num(years))
  return (
    <View className="gap-4 px-4 pt-2">
      <InputField label="Starting value (₹)" value={start} onChangeText={setStart} keyboardType="numeric" />
      <InputField label="Ending value (₹)" value={end} onChangeText={setEnd} keyboardType="numeric" />
      <InputField label="Years" value={years} onChangeText={setYears} keyboardType="decimal-pad" />
      <Card className="gap-3">
        <Text className="text-xs text-muted-foreground">CAGR</Text>
        <Text className="text-3xl font-bold text-foreground">{r ? fmtPct(r.cagrPct, false) : "—"}</Text>
        <Text className="text-sm text-muted-foreground">Absolute return: {r ? fmtPct(r.absolutePct) : "—"}</Text>
      </Card>
    </View>
  )
}
