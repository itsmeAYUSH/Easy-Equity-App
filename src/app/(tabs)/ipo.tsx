import { FlashList } from "@shopify/flash-list"
import { useCallback, useMemo, useState } from "react"
import { View } from "react-native"

import { errorMessage } from "@/api/errors"
import { IpoCard } from "@/components/ipo/IpoCard"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { FilterChips, type ChipOption } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { Notice } from "@/components/ui/Notice"
import { TabHeader } from "@/components/ui/TopBar"
import { Page } from "@/components/ui/Page"
import { ListShimmer } from "@/components/ui/Shimmer"
import { useIpos } from "@/hooks/use-ipo"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { timeAgo } from "@/lib/format"
import { STATUS_ORDER, type Ipo, type IpoStatus } from "@/lib/ipo"

type Filter = "all" | IpoStatus | "sme"

const FILTERS: ChipOption<Filter>[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "upcoming", label: "Upcoming" },
  { value: "closed", label: "Closed" },
  { value: "listed", label: "Listed" },
  { value: "sme", label: "SME" },
]

export default function IpoScreen() {
  const ipos = useIpos()
  const [filter, setFilter] = useState<Filter>("all")
  const { refreshing, onRefresh } = usePullToRefresh(ipos.refetch)

  const list = useMemo(() => {
    const all = ipos.data?.ipos ?? []
    const filtered =
      filter === "all" ? all : filter === "sme" ? all.filter((i) => i.board === "SME") : all.filter((i) => i.status === filter)
    return [...filtered].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  }, [ipos.data, filter])

  const renderItem = useCallback(({ item }: { item: Ipo }) => <IpoCard ipo={item} />, [])

  return (
    <Page>
      <TabHeader title="IPOs" subtitle={ipos.data?.updatedAt ? `GMP updated ${timeAgo(ipos.data.updatedAt)}` : "Indian IPOs with grey market premium"} />
      <FlashList
        data={list}
        renderItem={renderItem}
        keyExtractor={(i) => i.slug}
        ListHeaderComponent={<FilterChips options={FILTERS} value={filter} onChange={setFilter} />}
        ListEmptyComponent={
          ipos.isPending || ipos.data?.warming ? (
            <ListShimmer rows={5} />
          ) : ipos.isError ? (
            <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load IPOs" body={errorMessage(ipos.error)} buttonLabel="Try again" onButtonPress={() => ipos.refetch()} />
          ) : (
            <InfoState icon="rocket-outline" title="No IPOs here" body="Try another filter." />
          )
        }
        ListFooterComponent={
          list.length ? (
            <View className="px-4 pb-6 pt-2">
              <Notice text="GMP is an unofficial grey-market indicator and can change quickly. It is not a guarantee of listing price." />
            </View>
          ) : null
        }
        refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </Page>
  )
}
