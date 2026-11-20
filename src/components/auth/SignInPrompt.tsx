import Ionicons from "@expo/vector-icons/Ionicons"
import { router } from "expo-router"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Button } from "@/components/ui/Button"
import { useColors } from "@/lib/appearance"

/** Shown to guests on personal features (watchlist, portfolio, alerts). */
export function SignInPrompt({
  icon = "lock-closed-outline",
  title,
  body,
}: {
  icon?: keyof typeof Ionicons.glyphMap
  title: string
  body: string
}) {
  const p = useColors()
  return (
    <View className="flex-1 justify-center px-5 pb-16">
      <View className="items-center gap-3 rounded-3xl border border-border bg-card px-6 py-8">
        <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-accent/15">
          <Ionicons name={icon} size={30} color={p.accent} />
        </View>
        <Text className="text-center text-lg font-bold text-foreground">{title}</Text>
        <Text className="text-center text-sm leading-[22px] text-muted-foreground">{body}</Text>
        <View className="mt-3 w-full gap-3">
          <Button title="Sign in" onPress={() => router.push("/sign-in")} />
          <Button title="Create a free account" variant="secondary" onPress={() => router.push("/sign-up")} />
        </View>
      </View>
    </View>
  )
}
