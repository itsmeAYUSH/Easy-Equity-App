import Ionicons from "@expo/vector-icons/Ionicons"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { useState } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { errorMessage } from "@/api/errors"
import { InfoState } from "@/components/ui/InfoState"
import { Notice } from "@/components/ui/Notice"
import { TopBar } from "@/components/ui/TopBar"
import { Tappable } from "@/components/ui/Tappable"
import { Page } from "@/components/ui/Page"
import { InputField } from "@/components/ui/InputField"
import { MF_RISK_LINE } from "@/constants/legal"
import { useDebounce } from "@/hooks/use-debounce"
import { useFundSearch } from "@/hooks/use-mutual-funds"
import { useColors } from "@/lib/appearance"

const SUGGESTIONS = ["Parag Parikh Flexi Cap", "Nifty 50 Index", "HDFC Mid Cap", "SBI Small Cap", "ICICI Bluechip"]

export default function MutualFundsScreen() {
  const p = useColors()
  const [q, setQ] = useState("")
  const term = useDebounce(q.trim(), 350)
  const results = useFundSearch(term)

  return (
    <Page>
      <TopBar title="Mutual funds" subtitle="NAV, returns and history from AMFI" />
      <View className="px-4 pb-2">
        <InputField icon="search" value={q} onChangeText={setQ} placeholder="Search a fund, e.g. flexi cap" autoCorrect={false} returnKeyType="search" />
      </View>
      {term.length < 2 ? (
        <View className="gap-3 px-4 pt-3">
          <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Try</Text>
          <View className="flex-row flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Tappable key={s} onPress={() => setQ(s)} className="rounded-full border border-border bg-card px-3 py-1.5">
                <Text className="text-sm text-foreground">{s}</Text>
              </Tappable>
            ))}
          </View>
          <View className="pt-4">
            <Notice text={MF_RISK_LINE} />
          </View>
        </View>
      ) : (
        <FlashList
          data={results.data ?? []}
          keyExtractor={(f) => String(f.schemeCode)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <Tappable
              shrinkTo={0.98}
              onPress={() => router.push({ pathname: "/mutual-funds/[code]", params: { code: String(item.schemeCode) } })}
              className="mx-4 flex-row items-center gap-3 border-b border-border py-3"
            >
              <Text className="flex-1 text-sm font-medium leading-5 text-foreground">{item.schemeName}</Text>
              <Ionicons name="chevron-forward" size={16} color={p.mutedForeground} />
            </Tappable>
          )}
          ListEmptyComponent={
            results.isPending ? null : results.isError ? (
              <InfoState kind="error" icon="cloud-offline-outline" title="Search is unavailable" body={errorMessage(results.error)} />
            ) : (
              <InfoState icon="search-outline" title="No funds found" body="Try a shorter name, like the fund house." />
            )
          }
        />
      )}
    </Page>
  )
}
