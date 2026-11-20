import { memo } from "react"
import { ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Tappable } from "@/components/ui/Tappable"
import { haptics } from "@/lib/haptics"

export type ChipOption<T extends string> = { value: T; label: string }

/** A horizontally scrolling row of filter chips (news categories, IPO status). */
function FilterChipsInner<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ChipOption<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-5 py-1"
      keyboardShouldPersistTaps="handled"
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <Tappable
            key={o.value}
            onPress={() => {
              if (active) return
              haptics.tick()
              onChange(o.value)
            }}
            aria-selected={active}
            className={`h-9 justify-center rounded-full border px-4 ${active ? "border-primary bg-primary" : "border-border bg-card"}`}
          >
            <Text className={`text-[13px] font-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{o.label}</Text>
          </Tappable>
        )
      })}
    </ScrollView>
  )
}
export const FilterChips = memo(FilterChipsInner) as typeof FilterChipsInner

/** Equal-width segments (chart ranges, buy/sell direction). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ChipOption<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <View className="flex-row gap-1 rounded-xl border border-border bg-secondary p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <Tappable
            key={o.value}
            shrinkTo={0.95}
            onPress={() => {
              if (active) return
              haptics.tick()
              onChange(o.value)
            }}
            aria-selected={active}
            className={`h-9 flex-1 items-center justify-center rounded-lg px-1 ${active ? "bg-card" : ""}`}
          >
            <Text numberOfLines={1} className={`text-xs font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
              {o.label}
            </Text>
          </Tappable>
        )
      })}
    </View>
  )
}
