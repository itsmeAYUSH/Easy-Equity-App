/**
 * Light / dark / system theme via NativeWind class dark mode. The saved choice
 * is restored from storage before the splash screen hides, so a
 * dark-mode user never sees a light flash.
 */
import * as SystemUI from "expo-system-ui"
import { useColorScheme } from "nativewind"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Platform, useColorScheme as useSystemScheme } from "react-native"

import { PALETTES } from "@/constants/theme"
import { storage } from "@/lib/storage"
import { isThemeMode, THEME_MODE_KEY, AppearanceContext, type ThemeMode } from "@/lib/appearance"

export function AppearanceProvider({ children, onReady }: { children: ReactNode; onReady?: () => void }) {
  const { setColorScheme } = useColorScheme()
  const system = useSystemScheme()
  const [mode, setModeState] = useState<ThemeMode>("system")

  useEffect(() => {
    let cancelled = false
    storage.getItem(THEME_MODE_KEY)
      .then((stored) => {
        if (cancelled) return
        setModeState(isThemeMode(stored) ? stored : "system")
      })
      .catch(() => {})
      .finally(() => onReady?.())
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once on mount
  }, [])

  const scheme = mode === "system" ? (system === "dark" ? "dark" : "light") : mode
  const colors = PALETTES[scheme]

  // Keep NativeWind's classes and this colors on the same scheme. Native:
  // "system" clears the app override so the OS drives both. Web: NativeWind's
  // "system" never adds the `dark` class, so it gets the resolved scheme.
  useEffect(() => {
    setColorScheme(Platform.OS === "web" ? scheme : mode)
  }, [scheme, mode, setColorScheme])

  // The root view behind every screen (visible during transitions / keyboard).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {})
  }, [colors.background])

  const setMode = useCallback(
    (p: ThemeMode) => {
      setModeState(p)
      storage.setItem(THEME_MODE_KEY, p).catch(() => {})
    },
    [],
  )

  const value = useMemo(() => ({ scheme, mode, setMode, colors }), [scheme, mode, setMode, colors])
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}
