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
    <View className="flex-row gap-2 rounded-xl border border-border bg-card p-3">
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
    <View className="min-w-[45%] flex-1 gap-0.5">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className={`text-base font-semibold text-foreground ${valueClassName}`}>{value}</Text>
    </View>
  )
}
