// Per-weight subpath imports: the package index requires all 18 weights, and
// Metro would bundle every .ttf (~6 MB). These four are the only ones used.
import { Montserrat_400Regular } from "@expo-google-fonts/montserrat/400Regular"
import { Montserrat_500Medium } from "@expo-google-fonts/montserrat/500Medium"
import { Montserrat_600SemiBold } from "@expo-google-fonts/montserrat/600SemiBold"
import { Montserrat_700Bold } from "@expo-google-fonts/montserrat/700Bold"

/** Montserrat, as on the website. One file per weight (native can't synthesise weights). */
export const FontFamily = {
  regular: "Montserrat_400Regular",
  medium: "Montserrat_500Medium",
  semibold: "Montserrat_600SemiBold",
  bold: "Montserrat_700Bold",
} as const

/** Static map for expo-font's useFonts (same object every render). */
export const FONT_FILES = {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
}
