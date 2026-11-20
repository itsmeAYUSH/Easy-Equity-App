import { Redirect } from "expo-router"

/**
 * The Google sign-in returns to easyequity://auth/callback. The in-app browser
 * session usually consumes that link itself (lib/auth/oauth.ts); if Android
 * also routes it into the app, land on the home tab instead of "not found".
 */
export default function AuthCallback() {
  return <Redirect href="/" />
}
