import type { ReactNode } from "react"
import { View } from "react-native"

import { Tappable } from "@/components/ui/Tappable"

/** Where a row sits in a run of rows that should read as one rounded card. */
export type GroupPosition = "only" | "first" | "middle" | "last"

export function groupPosition(index: number, count: number): GroupPosition {
  if (count <= 1) return "only"
  if (index === 0) return "first"
  if (index === count - 1) return "last"
  return "middle"
}

/**
 * Classes for one row of a grouped list (iOS-settings style): the rows share
 * side borders, the first rounds the top, the last rounds the bottom, and a
 * hairline separates the rest. Works row by row, so FlashList can recycle them.
 */
export function groupedRowClass(position: GroupPosition = "only"): string {
  const top = position === "first" || position === "only"
  const bottom = position === "last" || position === "only"
  return `mx-5 border-x border-b border-border bg-card px-4 ${top ? "rounded-t-2xl border-t" : ""} ${bottom ? "rounded-b-2xl" : ""}`
}

/** A tappable row in a grouped list. */
export function ListRow({
  position = "only",
  onPress,
  onLongPress,
  accessibilityLabel,
  className = "",
  children,
}: {
  position?: GroupPosition
  onPress?: () => void
  onLongPress?: () => void
  accessibilityLabel?: string
  className?: string
  children: ReactNode
}) {
  return (
    <Tappable
      // A slice of a card shouldn't shrink on its own: dim only.
      shrinkTo={1}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={accessibilityLabel}
      className={`${groupedRowClass(position)} flex-row items-center gap-3 py-3.5 ${className}`}
    >
      {children}
    </Tappable>
  )
}

/** A static grouped-list container for a handful of rows (settings, results). */
export function ListGroup({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <View className={`mx-5 overflow-hidden rounded-2xl border border-border bg-card ${className}`}>{children}</View>
}
