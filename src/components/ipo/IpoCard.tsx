import { Image } from "expo-image"
import { router } from "expo-router"
import { memo } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Tappable } from "@/components/ui/Tappable"
import { fmtPct } from "@/lib/format"
import { priceLabel, stageLabel, STATUS_LABEL, type Ipo, type IpoStatus } from "@/lib/ipo"

const STATUS_STYLE: Record<IpoStatus, { box: string; text: string }> = {
  open: { box: "bg-bullish-bg", text: "text-bullish" },
  upcoming: { box: "bg-accent/15", text: "text-accent" },
  closed: { box: "bg-neutral-bg", text: "text-neutral" },
  listed: { box: "bg-secondary", text: "text-foreground" },
}

export const IpoCard = memo(function IpoCard({ ipo }: { ipo: Ipo }) {
  const s = STATUS_STYLE[ipo.status]
  const gmpPct = ipo.gmp?.percent
  const gain = ipo.status === "listed" ? ipo.listingGainPct : gmpPct
  return (
    <Tappable
      shrinkTo={0.98}
      onPress={() => router.push({ pathname: "/ipo/[slug]", params: { slug: ipo.slug } })}
      className="mx-4 mb-3 gap-3 rounded-2xl border border-border bg-card p-4"
    >
      <View className="flex-row items-center gap-3">
        {ipo.logo ? (
          <Image source={{ uri: ipo.logo }} style={{ width: 40, height: 40, borderRadius: 10 }} contentFit="contain" cachePolicy="memory-disk" />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary">
            <Text className="font-bold text-foreground">{ipo.displayName.slice(0, 1)}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text numberOfLines={1} className="text-[15px] font-semibold text-foreground">
            {ipo.displayName}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {ipo.board} · {stageLabel(ipo)}
          </Text>
        </View>
        <View className={`rounded-md px-2 py-0.5 ${s.box}`}>
          <Text className={`text-[11px] font-semibold ${s.text}`}>{STATUS_LABEL[ipo.status]}</Text>
        </View>
      </View>
      <View className="flex-row justify-between">
        <Cell label="Price" value={priceLabel(ipo)} />
        <Cell label={ipo.status === "listed" ? "Listing gain" : "GMP"} value={gain != null ? fmtPct(gain) : "—"} tone={gain} />
        <Cell label="Subscribed" value={ipo.subscriptionTimes != null ? `${ipo.subscriptionTimes.toFixed(2)}x` : "—"} />
      </View>
    </Tappable>
  )
})

function Cell({ label, value, tone }: { label: string; value: string; tone?: number | null }) {
  const color = tone == null || tone === 0 ? "text-foreground" : tone > 0 ? "text-bullish" : "text-bearish"
  return (
    <View className="gap-0.5">
      <Text className="text-[11px] text-muted-foreground">{label}</Text>
      <Text className={`text-sm font-semibold ${color}`}>{value}</Text>
    </View>
  )
}
