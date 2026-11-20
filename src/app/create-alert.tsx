import { router, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { HttpError, errorMessage } from "@/api/errors"
import { Button } from "@/components/ui/Button"
import { Segmented } from "@/components/ui/Chips"
import { TopBar } from "@/components/ui/TopBar"
import { Tappable } from "@/components/ui/Tappable"
import { Page } from "@/components/ui/Page"
import { InputField } from "@/components/ui/InputField"
import { useCreatePriceAlert } from "@/hooks/use-alerts"
import { useDebounce } from "@/hooks/use-debounce"
import { useSymbolSearch } from "@/hooks/use-market"
import { displaySymbol, fmtPrice } from "@/lib/format"

export default function CreateAlertScreen() {
  const params = useLocalSearchParams<{ symbol?: string; price?: string }>()
  const current = params.price ? parseFloat(params.price) : null
  const [symbol, setSymbol] = useState<string | null>(params.symbol ?? null)
  const [query, setQuery] = useState("")
  const [direction, setDirection] = useState<"above" | "below">("above")
  const [target, setTarget] = useState(current ? String(Math.round(current * 1.05 * 100) / 100) : "")
  const [error, setError] = useState<{ text: string; pro: boolean } | null>(null)
  const term = useDebounce(query.trim(), 300)
  const search = useSymbolSearch(symbol ? "" : term)
  const create = useCreatePriceAlert()

  const submit = () => {
    const price = parseFloat(target)
    if (!symbol) return setError({ text: "Choose a stock.", pro: false })
    if (!(price > 0)) return setError({ text: "Enter a target price above 0.", pro: false })
    setError(null)
    create.mutate(
      { symbol, target_price: price, direction },
      {
        onSuccess: () => router.back(),
        onError: (e) => setError({ text: errorMessage(e, "Couldn't create the alert."), pro: e instanceof HttpError && e.isProRequired }),
      },
    )
  }

  return (
    <Page edges={["top", "bottom"]}>
      <TopBar title="New price alert" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 px-4 pb-8">
          {symbol ? (
            <View className="flex-row items-center justify-between rounded-xl border border-border bg-card p-3">
              <View>
                <Text className="text-base font-semibold text-foreground">{displaySymbol(symbol)}</Text>
                {current ? <Text className="text-xs text-muted-foreground">Now {fmtPrice(current)}</Text> : null}
              </View>
              <Tappable onPress={() => setSymbol(null)} hitSlop={8}>
                <Text className="text-sm font-semibold text-accent">Change</Text>
              </Tappable>
            </View>
          ) : (
            <View className="gap-1">
              <InputField label="Stock" icon="search" value={query} onChangeText={setQuery} placeholder="Search a stock" autoCapitalize="characters" autoCorrect={false} />
              {(search.data ?? []).slice(0, 6).map((r) => (
                <Tappable key={r.symbol} onPress={() => setSymbol(r.symbol)} className="border-b border-border py-2.5">
                  <Text className="text-sm font-semibold text-foreground">{r.base || r.symbol}</Text>
                  <Text numberOfLines={1} className="text-xs text-muted-foreground">
                    {r.name} · {r.exchange}
                  </Text>
                </Tappable>
              ))}
            </View>
          )}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Notify me when the price</Text>
            <Segmented
              options={[
                { value: "above", label: "Rises above" },
                { value: "below", label: "Falls below" },
              ]}
              value={direction}
              onChange={setDirection}
            />
          </View>
          <InputField label="Target price" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
          {error ? (
            <View className="gap-2">
              <Text className="text-sm text-destructive">{error.text}</Text>
              {error.pro ? <Button title="See Pro" variant="secondary" size="sm" onPress={() => router.push("/pro")} /> : null}
            </View>
          ) : null}
          <Button title="Create alert" onPress={submit} loading={create.isPending} />
          <Text className="text-center text-xs text-muted-foreground">{"Prices are checked every 5 minutes. You'll see triggered alerts in Notifications (and by email if you opted in)."}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  )
}
