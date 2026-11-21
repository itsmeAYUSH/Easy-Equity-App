import Ionicons from "@expo/vector-icons/Ionicons"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { FlatList, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { useSession } from "@/lib/auth/session"
import { MarketStatusPill } from "@/components/market/MarketStatusPill"
import { TickerStrip } from "@/components/market/TickerStrip"
import { NewsCard } from "@/components/news/NewsCard"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { FilterChips, type ChipOption } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { HeaderIcon, SectionHeading, TabHeader } from "@/components/ui/TopBar"
import { Page } from "@/components/ui/Page"
import { Pill, sentimentPill } from "@/components/ui/Pill"
import { Tappable } from "@/components/ui/Tappable"
import { useDailyDigest } from "@/hooks/use-ai"
import { useColors } from "@/lib/appearance"
import { ListShimmer } from "@/components/ui/Shimmer"
import { useNotifications } from "@/hooks/use-alerts"
import { useArticles } from "@/hooks/use-articles"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useTickers } from "@/hooks/use-market"
import { errorMessage } from "@/api/errors"
import { buildNewsFeed, type FeedItem } from "@/lib/news-feed"
import type { Article } from "@/lib/types"

type Category = "all" | "indian-market" | "market-moving" | "global" | "economy" | "crypto"

const CATEGORIES: ChipOption<Category>[] = [
  { value: "all", label: "Top stories" },
  { value: "indian-market", label: "Indian Markets" },
  { value: "market-moving", label: "Market Moving" },
  { value: "global", label: "Global" },
  { value: "economy", label: "Economy" },
  { value: "crypto", label: "Crypto" },
]

export default function NewsScreen() {
  const [category, setCategory] = useState<Category>("all")
  const articles = useArticles(category === "all" ? {} : { category })
  const tickers = useTickers()
  const { userId } = useSession()
  const { unread } = useNotifications()
  const { refreshing, onRefresh } = usePullToRefresh(articles.refetch, tickers.refetch)

  const feed = useMemo(() => buildNewsFeed(articles.data ?? []), [articles.data])

  const renderItem = useCallback(({ item }: { item: FeedItem }) => {
    switch (item.type) {
      case "hero":
        return (
          <View className="pb-2 pt-3">
            <NewsCard article={item.article} variant="hero" />
          </View>
        )
      case "heading":
        return <SectionHeading title={item.title} subtitle={item.subtitle} />
      case "carousel":
        return <TrendingStrip articles={item.articles} />
      case "row":
        return (
          <View className="pb-3">
            <NewsCard article={item.article} />
          </View>
        )
    }
  }, [])

  return (
    <Page>
      <TabHeader
        title={
          <>
            Easy<Text className="text-accent">Equity</Text>
          </>
        }
        subtitle={<MarketStatusPill />}
        right={
          <>
            <HeaderIcon icon="search" label="Search stocks" onPress={() => router.push("/search")} />
            <HeaderIcon
              icon="notifications-outline"
              label="Notifications"
              badge={userId ? unread : 0}
              onPress={() => router.push(userId ? "/notifications" : "/sign-in")}
            />
          </>
        }
      />

      <FlashList
        data={feed}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        getItemType={(item) => item.type}
        ListHeaderComponent={
          <View className="gap-4 pb-2">
            <TickerStrip />
            <FilterChips options={CATEGORIES} value={category} onChange={setCategory} />
            {category === "all" ? <DigestTeaser /> : null}
          </View>
        }
        ListEmptyComponent={
          articles.isPending ? (
            <ListShimmer rows={4} withImage />
          ) : articles.isError ? (
            <InfoState
              kind="error"
              icon="cloud-offline-outline"
              title="Couldn't load the news"
              body={errorMessage(articles.error)}
              buttonLabel="Try again"
              onButtonPress={() => articles.refetch()}
            />
          ) : (
            <InfoState icon="newspaper-outline" title="No stories yet" body="New articles arrive every 30 minutes." />
          )
        }
        refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </Page>
  )
}

/** The AI daily digest in one card: overall mood and the first lines of the summary. */
function DigestTeaser() {
  const p = useColors()
  const digest = useDailyDigest()
  const d = digest.data
  if (!d || digest.warming || !d.executiveSummary) return null
  const t = sentimentPill(d.overallSentiment)
  return (
    <Tappable
      shrinkTo={0.98}
      onPress={() => router.push("/digest")}
      accessibilityLabel="Open the daily digest"
      className="mx-5 gap-2.5 rounded-2xl border border-accent/30 bg-accent/10 p-4"
    >
      <View className="flex-row items-center gap-2">
        <Ionicons name="sparkles" size={16} color={p.accent} />
        <Text className="flex-1 text-sm font-bold text-foreground">Today&apos;s AI digest</Text>
        {d.overallSentiment ? <Pill label={d.overallSentiment} tone={t.tone} icon={t.icon} size="xs" /> : null}
      </View>
      <Text numberOfLines={3} className="text-[13px] leading-5 text-foreground">
        {d.executiveSummary}
      </Text>
      <Text className="text-xs font-semibold text-accent">Read the digest →</Text>
    </Tappable>
  )
}

/** Horizontal strip of image cards for the "Trending now" section. */
function TrendingStrip({ articles }: { articles: Article[] }) {
  return (
    <FlatList
      horizontal
      data={articles}
      keyExtractor={(a) => a.id}
      renderItem={({ item }) => <NewsCard article={item} variant="carousel" />}
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-3 px-5"
      // Snap card by card: 264 wide + 12 gap.
      snapToInterval={276}
      decelerationRate="fast"
      initialNumToRender={3}
    />
  )
}
