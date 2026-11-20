import Ionicons from "@expo/vector-icons/Ionicons"
import { router } from "expo-router"
import type { ReactNode } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Tappable } from "@/components/ui/Tappable"
import { useColors } from "@/lib/appearance"

/** Header for pushed pages: back button, title, optional right-hand actions. */
export function TopBar({ title, subtitle, right }: { title: string; subtitle?: string | null; right?: ReactNode }) {
  const p = useColors()
  return (
    <View className="flex-row items-center gap-2 px-2 pb-2 pt-1">
      <Tappable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        accessibilityLabel="Back"
        hitSlop={8}
        className="h-10 w-10 items-center justify-center rounded-full"
      >
        <Ionicons name="chevron-back" size={24} color={p.foreground} />
      </Tappable>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-lg font-bold text-foreground">
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View className="flex-row items-center gap-1 pr-2">{right}</View> : null}
    </View>
  )
}

/** Title row for tab roots. */
export function TabHeader({ title, subtitle, right }: { title: string; subtitle?: string | null; right?: ReactNode }) {
  return (
    <View className="flex-row items-end justify-between px-4 pb-2 pt-2">
      <View className="flex-1">
        <Text className="text-2xl font-bold text-foreground">{title}</Text>
        {subtitle ? <Text className="text-xs text-muted-foreground">{subtitle}</Text> : null}
      </View>
      {right ? <View className="flex-row items-center gap-2">{right}</View> : null}
    </View>
  )
}

export function HeaderIcon({
  icon,
  onPress,
  label,
  badge,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
  label: string
  badge?: number
  color?: string
}) {
  const p = useColors()
  return (
    <Tappable onPress={onPress} accessibilityLabel={label} hitSlop={6} className="h-10 w-10 items-center justify-center rounded-full">
      <Ionicons name={icon} size={22} color={color ?? p.foreground} />
      {badge ? (
        <View className="absolute right-1 top-1 min-w-[16px] items-center rounded-full bg-destructive px-1">
          <Text className="text-[10px] font-bold text-white">{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Tappable>
  )
}

/** Bold heading above a block of content. */
export function SectionHeading({ title }: { title: string }) {
  return (
    <Text accessibilityRole="header" className="px-4 pb-2 pt-5 text-lg font-bold text-foreground">
      {title}
    </Text>
  )
}
