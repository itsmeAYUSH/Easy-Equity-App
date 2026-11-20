import Ionicons from "@expo/vector-icons/Ionicons"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, TextInput, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { errorMessage } from "@/api/errors"
import { InfoState } from "@/components/ui/InfoState"
import { Tappable } from "@/components/ui/Tappable"
import { Page } from "@/components/ui/Page"
import { useDebounce } from "@/hooks/use-debounce"
import { useSymbolSearch } from "@/hooks/use-market"
import { useToggleWatchlist, useWatchlist } from "@/hooks/use-watchlist"
import { useSession } from "@/lib/auth/session"
import { useColors } from "@/lib/appearance"
import type { SymbolSearchResult } from "@/lib/types"

const POPULAR = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "^NSEI", "BTC-USD"]

/**
 * Symbol search. Keystrokes are debounced (300 ms) and results cached for 10
 * minutes per query, so typing never floods the API's rate limit.
 */
export default function SearchScreen() {
  const p = useColors()
  const [q, setQ] = useState("")
  const term = useDebounce(q.trim(), 300)
  const results = useSymbolSearch(term)
  const { userId } = useSession()
  const { find } = useWatchlist()
  const { toggle } = useToggleWatchlist()

  const open = (symbol: string) => router.push({ pathname: "/stock/[symbol]", params: { symbol } })

  return (
    <Page>
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-2">
        <View className="h-11 flex-1 flex-row items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Ionicons name="search" size={18} color={p.mutedForeground} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Search stocks, indices, crypto"
            placeholderTextColor={p.mutedForeground}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            className="flex-1 font-normal text-base text-foreground"
            style={{ paddingVertical: 0 }}
          />
          {results.isFetching ? <ActivityIndicator size="small" color={p.mutedForeground} /> : null}
          {q ? (
            <Tappable onPress={() => setQ("")} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={p.mutedForeground} />
            </Tappable>
          ) : null}
        </View>
        <Tappable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-sm font-semibold text-accent">Cancel</Text>
        </Tappable>
      </View>

      {term.length < 2 ? (
        <View className="px-4 pt-4">
          <Text className="pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Popular</Text>
          <View className="flex-row flex-wrap gap-2">
            {POPULAR.map((s) => (
              <Tappable key={s} onPress={() => open(s)} className="rounded-full border border-border bg-card px-3 py-1.5">
                <Text className="text-sm font-medium text-foreground">{s.replace(/\.NS$/, "").replace("^NSEI", "NIFTY 50")}</Text>
              </Tappable>
            ))}
          </View>
        </View>
      ) : (
        <FlashList
          data={results.data ?? []}
          keyExtractor={(r) => r.symbol}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }: { item: SymbolSearchResult }) => {
            const stored = find(item.symbol)
            const watched = !!stored
            return (
              <Tappable shrinkTo={0.98} onPress={() => open(item.symbol)} className="mx-4 flex-row items-center gap-3 border-b border-border py-3">
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-foreground">{item.base || item.symbol}</Text>
                  <Text numberOfLines={1} className="text-xs text-muted-foreground">
                    {item.name} · {item.exchange}
                  </Text>
                </View>
                <Tappable
                  hitSlop={10}
                  accessibilityLabel={watched ? `Remove ${item.symbol} from watchlist` : `Add ${item.symbol} to watchlist`}
                  onPress={() => (userId ? toggle(item.symbol, stored) : router.push("/sign-in"))}
                >
                  <Ionicons name={watched ? "star" : "star-outline"} size={20} color={watched ? p.accent : p.mutedForeground} />
                </Tappable>
              </Tappable>
            )
          }}
          ListEmptyComponent={
            results.isPending ? null : results.isError ? (
              <InfoState kind="error" icon="cloud-offline-outline" title="Search is unavailable" body={errorMessage(results.error)} />
            ) : (
              <InfoState icon="search-outline" title={`No results for "${term}"`} body="Try the company name or NSE symbol." />
            )
          }
        />
      )}
    </Page>
  )
}
