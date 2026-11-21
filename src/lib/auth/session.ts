import type { Session } from "@supabase/supabase-js"
import { createContext, useContext } from "react"

import type { AppUser } from "@/lib/types"

export type SessionState = {
  /** True until the stored session has been read once (the splash stays up). */
  restoring: boolean
  session: Session | null
  /** The signed-in user's id (Supabase auth id; also the API's user_id). */
  userId: string | undefined
  /** The MongoDB profile from /auth/me — plan, onboarding, admin. Null for guests or while loading. */
  profile: AppUser | null
  /** Signed in but onboarding (terms + experience) not finished yet. */
  needsOnboarding: boolean
  isPro: boolean
  signInWithPassword: (email: string, password: string) => Promise<void>
  createAccount: (name: string, email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  continueWithGoogle: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  /** Set a new password for the signed-in user (also lets a Google user sign in with email). */
  changePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const SessionContext = createContext<SessionState | undefined>(undefined)

/** The signed-in user (or guest) and the sign-in actions. */
export function useSession(): SessionState {
  const session = useContext(SessionContext)
  if (session === undefined) throw new Error("useSession() needs <SessionProvider> above it")
  return session
}
