/**
 * Display cleanup for news text (same as the website's lib/text.ts). New
 * articles are cleaned on the server; this also fixes older ones that still
 * contain "&nbsp;" and summaries that only repeat the headline.
 */

const NAMED: Record<string, string> = {
  nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…",
}

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : match
    }
    return NAMED[code.toLowerCase()] ?? match
  })
}

/** Decode leftover HTML entities, drop tags and collapse whitespace. */
export function cleanNewsText(text?: string | null): string {
  return decode(decode(text ?? ""))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const words = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []

/** True when a summary only repeats the headline (common for Google News). */
export function repeatsTitle(title: string, summary: string): boolean {
  const titleWords = new Set(words(title))
  const summaryWords = words(summary)
  return summaryWords.length > 0 && summaryWords.every((w) => titleWords.has(w))
}
