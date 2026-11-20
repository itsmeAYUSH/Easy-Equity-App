/**
 * Google sign-in on native: the same Supabase Google provider as the website,
 * opened in an in-app browser session (PKCE). Supabase redirects back to
 * `easyequity://auth/callback?code=…`, which is exchanged for a session.
 *
 * Needs the redirect URL `easyequity://auth/callback` in Supabase Dashboard →
 * Authentication → URL Configuration → Redirect URLs (see README).
 */
import * as Linking from "expo-linking"
import * as WebBrowser from "expo-web-browser"
import { Platform } from "react-native"

import { supabase } from "@/lib/supabase"

WebBrowser.maybeCompleteAuthSession()

export function oauthRedirectUrl(): string {
  return Linking.createURL("auth/callback")
}

/** Returns true when signed in, false when the user closed the browser. */
export async function googleSignIn(): Promise<boolean> {
  const redirectTo = oauthRedirectUrl()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== "web" },
  })
  if (error) throw error
  if (Platform.OS === "web") return true // the page navigates away

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  if (result.type !== "success") return false

  const { queryParams } = Linking.parse(result.url)
  const errorDescription = queryParams?.error_description
  if (typeof errorDescription === "string") throw new Error(errorDescription)
  const code = queryParams?.code
  if (typeof code !== "string") throw new Error("Google sign-in did not return a code.")
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) throw exchangeError
  return true
}
