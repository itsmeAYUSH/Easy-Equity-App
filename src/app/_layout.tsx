import "@/global.css"

import { useFonts } from "expo-font"
import { Stack, useRootNavigationState, useRouter, useSegments, type ErrorBoundaryProps } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"

import { ErrorScreen } from "@/components/ErrorScreen"
import { FONT_FILES } from "@/constants/fonts"
import { useSession } from "@/lib/auth/session"
import { useAppearance } from "@/lib/appearance"
import { RootProviders } from "@/providers"

// Keep the native splash up until fonts, theme and the stored session are ready:
// no font swap, no light→dark flash, no signed-out flicker for a signed-in user.
SplashScreen.preventAutoHideAsync().catch(() => {})
SplashScreen.setOptions({ duration: 200, fade: true })

/** Any render error that escapes a screen lands here instead of a white screen. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <ErrorScreen error={error} retry={retry} />
}

export default function EasyEquityApp() {
  const [fontsLoaded, fontError] = useFonts(FONT_FILES)
  const [themeReady, setThemeReady] = useState(false)
  return (
    <RootProviders onThemeReady={() => setThemeReady(true)}>
      <AppStack ready={(fontsLoaded || !!fontError) && themeReady} />
    </RootProviders>
  )
}

/**
 * Where a user may be:
 * - Guests browse news, markets, IPOs and funds freely (like the website);
 *   personal features show a sign-in prompt.
 * - A signed-in user who hasn't finished onboarding (terms + experience) is
 *   sent there first — the API refuses to mark onboarding done without consent.
 * - A signed-in user never sits on the sign-in screens.
 */
function useRouteGuard(enabled: boolean) {
  const { restoring, userId, needsOnboarding } = useSession()
  const segments = useSegments()
  const router = useRouter()
  const navReady = Boolean(useRootNavigationState()?.key)

  useEffect(() => {
    if (!enabled || restoring || !navReady) return
    const root = segments[0]
    if (userId && needsOnboarding && root !== "onboarding") {
      router.replace("/onboarding")
    } else if (userId && !needsOnboarding && root === "(auth)") {
      router.replace("/")
    } else if (!userId && root === "onboarding") {
      router.replace("/")
    }
  }, [enabled, restoring, navReady, userId, needsOnboarding, segments, router])

  return restoring
}

function AppStack({ ready }: { ready: boolean }) {
  const { colors, scheme } = useAppearance()
  const restoring = useRouteGuard(ready)

  useEffect(() => {
    if (ready && !restoring) SplashScreen.hideAsync().catch(() => {})
  }, [ready, restoring])

  if (!ready) return null

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
          // Back-swipe from the left edge only, so the ticker strip, chip rows
          // and the chart scrubber keep their horizontal gestures.
          gestureEnabled: true,
          fullScreenGestureEnabled: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" options={{ animation: "fade_from_bottom", presentation: "modal" }} />
        <Stack.Screen name="onboarding" options={{ animation: "fade", gestureEnabled: false }} />
        <Stack.Screen name="search" options={{ animation: "fade" }} />
        <Stack.Screen name="add-holding" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="create-alert" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      </Stack>
    </>
  )
}
