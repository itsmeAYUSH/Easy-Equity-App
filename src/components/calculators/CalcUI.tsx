/** Building blocks shared by the calculator screens. */
import type { ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"

import { InputField } from "@/components/ui/InputField"
import { Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { Text } from "@/components/ui/Text"
import { TopBar } from "@/components/ui/TopBar"

/** "1,00,000" / "12.5" → number (0 when empty or invalid). */
export const num = (s: string) => {
  const n = parseFloat(s.replace(/,/g, ""))
  return Number.isFinite(n) ? n : 0
}

/** Keep only what a number field may contain. */
const clean = (s: string, decimals: boolean) => (decimals ? s.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1") : s.replace(/[^0-9]/g, ""))

export function CalcPage({ title, subtitle, note, children }: { title: string; subtitle?: string; note?: string; children: ReactNode }) {
  return (
    <Page>
      <TopBar title={title} subtitle={subtitle} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerClassName="gap-4 px-5 pb-12">
          {children}
          {note ? <Notice text={note} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  decimals = true,
  suffix,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  decimals?: boolean
  suffix?: string
  placeholder?: string
}) {
  return (
    <View className="flex-1">
      <InputField
        label={suffix ? `${label} (${suffix})` : label}
        value={value}
        onChangeText={(v) => onChange(clean(v, decimals))}
        keyboardType={decimals ? "decimal-pad" : "number-pad"}
        placeholder={placeholder}
        returnKeyType="done"
      />
    </View>
  )
}

export function Row({ children }: { children: ReactNode }) {
  return <View className="flex-row gap-3">{children}</View>
}

/** The big result card: headline figure plus two or three supporting figures. */
export function ResultCard({
  label,
  value,
  tone,
  items = [],
  footnote,
}: {
  label: string
  value: string
  tone?: "bullish" | "bearish"
  items?: { label: string; value: string; tone?: "bullish" | "bearish" }[]
  footnote?: string | null
}) {
  const color = (t?: "bullish" | "bearish") => (t === "bullish" ? "text-bullish" : t === "bearish" ? "text-bearish" : "text-primary-foreground")
  return (
    <View className="gap-4 rounded-3xl bg-primary p-5">
      <View className="gap-1">
        <Text className="text-xs font-medium text-primary-foreground/70">{label}</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} className={`text-[32px] font-bold leading-10 ${color(tone)}`}>
          {value}
        </Text>
      </View>
      {items.length ? (
        <View className="flex-row rounded-2xl bg-primary-foreground/10 p-3">
          {items.map((it, i) => (
            <View key={it.label} className={`flex-1 gap-1 ${i > 0 ? "border-l border-primary-foreground/15 pl-3" : ""}`}>
              <Text numberOfLines={1} className="text-[11px] text-primary-foreground/70">
                {it.label}
              </Text>
              <Text numberOfLines={1} adjustsFontSizeToFit className={`text-[13px] font-semibold ${color(it.tone)}`}>
                {it.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {footnote ? <Text className="text-xs leading-[18px] text-primary-foreground/80">{footnote}</Text> : null}
    </View>
  )
}

/** A stacked bar per year (e.g. invested vs gains), drawn with plain views. */
export function YearBars({
  series,
  legend,
}: {
  series: { key: number; total: number; part: number }[]
  legend: [string, string]
}) {
  const max = Math.max(1, ...series.map((s) => s.total))
  const shown = series.slice(-30)
  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="h-36 flex-row items-end gap-[3px]">
        {shown.map((s) => (
          <View key={s.key} className="flex-1 overflow-hidden rounded-t" style={{ height: `${(s.total / max) * 100}%` }}>
            <View className="bg-accent" style={{ flex: Math.max(0, s.total - s.part) }} />
            <View className="bg-primary/60" style={{ flex: Math.max(0, Math.min(s.part, s.total)) }} />
          </View>
        ))}
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] text-muted-foreground">Year 1</Text>
        <View className="flex-row gap-4">
          <Legend className="bg-primary/60" label={legend[0]} />
          <Legend className="bg-accent" label={legend[1]} />
        </View>
        <Text className="text-[11px] text-muted-foreground">Year {shown[shown.length - 1]?.key ?? ""}</Text>
      </View>
    </View>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`h-2.5 w-2.5 rounded-sm ${className}`} />
      <Text className="text-[11px] text-muted-foreground">{label}</Text>
    </View>
  )
}
