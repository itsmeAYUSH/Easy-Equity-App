import Ionicons from "@expo/vector-icons/Ionicons"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Share, Switch, View } from "react-native"

import { errorMessage } from "@/api/errors"
import { Button } from "@/components/ui/Button"
import { Segmented } from "@/components/ui/Chips"
import { InputField } from "@/components/ui/InputField"
import { Card, Notice } from "@/components/ui/Notice"
import { Page } from "@/components/ui/Page"
import { Tappable } from "@/components/ui/Tappable"
import { Text } from "@/components/ui/Text"
import { SectionHeading, TopBar } from "@/components/ui/TopBar"
import { useAiUsage } from "@/hooks/use-ai"
import { useDeleteAccount, useEmailPrefs, useExportData, useUpdateProfile } from "@/hooks/use-account"
import { useColors } from "@/lib/appearance"
import { useSession } from "@/lib/auth/session"
import { haptics } from "@/lib/haptics"
import type { EmailPrefs } from "@/lib/types"

type Experience = "Beginner" | "Intermediate" | "Advanced"

const EMAIL_LABELS: Record<keyof EmailPrefs, { title: string; body: string }> = {
  price_alerts: { title: "Price alerts", body: "When a stock crosses your target" },
  ipo_reminders: { title: "IPO reminders", body: "Open, close, allotment and listing days" },
  daily_digest: { title: "Daily digest", body: "A short market summary on weekday mornings" },
}

