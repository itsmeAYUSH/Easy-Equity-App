/**
 * Google sign-in on native: the same Supabase Google provider as the website,
 * opened in an in-app browser session (PKCE). Supabase redirects back to
 * `easyequity://auth/callback?code=…`, which is exchanged for a session.
 *
 * Needs the redirect URL `easyequity://auth/callback` in Supabase Dashboard →
 * Authentication → URL Configuration → Redirect URLs (see README). Supabase
 * sends a redirect that isn't on that list to the project's Site URL instead,
 * so the user lands on the website rather than back in the app.
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
  await completeOAuthRedirect(queryParams?.code, queryParams?.error_description)
  return true
}

let pending: { code: string; exchange: Promise<void> } | null = null

/**
 * Turn the `?code=` Supabase returned into a session. Both the browser session
 * above and the `auth/callback` route can receive the same link (and only the
 * route does if Android restarted the app meanwhile), so one code is exchanged
 * once; the PKCE verifier it needs is persisted, so a restart doesn't lose it.
 */
export function completeOAuthRedirect(code: unknown, errorDescription?: unknown): Promise<void> {
  if (typeof errorDescription === "string" && errorDescription) return Promise.reject(new Error(errorDescription))
  if (typeof code !== "string" || !code) return Promise.reject(new Error("Google sign-in did not return a code."))
  if (pending?.code !== code) {
    const exchange = supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) throw error
    })
    pending = { code, exchange }
  }
  return pending.exchange
}
