import Ionicons from "@expo/vector-icons/Ionicons"
import { router, useLocalSearchParams } from "expo-router"
import { useMemo, useState, type ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"

import { SymbolPicker } from "@/components/market/SymbolPicker"
import { Button } from "@/components/ui/Button"
import { InfoState } from "@/components/ui/InfoState"
import { InputField } from "@/components/ui/InputField"
import { Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { Pill, sentimentPill } from "@/components/ui/Pill"
import { PriceChange } from "@/components/ui/PriceChange"
import { Shimmer } from "@/components/ui/Shimmer"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { SectionHeading, TopBar } from "@/components/ui/TopBar"
import { useQuotes } from "@/hooks/use-market"
import { useSavedCompares } from "@/hooks/use-saved-compares"
import { useColors } from "@/lib/appearance"
import { displaySymbol, fmtMarketCap, fmtPrice, toYahooSymbol } from "@/lib/format"
import { haptics } from "@/lib/haptics"
import type { Quote } from "@/lib/types"

const MAX = 4

/** The website's momentum heuristic: day move plus where the price sits in its 52-week range. */
function signalFor(q?: Quote): string {
  if (!q) return "—"
  const pos = q.high52 && q.low52 && q.high52 > q.low52 ? (q.price - q.low52) / (q.high52 - q.low52) : 0.5
  if (q.changePercent > 0.5 && pos > 0.5) return "Bullish"
  if (q.changePercent < -0.5 && pos < 0.5) return "Bearish"
  return "Neutral"
}

/** Compare up to four stocks side by side: price, valuation and momentum. */
export default function CompareScreen() {
  const params = useLocalSearchParams<{ symbols?: string }>()
  const p = useColors()
  const [symbols, setSymbols] = useState<string[]>(() =>
    [...new Set((params.symbols ?? "").split(",").map((s) => s.trim()).filter(Boolean).map(toYahooSymbol))].slice(0, MAX),
  )
  const [saveName, setSaveName] = useState("")
  const saved = useSavedCompares()
  const quotes = useQuotes(symbols)
  const qmap = useMemo(() => new Map((quotes.data ?? []).map((q) => [q.symbol.toUpperCase(), q])), [quotes.data])
  const get = (s: string) => qmap.get(s.toUpperCase())

  const add = (raw: string) => {
    const s = toYahooSymbol(raw)
    haptics.tick()
    setSymbols((prev) => (prev.includes(s) || prev.length >= MAX ? prev : [...prev, s]))
  }
  const remove = (s: string) => setSymbols((prev) => prev.filter((x) => x !== s))

  const bestPe = useMemo(() => {
    const pes = symbols.map((s) => qmap.get(s.toUpperCase())?.peRatio).filter((v): v is number => typeof v === "number" && v > 0)
    return pes.length ? Math.min(...pes) : null
  }, [symbols, qmap])

  const rows: { label: string; render: (s: string) => ReactNode }[] = [
    { label: "Price", render: (s) => <Value>{fmtPrice(get(s)?.price, get(s)?.currency)}</Value> },
    { label: "Day change", render: (s) => (get(s) ? <PriceChange pct={get(s)!.changePercent} size="xs" /> : <Value>—</Value>) },
    {
      label: "P/E ratio",
      render: (s) => {
        const pe = get(s)?.peRatio
        const best = pe != null && pe === bestPe && symbols.length > 1
        return <Value className={best ? "text-bullish" : ""}>{pe != null ? `${pe.toFixed(1)}${best ? " ★" : ""}` : "—"}</Value>
      },
    },
    { label: "EPS (TTM)", render: (s) => <Value>{get(s)?.eps != null ? get(s)!.eps!.toFixed(2) : "—"}</Value> },
    { label: "Market cap", render: (s) => <Value>{fmtMarketCap(get(s)?.marketCap)}</Value> },
    { label: "52W high", render: (s) => <Value muted>{fmtPrice(get(s)?.high52, get(s)?.currency)}</Value> },
    { label: "52W low", render: (s) => <Value muted>{fmtPrice(get(s)?.low52, get(s)?.currency)}</Value> },
    {
      label: "52W position",
      render: (s) => {
        const q = get(s)
        if (!q?.high52 || !q.low52 || !(q.high52 > q.low52)) return <Value muted>—</Value>
        const pos = Math.max(0, Math.min(1, (q.price - q.low52) / (q.high52 - q.low52)))
        return (
          <View className="w-full gap-1">
            <View className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <View className="h-full rounded-full bg-accent" style={{ width: `${pos * 100}%` }} />
            </View>
            <Text className="text-[10px] text-muted-foreground">{Math.round(pos * 100)}%</Text>
          </View>
        )
      },
    },
    {
      label: "Signal",
      render: (s) => {
        const sig = signalFor(get(s))
        if (sig === "—") return <Value muted>—</Value>
        const t = sentimentPill(sig)
        return <Pill label={sig} tone={t.tone} icon={t.icon} size="xs" />
      },
    },
  ]

  return (
    <Page>
      <TopBar title="Compare stocks" subtitle={`Up to ${MAX} side by side`} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-12">
          {saved.items.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5 pb-3" keyboardShouldPersistTaps="handled">
              {saved.items.map((s) => (
                <View key={s.name} className="flex-row items-center gap-1 rounded-full border border-border bg-card pl-3 pr-1.5">
                  <Tappable onPress={() => setSymbols(s.symbols.slice(0, MAX))} className="flex-row items-center gap-1.5 py-2">
                    <Ionicons name="bookmark" size={12} color={p.accent} />
                    <Text className="text-xs font-semibold text-foreground">{s.name}</Text>
                  </Tappable>
                  <Tappable onPress={() => saved.remove(s.name)} hitSlop={8} accessibilityLabel={`Delete ${s.name}`} className="p-1">
                    <Ionicons name="close" size={14} color={p.mutedForeground} />
                  </Tappable>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {/* The chosen stocks */}
          <View className="flex-row flex-wrap gap-2 px-5">
            {symbols.map((s) => {
              const q = get(s)
              return (
                <View key={s} className="min-w-[46%] flex-1 gap-1 rounded-2xl border border-border bg-card p-3.5">
                  <View className="flex-row items-start justify-between gap-2">
                    <Tappable onPress={() => router.push({ pathname: "/stock/[symbol]", params: { symbol: s } })} className="flex-1">
                      <Text numberOfLines={1} className="text-base font-bold text-foreground">
                        {displaySymbol(s)}
                      </Text>
                      <Text numberOfLines={1} className="text-[11px] text-muted-foreground">
                        {q?.name ?? " "}
                      </Text>
                    </Tappable>
                    <Tappable onPress={() => remove(s)} hitSlop={10} accessibilityLabel={`Remove ${displaySymbol(s)}`}>
                      <Ionicons name="close-circle" size={20} color={p.mutedForeground} />
                    </Tappable>
                  </View>
                  {q ? (
                    <View className="flex-row items-center justify-between pt-1">
                      <Text className="text-[15px] font-semibold text-foreground">{fmtPrice(q.price, q.currency)}</Text>
                      <PriceChange pct={q.changePercent} size="xs" variant="pill" />
                    </View>
                  ) : (
                    <Shimmer height={18} width="70%" />
                  )}
                </View>
              )
            })}
          </View>

          {symbols.length < MAX ? (
            <View className="px-5 pt-4">
              <SymbolPicker onPick={add} exclude={symbols} placeholder={symbols.length ? "Add another stock" : "Search a stock to compare"} />
            </View>
          ) : null}

          {symbols.length >= 1 ? (
            <>
              <SectionHeading title="Side by side" subtitle={symbols.length === 1 ? "Add one more stock to compare" : "P/E ★ marks the lowest in the set"} />
              <View className="mx-5 overflow-hidden rounded-2xl border border-border bg-card">
                <View className="flex-row border-b border-border px-3 py-2.5">
                  {symbols.map((s) => (
                    <Text key={s} numberOfLines={1} className="flex-1 px-1 text-center text-xs font-bold text-foreground">
                      {displaySymbol(s)}
                    </Text>
                  ))}
                </View>
                {rows.map((row, i) => (
                  <View key={row.label} className={`gap-1.5 px-3 py-2.5 ${i < rows.length - 1 ? "border-b border-border/70" : ""}`}>
                    <Text className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{row.label}</Text>
                    <View className="flex-row items-center">
                      {symbols.map((s) => (
                        <View key={s} className="flex-1 items-center px-1">
                          {row.render(s)}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              <View className="flex-row items-end gap-2 px-5 pt-5">
                <View className="flex-1">
                  <InputField label="Save this set" value={saveName} onChangeText={setSaveName} placeholder="e.g. IT majors" returnKeyType="done" />
                </View>
                <Button
                  title="Save"
                  icon="bookmark-outline"
                  variant="secondary"
                  disabled={!saveName.trim()}
                  onPress={() => {
                    saved.save(saveName, symbols)
                    setSaveName("")
                    haptics.success()
                  }}
                />
              </View>
            </>
          ) : (
            <InfoState icon="git-compare-outline" title="Pick two stocks to start" body="Search above, or open a stock and tap Compare." small />
          )}

          <View className="px-5 pt-6">
            <Notice text="Signal is a simple momentum heuristic (today's move and the 52-week position), not advice. Data via Yahoo Finance; prices may be delayed." />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  )
}

function Value({ children, muted = false, className = "" }: { children: ReactNode; muted?: boolean; className?: string }) {
  return (
    <Text numberOfLines={1} adjustsFontSizeToFit className={`text-center text-[13px] font-semibold ${muted ? "text-muted-foreground" : "text-foreground"} ${className}`}>
      {children}
    </Text>
  )
}
