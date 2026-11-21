import Ionicons from "@expo/vector-icons/Ionicons"
import { useState } from "react"
import { ActivityIndicator, View } from "react-native"

import { InputField } from "@/components/ui/InputField"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { useDebounce } from "@/hooks/use-debounce"
import { useSymbolSearch } from "@/hooks/use-market"
import { useColors } from "@/lib/appearance"

/** A search box that lists matching symbols and hands the chosen one back. */
export function SymbolPicker({
  onPick,
  placeholder = "Search a stock, e.g. TCS or Infosys",
  includeCrypto = true,
  exclude = [],
}: {
  onPick: (symbol: string) => void
  placeholder?: string
  includeCrypto?: boolean
  exclude?: string[]
}) {
  const p = useColors()
  const [q, setQ] = useState("")
  const term = useDebounce(q.trim(), 300)
  const results = useSymbolSearch(term, includeCrypto)
  const skip = new Set(exclude.map((s) => s.toUpperCase()))
  const list = term.length >= 2 ? (results.data ?? []).filter((r) => !skip.has(r.symbol.toUpperCase())).slice(0, 6) : []

  return (
    <View className="gap-1">
      <InputField icon="search" value={q} onChangeText={setQ} placeholder={placeholder} autoCapitalize="characters" autoCorrect={false} returnKeyType="search" />
      {results.isFetching && term.length >= 2 && !list.length ? (
        <View className="items-center py-3">
          <ActivityIndicator size="small" color={p.mutedForeground} />
        </View>
      ) : null}
      {list.map((r) => (
        <Tappable
          key={r.symbol}
          onPress={() => {
            onPick(r.symbol)
            setQ("")
          }}
          className="flex-row items-center gap-3 border-b border-border py-3"
        >
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">{r.base || r.symbol}</Text>
            <Text numberOfLines={1} className="text-xs text-muted-foreground">
              {r.name} · {r.exchange}
            </Text>
          </View>
          <Ionicons name="add-circle" size={22} color={p.accent} />
        </Tappable>
      ))}
    </View>
  )
}
