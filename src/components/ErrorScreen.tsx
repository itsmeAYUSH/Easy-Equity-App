import { Pressable, Text, View } from "react-native"

/**
 * Last-resort screen for a crash that no screen handled. It uses only plain
 * React Native and fixed colours, so it still renders if a provider (theme,
 * fonts, data) is what failed.
 */
export function ErrorScreen({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#F9F8F6" }}>
      <Text style={{ fontSize: 20, fontWeight: "700", color: "#14181F", marginBottom: 8 }}>Something went wrong</Text>
      <Text style={{ fontSize: 14, color: "#676F7E", textAlign: "center", marginBottom: 24 }}>
        EasyEquity ran into a problem. Please try again.
      </Text>
      {__DEV__ ? (
        <Text selectable style={{ fontSize: 12, color: "#DC2828", marginBottom: 24 }}>
          {error.message}
        </Text>
      ) : null}
      <Pressable
        onPress={() => void retry()}
        accessibilityRole="button"
        style={{ backgroundColor: "#1D2330", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
      >
        <Text style={{ color: "#F9F8F6", fontWeight: "600" }}>Try again</Text>
      </Pressable>
    </View>
  )
}
