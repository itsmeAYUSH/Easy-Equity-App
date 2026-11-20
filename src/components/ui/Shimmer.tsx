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

/** Placeholder rows for lists (news, quotes). */
export function ListShimmer({ rows = 6, withImage = false }: { rows?: number; withImage?: boolean }) {
  return (
    <View className="gap-4 px-4 pt-2">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} className="flex-row gap-3">
          {withImage ? <Shimmer width={84} height={84} radius={12} /> : null}
          <View className="flex-1 gap-2 py-1">
            <Shimmer height={14} width="90%" />
            <Shimmer height={14} width="70%" />
            <Shimmer height={10} width="40%" />
          </View>
        </View>
      ))}
    </View>
  )
}
