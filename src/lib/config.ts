/**
 * Runtime configuration. Metro inlines EXPO_PUBLIC_* at build time, so these
 * are plain constants on device.
 */
import Constants from "expo-constants"
import { Platform } from "react-native"

/** The Express API on Render — same backend (and MongoDB) as the website. */
export const PRODUCTION_API = "https://easy-equity.onrender.com/api"
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL || "https://www.easyequity.in.net").replace(/\/+$/, "")

/**
 * API base URL, always ending in /api.
 *
 * A release build falls back to the production API, so a build made without
 * the env var still works. In development an explicit EXPO_PUBLIC_API_URL wins;
 * otherwise a native dev client talks to the local API (port 3001) on the
 * computer running Metro.
 */
const TUNNEL_HOST = /\.(exp\.direct|ngrok-free\.app|ngrok\.app|trycloudflare\.com)$/

function resolveApiUrl(): string {
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL ?? "").trim()
  if (fromEnv) return fromEnv.endsWith("/") ? fromEnv.slice(0, -1) : fromEnv
  if (!__DEV__) return PRODUCTION_API
  if (Platform.OS === "web") return "http://localhost:3001/api"
  // The computer running Metro, as the phone sees it (its LAN address).
  const devMachine = (Constants.expoConfig?.hostUri ?? "").split(":")[0]
  // A tunnel can't reach port 3001 on that computer, so use production then.
  if (!devMachine || TUNNEL_HOST.test(devMachine)) return PRODUCTION_API
  return `http://${devMachine}:3001/api`
}

export const API_URL = resolveApiUrl()

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ""
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ""

/** Deep-link scheme (app.json "scheme") — used for the Google sign-in return. */
export const APP_SCHEME = "easyequity"
