import Ionicons from "@expo/vector-icons/Ionicons"
import { Image } from "expo-image"
import { router } from "expo-router"
import { memo } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Tappable } from "@/components/ui/Tappable"
import { useColors } from "@/lib/appearance"
import { CATEGORY_LABEL, timeAgo } from "@/lib/format"
import { cleanNewsText, repeatsTitle } from "@/lib/text"
import type { Article, MarketImpact } from "@/lib/types"

const IMPACT: Record<MarketImpact, { label: string; box: string; text: string; dot: string }> = {
  bullish: { label: "Bullish", box: "bg-bullish-bg", text: "text-bullish", dot: "bg-bullish" },
  bearish: { label: "Bearish", box: "bg-bearish-bg", text: "text-bearish", dot: "bg-bearish" },
  neutral: { label: "Neutral", box: "bg-neutral-bg", text: "text-neutral", dot: "bg-neutral" },
}

export const ImpactBadge = memo(function ImpactBadge({ impact }: { impact: MarketImpact }) {
  const s = IMPACT[impact] ?? IMPACT.neutral
  return (
    <View className={`flex-row items-center gap-1.5 rounded-md px-2 py-1 ${s.box}`}>
      <View className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      <Text className={`text-[11px] font-semibold ${s.text}`}>{s.label}</Text>
    </View>
  )
})

export const CategoryTag = memo(function CategoryTag({ category }: { category: string }) {
  return (
    <View className="rounded-md bg-secondary px-2 py-1">
      <Text className="text-[11px] font-semibold text-foreground">{CATEGORY_LABEL[category] ?? category}</Text>
    </View>
  )
})

export type NewsCardVariant = "hero" | "carousel" | "row"

/**
 * A news story as a card. Three shapes:
 * - hero: the lead story, big image on top, title and summary below;
 * - carousel: fixed-width image card for the horizontal "Trending" strip;
 * - row: compact card, text on the left and a square thumbnail on the right.
 * Memoised and keyed by id, so FlashList recycles it cheaply; expo-image
 * caches on disk and in memory and decodes off the JS thread.
 */
export const NewsCard = memo(function NewsCard({ article, variant = "row" }: { article: Article; variant?: NewsCardVariant }) {
  const title = cleanNewsText(article.title)
  const open = () => router.push({ pathname: "/article/[id]", params: { id: article.id } })

  if (variant === "hero") {
    const summary = cleanNewsText(article.summary)
    return (
      <Tappable onPress={open} role="link" shrinkTo={0.98} className="mx-5 overflow-hidden rounded-3xl border border-border bg-card">
        <View>
          <Thumb article={article} style={{ width: "100%", aspectRatio: 16 / 9 }} />
          <View className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-accent-foreground">Top story</Text>
          </View>
        </View>
        <View className="gap-3 p-5">
          <Tags article={article} />
          <Text numberOfLines={3} className="text-xl font-bold leading-7 text-foreground">
            {title}
          </Text>
          {summary && !repeatsTitle(title, summary) ? (
            <Text numberOfLines={3} className="text-sm leading-[22px] text-muted-foreground">
              {summary}
            </Text>
          ) : null}
          <Byline article={article} />
        </View>
      </Tappable>
    )
  }

  if (variant === "carousel") {
    return (
      <Tappable onPress={open} role="link" shrinkTo={0.97} className="w-[264px] overflow-hidden rounded-2xl border border-border bg-card">
        <Thumb article={article} style={{ width: "100%", height: 148 }} />
        <View className="flex-1 gap-2.5 p-4">
          <Tags article={article} />
          <Text numberOfLines={3} className="text-[15px] font-semibold leading-[21px] text-foreground">
            {title}
          </Text>
          <View className="mt-auto pt-1">
            <Byline article={article} />
          </View>
        </View>
      </Tappable>
    )
  }

  return (
    <Tappable onPress={open} role="link" shrinkTo={0.98} className="mx-5 flex-row gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-1 gap-2">
        <Tags article={article} />
        <Text numberOfLines={3} className="text-[15px] font-semibold leading-[21px] text-foreground">
          {title}
        </Text>
        <View className="mt-auto pt-1">
          <Byline article={article} compact />
        </View>
      </View>
      {article.image_url ? <Thumb article={article} style={{ width: 92, height: 92, borderRadius: 14 }} /> : null}
    </Tappable>
  )
})

function Thumb({ article, style }: { article: Article; style: { width: number | `${number}%`; height?: number; aspectRatio?: number; borderRadius?: number } }) {
  const p = useColors()
  if (!article.image_url) {
    return (
      <View style={style} className="items-center justify-center bg-secondary">
        <Ionicons name="newspaper-outline" size={28} color={p.mutedForeground} />
      </View>
    )
  }
  return (
    <Image
      source={{ uri: article.image_url }}
      style={[{ backgroundColor: p.secondary }, style]}
      contentFit="cover"
      transition={150}
      cachePolicy="memory-disk"
      recyclingKey={article.id}
      accessibilityIgnoresInvertColors
    />
  )
}

function Tags({ article }: { article: Article }) {
  return (
    <View className="flex-row flex-wrap items-center gap-1.5">
      <CategoryTag category={article.category} />
      <ImpactBadge impact={article.impact} />
    </View>
  )
}

/** Source · age (· read time). One line that truncates at the end only. */
function Byline({ article, compact = false }: { article: Article; compact?: boolean }) {
  const p = useColors()
  return (
    <View className="flex-row items-center gap-1.5">
      <Ionicons name="time-outline" size={12} color={p.mutedForeground} />
      <Text numberOfLines={1} className="flex-1 text-xs text-muted-foreground">
        <Text className="text-xs font-semibold text-foreground">{article.source}</Text>
        {` · ${timeAgo(article.published_at)}`}
        {!compact && article.read_time ? ` · ${article.read_time} min read` : ""}
      </Text>
    </View>
  )
}
