import Ionicons from "@expo/vector-icons/Ionicons"
import { router } from "expo-router"
import { ScrollView, View } from "react-native"

import { errorMessage } from "@/api/errors"
import { AiWarming } from "@/components/ai/AiWarming"
import { Button } from "@/components/ui/Button"
import { InfoState } from "@/components/ui/InfoState"
import { Card, Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { Pill, sentimentPill } from "@/components/ui/Pill"
import { Shimmer } from "@/components/ui/Shimmer"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { SectionHeading, TopBar } from "@/components/ui/TopBar"
import { useDailyDigest } from "@/hooks/use-ai"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useColors } from "@/lib/appearance"
import { useSession } from "@/lib/auth/session"
import type { DailyDigest } from "@/lib/types"

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  "indian-market": "flag-outline",
  global: "globe-outline",
  crypto: "logo-bitcoin",
  economy: "stats-chart-outline",
  "market-moving": "flash-outline",
}

/** The AI daily digest — the same report as the website's /digest. */
export default function DigestScreen() {
  const p = useColors()
  const { userId } = useSession()
  const digest = useDailyDigest()
  const { refreshing, onRefresh } = usePullToRefresh(digest.refetch)
  const d = digest.data

  return (
    <Page>
      <TopBar title="Daily digest" subtitle="AI summary of today's market news" />
      <ScrollView refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerClassName="gap-3 px-5 pb-12">
        {digest.isPending ? (
          <>
            <Shimmer height={150} radius={20} />
            <Shimmer height={180} radius={16} />
            <Shimmer height={180} radius={16} />
          </>
        ) : digest.isError ? (
          <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load the digest" body={errorMessage(digest.error)} buttonLabel="Try again" onButtonPress={() => digest.refetch()} />
        ) : !d ? null : !userId && d.loginHint && !d.sections?.length ? (
          <View className="items-center gap-3 py-12">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Ionicons name="newspaper" size={26} color={p.primaryForeground} />
            </View>
            <Text className="text-center text-lg font-bold text-foreground">EasyEquity daily digest</Text>
            <Text className="max-w-xs text-center text-sm text-muted-foreground">{d.loginHint}</Text>
            <Button title="Sign in" onPress={() => router.push("/sign-in")} className="mt-2 min-w-[180px]" />
          </View>
        ) : (
          <>
            {digest.warming ? <AiWarming message={d.message} onRetry={() => digest.refetch()} retrying={digest.isFetching} /> : <Summary d={d} />}
            {!digest.warming && d.sections?.length ? <SectionHeading title="By market" /> : null}
            {(digest.warming ? [] : (d.sections ?? [])).map((s, i) => {
              const t = sentimentPill(s.sentiment)
              return (
                <Card key={`${s.title}-${i}`} className="gap-3">
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                      <Ionicons name={CATEGORY_ICON[s.category] ?? "newspaper-outline"} size={17} color={p.foreground} />
                    </View>
                    <Text className="flex-1 text-base font-bold text-foreground">{s.title}</Text>
                    <Pill label={s.sentiment} tone={t.tone} icon={t.icon} size="xs" />
                  </View>
                  <Text className="text-[13px] leading-5 text-muted-foreground">{s.summary}</Text>
                  {s.impactLevel ? <Pill label={`${s.impactLevel} impact`} tone={s.impactLevel === "High" ? "bearish" : s.impactLevel === "Medium" ? "accent" : "plain"} size="xs" /> : null}
                  {s.highlights?.length ? (
                    <View className="gap-1.5">
                      {s.highlights.map((h, j) => (
                        <View key={j} className="flex-row gap-2">
                          <Text className="text-xs text-accent">▸</Text>
                          <Text className="flex-1 text-xs leading-[18px] text-foreground">{h}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {s.watchlist?.length ? (
                    <View className="flex-row flex-wrap items-center gap-1.5 border-t border-border/70 pt-3">
                      <Text className="text-[11px] text-muted-foreground">Worth watching:</Text>
                      {s.watchlist.map((w, j) => (
                        <Pill key={j} label={w} tone="accent" size="xs" />
                      ))}
                    </View>
                  ) : null}
                </Card>
              )
            })}
            {!digest.warming && d.keyTakeaways?.length ? (
              <>
                <SectionHeading title="Key takeaways" />
                <Card className="gap-3">
                  {d.keyTakeaways.map((t, i) => (
                    <View key={i} className="flex-row gap-3">
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-accent/15">
                        <Text className="text-[11px] font-bold text-accent">{i + 1}</Text>
                      </View>
                      <Text className="flex-1 text-[13px] leading-5 text-foreground">{t}</Text>
                    </View>
                  ))}
                </Card>
              </>
            ) : null}
            <Tappable onPress={() => router.push("/sectors")} className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <Ionicons name="grid-outline" size={20} color={p.accent} />
              <Text className="flex-1 text-sm font-semibold text-foreground">Sector outlook</Text>
              <Ionicons name="chevron-forward" size={16} color={p.mutedForeground} />
            </Tappable>
            <Notice text={d.disclaimer} />
          </>
        )}
      </ScrollView>
    </Page>
  )
}

function Summary({ d }: { d: DailyDigest }) {
  const p = useColors()
  const t = sentimentPill(d.overallSentiment)
  return (
    <View className="gap-3 rounded-3xl bg-primary p-5">
      <View className="flex-row items-center gap-2">
        <Ionicons name="sparkles" size={18} color={p.accent} />
        <Text className="flex-1 text-base font-bold text-primary-foreground">Executive summary</Text>
        {d.overallSentiment ? (
          <Pill label={`${d.overallSentiment}${d.sentimentScore != null ? ` · ${d.sentimentScore}%` : ""}`} tone={t.tone} icon={t.icon} size="xs" />
        ) : null}
      </View>
      {d.executiveSummary ? <Text className="text-sm leading-[22px] text-primary-foreground/90">{d.executiveSummary}</Text> : null}
      <View className="opacity-80">
        <AiMetaOnDark generatedAt={d.generatedAt} articles={d.articlesAnalyzed} />
      </View>
    </View>
  )
}

function AiMetaOnDark({ generatedAt, articles }: { generatedAt?: string; articles?: number }) {
  const when = generatedAt
    ? new Date(generatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })
    : null
  if (!when && !articles) return null
  return (
    <Text className="text-[11px] text-primary-foreground/70">
      {[articles ? `Based on ${articles} articles` : null, when ? `${when} IST` : null].filter(Boolean).join(" · ")}
    </Text>
  )
}
