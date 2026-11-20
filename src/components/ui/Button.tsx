import Ionicons from "@expo/vector-icons/Ionicons"
import { ActivityIndicator, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Tappable } from "@/components/ui/Tappable"
import { useColors } from "@/lib/appearance"

type Variant = "primary" | "accent" | "secondary" | "ghost" | "destructive"

const CONTAINER: Record<Variant, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  secondary: "bg-card border border-border",
  ghost: "bg-transparent",
  destructive: "bg-destructive",
}

const LABEL: Record<Variant, string> = {
  primary: "text-primary-foreground",
  accent: "text-accent-foreground",
  secondary: "text-foreground",
  ghost: "text-foreground",
  destructive: "text-white",
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  size = "md",
  className = "",
}: {
  title: string
  onPress?: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  icon?: keyof typeof Ionicons.glyphMap
  size?: "sm" | "md"
  className?: string
}) {
  const p = useColors()
  const fg =
    variant === "primary" ? p.primaryForeground : variant === "accent" ? p.accentForeground : variant === "destructive" ? "#fff" : p.foreground
  const inactive = disabled || loading
  return (
    <Tappable
      onPress={onPress}
      disabled={inactive}
      accessibilityLabel={title}
      aria-busy={loading}
      className={`${CONTAINER[variant]} ${size === "sm" ? "h-9 px-3" : "h-12 px-5"} flex-row items-center justify-center rounded-xl ${inactive ? "opacity-60" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Ionicons name={icon} size={size === "sm" ? 16 : 18} color={fg} /> : null}
          <Text className={`${LABEL[variant]} font-semibold ${size === "sm" ? "text-sm" : "text-base"}`}>{title}</Text>
        </View>
      )}
    </Tappable>
  )
}
