import Ionicons from "@expo/vector-icons/Ionicons"
import { router } from "expo-router"
import { ScrollView, View } from "react-native"

import { Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { SectionHeading, TopBar } from "@/components/ui/TopBar"
import { GLOSSARY } from "@/content/glossary"
import { GUIDES } from "@/content/learn"
import { useColors } from "@/lib/appearance"

const ICONS: (keyof typeof Ionicons.glyphMap)[] = ["business-outline", "stats-chart-outline", "reader-outline", "rocket-outline", "pie-chart-outline", "newspaper-outline"]

/** Beginner guides (the website's /learn) and a link to the glossary. */
export default function LearnScreen() {
  const p = useColors()
  return (
    <Page>
      <TopBar title="Learn" subtitle="Investing basics in plain language" />
      <ScrollView contentContainerClassName="pb-12">
        <View className="gap-3 px-5">
          {GUIDES.map((g, i) => (
            <Tappable
              key={g.slug}
              onPress={() => router.push({ pathname: "/learn/[slug]", params: { slug: g.slug } })}
              accessibilityLabel={g.title}
              className="flex-row gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent/15">
                <Ionicons name={ICONS[i % ICONS.length]} size={22} color={p.accent} />
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-[15px] font-semibold leading-5 text-foreground">{g.title}</Text>
                <Text numberOfLines={2} className="text-xs leading-[18px] text-muted-foreground">
                  {g.description}
                </Text>
                <Text className="text-[11px] font-medium text-accent">{g.minutes} min read</Text>
              </View>
            </Tappable>
          ))}
        </View>

        <SectionHeading title="Glossary" subtitle={`${GLOSSARY.length} market terms, explained simply`} />
        <Tappable onPress={() => router.push("/glossary")} className="mx-5 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Ionicons name="book-outline" size={22} color={p.accent} />
          <Text className="flex-1 text-sm font-semibold text-foreground">Browse the glossary</Text>
          <Ionicons name="chevron-forward" size={16} color={p.mutedForeground} />
        </Tappable>
        <View className="px-5 pt-5">
          <Notice text="Educational only: these guides explain how things work. They don't suggest what to buy or sell." />
        </View>
      </ScrollView>
    </Page>
  )
}
