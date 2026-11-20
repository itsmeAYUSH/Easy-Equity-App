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
    <View className="flex-1 items-center justify-center gap-3 px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-accent/15">
        <Ionicons name={icon} size={30} color={p.accent} />
      </View>
      <Text className="text-center text-lg font-bold text-foreground">{title}</Text>
      <Text className="text-center text-sm leading-5 text-muted-foreground">{body}</Text>
      <View className="mt-2 w-full gap-2">
        <Button title="Sign in" onPress={() => router.push("/sign-in")} />
        <Button title="Create a free account" variant="secondary" onPress={() => router.push("/sign-up")} />
      </View>
    </View>
  )
}
