import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { useCallback, useState } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { useSession } from "@/lib/auth/session"
import { MarketStatusPill } from "@/components/market/MarketStatusPill"
import { TickerStrip } from "@/components/market/TickerStrip"
import { NewsCard } from "@/components/news/NewsCard"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { FilterChips, type ChipOption } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { HeaderIcon } from "@/components/ui/TopBar"
import { Page } from "@/components/ui/Page"
import { ListShimmer } from "@/components/ui/Shimmer"
import { useNotifications } from "@/hooks/use-alerts"
import { useArticles } from "@/hooks/use-articles"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { useTickers } from "@/hooks/use-market"
import { errorMessage } from "@/api/errors"
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

  const renderItem = useCallback(
    ({ item, index }: { item: Article; index: number }) => <NewsCard article={item} featured={index === 0 && !!item.image_url} />,
    [],
  )

  return (
    <Page>
      <View className="flex-row items-center justify-between px-4 pb-1 pt-2">
        <View>
          <Text className="text-2xl font-bold text-foreground">
            Easy<Text className="text-accent">Equity</Text>
          </Text>
          <View className="mt-1 self-start">
            <MarketStatusPill />
          </View>
        </View>
        <View className="flex-row">
          <HeaderIcon icon="search" label="Search stocks" onPress={() => router.push("/search")} />
          <HeaderIcon
            icon="notifications-outline"
            label="Notifications"
            badge={userId ? unread : 0}
            onPress={() => router.push(userId ? "/notifications" : "/sign-in")}
          />
        </View>
      </View>

      <FlashList
        data={articles.data ?? []}
        renderItem={renderItem}
        keyExtractor={(a) => a.id}
        getItemType={(item, index) => (index === 0 && item.image_url ? "featured" : "row")}
        ListHeaderComponent={
          <View>
            <TickerStrip />
            <FilterChips options={CATEGORIES} value={category} onChange={setCategory} />
          </View>
        }
        ListEmptyComponent={
          articles.isPending ? (
            <ListShimmer withImage />
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
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </Page>
  )
}
