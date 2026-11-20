import type { ReactNode } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { SessionProvider } from "@/providers/SessionProvider"
import { DataProvider } from "@/providers/DataProvider"
import { AppearanceProvider } from "@/providers/AppearanceProvider"

/**
 * Everything the screens need, outermost first: gestures and safe areas,
 * then light/dark colours, then the data cache, then the session (which
 * loads the user's profile through the data cache, so it must sit inside it).
 */
export function RootProviders({ children, onThemeReady }: { children: ReactNode; onThemeReady?: () => void }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppearanceProvider onReady={onThemeReady}>
          <DataProvider>
            <SessionProvider>{children}</SessionProvider>
          </DataProvider>
        </AppearanceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
