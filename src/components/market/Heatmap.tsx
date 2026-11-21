import { router } from "expo-router"
import { memo, useMemo } from "react"
import { View } from "react-native"

import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { useColors } from "@/lib/appearance"
import { fmtPct } from "@/lib/format"
import type { ScreenerRow } from "@/lib/types"

/** "#20AC6B" + 0.4 → "rgba(32,172,107,0.4)". */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "")
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha.toFixed(2)})`
}

/** Day change heatmap of the screener's large caps, grouped by sector (like the website's). */
export const SectorHeatmap = memo(function SectorHeatmap({ rows, maxSectors = 8 }: { rows: ScreenerRow[]; maxSectors?: number }) {
  const p = useColors()
  const groups = useMemo(() => {
    const map = new Map<string, ScreenerRow[]>()
    for (const r of rows) map.set(r.sector, [...(map.get(r.sector) ?? []), r])
    return [...map.entries()]
      .map(([sector, list]) => ({
        sector,
        list: [...list].sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0)),
        avg: list.reduce((s, r) => s + r.changePercent, 0) / list.length,
      }))
      .sort((a, b) => b.list.length - a.list.length)
      .slice(0, maxSectors)
  }, [rows, maxSectors])

  const tint = (pct: number) => {
    const t = Math.max(-3, Math.min(3, pct)) / 3
    return withAlpha(t >= 0 ? p.bullish : p.bearish, 0.12 + Math.abs(t) * 0.5)
  }

  return (
    <View className="gap-4 px-5">
      {groups.map((g) => (
        <View key={g.sector} className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-muted-foreground">{g.sector}</Text>
            <Text className={`text-xs font-semibold ${g.avg >= 0 ? "text-bullish" : "text-bearish"}`}>{fmtPct(g.avg)}</Text>
          </View>
          <View className="flex-row flex-wrap gap-1.5">
            {g.list.map((s) => (
              <Tappable
                key={s.symbol}
                onPress={() => router.push({ pathname: "/stock/[symbol]", params: { symbol: s.symbol } })}
                accessibilityLabel={`${s.base} ${fmtPct(s.changePercent)}`}
                style={{ backgroundColor: tint(s.changePercent) }}
                className="w-[23.5%] rounded-xl px-2 py-2"
              >
                <Text numberOfLines={1} className="text-[11px] font-bold text-foreground">
                  {s.base}
                </Text>
                <Text numberOfLines={1} className={`text-[11px] font-semibold ${s.changePercent >= 0 ? "text-bullish" : "text-bearish"}`}>
                  {fmtPct(s.changePercent)}
                </Text>
              </Tappable>
            ))}
          </View>
        </View>
      ))}
    </View>
  )
})

/** Advancing vs declining stocks as one split bar. */
export function BreadthBar({ adv, dec, total }: { adv: number; dec: number; total: number }) {
  const flat = Math.max(0, total - adv - dec)
  return (
    <View className="gap-2">
      <View className="h-2 flex-row overflow-hidden rounded-full bg-secondary">
        <View className="bg-bullish" style={{ flex: adv }} />
        <View className="bg-neutral/40" style={{ flex: flat }} />
        <View className="bg-bearish" style={{ flex: dec }} />
      </View>
      <View className="flex-row justify-between">
        <Text className="text-xs font-semibold text-bullish">▲ {adv} advancing</Text>
        <Text className="text-xs font-semibold text-bearish">{dec} declining ▼</Text>
      </View>
    </View>
  )
}
