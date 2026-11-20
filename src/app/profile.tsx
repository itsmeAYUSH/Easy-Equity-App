import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { accountApi, authApi, emailApi } from "@/api/endpoints"
import { errorMessage } from "@/api/errors"
import { Button } from "@/components/ui/Button"
import { Segmented } from "@/components/ui/Chips"
import { Card } from "@/components/ui/Notice"
import { TopBar, SectionHeading } from "@/components/ui/TopBar"
import { Page } from "@/components/ui/Page"
import { InputField } from "@/components/ui/InputField"
import { useSession } from "@/lib/auth/session"
import { haptics } from "@/lib/haptics"
import { useColors } from "@/lib/appearance"
import type { EmailPrefs } from "@/lib/types"
import { qk } from "@/queries/keys"

type Experience = "Beginner" | "Intermediate" | "Advanced"

const EMAIL_LABELS: Record<keyof EmailPrefs, { title: string; body: string }> = {
  price_alerts: { title: "Price alerts", body: "When a stock crosses your target" },
  ipo_reminders: { title: "IPO reminders", body: "Open, close, allotment and listing days" },
  daily_digest: { title: "Daily digest", body: "A short market summary on weekday mornings" },
}

export default function ProfileScreen() {
  const { userId, profile, refreshProfile, signOut } = useSession()
  const client = useQueryClient()
  const p = useColors()
  const [name, setName] = useState(profile?.display_name ?? "")
  const [city, setCity] = useState(profile?.city ?? "")
  const [experience, setExperience] = useState<Experience>((profile?.experience_level as Experience) ?? "Beginner")

  useEffect(() => {
    if (!profile) return
    setName(profile.display_name ?? "")
    setCity(profile.city ?? "")
    if (profile.experience_level) setExperience(profile.experience_level)
  }, [profile])

  const save = useMutation({
    mutationFn: () => authApi.updateProfile({ display_name: name.trim(), city: city.trim(), experience_level: experience }),
    onSuccess: async () => {
      haptics.success()
      await refreshProfile()
    },
  })

  const prefs = useQuery({ queryKey: qk.emailPrefs(userId), queryFn: emailApi.prefs, enabled: !!userId })
  const updatePrefs = useMutation({
    mutationFn: emailApi.updatePrefs,
    onSuccess: (data) => client.setQueryData(qk.emailPrefs(userId), data),
  })

  const deleteAccount = useMutation({
    mutationFn: () => accountApi.delete("DELETE"),
    onSuccess: () => void signOut(),
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

  return (
    <Page edges={["top"]}>
      <TopBar title="Profile" subtitle={profile?.email ?? null} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-16">
          <View className="gap-4 px-4">
            <InputField label="Name" value={name} onChangeText={setName} autoComplete="name" />
            <InputField label="City" value={city} onChangeText={setCity} />
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
            <Button title={save.isSuccess && !save.isPending ? "Saved" : "Save changes"} onPress={() => save.mutate()} loading={save.isPending} disabled={!name.trim()} />
          </View>

          <SectionHeading title="Email notifications" />
          <Card className="mx-4 gap-4">
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

          <SectionHeading title="Danger zone" />
          <View className="px-4">
            {deleteAccount.isError ? (
              <Text className="pb-2 text-sm text-destructive">{errorMessage(deleteAccount.error, "Couldn't delete the account.")}</Text>
            ) : null}
            <Button title="Delete account" variant="destructive" icon="trash-outline" onPress={confirmDelete} loading={deleteAccount.isPending} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  )
}
