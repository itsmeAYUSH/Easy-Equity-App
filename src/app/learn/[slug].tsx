import Ionicons from "@expo/vector-icons/Ionicons"
import { router, useLocalSearchParams, type Href } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { Fragment } from "react"
import { ScrollView, View } from "react-native"

import { InfoState } from "@/components/ui/InfoState"
import { Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { SectionHeading, TopBar } from "@/components/ui/TopBar"
import { GLOSSARY } from "@/content/glossary"
import { GUIDES, type Span } from "@/content/learn"
import { useColors } from "@/lib/appearance"
import { SITE_URL } from "@/lib/config"

/** Website paths used in the guides → the app's own screens. */
const APP_ROUTES: Record<string, Href> = {
  "/market-holidays": "/market-holidays",
  "/calculators/brokerage": "/calculators/brokerage",
  "/calculators/capital-gains": "/calculators/capital-gains",
  "/sip-calculator": "/calculators/sip",
  "/calculators": "/calculators",
  "/ipo": "/ipo",
  "/mutual-funds": "/mutual-funds",
  "/sectors": "/sectors",
  "/stocks": "/stocks",
  "/screener": "/screener",
  "/glossary": "/glossary",
  "/learn": "/learn",
}

const TERM_BY_SLUG = new Map(GLOSSARY.map((t) => [t.slug, t]))

export default function GuideScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const p = useColors()
  const guide = GUIDES.find((g) => g.slug === slug)
  const index = GUIDES.findIndex((g) => g.slug === slug)
  const next = index >= 0 ? GUIDES[index + 1] : undefined

  if (!guide) {
    return (
      <Page>
        <TopBar title="Learn" />
        <InfoState icon="book-outline" title="Guide not found" buttonLabel="All guides" onButtonPress={() => router.replace("/learn")} />
      </Page>
    )
  }

  const openLink = (href: string) => {
    const path = href.split("#")[0]
    const route = APP_ROUTES[path]
    if (route) router.push(route)
    else void WebBrowser.openBrowserAsync(`${SITE_URL}${href}`, { controlsColor: p.accent })
  }

  const spans = (list: Span[], base: string) =>
    list.map((s, i) => {
      const style = `${base} ${s.bold ? "font-semibold" : ""} ${s.term || s.link ? "text-accent" : ""}`
      const onPress = s.term ? () => router.push({ pathname: "/glossary", params: { term: s.term } }) : s.link ? () => openLink(s.link!) : undefined
      return (
        <Text key={i} className={style} onPress={onPress} suppressHighlighting>
          {s.text}
        </Text>
      )
    })

  return (
    <Page>
      <TopBar title="Learn" subtitle={`${guide.minutes} min read`} />
      <ScrollView contentContainerClassName="px-5 pb-12">
        <Text className="text-[26px] font-bold leading-8 text-foreground">{guide.title}</Text>
        <Text className="mt-2 text-[15px] leading-6 text-muted-foreground">{guide.description}</Text>
        <View className="mt-5 gap-4">
          {guide.body.map((b, i) => (
            <Fragment key={i}>
              {!("items" in b) ? (
                b.type === "h2" ? (
                  <Text className="mt-3 text-lg font-bold text-foreground">{spans(b.spans, "text-lg font-bold text-foreground")}</Text>
                ) : (
                  <Text selectable className="text-[15px] leading-[25px] text-foreground">
                    {spans(b.spans, "text-[15px] leading-[25px] text-foreground")}
                  </Text>
                )
              ) : (
                <View className="gap-2.5">
                  {b.items.map((item, j) => (
                    <View key={j} className="flex-row gap-3">
                      {b.type === "ol" ? (
                        <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-accent/15">
                          <Text className="text-[11px] font-bold text-accent">{j + 1}</Text>
                        </View>
                      ) : (
                        <View className="mt-[10px] h-1.5 w-1.5 rounded-full bg-accent" />
                      )}
                      <Text selectable className="flex-1 text-[15px] leading-[25px] text-foreground">
                        {spans(item, "text-[15px] leading-[25px] text-foreground")}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Fragment>
          ))}
        </View>

        {guide.terms.length ? (
          <>
            <SectionHeading title="Terms in this guide" />
            <View className="-mx-5 flex-row flex-wrap gap-2 px-5">
              {guide.terms.map((t) => {
                const term = TERM_BY_SLUG.get(t)
                if (!term) return null
                return (
                  <Tappable key={t} onPress={() => router.push({ pathname: "/glossary", params: { term: t } })} className="rounded-full border border-border bg-card px-3 py-1.5">
                    <Text className="text-xs font-semibold text-foreground">{term.term}</Text>
                  </Tappable>
                )
              })}
            </View>
          </>
        ) : null}

        {next ? (
          <Tappable
            onPress={() => router.replace({ pathname: "/learn/[slug]", params: { slug: next.slug } })}
            className="mt-8 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <View className="flex-1 gap-0.5">
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Next guide</Text>
              <Text className="text-sm font-semibold text-foreground">{next.title}</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={p.accent} />
          </Tappable>
        ) : null}
        <View className="pt-5">
          <Notice text="Educational only, not investment advice. EasyEquity is not registered with SEBI." />
        </View>
      </ScrollView>
    </Page>
  )
}
