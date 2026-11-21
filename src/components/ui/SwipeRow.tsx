import Ionicons from "@expo/vector-icons/Ionicons"
import { useRef, type ReactNode } from "react"
import { View } from "react-native"
import ReanimatedSwipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable"

import type { GroupPosition } from "@/components/ui/List"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { haptics } from "@/lib/haptics"

/**
 * Swipe a row left to reveal a red action (remove a holding, a watchlist star,
 * an alert). The row keeps its normal tap; the action needs a second tap, so a
 * stray swipe never deletes anything.
 */
export function SwipeRow({
  children,
  onAction,
  label = "Remove",
  icon = "trash-outline",
  position = "only",
}: {
  children: ReactNode
  onAction: () => void
  label?: string
  icon?: keyof typeof Ionicons.glyphMap
  /** Rounds the action's corners to match a grouped list row. */
  position?: GroupPosition
}) {
  const ref = useRef<SwipeableMethods>(null)
  const top = position === "first" || position === "only"
  const bottom = position === "last" || position === "only"

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={1.8}
      rightThreshold={36}
      overshootRight={false}
      dragOffsetFromRightEdge={12}
      onSwipeableWillOpen={() => haptics.tick()}
      renderRightActions={() => (
        <View className="mr-5 w-[84px]">
          <Tappable
            shrinkTo={0.96}
            accessibilityLabel={label}
            onPress={() => {
              ref.current?.close()
              onAction()
            }}
            className={`flex-1 items-center justify-center gap-1 bg-destructive ${top ? "rounded-tr-2xl" : ""} ${bottom ? "rounded-br-2xl" : ""}`}
          >
            <Ionicons name={icon} size={20} color="#fff" />
            <Text className="text-[11px] font-semibold text-white">{label}</Text>
          </Tappable>
        </View>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  )
}
