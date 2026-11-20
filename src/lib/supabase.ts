/**
 * Supabase — used only for sign-in, exactly as on the website. All app data
 * lives in MongoDB behind the Express API, which checks this session's access
 * token on every request.
 */
import { createClient } from "@supabase/supabase-js"
import { AppState, Platform } from "react-native"

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config"
import { storage } from "@/lib/storage"

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY not set — copy .env.example to .env.local")
}

export const supabase = createClient(SUPABASE_URL || "https://invalid.supabase.co", SUPABASE_ANON_KEY || "missing", {
  auth: {
    storage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === "web",
    // PKCE: Google sign-in returns a ?code= to our deep link (lib/auth/oauth.ts).
    flowType: "pkce",
  },
})

// Supabase's React Native guidance: refresh the token only while the app is in
// the foreground, so no refresh timer runs (and fails) in the background.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh()
    else supabase.auth.stopAutoRefresh()
  })
}
