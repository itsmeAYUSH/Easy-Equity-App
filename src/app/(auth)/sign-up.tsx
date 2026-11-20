import { Link, router } from "expo-router"
import { useState } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { AuthShell, isEmail, OrDivider } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/Button"
import { Notice } from "@/components/ui/Notice"
import { InputField } from "@/components/ui/InputField"
import { useSession } from "@/lib/auth/session"
import { haptics } from "@/lib/haptics"

export default function SignUpScreen() {
  const { createAccount, continueWithGoogle } = useSession()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState<"form" | "google" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    if (!name.trim()) return setError("Enter your name.")
    if (!isEmail(email)) return setError("Enter a valid email address.")
    if (password.length < 8) return setError("Use at least 8 characters for your password.")
    setBusy("form")
    setError(null)
    try {
      const { needsConfirmation } = await createAccount(name, email, password)
      haptics.success()
      if (needsConfirmation) setSent(true)
      else if (router.canGoBack()) router.back()
    } catch (e) {
      haptics.fail()
      setError(e instanceof Error ? e.message : "Couldn't create your account.")
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

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a confirmation link to ${email.trim()}. Open it, then come back and sign in.`}>
        <Button title="Go to sign in" onPress={() => router.replace("/sign-in")} />
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create your account" subtitle="Free forever: news with AI impact tags, live markets, IPO GMP, a watchlist and a portfolio tracker.">
      <View className="gap-4">
        <InputField label="Name" icon="person-outline" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
        <InputField
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <InputField
          label="Password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
        <Button title="Create account" onPress={submit} loading={busy === "form"} disabled={busy !== null} />
      </View>
      <OrDivider />
      <Button title="Continue with Google" icon="logo-google" variant="secondary" onPress={google} loading={busy === "google"} disabled={busy !== null} />
      <View className="mt-6">
        <Notice text="You'll agree to the Terms of Service and Privacy Policy in the next step." />
      </View>
      <View className="mt-6 flex-row justify-center gap-1">
        <Text className="text-sm text-muted-foreground">Already have an account?</Text>
        <Link href="/sign-in" replace className="text-sm font-semibold text-accent">
          Sign in
        </Link>
      </View>
    </AuthShell>
  )
}
