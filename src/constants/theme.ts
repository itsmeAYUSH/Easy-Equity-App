/**
 * EasyEquity colours for JS (icons, charts, native headers, status bar).
 * Same values as src/global.css — the web app's colors converted from HSL.
 * Class names (bg-card, text-bullish …) cover everything else.
 */
export type Scheme = "light" | "dark"

export type Palette = {
  background: string
  foreground: string
  card: string
  primary: string
  primaryForeground: string
  secondary: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  border: string
  bullish: string
  bullishBg: string
  bearish: string
  bearishBg: string
  neutral: string
  neutralBg: string
  overlay: string
}

export const PALETTES: Record<Scheme, Palette> = {
  light: {
    background: "#F9F8F6",
    foreground: "#14181F",
    card: "#FFFFFF",
    primary: "#1D2330",
    primaryForeground: "#F9F8F6",
    secondary: "#EEECE8",
    muted: "#E8E7E3",
    mutedForeground: "#676F7E",
    accent: "#F29E0D",
    accentForeground: "#14181F",
    destructive: "#DC2828",
    border: "#DCDFE5",
    bullish: "#20AC6B",
    bullishBg: "#E9FBF3",
    bearish: "#DC2828",
    bearishBg: "#FCEDED",
    neutral: "#737B8C",
    neutralBg: "#F1F2F4",
    overlay: "rgba(20,24,31,0.45)",
  },
  dark: {
    background: "#101318",
    foreground: "#F4F3F0",
    card: "#161A22",
    primary: "#F4F3F0",
    primaryForeground: "#101318",
    secondary: "#212630",
    muted: "#272C35",
    mutedForeground: "#8F96A3",
    accent: "#F4A825",
    accentForeground: "#101318",
    destructive: "#CF3030",
    border: "#2B303B",
    bullish: "#28D785",
    bullishBg: "#122B1F",
    bearish: "#E25050",
    bearishBg: "#2E1414",
    neutral: "#8F96A3",
    neutralBg: "#22252A",
    overlay: "rgba(0,0,0,0.6)",
  },
}
