/**
 * Lays out the news tab: one lead story, a "Trending" strip, then the rest.
 * Pure (no React Native), so it is unit-tested in plain Node.
 */
import type { Article } from "./types"

export type FeedItem =
  | { type: "hero"; key: string; article: Article }
  | { type: "carousel"; key: string; articles: Article[] }
  | { type: "heading"; key: string; title: string; subtitle?: string }
  | { type: "row"; key: string; article: Article }

/** How far down the list we look for a story with a picture to lead with. */
const HERO_LOOKAHEAD = 6
/** Stories in the "Trending" strip, and the fewest stories that justify one. */
const TRENDING_COUNT = 5
const MIN_FOR_TRENDING = 9

export function buildNewsFeed(articles: Article[]): FeedItem[] {
  if (!articles.length) return []

  // Lead with the newest story that has a picture, if one is near the top.
  const withImage = articles.slice(0, HERO_LOOKAHEAD).findIndex((a) => !!a.image_url)
  const heroIndex = withImage === -1 ? 0 : withImage
  const hero = articles[heroIndex]
  const rest = articles.filter((_, i) => i !== heroIndex)

  const items: FeedItem[] = [{ type: "hero", key: `hero-${hero.id}`, article: hero }]

  let latest = rest
  if (articles.length >= MIN_FOR_TRENDING) {
    items.push({ type: "heading", key: "h-trending", title: "Trending now", subtitle: "The stories moving markets" })
    items.push({ type: "carousel", key: "trending", articles: rest.slice(0, TRENDING_COUNT) })
    latest = rest.slice(TRENDING_COUNT)
  }

  if (latest.length) {
    items.push({ type: "heading", key: "h-latest", title: "Latest news" })
    for (const a of latest) items.push({ type: "row", key: a.id, article: a })
  }
  return items
}
