import Ionicons from "@expo/vector-icons/Ionicons"
import { memo } from "react"
import { View } from "react-native"

import { Card } from "@/components/ui/Notice"
import { Pill, sentimentPill } from "@/components/ui/Pill"
import { Text } from "@/components/ui/Text"
import { useColors } from "@/lib/appearance"
import type { SectorIntelligence } from "@/lib/types"

type Sector = SectorIntelligence["sectors"][number]

function ConfidenceBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value))
  const color = v >= 70 ? "bg-bullish" : v >= 40 ? "bg-accent" : "bg-bearish"
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <View className={`h-full rounded-full ${color}`} style={{ width: `${v}%` }} />
      </View>
      <Text className="w-9 text-right text-[11px] font-semibold text-muted-foreground">{v}%</Text>
    </View>
  )
}

/** One sector from the AI sector intelligence report. */
export const SectorCard = memo(function SectorCard({ sector }: { sector: Sector }) {
  const p = useColors()
  const t = sentimentPill(sector.outlook)
  return (
    <Card className="gap-3.5">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-base font-bold text-foreground">{sector.name}</Text>
        <View className="flex-row gap-1.5">
          {sector.trendStrength ? (
            <Pill label={sector.trendStrength} tone={sector.trendStrength === "Strong" ? "accent" : sector.trendStrength === "Weak" ? "bearish" : "plain"} size="xs" />
          ) : null}
          <Pill label={sector.outlook} tone={t.tone} icon={t.icon} size="xs" />
        </View>
      </View>
      {sector.summary ? <Text className="text-[13px] leading-5 text-muted-foreground">{sector.summary}</Text> : null}
      {sector.confidence != null ? (
        <View className="gap-1">
          <Text className="text-[11px] text-muted-foreground">AI confidence</Text>
          <ConfidenceBar value={sector.confidence} />
        </View>
      ) : null}
      {sector.keyDrivers?.length ? (
        <View className="flex-row flex-wrap gap-1.5">
          {sector.keyDrivers.map((d, i) => (
            <View key={i} className="rounded-full bg-secondary px-2.5 py-1">
              <Text className="text-[11px] text-foreground">{d}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {sector.momentumStocks?.length ? (
        <View className="flex-row flex-wrap items-center gap-1.5">
          <Ionicons name="eye-outline" size={13} color={p.mutedForeground} />
          <Text className="text-[11px] text-muted-foreground">Showing momentum:</Text>
          {sector.momentumStocks.map((s, i) => (
            <Pill key={i} label={s} tone="accent" size="xs" />
          ))}
        </View>
      ) : null}
      {sector.shortTermView || sector.longTermView ? (
        <View className="flex-row gap-3 border-t border-border/70 pt-3">
          <View className="flex-1 gap-1">
            <Text className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Short term</Text>
            <Text className="text-xs leading-[18px] text-foreground">{sector.shortTermView}</Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Long term</Text>
            <Text className="text-xs leading-[18px] text-foreground">{sector.longTermView}</Text>
          </View>
        </View>
      ) : null}
      {sector.riskFactors?.length ? (
        <View className="gap-1 border-t border-border/70 pt-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="warning-outline" size={13} color={p.bearish} />
            <Text className="text-[11px] font-semibold text-bearish">Risks</Text>
          </View>
          {sector.riskFactors.map((r, i) => (
            <Text key={i} className="text-xs leading-[18px] text-muted-foreground">
              • {r}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  )
})
