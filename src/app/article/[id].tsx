import Ionicons from "@expo/vector-icons/Ionicons"
import { Image } from "expo-image"
import { router, useLocalSearchParams } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { useState } from "react"
import { ScrollView, Share, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { errorMessage } from "@/api/errors"
import { ImpactBadge } from "@/components/news/NewsCard"
import { Button } from "@/components/ui/Button"
import { InfoState } from "@/components/ui/InfoState"
import { Notice } from "@/components/ui/Notice"
import { HeaderIcon, TopBar } from "@/components/ui/TopBar"
import { Tappable } from "@/components/ui/Tappable"
import { Page } from "@/components/ui/Page"
import { ListShimmer, Shimmer } from "@/components/ui/Shimmer"
import { AI_DISCLAIMER } from "@/constants/legal"
import { useArticle, useExplainArticle } from "@/hooks/use-articles"
import { SITE_URL } from "@/lib/config"
import { CATEGORY_LABEL, fmtDateTime, toYahooSymbol } from "@/lib/format"
import { cleanNewsText, repeatsTitle } from "@/lib/text"
import { useColors } from "@/lib/appearance"

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const article = useArticle(id)
  const [explainOn, setExplainOn] = useState(false)
  const explain = useExplainArticle(id, explainOn)
  const p = useColors()

  const a = article.data
  const title = cleanNewsText(a?.title)
  const summary = cleanNewsText(a?.summary)
  const content = cleanNewsText(a?.content)
  const body = content && content !== summary ? content : ""

  return (
    <Page>
      <TopBar
        title={a ? (CATEGORY_LABEL[a.category] ?? "News") : "News"}
        right={
          a ? (
            <HeaderIcon
              icon="share-outline"
              label="Share"
              onPress={() => void Share.share({ message: `${title}\n${SITE_URL}/article/${a.id}` })}
            />
          ) : null
        }
      />
      {!a ? (
        article.isError ? (
          <InfoState kind="error" icon="cloud-offline-outline" title="Couldn't load this story" body={errorMessage(article.error)} buttonLabel="Try again" onButtonPress={() => article.refetch()} />
        ) : (
          <ListShimmer rows={3} />
        )
      ) : (
        <ScrollView contentContainerClassName="pb-10">
          {a.image_url ? (
            <Image
              source={{ uri: a.image_url }}
              style={{ width: "100%", aspectRatio: 16 / 9 }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
          ) : null}
          <View className="gap-3 px-4 pt-4">
            <View className="flex-row items-center gap-2">
              <ImpactBadge impact={a.impact} />
              <Text className="text-xs text-muted-foreground">
                {a.source} · {fmtDateTime(a.published_at)}
              </Text>
            </View>
            <Text selectable className="text-2xl font-bold leading-8 text-foreground">
              {title}
            </Text>
            {summary && !repeatsTitle(title, summary) ? (
              <Text selectable className="text-base leading-6 text-foreground">
                {summary}
              </Text>
            ) : null}
            {a.impact_reason ? (
              <View className="gap-1 rounded-xl border border-border bg-card p-3">
                <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why it may move markets</Text>
                <Text className="text-sm leading-5 text-foreground">{a.impact_reason}</Text>
              </View>
            ) : null}
            {body ? (
              <Text selectable className="text-[15px] leading-6 text-foreground">
                {body}
              </Text>
            ) : null}

            {a.tickers?.length ? (
              <View className="flex-row flex-wrap gap-2 pt-1">
                {a.tickers.slice(0, 8).map((t) => (
                  <Tappable
                    key={t}
                    // Article tickers are bare NSE symbols (RELIANCE): open the Yahoo form.
                    onPress={() => router.push({ pathname: "/stock/[symbol]", params: { symbol: toYahooSymbol(t) } })}
                    className="rounded-full border border-border bg-card px-3 py-1"
                  >
                    <Text className="text-xs font-semibold text-foreground">{t}</Text>
                  </Tappable>
                ))}
              </View>
            ) : null}

            {/* Explain simply (AI) */}
            <View className="mt-2 gap-3 rounded-2xl border border-border bg-card p-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="sparkles" size={18} color={p.accent} />
                <Text className="text-base font-semibold text-foreground">Explain simply</Text>
              </View>
              {!explainOn ? (
                <>
                  <Text className="text-sm text-muted-foreground">Get this story in plain language, with the jargon explained.</Text>
                  <Button title="Explain this story" variant="accent" size="sm" onPress={() => setExplainOn(true)} />
                </>
              ) : explain.isPending ? (
                <View className="gap-2">
                  <Shimmer height={12} />
                  <Shimmer height={12} width="90%" />
                  <Shimmer height={12} width="75%" />
                </View>
              ) : explain.isError ? (
                <>
                  <Text className="text-sm text-destructive">{errorMessage(explain.error, "The explanation isn't available right now.")}</Text>
                  <Button title="Try again" variant="secondary" size="sm" onPress={() => explain.refetch()} />
                </>
              ) : explain.data ? (
                <View className="gap-3">
                  <Text className="text-sm leading-5 text-foreground">{explain.data.explanation.summary}</Text>
                  {explain.data.explanation.points.map((pt, i) => (
                    <View key={i} className="flex-row gap-2">
                      <Text className="text-accent">•</Text>
                      <Text className="flex-1 text-sm leading-5 text-foreground">{pt}</Text>
                    </View>
                  ))}
                  {explain.data.explanation.whyItMatters ? (
                    <Text className="text-sm leading-5 text-muted-foreground">
                      <Text className="font-semibold text-foreground">Why it matters: </Text>
                      {explain.data.explanation.whyItMatters}
                    </Text>
                  ) : null}
                  {explain.data.explanation.terms.map((t) => (
                    <Text key={t.term} className="text-xs leading-5 text-muted-foreground">
                      <Text className="font-semibold text-foreground">{t.term}: </Text>
                      {t.meaning}
                    </Text>
                  ))}
                  <Notice text={AI_DISCLAIMER} />
                </View>
              ) : null}
            </View>

            {a.source_url ? (
              <Button
                title={`Read on ${a.source}`}
                icon="open-outline"
                variant="secondary"
                onPress={() => void WebBrowser.openBrowserAsync(a.source_url!, { controlsColor: p.accent })}
              />
            ) : null}
          </View>
        </ScrollView>
      )}
    </Page>
  )
}
