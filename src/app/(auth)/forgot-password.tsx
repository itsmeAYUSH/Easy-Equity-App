import { router } from "expo-router"
import { useState } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { AuthShell, isEmail } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/Button"
import { InputField } from "@/components/ui/InputField"
import { useSession } from "@/lib/auth/session"

export default function ForgotPasswordScreen() {
  const { sendPasswordReset } = useSession()
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    if (!isEmail(email)) return setError("Enter a valid email address.")
    setBusy(true)
    setError(null)
    try {
      await sendPasswordReset(email)
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the reset link.")
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <AuthShell title="Reset link sent" subtitle={`Check ${email.trim()}. The link opens EasyEquity in your browser, where you can set a new password.`}>
        <Button title="Back to sign in" onPress={() => router.replace("/sign-in")} />
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Forgot password?" subtitle="Enter your email and we'll send you a link to set a new password.">
      <View className="gap-4">
        <InputField
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="send"
          onSubmitEditing={submit}
        />
        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
        <Button title="Send reset link" onPress={submit} loading={busy} />
      </View>
    </AuthShell>
  )
}
