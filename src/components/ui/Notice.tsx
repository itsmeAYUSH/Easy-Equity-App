import Ionicons from "@expo/vector-icons/Ionicons"
import type { ReactNode } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { useColors } from "@/lib/appearance"

/** A small boxed note: disclaimers, warnings, info. */
export function Notice({
  text,
  tone = "info",
  icon,
}: {
  text: string
  tone?: "info" | "warning" | "error"
  icon?: keyof typeof Ionicons.glyphMap
}) {
  const p = useColors()
  const color = tone === "error" ? p.destructive : tone === "warning" ? p.accent : p.mutedForeground
  return (
    <View className="flex-row items-start gap-3 rounded-2xl border border-border bg-secondary/60 p-4">
      <Ionicons name={icon ?? (tone === "info" ? "information-circle-outline" : "alert-circle-outline")} size={18} color={color} />
      <Text className="flex-1 text-xs leading-5 text-muted-foreground">{text}</Text>
    </View>
  )
}

/** A rounded card surface. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-2xl border border-border bg-card p-4 ${className}`}>{children}</View>
}

/** Label / value pair for stat grids. */
export function Metric({ label, value, valueClassName = "" }: { label: string; value: string; valueClassName?: string }) {
  return (
    <View className="min-w-[45%] flex-1 gap-1">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className={`text-[15px] font-semibold text-foreground ${valueClassName}`}>{value}</Text>
    </View>
  )
}

/** One "label ……… value" line inside a card (breakdowns, rates, timelines). */
export function KeyValue({
  label,
  value,
  valueClassName = "",
  hint,
  divider = true,
}: {
  label: string
  value: ReactNode
  valueClassName?: string
  hint?: string | null
  divider?: boolean
}) {
  return (
    <View className={`flex-row items-center justify-between gap-3 py-2.5 ${divider ? "border-b border-border/70" : ""}`}>
      <View className="flex-1">
        <Text className="text-sm text-muted-foreground">{label}</Text>
        {hint ? <Text className="text-[11px] text-muted-foreground/80">{hint}</Text> : null}
      </View>
      {typeof value === "string" ? <Text className={`text-sm font-semibold text-foreground ${valueClassName}`}>{value}</Text> : value}
    </View>
  )
}

/** Small uppercase label above a card's content. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Text className={`text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${className}`}>{children}</Text>
}
