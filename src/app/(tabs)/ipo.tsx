import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { View } from "react-native"

import { errorMessage } from "@/api/errors"
import { IpoCard } from "@/components/ipo/IpoCard"
import { FilterChips, Segmented, type ChipOption } from "@/components/ui/Chips"
import { InfoState } from "@/components/ui/InfoState"
import { InputField } from "@/components/ui/InputField"
import { Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { ListShimmer } from "@/components/ui/Shimmer"
import { Text } from "@/components/ui/Text"
import { ThemedRefreshControl } from "@/components/ui/ThemedRefreshControl"
import { HeaderIcon, TabHeader } from "@/components/ui/TopBar"
import { useIpos } from "@/hooks/use-ipo"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { timeAgo } from "@/lib/format"
import { STATUS_ORDER, type Ipo, type IpoStatus } from "@/lib/ipo"

type Filter = "all" | IpoStatus | "sme" | "mainboard"
type Sort = "status" | "gmp" | "subscription"

/** Open and upcoming first (soonest date first), then the rest. */
function byStatusThenDate(a: Ipo, b: Ipo): number {
  const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  if (s) return s
  const key = (i: Ipo) => (i.status === "open" ? i.closeDate : i.status === "upcoming" ? i.openDate : i.listingDate ?? i.closeDate) ?? "9999"
  return a.status === "listed" || a.status === "closed" ? key(b).localeCompare(key(a)) : key(a).localeCompare(key(b))
}

export default function IpoScreen() {
  const ipos = useIpos()
  const [filter, setFilter] = useState<Filter>("all")
  const [sort, setSort] = useState<Sort>("status")
  const [q, setQ] = useState("")
  const { refreshing, onRefresh } = usePullToRefresh(ipos.refetch)

  const all = useMemo(() => ipos.data?.ipos ?? [], [ipos.data])
  const counts = useMemo(() => {
    const c = { open: 0, upcoming: 0 }
    for (const i of all) if (i.status === "open" || i.status === "upcoming") c[i.status]++
    return c
  }, [all])

  const filters: ChipOption<Filter>[] = [
    { value: "all", label: "All" },
    { value: "open", label: counts.open ? `Open · ${counts.open}` : "Open" },
    { value: "upcoming", label: counts.upcoming ? `Upcoming · ${counts.upcoming}` : "Upcoming" },
    { value: "closed", label: "Closed" },
    { value: "listed", label: "Listed" },
    { value: "mainboard", label: "Mainboard" },
    { value: "sme", label: "SME" },
  ]

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const filtered = all.filter((i) => {
      if (term && !i.displayName.toLowerCase().includes(term) && !i.name.toLowerCase().includes(term)) return false
      if (filter === "all") return true
      if (filter === "sme") return i.board === "SME"
      if (filter === "mainboard") return i.board === "Mainboard"
      return i.status === filter
    })
    const gain = (i: Ipo) => (i.status === "listed" ? i.listingGainPct : i.gmp?.percent) ?? -Infinity
    const sorters: Record<Sort, (a: Ipo, b: Ipo) => number> = {
      status: byStatusThenDate,
      gmp: (a, b) => gain(b) - gain(a),
      subscription: (a, b) => (b.subscriptionTimes ?? -1) - (a.subscriptionTimes ?? -1),
    }
    return [...filtered].sort(sorters[sort])
  }, [all, filter, sort, q])

  const renderItem = useCallback(
    ({ item }: { item: Ipo }) => (
      <View className="pb-3">
        <IpoCard ipo={item} />
      </View>
    ),
    [],
  )

  return (
    <Page>
      <TabHeader
        title="IPOs"
        subtitle={ipos.data?.updatedAt ? `GMP updated ${timeAgo(ipos.data.updatedAt)}` : "Indian IPOs with grey market premium"}
        right={<HeaderIcon icon="calendar-outline" label="Market calendar" onPress={() => router.push("/calendar")} />}
      />
      <FlashList
        data={list}
        renderItem={renderItem}
        keyExtractor={(i) => i.slug}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View className="gap-3 pb-4">
            <View className="px-5">
              <InputField icon="search" value={q} onChangeText={setQ} placeholder="Search IPOs" autoCorrect={false} returnKeyType="search" />
            </View>
            <FilterChips options={filters} value={filter} onChange={setFilter} />
            <View className="px-5">
              <Segmented<Sort>
                options={[
                  { value: "status", label: "By date" },
                  { value: "gmp", label: "Highest GMP" },
                  { value: "subscription", label: "Most subscribed" },
                ]}
                value={sort}
                onChange={setSort}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          ipos.isPending || ipos.data?.warming ? (
            <ListShimmer rows={5} />
          ) : ipos.isError ? (
            <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load IPOs" body={errorMessage(ipos.error)} buttonLabel="Try again" onButtonPress={() => ipos.refetch()} />
          ) : (
            <InfoState icon="rocket-outline" title="No IPOs here" body={q ? "Try another name." : "Try another filter."} />
          )
        }
        ListFooterComponent={
          list.length ? (
            <View className="gap-3 px-5 pt-3">
              <Notice text="GMP (grey market premium) is an unofficial, unregulated indicator from the grey market and can change quickly. It is not a guarantee of the listing price. Information only — not investment advice." />
              {ipos.data?.nextRefreshAt ? (
                <Text className="text-center text-[11px] text-muted-foreground">
                  Data via IPO Guru · next refresh{" "}
                  {new Date(ipos.data.nextRefreshAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST
                </Text>
              ) : null}
            </View>
          ) : null
        }
        refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </Page>
  )
}
