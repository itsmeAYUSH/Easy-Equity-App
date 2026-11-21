import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { accountApi, authApi, emailApi } from "@/api/endpoints"
import { useSession } from "@/lib/auth/session"
import { haptics } from "@/lib/haptics"
import type { ProfileUpdate } from "@/lib/types"
import { qk } from "@/queries/keys"

/** Save profile fields; the session's profile is re-read afterwards. */
export function useUpdateProfile() {
  const { refreshProfile } = useSession()
  return useMutation({
    mutationFn: (data: ProfileUpdate) => authApi.updateProfile(data),
    onSuccess: async () => {
      haptics.success()
      await refreshProfile()
    },
    onError: () => haptics.fail(),
  })
}

/** Email notification opt-ins (same switches as the website's profile). */
export function useEmailPrefs() {
  const { userId } = useSession()
  const client = useQueryClient()
  const prefs = useQuery({ queryKey: qk.emailPrefs(userId), queryFn: emailApi.prefs, enabled: !!userId })
  const update = useMutation({
    mutationFn: emailApi.updatePrefs,
    onSuccess: (data) => client.setQueryData(qk.emailPrefs(userId), data),
    onError: () => haptics.fail(),
  })
  return { prefs, update }
}

/** Everything stored about the user, as JSON (data-rights export). */
export function useExportData() {
  return useMutation({ mutationFn: accountApi.export })
}

/** Permanently delete the account, then sign out. */
export function useDeleteAccount() {
  const { signOut } = useSession()
  return useMutation({
    mutationFn: () => accountApi.delete("DELETE"),
    onSuccess: () => void signOut(),
  })
}
