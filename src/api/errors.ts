/**
 * Normalised error thrown by every failed API request.
 *
 * `status` 0 means the server never answered (offline, timeout, Render waking
 * up). `code` is the API's stable code when it sends one (e.g. PRO_REQUIRED,
 * LIMIT_REACHED). `message` is always a sentence that is safe to show.
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = "HttpError"
  }

  /** The free plan's limit was hit (402 from alerts and AI). */
  get isProRequired(): boolean {
    return this.status === 402 || this.code === "PRO_REQUIRED"
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  0: "Can't reach EasyEquity. Check your connection and try again.",
  400: "That request wasn't valid.",
  401: "Please sign in to continue.",
  402: "You've reached the free plan's limit.",
  403: "You don't have access to this.",
  404: "Not found.",
  409: "That already exists.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our side. Please try again.",
  502: "The data source is temporarily unavailable. Please try again shortly.",
  503: "EasyEquity is temporarily unavailable. Please try again shortly.",
}

export function statusMessage(status: number): string {
  return STATUS_MESSAGES[status] ?? (status >= 500 ? STATUS_MESSAGES[500] : "Something went wrong. Please try again.")
}

/** The sentence to show for any failure, with the caller's fallback for unknowns. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof HttpError) return error.message || fallback
  return fallback
}
