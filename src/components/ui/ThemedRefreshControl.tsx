import { RefreshControl, type RefreshControlProps } from "react-native"

import { useColors } from "@/lib/appearance"

/** Pull-to-refresh spinner in the EasyEquity accent colour. */
export function ThemedRefreshControl(props: RefreshControlProps) {
  const p = useColors()
  return <RefreshControl tintColor={p.accent} colors={[p.accent]} progressBackgroundColor={p.card} {...props} />
}
