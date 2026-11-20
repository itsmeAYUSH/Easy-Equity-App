// Types and display helpers for IPOs (same as the website's src/lib/ipo.ts).
// Data comes from our backend (/api/ipo), which caches IPO Guru.

export type IpoStatus = "upcoming" | "open" | "closed" | "listed"
export type IpoBoard = "Mainboard" | "SME"

export interface IpoGmp {
  price: number | null
  percent: number | null
  estListingPrice: number | null
  kostak: string | null
  subjectToSauda: string | null
  updatedAt: string | null
  updatedLabel: string | null
}

export interface Ipo {
  slug: string
  name: string
  displayName: string
  board: IpoBoard
  subType: string | null
  stage: string | null
  datesTba: boolean
  isListed: boolean
  logo: string | null
  openDate: string | null
  closeDate: string | null
  allotmentDate: string | null
  listingDate: string | null
  priceBand: string | null
  priceMin: number | null
  priceMax: number | null
  issuePrice: number | null
  issueSizeCr: number | null
  lotSize: number | null
  minInvestment: number | null
  gmp: IpoGmp | null
  subscriptionTimes: number | null
  listingPrice: number | null
  listingGainPct: number | null
  cmp: number | null
  currentGainPct: number | null
  webUrl: string | null
  status: IpoStatus
}

export interface IpoDetail {
  timeline: {
    openDate: string | null
    closeDate: string | null
    allotmentDate: string | null
    refundDate: string | null
    creditToDematDate: string | null
    listingDate: string | null
  }
  issue: {
    issueSizeCr: number | null
    issuePrice: number | null
    priceBand: string | null
    priceMin: number | null
    priceMax: number | null
    faceValue: number | null
    lotSize: number | null
    minInvestment: number | null
    saleType: string | null
    listingOn: string | null
    bseScripCode: string | null
    nseSymbol: string | null
  }
  gmp: IpoGmp | null
  subscription: {
    total: number | null
    qib: number | null
    nii: number | null
    retail: number | null
    employee: number | null
    shareholder: number | null
    anchor: number | null
    applications: number | null
    updatedAt: string | null
    updatedLabel: string | null
  } | null
  listing: {
    listingPrice: number | null
    listingGainPct: number | null
    cmp: number | null
    currentGainPct: number | null
  } | null
  locked: string[]
}

export interface IpoListResponse {
  ipos: Ipo[]
  updatedAt: string | null
  nextRefreshAt: string
  warming: boolean
  retryAfterSec: number | null
}

export interface IpoDetailResponse {
  ipo: Ipo
  detail: IpoDetail | null
  detailFetchedAt: string | null
  detailState: "ready" | "pending" | "unavailable"
  retryAfterSec: number | null
  updatedAt: string | null
}

export const STATUS_LABEL: Record<IpoStatus, string> = {
  open: "Open",
  upcoming: "Upcoming",
  closed: "Closed",
  listed: "Listed",
}

/** Today's date (YYYY-MM-DD) in IST — IPO dates are Indian calendar days. */
export function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10)
}

/** "22 Sep" (or "22 Sep 2026"). Parsed as calendar days, no time-zone shift. */
export function fmtIpoDate(d: string | null | undefined, withYear = false): string {
  if (!d) return "TBA"
  const parsed = new Date(`${d.slice(0, 10)}T00:00:00Z`)
  if (isNaN(parsed.getTime())) return d
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  })
}

/** "₹140 – ₹148", or the final issue price once fixed. */
export function priceLabel(ipo: Pick<Ipo, "issuePrice" | "priceMin" | "priceMax" | "priceBand">): string {
  const n = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 2 })
  if (ipo.priceMin != null && ipo.priceMax != null && ipo.priceMin !== ipo.priceMax) {
    return `₹${n(ipo.priceMin)} – ₹${n(ipo.priceMax)}`
  }
  if (ipo.priceMax != null) return `₹${n(ipo.priceMax)}`
  if (ipo.issuePrice != null) return `₹${n(ipo.issuePrice)}`
  return ipo.priceBand ? `₹${ipo.priceBand}` : "TBA"
}

/** Short, date-aware phrase for an IPO's current stage. */
export function stageLabel(ipo: Ipo, today = todayIST()): string {
  switch (ipo.status) {
    case "open":
      return ipo.closeDate === today ? "Closes today" : `Closes ${fmtIpoDate(ipo.closeDate)}`
    case "upcoming":
      if (ipo.datesTba || !ipo.openDate) return "Dates TBA"
      return ipo.openDate === today ? "Opens today" : `Opens ${fmtIpoDate(ipo.openDate)}`
    case "closed":
      if (ipo.listingDate) return `Lists ${fmtIpoDate(ipo.listingDate)}`
      return `Closed ${fmtIpoDate(ipo.closeDate)}`
    case "listed":
      return ipo.listingDate === today ? "Listed today" : `Listed ${fmtIpoDate(ipo.listingDate, true)}`
  }
}

/** Sort order for the list: open first, then upcoming, closed, listed. */
export const STATUS_ORDER: Record<IpoStatus, number> = { open: 0, upcoming: 1, closed: 2, listed: 3 }
