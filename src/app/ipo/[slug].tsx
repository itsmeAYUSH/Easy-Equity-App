import Ionicons from "@expo/vector-icons/Ionicons"
import { Image } from "expo-image"
import { router, useLocalSearchParams } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { ScrollView, Share, View } from "react-native"

import { errorMessage } from "@/api/errors"
import { Button } from "@/components/ui/Button"
import { InfoState } from "@/components/ui/InfoState"
import { Card, KeyValue, Metric, Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { Pill, type Tone } from "@/components/ui/Pill"
import { ListShimmer, Shimmer } from "@/components/ui/Shimmer"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { HeaderIcon, SectionHeading, TopBar } from "@/components/ui/TopBar"
import { useIpo, useIpoReminders } from "@/hooks/use-ipo"
import { useColors } from "@/lib/appearance"
import { useSession } from "@/lib/auth/session"
import { SITE_URL } from "@/lib/config"
import { fmtINR, fmtPct } from "@/lib/format"
import { fmtIpoDate, priceLabel, stageLabel, STATUS_LABEL, todayIST, type Ipo, type IpoDetail, type IpoStatus } from "@/lib/ipo"

const ALLOTMENT_HELP_URL = "https://www.ipoguru.in/how-to-check-ipo-allotment-status"
const times = (n: number | null | undefined) => (n == null ? "—" : `${n.toFixed(2)}x`)
const STATUS_TONE: Record<IpoStatus, Tone> = { open: "bullish", upcoming: "accent", closed: "neutral", listed: "plain" }

export default function IpoDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const query = useIpo(slug)
  const { userId } = useSession()
  const reminders = useIpoReminders()
  const p = useColors()

  const ipo = query.data?.ipo
  const detail = query.data?.detail
  const reminding = reminders.slugs.has(slug)
  const listed = ipo?.status === "listed"
  const canRemind = ipo && !listed
  const gmp = detail?.gmp ?? ipo?.gmp ?? null
  const sub = detail?.subscription ?? null
  const listing = detail?.listing ?? (ipo && ipo.listingPrice != null ? { listingPrice: ipo.listingPrice, listingGainPct: ipo.listingGainPct, cmp: ipo.cmp, currentGainPct: ipo.currentGainPct } : null)
  const nseSymbol = detail?.issue.nseSymbol

  const share = () => ipo && void Share.share({ message: `${ipo.displayName} IPO · ${priceLabel(ipo)}\n${SITE_URL}/ipo/${ipo.slug}` })

  return (
    <Page>
      <TopBar
        title={ipo?.displayName ?? "IPO"}
        subtitle={ipo ? `${ipo.board} · ${STATUS_LABEL[ipo.status]}` : null}
        right={ipo ? <HeaderIcon icon="share-outline" label="Share" onPress={share} /> : null}
      />
      {!ipo ? (
        query.isError ? (
          <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load this IPO" body={errorMessage(query.error)} buttonLabel="Try again" onButtonPress={() => query.refetch()} />
        ) : (
          <ListShimmer rows={4} />
        )
      ) : (
        <ScrollView contentContainerClassName="pb-12">
          <View className="flex-row items-center gap-4 px-5 pt-1">
            <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card">
              {ipo.logo ? (
                <Image source={{ uri: ipo.logo }} style={{ width: 52, height: 52 }} contentFit="contain" cachePolicy="memory-disk" />
              ) : (
                <Text className="text-2xl font-bold text-foreground">{ipo.displayName.slice(0, 1)}</Text>
              )}
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="text-xl font-bold leading-7 text-foreground">{ipo.displayName}</Text>
              <View className="flex-row flex-wrap items-center gap-1.5">
                <Pill label={STATUS_LABEL[ipo.status]} tone={STATUS_TONE[ipo.status]} size="xs" />
                <Pill label={ipo.board} size="xs" />
                <Text className="text-xs text-muted-foreground">{stageLabel(ipo)}</Text>
              </View>
            </View>
          </View>

          <Card className="mx-5 mt-4">
            <View className="flex-row flex-wrap gap-y-4">
              <Metric label={listed && ipo.issuePrice != null ? "Issue price" : "Price band"} value={listed && ipo.issuePrice != null ? fmtINR(ipo.issuePrice) : priceLabel(ipo)} />
              <Metric label="Lot size" value={ipo.lotSize != null ? `${ipo.lotSize.toLocaleString("en-IN")} shares` : "—"} />
              <Metric label="Min. investment" value={fmtINR(ipo.minInvestment ?? detail?.issue.minInvestment, 0)} />
              <Metric label="Issue size" value={(ipo.issueSizeCr ?? detail?.issue.issueSizeCr) != null ? `₹${(ipo.issueSizeCr ?? detail?.issue.issueSizeCr)!.toLocaleString("en-IN")} Cr` : "—"} />
              <Metric label="Subscribed" value={times(sub?.total ?? ipo.subscriptionTimes)} />
              {listed && listing ? (
                <Metric label="Listing gain" value={fmtPct(listing.listingGainPct)} valueClassName={(listing.listingGainPct ?? 0) >= 0 ? "text-bullish" : "text-bearish"} />
              ) : (
                <Metric label="GMP" value={gmp?.price != null ? `${fmtINR(gmp.price)} (${fmtPct(gmp.percent)})` : "—"} valueClassName={(gmp?.percent ?? 0) >= 0 ? "text-bullish" : "text-bearish"} />
              )}
            </View>
          </Card>

          {canRemind ? (
            <View className="px-5 pt-4">
              <Button
                title={reminding ? "Reminders on for key dates" : "Remind me on key dates"}
                icon={reminding ? "notifications" : "notifications-outline"}
                variant={reminding ? "secondary" : "primary"}
                onPress={() => (userId ? reminders.toggle.mutate({ slug, on: !reminding }) : router.push("/sign-in"))}
              />
              <Text className="pt-2 text-center text-[11px] text-muted-foreground">
                {reminding ? "Tap again to turn off." : "Opening, closing, allotment and listing days, in Notifications (and email if you turned that on)."}
              </Text>
            </View>
          ) : null}

          {listed && listing ? (
            <>
              <SectionHeading title="Listing performance" />
              <Card className="mx-5 py-1">
                <KeyValue label="Issue price" value={fmtINR(ipo.issuePrice ?? detail?.issue.issuePrice)} />
                <KeyValue label="Listing price" value={fmtINR(listing.listingPrice)} />
                <KeyValue label="Listing gain" value={fmtPct(listing.listingGainPct)} valueClassName={(listing.listingGainPct ?? 0) >= 0 ? "text-bullish" : "text-bearish"} />
                <KeyValue label="Current price" value={fmtINR(listing.cmp)} />
                <KeyValue label="Gain vs issue price" value={fmtPct(listing.currentGainPct)} valueClassName={(listing.currentGainPct ?? 0) >= 0 ? "text-bullish" : "text-bearish"} divider={false} />
              </Card>
            </>
          ) : gmp ? (
            <>
              <SectionHeading title="Grey market premium" subtitle={gmp.updatedLabel ?? null} />
              <Card className="mx-5 gap-1 py-3">
                <View className="flex-row items-end gap-3 pb-2">
                  <Text className={`text-3xl font-bold ${(gmp.percent ?? 0) >= 0 ? "text-bullish" : "text-bearish"}`}>{gmp.price != null ? fmtINR(gmp.price) : "—"}</Text>
                  <Text className={`pb-1 text-base font-semibold ${(gmp.percent ?? 0) >= 0 ? "text-bullish" : "text-bearish"}`}>{fmtPct(gmp.percent)}</Text>
                </View>
                <KeyValue label="Cap price" value={fmtINR(ipo.priceMax ?? ipo.issuePrice)} />
                <KeyValue label="Estimated listing price" value={fmtINR(gmp.estListingPrice)} divider={!!(gmp.kostak || gmp.subjectToSauda)} />
                {gmp.kostak ? <KeyValue label="Kostak" value={`₹${gmp.kostak}`} divider={!!gmp.subjectToSauda} /> : null}
                {gmp.subjectToSauda ? <KeyValue label="Subject to sauda" value={`₹${gmp.subjectToSauda}`} divider={false} /> : null}
              </Card>
            </>
          ) : null}

          <SectionHeading title="Timeline" />
          <Timeline ipo={ipo} detail={detail ?? null} />
          {ipo.status === "closed" || ipo.status === "open" ? (
            <Tappable onPress={() => void WebBrowser.openBrowserAsync(ALLOTMENT_HELP_URL, { controlsColor: p.accent })} className="mx-5 mt-3 flex-row items-center gap-2 self-start">
              <Ionicons name="help-circle-outline" size={16} color={p.accent} />
              <Text className="text-sm font-semibold text-accent">How to check allotment status</Text>
            </Tappable>
          ) : null}

          <SectionHeading title="Subscription" subtitle={sub?.updatedLabel ?? null} />
          {sub ? (
            <SubscriptionBars sub={sub} />
          ) : query.data?.detailState === "pending" ? (
            <View className="mx-5 gap-2">
              <Shimmer height={90} radius={16} />
              <Text className="text-xs text-muted-foreground">Fetching the latest subscription figures…</Text>
            </View>
          ) : (
            <Text className="px-5 text-sm text-muted-foreground">
              {ipo.subscriptionTimes != null ? `Subscribed ${times(ipo.subscriptionTimes)} overall.` : "Subscription figures aren't out yet."}
            </Text>
          )}

          {detail ? (
            <>
              <SectionHeading title="Issue details" />
              <Card className="mx-5 py-1">
                <KeyValue label="Price band" value={priceLabel(ipo)} />
                {ipo.issuePrice != null ? <KeyValue label="Final issue price" value={fmtINR(ipo.issuePrice)} /> : null}
                {detail.issue.faceValue != null ? <KeyValue label="Face value" value={fmtINR(detail.issue.faceValue)} /> : null}
                {detail.issue.saleType ? <KeyValue label="Sale type" value={detail.issue.saleType} /> : null}
                {detail.issue.listingOn ? <KeyValue label="Listing on" value={detail.issue.listingOn} /> : null}
                {nseSymbol ? <KeyValue label="NSE symbol" value={nseSymbol} /> : null}
                <KeyValue label="BSE code" value={detail.issue.bseScripCode ?? "—"} divider={false} />
              </Card>
            </>
          ) : null}

          <View className="gap-3 px-5 pt-6">
            {nseSymbol && (listed || ipo.isListed) ? (
              <Button title={`Stock page: ${nseSymbol}`} icon="stats-chart-outline" variant="secondary" onPress={() => router.push({ pathname: "/stock/[symbol]", params: { symbol: `${nseSymbol}.NS` } })} />
            ) : null}
            {ipo.webUrl ? (
              <Button title="View on IPO Guru" icon="open-outline" variant="ghost" onPress={() => void WebBrowser.openBrowserAsync(ipo.webUrl!, { controlsColor: p.accent })} />
            ) : null}
            <Notice text="GMP is an unofficial grey-market indicator, not a guarantee of listing price. Information only — not investment advice." />
          </View>
        </ScrollView>
      )}
    </Page>
  )
}

