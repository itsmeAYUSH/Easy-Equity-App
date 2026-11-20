# EasyEquity mobile — notes for coding agents

Expo SDK 54. Read the versioned docs at https://docs.expo.dev/versions/v54.0.0/ before
changing framework code.

- Data comes ONLY from the EasyEquity Express API (`src/api/endpoints.ts`), the same one the
  website uses (`D:\Ayush\Web Development\easy equity\easyEquity server`). Never connect to
  MongoDB from the app. Check a route's response shape in the server's `src/routes/*` before
  typing it in `src/lib/types.ts`.
- Screens call hooks in `src/hooks`, never `request()` directly. Query keys live in
  `src/queries/keys.ts`; per-user keys must never be persisted (`shouldPersistQuery`).
- Polling belongs only in `src/app/(tabs)/_layout.tsx` (`poll: true`). Readers elsewhere share
  the cache.
- Storage goes through `src/lib/storage.ts` (MMKV, AsyncStorage fallback).
- Styling: NativeWind classes with the website's palette tokens (`bg-card`, `text-bullish` …);
  `useColors()` for JS colours; the `Text` in `components/ui` (not React Native's) so Montserrat applies. Touch targets use `Tappable`. No `className` on Reanimated
  `Animated.View`.
- Before finishing: `npm run typecheck`, `npm run lint`, `npm test`.
