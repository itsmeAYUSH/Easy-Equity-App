import Ionicons from "@expo/vector-icons/Ionicons"
import { FlashList } from "@shopify/flash-list"
import { router, useLocalSearchParams } from "expo-router"
import { useMemo, useState } from "react"
import { ActivityIndicator, TextInput, View } from "react-native"

import { errorMessage } from "@/api/errors"
import { NewsCard } from "@/components/news/NewsCard"
import { FilterChips, Segmented, type ChipOption } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { Page } from "@/components/ui/Page"
import { ListShimmer } from "@/components/ui/Shimmer"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { useArticles } from "@/hooks/use-articles"
import { useDebounce } from "@/hooks/use-debounce"
import { useSymbolSearch } from "@/hooks/use-market"
import { useToggleWatchlist, useWatchlist } from "@/hooks/use-watchlist"
import { useColors } from "@/lib/appearance"
import { useSession } from "@/lib/auth/session"
import type { MarketImpact, SymbolSearchResult } from "@/lib/types"

const POPULAR = [
  { symbol: "RELIANCE.NS", label: "Reliance" },
  { symbol: "TCS.NS", label: "TCS" },
  { symbol: "HDFCBANK.NS", label: "HDFC Bank" },
  { symbol: "INFY.NS", label: "Infosys" },
  { symbol: "ICICIBANK.NS", label: "ICICI Bank" },
  { symbol: "^NSEI", label: "NIFTY 50" },
  { symbol: "^BSESN", label: "SENSEX" },
  { symbol: "BTC-USD", label: "Bitcoin" },
]
const NEWS_TOPICS = ["RBI", "Sensex", "IPO", "Budget", "Crude oil", "Rupee", "Results"]

type Mode = "stocks" | "news"
type Impact = "all" | MarketImpact

const IMPACTS: ChipOption<Impact>[] = [
  { value: "all", label: "Any impact" },
  { value: "bullish", label: "Bullish" },
  { value: "bearish", label: "Bearish" },
  { value: "neutral", label: "Neutral" },
]

/**
 * Search stocks, indices and crypto, or the news. Keystrokes are debounced
 * (300 ms) and results cached, so typing never floods the API's rate limit.
 */
export default function SearchScreen() {
  const p = useColors()
  const params = useLocalSearchParams<{ mode?: string }>()
  const [mode, setMode] = useState<Mode>(params.mode === "news" ? "news" : "stocks")
  const [q, setQ] = useState("")
  const term = useDebounce(q.trim(), 300)
  const symbols = useSymbolSearch(mode === "stocks" ? term : "")
  const news = useArticles({ search: term, limit: 40 }, { enabled: mode === "news" && term.length >= 2 })
  const busy = mode === "stocks" ? symbols.isFetching : news.isFetching

  return (
    <Page>
      <View className="flex-row items-center gap-2 px-5 pb-2 pt-2">
        <View className="h-11 flex-1 flex-row items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Ionicons name="search" size={18} color={p.mutedForeground} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder={mode === "stocks" ? "Stocks, indices, crypto" : "Search the news"}
            placeholderTextColor={p.mutedForeground}
            autoCapitalize={mode === "stocks" ? "characters" : "none"}
            autoCorrect={false}
            returnKeyType="search"
            className="flex-1 text-base text-foreground"
            style={{ fontFamily: "Montserrat_400Regular", paddingVertical: 0 }}
          />
          {busy && term.length >= 2 ? <ActivityIndicator size="small" color={p.mutedForeground} /> : null}
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
      <View className="px-5 pb-2">
        <Segmented<Mode>
          options={[
            { value: "stocks", label: "Stocks & crypto" },
            { value: "news", label: "News" },
          ]}
          value={mode}
          onChange={setMode}
        />
      </View>

      {mode === "stocks" ? <StockResults term={term} query={symbols} onPick={setQ} /> : <NewsResults term={term} query={news} onPick={setQ} />}
    </Page>
  )
}

function Suggestions({ title, items, onPress }: { title: string; items: { key: string; label: string }[]; onPress: (key: string) => void }) {
  return (
    <View className="px-5 pt-4">
      <Text className="pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {items.map((s) => (
          <Tappable key={s.key} onPress={() => onPress(s.key)} className="rounded-full border border-border bg-card px-3.5 py-2">
            <Text className="text-sm font-medium text-foreground">{s.label}</Text>
          </Tappable>
        ))}
      </View>
    </View>
  )
}

function StockResults({ term, query, onPick }: { term: string; query: ReturnType<typeof useSymbolSearch>; onPick: (q: string) => void }) {
  const p = useColors()
  const { userId } = useSession()
  const { find } = useWatchlist()
  const { toggle } = useToggleWatchlist()
  const open = (symbol: string) => router.push({ pathname: "/stock/[symbol]", params: { symbol } })

  if (term.length < 2) {
    return (
      <>
        <Suggestions title="Popular" items={POPULAR.map((s) => ({ key: s.symbol, label: s.label }))} onPress={open} />
        <Suggestions title="Try" items={["Tata", "Adani", "Bank", "Pharma", "Ethereum"].map((s) => ({ key: s, label: s }))} onPress={onPick} />
      </>
    )
  }
  return (
    <FlashList
      data={query.data ?? []}
      keyExtractor={(r) => r.symbol}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      renderItem={({ item }: { item: SymbolSearchResult }) => {
        const stored = find(item.symbol)
        const watched = !!stored
        return (
          <Tappable shrinkTo={0.98} onPress={() => open(item.symbol)} className="mx-5 flex-row items-center gap-3 border-b border-border py-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <Text className="text-[10px] font-bold text-foreground">{(item.base || item.symbol).slice(0, 4)}</Text>
            </View>
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
        query.isPending ? null : query.isError ? (
          <InfoState kind="error" icon="cloud-offline-outline" title="Search is unavailable" body={errorMessage(query.error)} />
        ) : (
          <InfoState icon="search-outline" title={`No results for "${term}"`} body="Try the company name or NSE symbol." />
        )
      }
    />
  )
}

function NewsResults({ term, query, onPick }: { term: string; query: ReturnType<typeof useArticles>; onPick: (q: string) => void }) {
  const [impact, setImpact] = useState<Impact>("all")
  const list = useMemo(() => (query.data ?? []).filter((a) => impact === "all" || a.impact === impact), [query.data, impact])

  if (term.length < 2) {
    return <Suggestions title="Topics" items={NEWS_TOPICS.map((s) => ({ key: s, label: s }))} onPress={onPick} />
  }
  return (
    <FlashList
      data={list}
      keyExtractor={(a) => a.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      renderItem={({ item }) => (
        <View className="pb-3">
          <NewsCard article={item} />
        </View>
      )}
      ListHeaderComponent={
        <View className="pb-3 pt-1">
          <FilterChips options={IMPACTS} value={impact} onChange={setImpact} />
          {query.data?.length ? (
            <Text className="px-5 pt-3 text-xs text-muted-foreground">
              {list.length} {list.length === 1 ? "story" : "stories"} for &ldquo;{term}&rdquo;
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        query.isPending ? (
          <ListShimmer rows={3} withImage={false} />
        ) : query.isError ? (
          <InfoState kind="error" icon="cloud-offline-outline" title="News search is unavailable" body={errorMessage(query.error)} />
        ) : (
          <InfoState icon="newspaper-outline" title={`No stories for "${term}"`} body={impact === "all" ? "Try another word." : "Try another impact filter."} />
        )
      }
      contentContainerStyle={{ paddingBottom: 32 }}
    />
  )
}
