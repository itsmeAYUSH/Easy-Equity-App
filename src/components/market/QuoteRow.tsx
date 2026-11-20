import { router } from "expo-router"
import { memo, type ReactNode } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Tappable } from "@/components/ui/Tappable"
import { PriceChange } from "@/components/ui/PriceChange"
import { displaySymbol, fmtPrice } from "@/lib/format"

/** One instrument per row: symbol + name on the left, price + change on the right. */
export const QuoteRow = memo(function QuoteRow({
  symbol,
  name,
  price,
  changePct,
  currency,
  right,
  onPress,
}: {
  symbol: string
  name?: string | null
  price?: number | null
  changePct?: number | null
  currency?: string | null
  right?: ReactNode
  onPress?: () => void
}) {
  return (
    <Tappable
      shrinkTo={0.98}
      onPress={onPress ?? (() => router.push({ pathname: "/stock/[symbol]", params: { symbol } }))}
      className="mx-4 flex-row items-center gap-3 border-b border-border py-3"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
        <Text className="text-xs font-bold text-foreground">{displaySymbol(symbol).slice(0, 3)}</Text>
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-[15px] font-semibold text-foreground">
          {displaySymbol(symbol)}
        </Text>
        {name ? (
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {name}
          </Text>
        ) : null}
      </View>
      <View className="items-end gap-0.5">
        <Text className="text-[15px] font-semibold text-foreground">{price != null ? fmtPrice(price, currency) : "—"}</Text>
        {changePct != null ? <PriceChange pct={changePct} size="xs" /> : null}
      </View>
      {right}
    </Tappable>
  )
})
