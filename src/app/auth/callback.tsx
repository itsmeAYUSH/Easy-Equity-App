import { Redirect, router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Platform, View } from "react-native"

import { InfoState } from "@/components/ui/InfoState"
import { useColors } from "@/lib/appearance"
import { completeOAuthRedirect } from "@/lib/auth/oauth"

/**
 * The Google sign-in returns to easyequity://auth/callback?code=…. Usually the
 * in-app browser session consumes that link itself (lib/auth/oauth.ts). When
 * Android hands it to the router instead (it restarted the app while the
 * browser was open), finish the sign-in here so the user stays in the app.
 */
export default function AuthCallback() {
  const p = useColors()
  const { code, error_description: errorDescription } = useLocalSearchParams<{ code?: string; error_description?: string }>()
  // On web the Supabase client reads the code from the URL itself (detectSessionInUrl).
  const handleHere = Platform.OS !== "web" && !!(code || errorDescription)
  const [state, setState] = useState<"working" | "done" | "failed">(handleHere ? "working" : "done")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!handleHere) return
    let live = true
    completeOAuthRedirect(code, errorDescription).then(
      () => live && setState("done"),
      (e: unknown) => {
        if (!live) return
        setMessage(e instanceof Error ? e.message : null)
        setState("failed")
      },
    )
    return () => {
      live = false
    }
  }, [handleHere, code, errorDescription])

  // Home; the root gate sends a new user on to onboarding.
  if (state === "done") return <Redirect href="/" />

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      {state === "working" ? (
        <ActivityIndicator color={p.accent} />
      ) : (
        <InfoState
          kind="error"
          icon="logo-google"
          title="Google sign-in didn't finish"
          body={message}
          buttonLabel="Try again"
          onButtonPress={() => router.replace("/sign-in")}
        />
      )}
    </View>
  )
}
