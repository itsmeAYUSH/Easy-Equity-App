import { cssInterop } from "nativewind"
import type { ReactNode } from "react"
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from "react-native"
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated"

const PressableView = Animated.createAnimatedComponent(Pressable)

type Props = PressableProps & {
  children: ReactNode
  className?: string
  style?: StyleProp<ViewStyle>
  /** How small it gets while held (1 = no shrink). */
  shrinkTo?: number
  /** Filled in by NativeWind from `className` (see the cssInterop call below); don't pass it. */
  classStyle?: StyleProp<ViewStyle>
}

/**
 * The app's touch target: dims and shrinks a little while held. The animation
 * runs on the UI thread (Reanimated), so it stays smooth while lists render,
 * and it is skipped when the system asks for reduced motion.
 */
export function Tappable({
  children,
  classStyle,
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

  // Opacity set by a class or style (`opacity-60` on a disabled Button): the
  // press dim scales it, since the animated style is applied last.
  const restOpacity = StyleSheet.flatten([classStyle, style])?.opacity
  const rest = typeof restOpacity === "number" ? restOpacity : 1

  const animated = useAnimatedStyle(() => ({
    opacity: rest * (1 - held.value * 0.12),
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
      // The animated handle must stay its own array entry. Reanimated swaps
      // any style object carrying it for the animated values alone.
      style={[classStyle, style, animated]}
    >
      {children}
    </PressableView>
  )
}

// NativeWind resolves `className` into `classStyle`, not `style`. Mapped onto
// `style`, it merges the class styles and the animated handle into one object,
// and on native Reanimated then drops every class (no padding, gap, flex-row or
// background on any Tappable). Web was unaffected, where classes stay CSS.
cssInterop(Tappable, { className: "classStyle" })
