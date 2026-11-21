import Ionicons from "@expo/vector-icons/Ionicons"
import { ActivityIndicator, View } from "react-native"

import { Button } from "@/components/ui/Button"
import { Text } from "@/components/ui/Text"
import { useColors } from "@/lib/appearance"

/** Shown while the server's AI report is still being prepared; the hook re-asks every 45 s. */
export function AiWarming({ message, onRetry, retrying }: { message?: string | null; onRetry: () => void; retrying?: boolean }) {
  const p = useColors()
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-accent/20">
        {retrying ? <ActivityIndicator size="small" color={p.accent} /> : <Ionicons name="sparkles" size={18} color={p.accent} />}
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold text-foreground">AI is warming up</Text>
        <Text className="text-xs leading-[18px] text-muted-foreground">{message || "We'll try again automatically in a moment."}</Text>
      </View>
      <Button title="Retry" size="sm" variant="secondary" onPress={onRetry} disabled={retrying} />
    </View>
  )
}

/** Header row for an AI report: "Based on N articles · updated 10:42". */
export function AiMeta({ generatedAt, articles }: { generatedAt?: string | null; articles?: number | null }) {
  const p = useColors()
  const when = generatedAt
    ? new Date(generatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })
    : null
  if (!when && !articles) return null
  return (
    <View className="flex-row items-center gap-1.5">
      <Ionicons name="time-outline" size={12} color={p.mutedForeground} />
      <Text className="text-[11px] text-muted-foreground">
        {[articles ? `Based on ${articles} articles` : null, when ? `${when} IST` : null].filter(Boolean).join(" · ")}
      </Text>
    </View>
  )
}
