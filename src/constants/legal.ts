/**
 * Legal copy shared with the website (easyequity-app/src/lib/legal.ts).
 * LEGAL_VERSION must match the website's: it is stored with the user's consent
 * in the same MongoDB user document. Bump both together.
 */
import { SITE_URL } from "@/lib/config"

export const LEGAL_VERSION = "2026-11-07"

export const LEGAL_PAGES = {
  terms: `${SITE_URL}/terms`,
  privacy: `${SITE_URL}/privacy`,
  disclaimer: `${SITE_URL}/disclaimer`,
  refund: `${SITE_URL}/refund-policy`,
  contact: `${SITE_URL}/contact`,
  howOurAiWorks: `${SITE_URL}/how-our-ai-works`,
  pricing: `${SITE_URL}/pricing`,
} as const

/** Shown wherever AI output appears. */
export const AI_DISCLAIMER =
  "AI-generated, and may be wrong or out of date. For information only — not investment advice or a recommendation to buy or sell. EasyEquity is not registered with SEBI."

export const MF_RISK_LINE =
  "Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing."

export const CRYPTO_RISK_LINE =
  "Crypto products and NFTs are unregulated in India and can be highly risky. There may be no regulatory recourse for any loss from such transactions."
