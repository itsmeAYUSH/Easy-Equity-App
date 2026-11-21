import Ionicons from "@expo/vector-icons/Ionicons"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"

import { HttpError, errorMessage } from "@/api/errors"
import { Button } from "@/components/ui/Button"
import { Segmented } from "@/components/ui/Chips"
import { InputField } from "@/components/ui/InputField"
import { Page } from "@/components/ui/Page"
import { PriceChange } from "@/components/ui/PriceChange"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { TopBar } from "@/components/ui/TopBar"
import { useCreatePriceAlert } from "@/hooks/use-alerts"
import { useDebounce } from "@/hooks/use-debounce"
import { useQuotes, useSymbolSearch } from "@/hooks/use-market"
import { useColors } from "@/lib/appearance"
import { useSession } from "@/lib/auth/session"
import { displaySymbol, fmtPrice, guessCurrency } from "@/lib/format"
import { haptics } from "@/lib/haptics"

const round2 = (n: number) => Math.round(n * 100) / 100

export default function CreateAlertScreen() {
  const params = useLocalSearchParams<{ symbol?: string; price?: string }>()
  const p = useColors()
  const { isPro } = useSession()
  const [symbol, setSymbol] = useState<string | null>(params.symbol ? params.symbol.toUpperCase() : null)
  const [query, setQuery] = useState("")
  const [direction, setDirection] = useState<"above" | "below">("above")
  const [target, setTarget] = useState("")
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<{ text: string; pro: boolean } | null>(null)
  const term = useDebounce(query.trim(), 300)
  const search = useSymbolSearch(symbol ? "" : term)
  const create = useCreatePriceAlert()

  // The live price of whichever stock is chosen (not the one the screen opened with).
  const quote = useQuotes(symbol ? [symbol] : [])
  const q = quote.data?.find((x) => x.symbol.toUpperCase() === symbol)
  const opened = params.price ? parseFloat(params.price) : null
  const current = q?.price ?? (symbol === params.symbol?.toUpperCase() && opened && opened > 0 ? opened : null)
  const currency = q?.currency ?? (symbol ? guessCurrency(symbol) : "INR")

  // Suggest a target 5% away in the chosen direction, until the user types their own.
  useEffect(() => {
    if (touched || current == null) return
    setTarget(String(round2(current * (direction === "above" ? 1.05 : 0.95))))
  }, [current, direction, touched])

  const price = parseFloat(target)
  const distance = current && price > 0 ? ((price - current) / current) * 100 : null
  const wrongSide = distance != null && ((direction === "above" && distance <= 0) || (direction === "below" && distance >= 0))

  const choose = (s: string) => {
    haptics.tick()
    setSymbol(s.toUpperCase())
    setTouched(false)
    setTarget("")
    setError(null)
  }

  const submit = () => {
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
      <TopBar title="New price alert" subtitle={isPro ? "Unlimited alerts with Pro" : "Free plan: 2 active alerts"} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-8">
          {symbol ? (
            <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                <Text className="text-[11px] font-bold text-foreground">{displaySymbol(symbol).slice(0, 4)}</Text>
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-base font-semibold text-foreground">{displaySymbol(symbol)}</Text>
                {current != null ? (
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-muted-foreground">Now {fmtPrice(current, currency)}</Text>
                    {q ? <PriceChange pct={q.changePercent} size="xs" /> : null}
                  </View>
                ) : quote.isPending ? (
                  <ActivityIndicator size="small" color={p.mutedForeground} style={{ alignSelf: "flex-start" }} />
                ) : (
                  <Text className="text-xs text-muted-foreground">{q?.name ?? "Price unavailable right now"}</Text>
                )}
              </View>
              <Tappable onPress={() => setSymbol(null)} hitSlop={8} accessibilityLabel="Choose another stock">
                <Text className="text-sm font-semibold text-accent">Change</Text>
              </Tappable>
            </View>
          ) : (
            <View className="gap-1">
              <InputField
                label="Stock"
                icon="search"
                value={query}
                onChangeText={setQuery}
                placeholder="Search a stock or crypto"
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
              />
              {(search.data ?? []).slice(0, 6).map((r) => (
                <Tappable key={r.symbol} onPress={() => choose(r.symbol)} className="flex-row items-center gap-3 border-b border-border py-3">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{r.base || r.symbol}</Text>
                    <Text numberOfLines={1} className="text-xs text-muted-foreground">
                      {r.name} · {r.exchange}
                    </Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={20} color={p.accent} />
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

          <View className="gap-2">
            <InputField
              label={`Target price (${currency === "USD" ? "$" : "₹"})`}
              value={target}
              onChangeText={(v) => {
                setTouched(true)
                setTarget(v.replace(/[^0-9.]/g, ""))
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            {distance != null ? (
              <Text className={`text-xs ${wrongSide ? "text-destructive" : "text-muted-foreground"}`}>
                {wrongSide
                  ? direction === "above"
                    ? "That's at or below today's price, so it would trigger at once."
                    : "That's at or above today's price, so it would trigger at once."
                  : `${Math.abs(distance).toFixed(2)}% ${distance > 0 ? "above" : "below"} the current price`}
              </Text>
            ) : null}
          </View>

          {error ? (
            <View className="gap-2 rounded-xl bg-bearish-bg p-3">
              <Text className="text-sm text-destructive">{error.text}</Text>
              {error.pro ? <Button title="See Pro" variant="secondary" size="sm" onPress={() => router.push("/pro")} /> : null}
            </View>
          ) : null}
          <Button title="Create alert" icon="alarm-outline" onPress={submit} loading={create.isPending} />
          <Text className="text-center text-xs leading-5 text-muted-foreground">
            {"Prices are checked every 5 minutes. Triggered alerts appear in Notifications (and by email if you turned that on in Profile)."}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  )
}