function Timeline({ ipo, detail }: { ipo: Ipo; detail: IpoDetail | null }) {
  const t = detail?.timeline
  const today = todayIST()
  const steps = [
    { label: "Bidding opens", date: t?.openDate ?? ipo.openDate },
    { label: "Bidding closes", date: t?.closeDate ?? ipo.closeDate },
    { label: "Allotment", date: t?.allotmentDate ?? ipo.allotmentDate },
    { label: "Refunds", date: t?.refundDate ?? null },
    { label: "Shares in demat", date: t?.creditToDematDate ?? null },
    { label: "Listing", date: t?.listingDate ?? ipo.listingDate },
  ]
  const nextIndex = steps.findIndex((s) => s.date && s.date.slice(0, 10) >= today)
  return (
    <Card className="mx-5 py-2">
      {steps.map((s, i) => {
        const done = !!s.date && s.date.slice(0, 10) < today
        const current = i === nextIndex
        return (
          <View key={s.label} className="flex-row gap-3">
            <View className="items-center">
              <View className={`mt-3 h-4 w-4 items-center justify-center rounded-full ${done ? "bg-bullish" : current ? "bg-accent" : "border-2 border-border bg-card"}`}>
                {done ? <Ionicons name="checkmark" size={10} color="#fff" /> : null}
              </View>
              {i < steps.length - 1 ? <View className={`w-0.5 flex-1 ${done ? "bg-bullish/50" : "bg-border"}`} /> : null}
            </View>
            <View className="flex-1 flex-row items-center justify-between py-2.5">
              <Text className={`text-sm ${current ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s.label}</Text>
              <Text className={`text-sm font-semibold ${current ? "text-accent" : "text-foreground"}`}>
                {s.date?.slice(0, 10) === today ? "Today" : fmtIpoDate(s.date, true)}
              </Text>
            </View>
          </View>
        )
      })}
      {ipo.datesTba ? <Text className="pb-1 text-xs text-muted-foreground">Dates are yet to be announced.</Text> : null}
    </Card>
  )
}

function SubscriptionBars({ sub }: { sub: NonNullable<IpoDetail["subscription"]> }) {
  const rows = [
    { label: "QIB", value: sub.qib },
    { label: "NII (HNI)", value: sub.nii },
    { label: "Retail", value: sub.retail },
    { label: "Employee", value: sub.employee },
    { label: "Shareholder", value: sub.shareholder },
  ].filter((r): r is { label: string; value: number } => r.value != null)
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <Card className="mx-5 gap-3">
      <View className="flex-row items-end justify-between">
        <View>
          <Text className="text-[11px] text-muted-foreground">Total</Text>
          <Text className="text-2xl font-bold text-foreground">{times(sub.total)}</Text>
        </View>
        {sub.applications != null ? <Text className="text-xs text-muted-foreground">{sub.applications.toLocaleString("en-IN")} applications</Text> : null}
      </View>
      {rows.map((r) => (
        <View key={r.label} className="gap-1">
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted-foreground">{r.label}</Text>
            <Text className="text-xs font-semibold text-foreground">{times(r.value)}</Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-secondary">
            <View className={`h-full rounded-full ${r.value >= 1 ? "bg-bullish" : "bg-accent"}`} style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </View>
        </View>
      ))}
      {sub.anchor != null ? <Text className="text-[11px] text-muted-foreground">Anchor portion: {times(sub.anchor)}</Text> : null}
    </Card>
  )
}
