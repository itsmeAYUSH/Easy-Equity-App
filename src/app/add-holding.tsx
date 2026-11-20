import { router } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { errorMessage } from "@/api/errors"
import { Button } from "@/components/ui/Button"
import { TopBar } from "@/components/ui/TopBar"
import { Tappable } from "@/components/ui/Tappable"
import { Page } from "@/components/ui/Page"
import { InputField } from "@/components/ui/InputField"
import { useDebounce } from "@/hooks/use-debounce"
import { useSymbolSearch } from "@/hooks/use-market"
import { useAddHolding } from "@/hooks/use-portfolio"
import { displaySymbol } from "@/lib/format"

/** Add (or buy more of) a holding. Adding a stock you already hold averages the price on the server. */
export default function AddHoldingScreen() {
  const [query, setQuery] = useState("")
  const [symbol, setSymbol] = useState<string | null>(null)
  const [qty, setQty] = useState("")
  const [price, setPrice] = useState("")
  const [error, setError] = useState<string | null>(null)
  const term = useDebounce(query.trim(), 300)
  const search = useSymbolSearch(symbol ? "" : term, false)
  const add = useAddHolding()

  const submit = () => {
    const quantity = parseFloat(qty)
    const avg = parseFloat(price)
    const s = symbol ?? query.trim().toUpperCase()
    if (!s) return setError("Choose a stock.")
    if (!(quantity > 0) || !(avg > 0)) return setError("Quantity and average price must be above 0.")
    setError(null)
    add.mutate(
      { symbol: s, quantity, avg_price: avg },
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e, "Couldn't add the holding.")) },
    )
  }

  return (
    <Page edges={["top", "bottom"]}>
      <TopBar title="Add holding" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 px-4 pb-8">
          {symbol ? (
            <View className="flex-row items-center justify-between rounded-xl border border-border bg-card p-3">
              <Text className="text-base font-semibold text-foreground">{displaySymbol(symbol)}</Text>
              <Tappable onPress={() => setSymbol(null)} hitSlop={8}>
                <Text className="text-sm font-semibold text-accent">Change</Text>
              </Tappable>
            </View>
          ) : (
            <View className="gap-1">
              <InputField label="Stock" icon="search" value={query} onChangeText={setQuery} placeholder="e.g. Reliance, TCS" autoCapitalize="characters" autoCorrect={false} />
              {(search.data ?? []).slice(0, 6).map((r) => (
                <Tappable
                  key={r.symbol}
                  onPress={() => {
                    setSymbol(r.symbol)
                    setQuery(r.base || r.symbol)
                  }}
                  className="border-b border-border py-2.5"
                >
                  <Text className="text-sm font-semibold text-foreground">{r.base || r.symbol}</Text>
                  <Text numberOfLines={1} className="text-xs text-muted-foreground">
                    {r.name} · {r.exchange}
                  </Text>
                </Tappable>
              ))}
            </View>
          )}
          <InputField label="Quantity" value={qty} onChangeText={setQty} keyboardType="decimal-pad" placeholder="10" />
          <InputField label="Average buy price (₹)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="2450.50" />
          {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
          <Button title="Add to portfolio" onPress={submit} loading={add.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  )
}
