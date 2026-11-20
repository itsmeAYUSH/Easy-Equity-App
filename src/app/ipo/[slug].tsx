import Ionicons from "@expo/vector-icons/Ionicons"
import { Image } from "expo-image"
import { router, useLocalSearchParams } from "expo-router"
import { ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { errorMessage } from "@/api/errors"
import { Button } from "@/components/ui/Button"
import { InfoState } from "@/components/ui/InfoState"
import { Card, Notice, Metric } from "@/components/ui/Notice"
import { TopBar, SectionHeading } from "@/components/ui/TopBar"
import { Page } from "@/components/ui/Page"
import { ListShimmer, Shimmer } from "@/components/ui/Shimmer"
import { useIpo, useIpoReminders } from "@/hooks/use-ipo"
import { useSession } from "@/lib/auth/session"
import { fmtINR, fmtPct } from "@/lib/format"
import { fmtIpoDate, priceLabel, stageLabel, STATUS_LABEL } from "@/lib/ipo"
import { useColors } from "@/lib/appearance"

const times = (n: number | null | undefined) => (n == null ? "—" : `${n.toFixed(2)}x`)

export default function IpoDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const query = useIpo(slug)
  const { userId } = useSession()
  const reminders = useIpoReminders()
  const p = useColors()

  const ipo = query.data?.ipo
  const detail = query.data?.detail
  const reminding = reminders.slugs.has(slug)
  const canRemind = ipo && (ipo.status === "upcoming" || ipo.status === "open" || ipo.status === "closed")

  return (
    <Page>
      <TopBar title={ipo?.displayName ?? "IPO"} subtitle={ipo ? `${ipo.board} · ${STATUS_LABEL[ipo.status]}` : null} />
      {!ipo ? (
        query.isError ? (
          <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load this IPO" body={errorMessage(query.error)} buttonLabel="Try again" onButtonPress={() => query.refetch()} />
        ) : (
          <ListShimmer rows={4} />
        )
      ) : (
        <ScrollView contentContainerClassName="pb-12">
          <View className="flex-row items-center gap-3 px-4 pt-2">
            {ipo.logo ? (
              <Image source={{ uri: ipo.logo }} style={{ width: 52, height: 52, borderRadius: 12 }} contentFit="contain" />
            ) : null}
            <View className="flex-1">
              <Text className="text-xl font-bold text-foreground">{ipo.displayName}</Text>
              <Text className="text-sm text-muted-foreground">{stageLabel(ipo)}</Text>
            </View>
          </View>

          {ipo.gmp ? (
            <Card className="mx-4 mt-4 gap-2">
              <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Grey market premium</Text>
              <View className="flex-row items-end gap-3">
                <Text className="text-3xl font-bold text-foreground">{ipo.gmp.price != null ? fmtINR(ipo.gmp.price) : "—"}</Text>
                <Text className={`pb-1 text-base font-semibold ${(ipo.gmp.percent ?? 0) >= 0 ? "text-bullish" : "text-bearish"}`}>
                  {fmtPct(ipo.gmp.percent)}
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground">
                Est. listing {ipo.gmp.estListingPrice != null ? fmtINR(ipo.gmp.estListingPrice) : "—"}
                {ipo.gmp.updatedLabel ? ` · ${ipo.gmp.updatedLabel}` : ""}
              </Text>
            </Card>
          ) : null}

          {canRemind ? (
            <View className="px-4 pt-4">
              <Button
                title={reminding ? "Reminder on" : "Remind me on key dates"}
                icon={reminding ? "notifications" : "notifications-outline"}
                variant={reminding ? "secondary" : "primary"}
                onPress={() => (userId ? reminders.toggle.mutate({ slug, on: !reminding }) : router.push("/sign-in"))}
              />
            </View>
          ) : null}

          <SectionHeading title="Issue details" />
          <Card className="mx-4">
            <View className="flex-row flex-wrap gap-y-4">
              <Metric label="Price band" value={priceLabel(ipo)} />
              <Metric label="Lot size" value={ipo.lotSize != null ? `${ipo.lotSize} shares` : "—"} />
              <Metric label="Min. investment" value={ipo.minInvestment != null ? fmtINR(ipo.minInvestment, 0) : "—"} />
              <Metric label="Issue size" value={ipo.issueSizeCr != null ? `₹${ipo.issueSizeCr.toLocaleString("en-IN")} Cr` : "—"} />
              {detail?.issue.saleType ? <Metric label="Sale type" value={detail.issue.saleType} /> : null}
              {detail?.issue.listingOn ? <Metric label="Listing on" value={detail.issue.listingOn} /> : null}
            </View>
          </Card>

          <SectionHeading title="Timeline" />
          <Card className="mx-4 gap-3">
            {[
              ["Opens", detail?.timeline.openDate ?? ipo.openDate],
              ["Closes", detail?.timeline.closeDate ?? ipo.closeDate],
              ["Allotment", detail?.timeline.allotmentDate ?? ipo.allotmentDate],
              ["Refunds", detail?.timeline.refundDate],
              ["Shares in demat", detail?.timeline.creditToDematDate],
              ["Listing", detail?.timeline.listingDate ?? ipo.listingDate],
            ].map(([label, date]) => (
              <View key={label} className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="calendar-outline" size={14} color={p.mutedForeground} />
                  <Text className="text-sm text-muted-foreground">{label}</Text>
                </View>
                <Text className="text-sm font-semibold text-foreground">{fmtIpoDate(date, true)}</Text>
              </View>
            ))}
          </Card>

          <SectionHeading title="Subscription" />
          {detail?.subscription ? (
            <Card className="mx-4">
              <View className="flex-row flex-wrap gap-y-4">
                <Metric label="Total" value={times(detail.subscription.total)} />
                <Metric label="QIB" value={times(detail.subscription.qib)} />
                <Metric label="NII" value={times(detail.subscription.nii)} />
                <Metric label="Retail" value={times(detail.subscription.retail)} />
              </View>
              {detail.subscription.updatedLabel ? (
                <Text className="mt-3 text-xs text-muted-foreground">{detail.subscription.updatedLabel}</Text>
              ) : null}
            </Card>
          ) : query.data?.detailState === "pending" ? (
            <View className="mx-4 gap-2">
              <Shimmer height={60} radius={16} />
              <Text className="text-xs text-muted-foreground">Fetching the latest subscription figures…</Text>
            </View>
          ) : (
            <Text className="px-4 text-sm text-muted-foreground">
              {ipo.subscriptionTimes != null ? `Subscribed ${times(ipo.subscriptionTimes)} overall.` : "Subscription data isn't available yet."}
            </Text>
          )}

          {ipo.status === "listed" ? (
            <>
              <SectionHeading title="Listing" />
              <Card className="mx-4">
                <View className="flex-row flex-wrap gap-y-4">
                  <Metric label="Listing price" value={fmtINR(ipo.listingPrice)} />
                  <Metric label="Listing gain" value={fmtPct(ipo.listingGainPct)} />
                  <Metric label="Current price" value={fmtINR(ipo.cmp)} />
                  <Metric label="Gain now" value={fmtPct(ipo.currentGainPct)} />
                </View>
              </Card>
            </>
          ) : null}

          <View className="px-4 pt-6">
            <Notice text="GMP is an unofficial grey-market indicator, not a guarantee of listing price. Information only — not investment advice." />
          </View>
        </ScrollView>
      )}
    </Page>
  )
}
