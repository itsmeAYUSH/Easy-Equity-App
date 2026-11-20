import Ionicons from "@expo/vector-icons/Ionicons"
import { forwardRef } from "react"
import { TextInput, View, type TextInputProps } from "react-native"
import { Text } from "@/components/ui/Text"

import { useColors } from "@/lib/appearance"

type Props = TextInputProps & {
  label?: string
  error?: string | null
  icon?: keyof typeof Ionicons.glyphMap
}

/** A labelled input. 16 pt text keeps iOS from zooming on focus. */
export const InputField = forwardRef<TextInput, Props>(function InputField({ label, error, icon, ...rest }, ref) {
  const p = useColors()
  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-medium text-foreground">{label}</Text> : null}
      <View
        className={`h-12 flex-row items-center gap-2.5 rounded-xl border bg-card px-4 ${error ? "border-destructive" : "border-border"}`}
      >
        {icon ? <Ionicons name={icon} size={18} color={p.mutedForeground} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={p.mutedForeground}
          className="flex-1 text-base text-foreground"
          style={{ fontFamily: "Montserrat_400Regular", paddingVertical: 0 }}
          {...rest}
        />
      </View>
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  )
})
