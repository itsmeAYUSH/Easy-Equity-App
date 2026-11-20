import { Image } from "expo-image"
import { router } from "expo-router"
import { memo } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Tappable } from "@/components/ui/Tappable"
import { CATEGORY_LABEL, timeAgo } from "@/lib/format"
import { cleanNewsText, repeatsTitle } from "@/lib/text"
import type { Article, MarketImpact } from "@/lib/types"

const IMPACT: Record<MarketImpact, { label: string; box: string; text: string }> = {
  bullish: { label: "Bullish", box: "bg-bullish-bg", text: "text-bullish" },
  bearish: { label: "Bearish", box: "bg-bearish-bg", text: "text-bearish" },
  neutral: { label: "Neutral", box: "bg-neutral-bg", text: "text-neutral" },
}

export const ImpactBadge = memo(function ImpactBadge({ impact }: { impact: MarketImpact }) {
  const s = IMPACT[impact] ?? IMPACT.neutral
  return (
    <View className={`rounded-md px-2 py-0.5 ${s.box}`}>
      <Text className={`text-[11px] font-semibold ${s.text}`}>{s.label}</Text>
    </View>
  )
})

/**
 * A news row. Memoised and keyed by id, so FlashList recycles it cheaply.
 * expo-image caches on disk and memory and decodes off the JS thread.
 */
export const NewsCard = memo(function NewsCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  const title = cleanNewsText(article.title)
  const summary = cleanNewsText(article.summary)
  const showSummary = featured && summary && !repeatsTitle(title, summary)
  const open = () => router.push({ pathname: "/article/[id]", params: { id: article.id } })

  if (featured) {
    return (
      <Tappable onPress={open} role="link" className="mx-4 mb-4 overflow-hidden rounded-2xl border border-border bg-card">
        {article.image_url ? (
          <Image
            source={{ uri: article.image_url }}
            style={{ width: "100%", aspectRatio: 16 / 9 }}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            recyclingKey={article.id}
            accessibilityIgnoresInvertColors
          />
        ) : null}
        <View className="gap-2 p-4">
          <Meta article={article} />
          <Text className="text-lg font-bold leading-6 text-foreground">{title}</Text>
          {showSummary ? (
            <Text numberOfLines={3} className="text-sm leading-5 text-muted-foreground">
              {summary}
            </Text>
          ) : null}
        </View>
      </Tappable>
    )
  }

  return (
    <Tappable onPress={open} role="link" shrinkTo={0.98} className="mx-4 flex-row gap-3 border-b border-border py-3">
      <View className="flex-1 gap-1.5">
        <Meta article={article} />
        <Text numberOfLines={3} className="text-[15px] font-semibold leading-5 text-foreground">
          {title}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {article.source} · {timeAgo(article.published_at)}
        </Text>
      </View>
      {article.image_url ? (
        <Image
          source={{ uri: article.image_url }}
          style={{ width: 84, height: 84, borderRadius: 12 }}
          contentFit="cover"
          transition={120}
          cachePolicy="memory-disk"
          recyclingKey={article.id}
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </Tappable>
  )
})

function Meta({ article }: { article: Article }) {
  return (
    <View className="flex-row items-center gap-2">
      <ImpactBadge impact={article.impact} />
      <Text className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {CATEGORY_LABEL[article.category] ?? article.category}
      </Text>
    </View>
  )
}
