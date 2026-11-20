import { Link, router } from "expo-router"
import { useRef, useState } from "react"
import { TextInput, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { AuthShell, isEmail, OrDivider } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/Button"
import { InputField } from "@/components/ui/InputField"
import { useSession } from "@/lib/auth/session"
import { haptics } from "@/lib/haptics"

export default function SignInScreen() {
  const { signInWithPassword, continueWithGoogle } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState<"password" | "google" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const passwordRef = useRef<TextInput>(null)

  const submit = async () => {
    if (!isEmail(email) || !password) {
      setError("Enter your email and password.")
      return
    }
    setBusy("password")
    setError(null)
    try {
      await signInWithPassword(email, password)
      // The root gate moves a signed-in user on (onboarding or back to the app).
      if (router.canGoBack()) router.back()
    } catch (e) {
      haptics.fail()
      setError(e instanceof Error ? e.message : "Sign-in failed.")
    } finally {
      setBusy(null)
    }
  }

  const google = async () => {
    setBusy("google")
    setError(null)
    try {
      await continueWithGoogle()
    } catch (e) {
      haptics.fail()
      setError(e instanceof Error ? e.message : "Google sign-in failed.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in with your EasyEquity account — the same one you use on the website.">
      <View className="gap-4">
        <InputField
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <InputField
          ref={passwordRef}
          label="Password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
        <Button title="Sign in" onPress={submit} loading={busy === "password"} disabled={busy !== null} />
        <Link href="/forgot-password" className="self-center py-1 text-sm font-semibold text-accent">
          Forgot password?
        </Link>
      </View>
      <OrDivider />
      <Button title="Continue with Google" icon="logo-google" variant="secondary" onPress={google} loading={busy === "google"} disabled={busy !== null} />
      <View className="mt-8 flex-row justify-center gap-1">
        <Text className="text-sm text-muted-foreground">New to EasyEquity?</Text>
        <Link href="/sign-up" replace className="text-sm font-semibold text-accent">
          Create an account
        </Link>
      </View>
    </AuthShell>
  )
}
