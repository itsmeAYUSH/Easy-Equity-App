import Ionicons from "@expo/vector-icons/Ionicons"
import { memo } from "react"
import { View } from "react-native"

import { Text } from "@/components/ui/Text"
import { useColors } from "@/lib/appearance"

export type Tone = "bullish" | "bearish" | "neutral" | "accent" | "plain"

// Full class names (not built from strings) so Tailwind keeps them.
const TONES: Record<Tone, { box: string; text: string }> = {
  bullish: { box: "bg-bullish-bg", text: "text-bullish" },
  bearish: { box: "bg-bearish-bg", text: "text-bearish" },
  neutral: { box: "bg-neutral-bg", text: "text-neutral" },
  accent: { box: "bg-accent/15", text: "text-accent" },
  plain: { box: "bg-secondary", text: "text-foreground" },
}

export function toneText(tone: Tone): string {
  return TONES[tone].text
}

/** A small rounded label: sentiment, status, impact. */
export const Pill = memo(function Pill({
  label,
  tone = "plain",
  icon,
  size = "sm",
}: {
  label: string
  tone?: Tone
  icon?: keyof typeof Ionicons.glyphMap
  size?: "xs" | "sm"
}) {
  const p = useColors()
  const s = TONES[tone]
  const iconColor = tone === "bullish" ? p.bullish : tone === "bearish" ? p.bearish : tone === "accent" ? p.accent : tone === "neutral" ? p.neutral : p.foreground
  return (
    <View className={`flex-row items-center gap-1 self-start rounded-full ${size === "xs" ? "px-2 py-0.5" : "px-2.5 py-1"} ${s.box}`}>
      {icon ? <Ionicons name={icon} size={size === "xs" ? 11 : 12} color={iconColor} /> : null}
      <Text numberOfLines={1} className={`${size === "xs" ? "text-[10px]" : "text-[11px]"} font-semibold ${s.text}`}>
        {label}
      </Text>
    </View>
  )
})

/** Sentiment word → tone + arrow icon. */
export function sentimentPill(sentiment: string | null | undefined): { tone: Tone; icon: keyof typeof Ionicons.glyphMap } {
  if (sentiment && /bull|positive/i.test(sentiment)) return { tone: "bullish", icon: "trending-up" }
  if (sentiment && /bear|negative/i.test(sentiment)) return { tone: "bearish", icon: "trending-down" }
  return { tone: "neutral", icon: "remove" }
}
