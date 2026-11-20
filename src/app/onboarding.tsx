import Ionicons from "@expo/vector-icons/Ionicons"
import * as WebBrowser from "expo-web-browser"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { authApi } from "@/api/endpoints"
import { errorMessage } from "@/api/errors"
import { Button } from "@/components/ui/Button"
import { Segmented } from "@/components/ui/Chips"
import { Tappable } from "@/components/ui/Tappable"
import { Page } from "@/components/ui/Page"
import { InputField } from "@/components/ui/InputField"
import { LEGAL_PAGES, LEGAL_VERSION } from "@/constants/legal"
import { useSession } from "@/lib/auth/session"
import { haptics } from "@/lib/haptics"
import { useColors } from "@/lib/appearance"

type Experience = "Beginner" | "Intermediate" | "Advanced"

/**
 * Same onboarding as the website (OnboardingPage): name, experience and the
 * Terms/Privacy consent, saved to the same MongoDB user with LEGAL_VERSION.
 * The API refuses to finish onboarding without consent.
 */
export default function OnboardingScreen() {
  const { profile, refreshProfile, signOut } = useSession()
  const p = useColors()
  const [name, setName] = useState(profile?.display_name ?? "")
  const [city, setCity] = useState(profile?.city ?? "")
  const [experience, setExperience] = useState<Experience>((profile?.experience_level as Experience) ?? "Beginner")
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!name.trim()) return setError("Please fill in your name.")
    if (!agreed) return setError("Please agree to the Terms of Service and Privacy Policy to continue.")
    setBusy(true)
    setError(null)
    try {
      await authApi.updateProfile({
        display_name: name.trim(),
        city: city.trim() || undefined,
        country: profile?.country ?? "India",
        experience_level: experience,
        onboarding_completed: true,
        accept_terms: true,
        terms_version: LEGAL_VERSION,
      })
      haptics.success()
      // The gate sees onboarding_completed and lets the user into the app.
      await refreshProfile()
    } catch (e) {
      haptics.fail()
      setError(errorMessage(e, "Could not save your details."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-6 pb-8 pt-6">
          <Text className="text-2xl font-bold text-foreground">Welcome to EasyEquity 👋</Text>
          <Text className="mt-2 text-sm leading-5 text-muted-foreground">A few details so we can tailor explanations to you.</Text>

          <View className="mt-8 gap-5">
            <InputField label="Your name" icon="person-outline" value={name} onChangeText={setName} autoComplete="name" />
            <InputField label="City (optional)" icon="location-outline" value={city} onChangeText={setCity} />
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Investing experience</Text>
              <Segmented<Experience>
                options={[
                  { value: "Beginner", label: "Beginner" },
                  { value: "Intermediate", label: "Intermediate" },
                  { value: "Advanced", label: "Advanced" },
                ]}
                value={experience}
                onChange={setExperience}
              />
            </View>

            <Tappable
              onPress={() => setAgreed((a) => !a)}
              role="checkbox"
              aria-checked={agreed}
              className="flex-row items-start gap-3 rounded-xl border border-border bg-card p-3"
            >
              <Ionicons name={agreed ? "checkbox" : "square-outline"} size={22} color={agreed ? p.accent : p.mutedForeground} />
              <Text className="flex-1 text-sm leading-5 text-foreground">
                I agree to the{" "}
                <Text className="font-semibold text-accent" onPress={() => void WebBrowser.openBrowserAsync(LEGAL_PAGES.terms)}>
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text className="font-semibold text-accent" onPress={() => void WebBrowser.openBrowserAsync(LEGAL_PAGES.privacy)}>
                  Privacy Policy
                </Text>
                , and understand EasyEquity provides information, not investment advice.
              </Text>
            </Tappable>

            {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
            <Button title="Continue" onPress={submit} loading={busy} />
            <Button title="Sign out" variant="ghost" onPress={() => void signOut()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  )
}
