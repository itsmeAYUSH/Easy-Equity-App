import { useEffect } from "react"
import { View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native"
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"

import { useColors } from "@/lib/appearance"

/** A loading placeholder that gently breathes (static under reduced motion). */
export function Shimmer({
  width = "100%",
  height = 12,
  radius = 8,
  style,
}: {
  width?: DimensionValue
  height?: DimensionValue
  radius?: number
  style?: StyleProp<ViewStyle>
}) {
  const p = useColors()
  const reduced = useReducedMotion()
  const opacity = useSharedValue(0.55)

  useEffect(() => {
    if (reduced) return
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true)
    return () => cancelAnimation(opacity)
  }, [opacity, reduced])

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      aria-hidden
      style={[{ width, height, borderRadius: radius, backgroundColor: p.muted }, animated, style]}
    />
  )
}

/** Placeholder cards for lists (news, quotes), shaped like the cards they stand in for. */
export function ListShimmer({ rows = 6, withImage = false }: { rows?: number; withImage?: boolean }) {
  return (
    <View className="gap-3 px-5 pt-2">
      {withImage ? (
        <View className="overflow-hidden rounded-3xl border border-border bg-card">
          <Shimmer height={180} radius={0} />
          <View className="gap-2.5 p-5">
            <Shimmer height={12} width="35%" />
            <Shimmer height={18} width="95%" />
            <Shimmer height={18} width="70%" />
          </View>
        </View>
      ) : null}
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
          {!withImage ? <Shimmer width={40} height={40} radius={12} /> : null}
          <View className="flex-1 gap-2">
            <Shimmer height={14} width="85%" />
            <Shimmer height={12} width="55%" />
          </View>
          {withImage ? <Shimmer width={84} height={84} radius={12} /> : null}
        </View>
      ))}
    </View>
  )
}
