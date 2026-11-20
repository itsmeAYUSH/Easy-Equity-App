/**
 * HTTP client for the EasyEquity Express API — the same API (and MongoDB) the
 * website uses. Plain fetch, no extra HTTP library.
 *
 * - Adds the Supabase access token when the user is signed in.
 * - Fails at once when the device is offline, instead of waiting for a timeout.
 * - On a 401 it refreshes the session once and retries. If the refresh itself
 *   is rejected, the user is signed out (SessionProvider then clears their data);
 *   if it couldn't reach the server, the session is kept.
 * - Every failure is an HttpError with a sentence that is safe to show.
 */
import { onlineManager } from "@tanstack/react-query"

import { HttpError, statusMessage } from "@/api/errors"
import { API_URL } from "@/lib/config"
import { supabase } from "@/lib/supabase"

/** Render's free plan can take ~50 s to wake up. */
const DEFAULT_TIMEOUT_MS = 30_000
/** The API waits up to 45 s for Gemini. */
export const AI_TIMEOUT_MS = 75_000

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  timeoutMs?: number
  signal?: AbortSignal
  /** Public data: send without the user's token. */
  anonymous?: boolean
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.append(key, String(value))
  }
  const qs = params.toString()
  return `${API_URL}${path}${qs ? `?${qs}` : ""}`
}

async function send(path: string, opts: RequestOptions, token: string | null): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  const cancel = () => controller.abort()
  opts.signal?.addEventListener("abort", cancel)
  try {
    return await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    })
  } catch (error) {
    if (opts.signal?.aborted) throw error // cancelled by React Query (screen left): not a failure
    throw new HttpError(statusMessage(0), 0)
  } finally {
    clearTimeout(timer)
    opts.signal?.removeEventListener("abort", cancel)
  }
}

/** The API's 4xx errors are plain-English sentences (the website shows them too); 5xx text is not. */
async function errorFrom(res: Response): Promise<HttpError> {
  const payload: Record<string, unknown> = await res.json().catch(() => ({}))
  const asText = (v: unknown) => (typeof v === "string" ? v.trim() : "")
  const serverSentence = asText(payload.error) || asText(payload.message)
  const message = res.status < 500 && serverSentence ? serverSentence : statusMessage(res.status)
  return new HttpError(message, res.status, asText(payload.code) || undefined, payload)
}

async function currentToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (!onlineManager.isOnline()) throw new HttpError(statusMessage(0), 0)

  const token = opts.anonymous ? null : await currentToken()
  const started = Date.now()
  let res = await send(path, opts, token)

  if (res.status === 401 && token) {
    const { data, error } = await supabase.auth.refreshSession()
    if (data.session) {
      res = await send(path, opts, data.session.access_token)
    } else if (error?.name === "AuthRetryableFetchError") {
      throw new HttpError(statusMessage(0), 0) // couldn't reach Supabase: keep the session
    } else {
      // Supabase rejected the refresh: the session is over. SessionProvider
      // reacts to the sign-out and clears this user's cached data.
      void supabase.auth.signOut().catch(() => undefined)
      throw new HttpError("Your session has expired. Please sign in again.", 401)
    }
  }

  if (__DEV__) console.log(`[api] ${res.status} ${opts.method ?? "GET"} ${path} · ${Date.now() - started} ms`)

  if (!res.ok) throw await errorFrom(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
