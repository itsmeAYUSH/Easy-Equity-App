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
