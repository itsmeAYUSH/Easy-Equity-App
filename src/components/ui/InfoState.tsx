import Ionicons from "@expo/vector-icons/Ionicons"
import { useEffect } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated"

import { Button } from "@/components/ui/Button"
import { useColors } from "@/lib/appearance"

type Props = {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  body?: string | null
  /** "error" = something failed to load: red icon, and the button is a retry. */
  kind?: "empty" | "error"
  buttonLabel?: string
  onButtonPress?: () => void
  /** Less vertical padding, for use inside a section. */
  small?: boolean
}

/** Centered message for empty lists, no search results, or a failed load. */
export function InfoState({ icon, title, body, kind = "empty", buttonLabel, onButtonPress, small = false }: Props) {
  const c = useColors()
  const failed = kind === "error"
  const reduced = useReducedMotion()

  // Fades in (Reanimated shared value, so it always ends fully opaque on web too).
  const shown = useSharedValue(reduced ? 1 : 0)
  useEffect(() => {
    shown.value = reduced ? 1 : withTiming(1, { duration: 200 })
  }, [shown, reduced])
  const fadeIn = useAnimatedStyle(() => ({ opacity: shown.value }))

  return (
    // Classes go on the inner View: NativeWind doesn't style Reanimated's Animated.View.
    <Animated.View style={fadeIn} accessibilityLiveRegion={failed ? "polite" : "none"}>
      <View className={`items-center gap-2 px-6 ${small ? "py-6" : "py-12"}`}>
        <Ionicons name={icon} size={30} color={failed ? c.destructive : c.mutedForeground} />
        <Text accessibilityRole="header" className="mt-1 text-center text-base font-semibold text-foreground">
          {title}
        </Text>
        {body ? <Text className="max-w-xs text-center text-sm text-muted-foreground">{body}</Text> : null}
        {buttonLabel && onButtonPress ? (
          <View className="mt-3 min-w-[180px]">
            <Button title={buttonLabel} onPress={onButtonPress} variant={failed ? "secondary" : "primary"} />
          </View>
        ) : null}
      </View>
    </Animated.View>
  )
}
