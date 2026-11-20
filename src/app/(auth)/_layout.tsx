import { Stack } from "expo-router"

import { useColors } from "@/lib/appearance"

export default function AuthStack() {
  const p = useColors()
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.background }, animation: "slide_from_right" }} />
}
