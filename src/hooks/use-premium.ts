import { useQuery } from "@tanstack/react-query"

import { premiumApi } from "@/api/endpoints"
import { useSession } from "@/lib/auth/session"
import { qk } from "@/queries/keys"

export function usePremiumStatus() {
  const { userId } = useSession()
  return useQuery({
    queryKey: qk.premium(userId),
    queryFn: premiumApi.status,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })
}
