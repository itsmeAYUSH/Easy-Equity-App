import { type ReactNode } from "react"
import { View } from "react-native"
import { useSafeAreaInsets, type Edge } from "react-native-safe-area-context"

/** A page's root view: themed background, with padding for the chosen safe-area edges. */
export function Page({ children, edges = ["top"] }: { children: ReactNode; edges?: Edge[] }) {
  const insets = useSafeAreaInsets()
  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: edges.includes("top") ? insets.top : 0,
        paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
        paddingLeft: edges.includes("left") ? insets.left : 0,
        paddingRight: edges.includes("right") ? insets.right : 0,
      }}
    >
      {children}
    </View>
  )
}
