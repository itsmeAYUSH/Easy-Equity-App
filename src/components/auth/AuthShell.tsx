import Ionicons from "@expo/vector-icons/Ionicons"
import { router } from "expo-router"
import type { ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Tappable } from "@/components/ui/Tappable"
import { Page } from "@/components/ui/Page"
import { useColors } from "@/lib/appearance"

/** Shared frame for the sign-in screens: close button, brand mark, title, form. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const p = useColors()
  return (
    <Page edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="flex-grow px-6 pb-8">
          <View className="flex-row justify-end pt-2">
            <Tappable
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              accessibilityLabel="Close"
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full bg-secondary"
            >
              <Ionicons name="close" size={20} color={p.foreground} />
            </Tappable>
          </View>
          <View className="mb-8 mt-4 items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Ionicons name="trending-up" size={28} color={p.primaryForeground} />
            </View>
            <Text className="text-center text-2xl font-bold text-foreground">{title}</Text>
            <Text className="text-center text-sm leading-5 text-muted-foreground">{subtitle}</Text>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  )
}

/** "or" divider between the email form and Google. */
export function OrDivider() {
  return (
    <View className="my-5 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-border" />
      <Text className="text-xs text-muted-foreground">or</Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  )
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
