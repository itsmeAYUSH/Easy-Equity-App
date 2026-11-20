import { cssInterop } from "nativewind"
import type { ReactNode } from "react"
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native"
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated"

const PressableView = Animated.createAnimatedComponent(Pressable)
// NativeWind only styles components it knows; register this one so `className` works.
cssInterop(PressableView, { className: "style" })

type Props = PressableProps & {
  children: ReactNode
  className?: string
  style?: StyleProp<ViewStyle>
  /** How small it gets while held (1 = no shrink). */
  shrinkTo?: number
}

/**
 * The app's touch target: dims and shrinks a little while held. The animation
 * runs on the UI thread (Reanimated), so it stays smooth while lists render,
 * and it is skipped when the system asks for reduced motion.
 */
export function Tappable({
  children,
  style,
  shrinkTo = 0.97,
  onPressIn,
  onPressOut,
  disabled,
  role = "button",
  ...pressableProps
}: Props) {
  const held = useSharedValue(0)
  const reduced = useReducedMotion()

  const animated = useAnimatedStyle(() => ({
    opacity: 1 - held.value * 0.12,
    transform: [{ scale: 1 - held.value * (1 - shrinkTo) }],
  }))

  return (
    <PressableView
      {...pressableProps}
      role={role}
      disabled={disabled}
      aria-disabled={!!disabled}
      onPressIn={(e) => {
        if (!reduced && !disabled) held.value = withTiming(1, { duration: 80 })
        onPressIn?.(e)
      }}
      onPressOut={(e) => {
        held.value = reduced ? 0 : withTiming(0, { duration: 140 })
        onPressOut?.(e)
      }}
      style={[animated, style]}
    >
      {children}
    </PressableView>
  )
}
