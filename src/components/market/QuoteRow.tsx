import { router } from "expo-router"
import { memo, type ReactNode } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { ListRow, type GroupPosition } from "@/components/ui/List"
import { PriceChange } from "@/components/ui/PriceChange"
import { displaySymbol, fmtPrice } from "@/lib/format"

/**
 * One instrument per row: symbol + name on the left, price + change on the right.
 * `position` joins consecutive rows into one rounded card (see ListRow).
 */
export const QuoteRow = memo(function QuoteRow({
  symbol,
  name,
  price,
  changePct,
  currency,
  right,
  onPress,
  position = "only",
}: {
  symbol: string
  name?: string | null
  price?: number | null
  changePct?: number | null
  currency?: string | null
  right?: ReactNode
  onPress?: () => void
  position?: GroupPosition
}) {
  const label = displaySymbol(symbol)
  return (
    <ListRow position={position} onPress={onPress ?? (() => router.push({ pathname: "/stock/[symbol]", params: { symbol } }))}>
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-secondary">
        <Text className="text-[11px] font-bold text-foreground">{label.slice(0, 4)}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="text-[15px] font-semibold text-foreground">
          {label}
        </Text>
        {name ? (
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {name}
          </Text>
        ) : null}
      </View>
      <View className="items-end gap-1">
        <Text className="text-[15px] font-semibold text-foreground">{price != null ? fmtPrice(price, currency) : "—"}</Text>
        {changePct != null ? <PriceChange pct={changePct} size="xs" variant="pill" /> : null}
      </View>
      {right}
    </ListRow>
  )
})
