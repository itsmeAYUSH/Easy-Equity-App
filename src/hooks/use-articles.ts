import { useQuery, useQueryClient } from "@tanstack/react-query"

import { aiApi, articlesApi } from "@/api/endpoints"
import type { Article } from "@/lib/types"
import { qk } from "@/queries/keys"

export type ArticleParams = { category?: string; search?: string; terms?: string; limit?: number }

export function useArticles(params: ArticleParams = {}, { enabled = true }: { enabled?: boolean } = {}) {
  const client = useQueryClient()
  return useQuery({
    queryKey: qk.articles(params),
    queryFn: async ({ signal }) => {
      const list = await articlesApi.list({ limit: 50, ...params }, signal)
      // Seed each article's detail cache: opening a story from the feed paints instantly.
      for (const a of list) {
        if (!client.getQueryData(qk.article(a.id))) client.setQueryData(qk.article(a.id), a)
      }
      return list
    },
    enabled,
    staleTime: 2 * 60_000,
  })
}

export function useArticle(id: string) {
  const client = useQueryClient()
  return useQuery({
    queryKey: qk.article(id),
    queryFn: ({ signal }) => articlesApi.get(id, signal),
    enabled: !!id,
    staleTime: 30 * 60_000,
    // The feed's copy shows at once while the full article loads.
    initialData: () => client.getQueryData<Article>(qk.article(id)),
  })
}

/** "Explain simply" — generated once per article on the server, then cached. Runs on demand. */
export function useExplainArticle(id: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.explain(id),
    queryFn: () => aiApi.explainArticle(id),
    enabled: enabled && !!id,
    staleTime: Infinity,
    retry: false,
  })
}
