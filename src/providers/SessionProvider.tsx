/**
 * Sign-in state: the Supabase session (same project as the website) plus the
 * MongoDB profile from GET /auth/me (plan, onboarding, admin).
 *
 * - `restoring` ends as soon as the stored session is read; the profile
 *   loads after, so a signed-in launch never waits for Render to wake up.
 * - Signing out, or switching accounts, drops every per-user query, so one
 *   account's watchlist or portfolio never shows for the next.
 */
import type { Session } from "@supabase/supabase-js"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { authApi } from "@/api/endpoints"
import { SessionContext, type SessionState } from "@/lib/auth/session"
import { googleSignIn } from "@/lib/auth/oauth"
import { SITE_URL } from "@/lib/config"
import { supabase } from "@/lib/supabase"
import { queryClient } from "@/queries/client"
import { qk, shouldPersistQuery } from "@/queries/keys"

/** Drop everything that belongs to a user; keep public news/market data. */
function clearUserQueries() {
  queryClient.removeQueries({ predicate: (q) => !shouldPersistQuery(q.queryKey) })
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [restoring, setRestoring] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const lastUserId = useRef<string | undefined>(undefined)

  useEffect(() => {
    let active = true
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return
        lastUserId.current = data.session?.user.id
        setSession(data.session)
      })
      .catch(() => {})
      .finally(() => active && setRestoring(false))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      const nextId = next?.user.id
      if (nextId !== lastUserId.current) {
        clearUserQueries()
        lastUserId.current = nextId
      }
      setSession(next)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id
  const profileQuery = useQuery({
    queryKey: qk.me(userId),
    queryFn: async () => (await authApi.me()).user,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })
  const profile = userId ? (profileQuery.data ?? null) : null

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error(explainAuthError(error.message))
  }, [])

  const createAccount = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // full_name is picked up by the API's ensureUser as the display name.
      options: { emailRedirectTo: SITE_URL, data: { full_name: name.trim() } },
    })
    if (error) throw new Error(explainAuthError(error.message))
    return { needsConfirmation: !data.session }
  }, [])

  const continueWithGoogle = useCallback(async () => {
    await googleSignIn()
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    // Same flow as the website: the link opens the web profile page to set a new password.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${SITE_URL}/profile` })
    if (error) throw new Error(explainAuthError(error.message))
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => {})
    clearUserQueries()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (userId) await queryClient.invalidateQueries({ queryKey: qk.me(userId) })
  }, [userId])

  const value = useMemo<SessionState>(
    () => ({
      restoring,
      session,
      userId,
      profile,
      needsOnboarding: !!profile && !profile.onboarding_completed,
      isPro: !!profile?.is_premium,
      signInWithPassword,
      createAccount,
      continueWithGoogle,
      sendPasswordReset,
      signOut,
      refreshProfile,
    }),
    [restoring, session, userId, profile, signInWithPassword, createAccount, continueWithGoogle, sendPasswordReset, signOut, refreshProfile],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

/** Supabase's English is fine to show, with a few made clearer. */
function explainAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Wrong email or password."
  if (/email not confirmed/i.test(message)) return "Please confirm your email first — check your inbox for the link."
  if (/user already registered/i.test(message)) return "An account with this email already exists. Sign in instead."
  if (/network|fetch/i.test(message)) return "Can't reach the sign-in service. Check your connection."
  return message
}
