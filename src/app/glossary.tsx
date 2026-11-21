import { FlashList } from "@shopify/flash-list"
import { router, useLocalSearchParams } from "expo-router"
import { useMemo, useState } from "react"
import { View } from "react-native"

import { Button } from "@/components/ui/Button"
import { InfoState } from "@/components/ui/InfoState"
import { InputField } from "@/components/ui/InputField"
import { Page } from "@/components/ui/Page"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { TopBar } from "@/components/ui/TopBar"
import { GLOSSARY, type GlossaryTerm } from "@/content/glossary"

const BY_SLUG = new Map(GLOSSARY.map((t) => [t.slug, t]))
const SORTED = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term))

/** Market terms in plain language (the website's /glossary). `?term=` opens on one term and its related ones. */
export default function GlossaryScreen() {
  const params = useLocalSearchParams<{ term?: string }>()
  const [focus, setFocus] = useState<string | null>(params.term && BY_SLUG.has(params.term) ? params.term : null)
  const [q, setQ] = useState("")

  const list = useMemo<GlossaryTerm[]>(() => {
    if (focus) {
      const t = BY_SLUG.get(focus)
      if (!t) return SORTED
      return [t, ...(t.related ?? []).map((s) => BY_SLUG.get(s)).filter((x): x is GlossaryTerm => !!x)]
    }
    const term = q.trim().toLowerCase()
    return term ? SORTED.filter((t) => t.term.toLowerCase().includes(term) || t.definition.toLowerCase().includes(term)) : SORTED
  }, [focus, q])

  return (
    <Page>
      <TopBar title="Glossary" subtitle={`${GLOSSARY.length} terms, explained simply`} />
      <FlashList
        data={list}
        keyExtractor={(t) => t.slug}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item, index }) => (
          <View className={`mx-5 mb-3 gap-2 rounded-2xl border bg-card p-4 ${focus && index === 0 ? "border-accent" : "border-border"}`}>
            <Text className="text-base font-bold text-foreground">{item.term}</Text>
            <Text selectable className="text-sm leading-[22px] text-muted-foreground">
              {item.definition}
            </Text>
            {item.related?.length ? (
              <View className="flex-row flex-wrap gap-1.5 pt-1">
                {item.related.map((r) => {
                  const rel = BY_SLUG.get(r)
                  if (!rel) return null
                  return (
                    <Tappable key={r} onPress={() => setFocus(r)} className="rounded-full bg-secondary px-2.5 py-1">
                      <Text className="text-[11px] font-semibold text-foreground">{rel.term}</Text>
                    </Tappable>
                  )
                })}
              </View>
            ) : null}
            {/cagr/i.test(item.slug) ? (
              <Tappable onPress={() => router.push("/calculators/cagr")} className="self-start pt-1">
                <Text className="text-xs font-semibold text-accent">Open the CAGR calculator →</Text>
              </Tappable>
            ) : item.slug === "sip" ? (
              <Tappable onPress={() => router.push("/calculators/sip")} className="self-start pt-1">
                <Text className="text-xs font-semibold text-accent">Open the SIP calculator →</Text>
              </Tappable>
            ) : null}
          </View>
        )}
        ListHeaderComponent={
          <View className="px-5 pb-4">
            {focus ? (
              <Button title="Show all terms" icon="list-outline" variant="secondary" size="sm" onPress={() => setFocus(null)} />
            ) : (
              <InputField icon="search" value={q} onChangeText={setQ} placeholder="Search a term, e.g. P/E or NAV" autoCorrect={false} returnKeyType="search" />
            )}
          </View>
        }
        ListEmptyComponent={<InfoState icon="book-outline" title="No terms match" body="Try a shorter word." small />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </Page>
  )
}
