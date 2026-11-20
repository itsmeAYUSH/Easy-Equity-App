import { createContext, useContext } from "react"

import { PALETTES, type Palette, type Scheme } from "@/constants/theme"

export type ThemeMode = "system" | "light" | "dark"
export const THEME_MODE_KEY = "easyequity.theme.v1"

export function isThemeMode(v: unknown): v is ThemeMode {
  return v === "system" || v === "light" || v === "dark"
}

export type AppearanceState = {
  scheme: Scheme
  mode: ThemeMode
  setMode: (p: ThemeMode) => void
  colors: Palette
}

export const AppearanceContext = createContext<AppearanceState>({
  scheme: "light",
  mode: "system",
  setMode: () => {},
  colors: PALETTES.light,
})

export const useAppearance = () => useContext(AppearanceContext)
/** JS colours for the active scheme (icons, charts, native header options). */
export const useColors = () => useContext(AppearanceContext).colors
