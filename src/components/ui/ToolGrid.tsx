import Ionicons from "@expo/vector-icons/Ionicons"
import { router, type Href } from "expo-router"
import { View } from "react-native"

import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { useColors } from "@/lib/appearance"

export type Tool = { icon: keyof typeof Ionicons.glyphMap; label: string; href: Href }

/** Four-across grid of tool shortcuts (icon in a tinted square, label below). */
export function ToolGrid({ tools }: { tools: Tool[] }) {
  const p = useColors()
  return (
    <View className="mx-5 flex-row flex-wrap rounded-3xl border border-border bg-card px-1 py-3">
      {tools.map((t) => (
        <Tappable
          key={t.label}
          onPress={() => router.push(t.href)}
          accessibilityLabel={t.label}
          className="w-1/4 items-center gap-2 px-1 py-2"
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent/15">
            <Ionicons name={t.icon} size={22} color={p.accent} />
          </View>
          <Text numberOfLines={2} className="text-center text-[11px] font-medium leading-[14px] text-foreground">
            {t.label}
          </Text>
        </Tappable>
      ))}
    </View>
  )
}