export default function ProfileScreen() {
  const { profile, isPro, changePassword } = useSession()
  const p = useColors()
  const [name, setName] = useState(profile?.display_name ?? "")
  const [city, setCity] = useState(profile?.city ?? "")
  const [country, setCountry] = useState(profile?.country ?? "India")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [experience, setExperience] = useState<Experience>((profile?.experience_level as Experience) ?? "Beginner")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordState, setPasswordState] = useState<{ busy: boolean; error: string | null; done: boolean }>({ busy: false, error: null, done: false })

  useEffect(() => {
    if (!profile) return
    setName(profile.display_name ?? "")
    setCity(profile.city ?? "")
    setCountry(profile.country ?? "India")
    setPhone(profile.phone ?? "")
    if (profile.experience_level) setExperience(profile.experience_level)
  }, [profile])

  const save = useUpdateProfile()
  const { prefs, update: updatePrefs } = useEmailPrefs()
  const exportData = useExportData()
  const deleteAccount = useDeleteAccount()
  const usage = useAiUsage()

  const submitPassword = async () => {
    if (newPassword.length < 8) return setPasswordState({ busy: false, error: "Use at least 8 characters.", done: false })
    if (newPassword !== confirmPassword) return setPasswordState({ busy: false, error: "The two passwords don't match.", done: false })
    setPasswordState({ busy: true, error: null, done: false })
    try {
      await changePassword(newPassword)
      haptics.success()
      setNewPassword("")
      setConfirmPassword("")
      setPasswordState({ busy: false, error: null, done: true })
    } catch (e) {
      haptics.fail()
      setPasswordState({ busy: false, error: e instanceof Error ? e.message : "Couldn't change the password.", done: false })
    }
  }

  const shareExport = () =>
    exportData.mutate(undefined, {
      onSuccess: (data) => void Share.share({ title: "My EasyEquity data", message: JSON.stringify(data, null, 2) }),
    })

  const confirmDelete = () =>
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your EasyEquity account and everything saved with it — watchlist, portfolio, alerts — on the app and the website. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete account", style: "destructive", onPress: () => deleteAccount.mutate() },
      ],
    )

  const u = usage.data
  const aiLine = u?.unlimited ? "Unlimited AI analyses" : u ? `${u.remaining ?? 0} of ${u.limit} AI analyses left today` : "AI analyses: 3 a day on the free plan"

  return (
    <Page edges={["top"]}>
      <TopBar title="Profile" subtitle={profile?.email ?? null} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-16">
          <Tappable onPress={() => router.push("/pro")} className="mx-5 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <View className={`h-10 w-10 items-center justify-center rounded-xl ${isPro ? "bg-accent" : "bg-secondary"}`}>
              <Ionicons name="diamond" size={18} color={isPro ? p.accentForeground : p.mutedForeground} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-foreground">{isPro ? "EasyEquity Pro" : "Free plan"}</Text>
              <Text className="text-xs text-muted-foreground">{aiLine}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={p.mutedForeground} />
          </Tappable>

          <SectionHeading title="Your details" />
          <View className="gap-4 px-5">
            <InputField label="Name" value={name} onChangeText={setName} autoComplete="name" />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <InputField label="City" value={city} onChangeText={setCity} />
              </View>
              <View className="flex-1">
                <InputField label="Country" value={country} onChangeText={setCountry} />
              </View>
            </View>
            <InputField label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="+91 98765 43210" maxLength={20} />
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
            {save.isError ? <Text className="text-sm text-destructive">{errorMessage(save.error, "Couldn't save.")}</Text> : null}
            <Button
              title={save.isSuccess && !save.isPending ? "Saved" : "Save changes"}
              icon={save.isSuccess && !save.isPending ? "checkmark" : undefined}
              onPress={() =>
                save.mutate({
                  display_name: name.trim(),
                  city: city.trim(),
                  country: country.trim() || "India",
                  phone: phone.trim(),
                  experience_level: experience,
                })
              }
              loading={save.isPending}
              disabled={!name.trim()}
            />
          </View>

          <SectionHeading title="Email notifications" subtitle={prefs.data?.email ? `Sent to ${prefs.data.email}` : null} />
          <Card className="mx-5 gap-4">
            {prefs.data && !prefs.data.configured ? (
              <Text className="text-sm text-muted-foreground">{"Email isn't set up yet. Alerts still appear in Notifications."}</Text>
            ) : (
              (Object.keys(EMAIL_LABELS) as (keyof EmailPrefs)[]).map((k) => (
                <View key={k} className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <Text className="text-[15px] font-medium text-foreground">{EMAIL_LABELS[k].title}</Text>
                    <Text className="text-xs text-muted-foreground">{EMAIL_LABELS[k].body}</Text>
                  </View>
                  <Switch
                    value={!!prefs.data?.prefs[k]}
                    disabled={!prefs.data || updatePrefs.isPending}
                    onValueChange={(v) => updatePrefs.mutate({ [k]: v })}
                    trackColor={{ true: p.accent, false: p.muted }}
                    thumbColor="#fff"
                    accessibilityLabel={EMAIL_LABELS[k].title}
                  />
                </View>
              ))
            )}
          </Card>

          <SectionHeading title="Password" subtitle="Signed in with Google? Setting one lets you also sign in with email." />
          <View className="gap-4 px-5">
            <InputField label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
            <InputField
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={submitPassword}
            />
            {passwordState.error ? <Text className="text-sm text-destructive">{passwordState.error}</Text> : null}
            {passwordState.done ? <Text className="text-sm text-bullish">Password changed.</Text> : null}
            <Button title="Change password" variant="secondary" icon="key-outline" onPress={submitPassword} loading={passwordState.busy} disabled={!newPassword} />
          </View>

          <SectionHeading title="Your data" />
          <View className="gap-3 px-5">
            {exportData.isError ? <Text className="text-sm text-destructive">{errorMessage(exportData.error, "Couldn't export your data.")}</Text> : null}
            <Button title="Export my data" icon="download-outline" variant="secondary" onPress={shareExport} loading={exportData.isPending} />
            <Text className="text-xs leading-[18px] text-muted-foreground">
              A copy of everything EasyEquity stores about you (profile, watchlist, portfolio, alerts), as JSON you can save or send.
            </Text>
          </View>

          <SectionHeading title="Danger zone" />
          <View className="gap-3 px-5">
            {deleteAccount.isError ? <Text className="text-sm text-destructive">{errorMessage(deleteAccount.error, "Couldn't delete the account.")}</Text> : null}
            <Button title="Delete account" variant="destructive" icon="trash-outline" onPress={confirmDelete} loading={deleteAccount.isPending} />
            {isPro ? <Notice text="Deleting your account also cancels your Pro subscription, so you won't be charged again." /> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  )
}
