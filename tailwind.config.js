/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // Required for NativeWind colorScheme.set (ThemeProvider drives light/dark/system).
  darkMode: "class",
  theme: {
    extend: {
      // RGB channel vars from src/global.css, so opacity modifiers work (bg-accent/10).
      // Same token names as the web app's Tailwind config.
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
        },
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        muted: {
          DEFAULT: "rgb(var(--color-muted) / <alpha-value>)",
          foreground: "rgb(var(--color-muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          foreground: "rgb(var(--color-accent-foreground) / <alpha-value>)",
        },
        destructive: "rgb(var(--color-destructive) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        bullish: {
          DEFAULT: "rgb(var(--color-bullish) / <alpha-value>)",
          bg: "rgb(var(--color-bullish-bg) / <alpha-value>)",
        },
        bearish: {
          DEFAULT: "rgb(var(--color-bearish) / <alpha-value>)",
          bg: "rgb(var(--color-bearish-bg) / <alpha-value>)",
        },
        neutral: {
          DEFAULT: "rgb(var(--color-neutral) / <alpha-value>)",
          bg: "rgb(var(--color-neutral-bg) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Montserrat_400Regular"],
        medium: ["Montserrat_500Medium"],
        semibold: ["Montserrat_600SemiBold"],
        bold: ["Montserrat_700Bold"],
      },
    },
  },
  plugins: [
    // On native a font weight needs its own font file: map font-* to the loaded faces.
    function montserratWeights({ addUtilities }) {
      addUtilities({
        ".font-normal": { fontFamily: "Montserrat_400Regular", fontWeight: "400" },
        ".font-medium": { fontFamily: "Montserrat_500Medium", fontWeight: "500" },
        ".font-semibold": { fontFamily: "Montserrat_600SemiBold", fontWeight: "600" },
        ".font-bold": { fontFamily: "Montserrat_700Bold", fontWeight: "700" },
        ".font-extrabold": { fontFamily: "Montserrat_700Bold", fontWeight: "800" },
      })
    },
  ],
}
