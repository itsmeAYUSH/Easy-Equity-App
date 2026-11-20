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
    <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
      <Tappable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        accessibilityLabel="Back"
        hitSlop={8}
        className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
      >
        <Ionicons name="chevron-back" size={20} color={p.foreground} />
      </Tappable>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-lg font-bold text-foreground">
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} className="mt-0.5 text-xs text-muted-foreground">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View className="flex-row items-center gap-2">{right}</View> : null}
    </View>
  )
}

/** Title row for tab roots. `subtitle` may be a string or a node (a status pill). */
export function TabHeader({ title, subtitle, right }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between gap-3 px-5 pb-4 pt-3">
      <View className="flex-1">
        <Text accessibilityRole="header" className="text-[26px] font-bold leading-8 text-foreground">
          {title}
        </Text>
        {typeof subtitle === "string" ? (
          <Text className="mt-1 text-xs text-muted-foreground">{subtitle}</Text>
        ) : subtitle ? (
          <View className="mt-2 flex-row">{subtitle}</View>
        ) : null}
      </View>
      {right ? <View className="flex-row items-center gap-2">{right}</View> : null}
    </View>
  )
}

/** Round icon button for headers, with an optional unread badge. */
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
    <Tappable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={6}
      className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
    >
      <Ionicons name={icon} size={20} color={color ?? p.foreground} />
      {badge ? (
        <View className="absolute -right-1 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-destructive px-1">
          <Text className="text-[9px] font-bold text-white">{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Tappable>
  )
}

/**
 * Heading that opens a block of content. Sections are 32 pt apart; pass
 * `first` for the one directly under a header so it doesn't double the gap.
 */
export function SectionHeading({
  title,
  subtitle,
  action,
  first = false,
}: {
  title: string
  subtitle?: string | null
  action?: { label: string; onPress: () => void }
  first?: boolean
}) {
  return (
    <View className={`flex-row items-end justify-between gap-3 px-5 pb-3 ${first ? "pt-2" : "pt-8"}`}>
      <View className="flex-1">
        <Text accessibilityRole="header" className="text-lg font-bold text-foreground">
          {title}
        </Text>
        {subtitle ? <Text className="mt-0.5 text-xs text-muted-foreground">{subtitle}</Text> : null}
      </View>
      {action ? (
        <Tappable onPress={action.onPress} hitSlop={8} accessibilityLabel={action.label}>
          <Text className="text-sm font-semibold text-accent">{action.label}</Text>
        </Tappable>
      ) : null}
    </View>
  )
}
