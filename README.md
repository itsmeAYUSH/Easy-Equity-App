# EasyEquity — mobile app

The iOS / Android app for [EasyEquity](https://www.easyequity.in.net): market news with AI
impact tags and a daily AI digest, live markets (heatmap, breadth, commodities, currencies,
macro), stock pages with charts and AI analysis, sector intelligence, the Nifty 50, stock
comparison, IPOs with GMP, mutual funds, a screener, an earnings calendar, five calculators,
beginner guides and a glossary, a watchlist, a portfolio tracker (XIRR, allocation, dividends,
Portfolio AI) and price alerts — the same features as the website.

**Stack:** Expo SDK 54 · expo-router 6 · TypeScript · NativeWind 4 (Tailwind) ·
TanStack React Query 5 · Supabase Auth · react-native-mmkv · FlashList · Reanimated 4 ·
expo-image · react-native-svg.

## Same database as the website

The app does **not** connect to MongoDB directly (that would put the database password
inside every installed app). It talks to the **same Express API** the website uses, which
owns the MongoDB database, and signs in with the **same Supabase project**:

```
Mobile app ──► Express API (Render, /api/*) ──► MongoDB Atlas   ← same as the website
    │
    └── Supabase Auth (same project as the website)
```

One account works everywhere: a stock starred on the phone appears in the website's
watchlist, a holding added on the web shows in the app's portfolio, and Pro bought on the
website unlocks in the app.

## Run it

Needs Node 22 or 24.

```bash
npm install
cp .env.example .env.local      # the website's public API + Supabase values are pre-filled
npx expo start                  # then press a (Android) / i (iOS)
```

- **Expo Go** works for a quick look (storage uses AsyncStorage there).
- **In a browser:** `npm run web`. The API only allows the website's own domains (CORS), so
  a page on `localhost` can't call it directly. `npm run web` starts a small proxy on this
  computer (`scripts/web-dev.mjs`, port 3999, localhost only) that forwards `/api/*` and adds
  CORS headers for localhost pages. `API_TARGET=http://localhost:3001` proxies to a local
  backend instead. The phone app doesn't need any of this: native apps aren't subject to CORS.
- **A development build** uses MMKV for storage: `npx expo run:android` /
  `npx expo run:ios`, or `eas build --profile development`.
- **Against a local API:** run the backend (`easyEquity server`, port 3001) and leave
  `EXPO_PUBLIC_API_URL` unset in `.env.local`. Dev builds then call
  `http://<your computer's LAN IP>:3001/api`. See the backend README's warning about
  using production keys locally.

## Build an APK

Builds run in the cloud on EAS (Expo's build service; free plan available), so no Android
SDK is needed on your computer.

```bash
npm install -g eas-cli
eas login                 # your Expo account
eas init                  # first time only: links this folder to an Expo project
npm run build:apk         # = eas build --platform android --profile preview
```

When the build finishes (about 10–20 minutes), EAS prints a link and a QR code: open it on the
phone, download the `.apk` and install it (allow "Install unknown apps" for your browser).
EAS creates and keeps the signing key for you.

- `npm run build:aab` builds the `.aab` that the Google Play Store needs.
- EAS expects a git repository (`git init`, then commit). Without one, set `EAS_NO_VCS=1`.
- The public API/Supabase values the build needs are in `eas.json` (`build.base.env`);
  `.env.local` is not uploaded.

## One-time setup outside the code

| What | Where | Why |
|---|---|---|
| Add `easyequity://auth/callback` (and `exp://**` for Expo Go) | Supabase → Authentication → URL Configuration → Redirect URLs | Google sign-in returns to the app through this link. A link missing from this list is replaced by the Site URL, so the user lands on the website instead |
| Site URL `https://www.easyequity.in.net` | Supabase → Authentication → URL Configuration → Site URL | The fallback above, and where confirmation emails lead; it must not be an old domain such as the `vercel.app` one |
| App id `net.in.easyequity.app` | `app.json` (`ios.bundleIdentifier`, `android.package`) | Taken from the domain easyequity.in.net; change it before the first store build if you want another |
| `eas init` | once, in this folder | Links the project to your Expo account for EAS builds |

The API needs **no changes**: native apps don't send an `Origin` header, so CORS doesn't
apply, and the API already accepts the Supabase bearer token from any client.

## Checks

| Command | Does |
|---|---|
| `npm run typecheck` | TypeScript (strict, typed routes) |
| `npm run lint` | ESLint (Expo rules) |
| `npm test` | Unit tests for the pure logic (symbols, market hours, SIP/CAGR, text, cache rules) |
| `npx expo export --platform android` | Full production bundle: proves the Babel/Metro/NativeWind setup |

## Layout

```
src/
  app/                 expo-router routes
    (tabs)/            News (+ AI digest card) · Markets · IPOs · Portfolio · More
    (auth)/            sign-in, sign-up, forgot-password
    article/[id]       story + "Explain simply" (AI) + related news
    stock/[symbol]     scrubbable chart, key stats, 52W range, company profile & peers,
                       AI analysis (with credits left), news, watchlist ★, alert ⏰, compare
    ipo/[slug]         GMP (kostak, sauda), timeline, subscription by category, reminders
    mutual-funds/      search + fund page (NAV chart and returns for 1M…All)
    sectors/           AI sector outlook + Nifty 50 by NSE sector, sector pages
    calculators/       SIP, SWP, CAGR, capital gains tax, brokerage & charges
    learn/, glossary   beginner guides and market terms (same content as the website)
    digest, stocks (Nifty 50), compare, calendar, market-holidays, search (stocks + news),
    screener, alerts, notifications, profile, pro, onboarding
  api/                 client.ts (fetch + auth + errors), endpoints.ts (every API call), errors.ts
  components/          ui/ building blocks, news/, market/, ipo/, charts/, auth/
  constants/           theme (the website's palette), fonts, legal (shared with the website)
  content/             learn guides (generated from the website's learn.tsx) and glossary
  hooks/               React Query hooks per area (use-market, use-ai, use-portfolio, use-account …)
  lib/                 supabase, storage, config, format, ipo, market-status, calculators,
                       portfolio (XIRR), mutual-funds, nifty50, news-terms, ai
  providers/           Theme → Query → Auth
  queries/             QueryClient, query keys, what gets saved between launches
```

## Performance

- **MMKV storage** (`src/lib/storage.ts`) for the sign-in session, theme and cached data:
  synchronous reads at launch. Falls back to AsyncStorage in Expo Go and on web.
- **Cache kept between launches** — news, tickers, movers and IPOs show instantly on the next
  start while fresh data loads. Per-user data is never written to disk.
- **One place polls** — only the tabs layout refreshes tickers (every 60 s in NSE hours, 5 min
  outside) and notifications; other screens read the shared cache. This keeps the app well
  inside the API's limit of 200 requests per 15 minutes.
- **Background and offline aware** — nothing polls while the app is in the background,
  requests pause offline and resume on reconnect, and the Supabase token refreshes only while
  the app is open.
- **401 → refresh once → retry**; the user is signed out only if Supabase rejects the refresh.
- **Instant feedback** — starring, removing holdings and alerts, and marking notifications read
  update at once and roll back if the API refuses.
- **Detail pages open instantly** from lists (the list data seeds the detail cache).
- **FlashList** for long lists, memoised rows, **expo-image** with memory + disk cache.
- **Animations on the UI thread** (Reanimated); reduced-motion settings are respected.
- **Splash stays up** until fonts, the saved theme and the stored session are ready.
- **Only the 4 Montserrat weights used** are bundled (per-weight imports; the package index
  would add all 18, ~6 MB).

## Things that are easy to break

- **NativeWind and Pressable:** don't give `Pressable` a function `style` — NativeWind drops
  it. Use `Tappable`.
- **`className` on Reanimated's `Animated.View` is ignored** — animate the outer view and put
  classes on an inner `View` (see `InfoState`). `Tappable` is registered with `cssInterop`.
- **Symbols:** search returns exact Yahoo symbols (`AAPL`, `RELIANCE.NS`); movers and article
  tickers are bare NSE symbols (`ITC`). Convert bare ones with `toYahooSymbol` before opening
  `/stock/[symbol]`. The website saves watchlist symbols in both forms, so matching uses the
  Yahoo form (a bare US ticker saved on the web is read as NSE — same as the website).
- **`LEGAL_VERSION`** in `src/constants/legal.ts` must match the website's.
- **Shared data with the website:** `src/lib/nifty50.ts` (after each index review),
  `src/lib/calculators.ts` tax/charge rates (after each Budget), `src/content/glossary.ts`
  and `src/content/learn.ts` (the guides, converted from the website's JSX).
- **AI "warming up" answers** come back as HTTP 200 placeholders; `lib/ai.ts` spots them so
  they are re-asked every 45 s and never saved to disk.
- **NSE holidays** in `src/lib/market-status.ts`: update each December (same as the website).

## Payments

Pro is bought on the website (Razorpay). The app shows the plan and unlocks Pro for the same
account, but has **no in-app "buy" button or link**: Apple (3.1.1) and Google Play require their
own billing for digital subscriptions bought inside an app. Selling Pro in the app would need
in-app purchases plus a server webhook that sets the same `is_premium` fields.

## Store requirements already covered

- Account deletion inside the app (Profile → Delete account) — App Store rule 5.1.1(v).
- Terms/Privacy consent at onboarding, stored with the same version as the website.
- AI and mutual-fund risk disclaimers wherever that content appears.
#   E a s y - E q u i t y - A p p  
 