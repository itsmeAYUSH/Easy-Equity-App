/**
 * NSE open/closed status, from the website's lib/marketHolidays.ts and
 * IndianMarketStatus. UPDATE THE HOLIDAY LIST EACH DECEMBER (same as the web).
 */
/** The year the list below covers. */
export const MARKET_HOLIDAYS_YEAR = 2026

export const MARKET_HOLIDAYS: { date: string; name: string }[] = [
  { date: "2026-01-15", name: "Maharashtra Municipal Elections" },
  { date: "2026-01-26", name: "Republic Day" },
  { date: "2026-03-03", name: "Holi" },
  { date: "2026-03-26", name: "Shri Ram Navami" },
  { date: "2026-03-31", name: "Shri Mahavir Jayanti" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-14", name: "Dr. Baba Saheb Ambedkar Jayanti" },
  { date: "2026-05-01", name: "Maharashtra Day" },
  { date: "2026-05-28", name: "Bakri Id" },
  { date: "2026-06-26", name: "Muharram" },
  { date: "2026-09-14", name: "Ganesh Chaturthi" },
  { date: "2026-10-02", name: "Mahatma Gandhi Jayanti" },
  { date: "2026-10-20", name: "Dussehra" },
  { date: "2026-11-08", name: "Diwali Laxmi Pujan (Sunday; Muhurat trading, timing per NSE)" },
  { date: "2026-11-10", name: "Diwali Balipratipada" },
  { date: "2026-11-24", name: "Prakash Gurpurb Sri Guru Nanak Dev" },
  { date: "2026-12-25", name: "Christmas" },
]

export type MarketStatus = { state: "open" | "pre-open" | "closed" | "holiday"; label: string }

/** Wall-clock parts in India, independent of the phone's time zone. */
function indiaParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ""
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10),
    weekday: get("weekday"),
  }
}

export function nseStatus(now: Date = new Date()): MarketStatus {
  const { date, minutes, weekday } = indiaParts(now)
  if (weekday === "Sat" || weekday === "Sun") return { state: "closed", label: "Closed · Weekend" }
  const holiday = MARKET_HOLIDAYS.find((h) => h.date === date)
  if (holiday) return { state: "holiday", label: `Holiday · ${holiday.name}` }
  if (minutes >= 9 * 60 && minutes < 9 * 60 + 15) return { state: "pre-open", label: "Pre-open" }
  if (minutes >= 9 * 60 + 15 && minutes < 15 * 60 + 30) return { state: "open", label: "Market open" }
  return { state: "closed", label: minutes < 9 * 60 ? "Opens 9:15 IST" : "Closed" }
}

/** Today's date in India as YYYY-MM-DD. */
export function todayInIndia(now: Date = new Date()): string {
  return indiaParts(now).date
}

/** True during NSE trading hours: live prices are worth polling more often. */
export function isMarketHours(now: Date = new Date()): boolean {
  const s = nseStatus(now).state
  return s === "open" || s === "pre-open"
}
