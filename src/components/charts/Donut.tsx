import { memo, type ReactNode } from "react"
import { View } from "react-native"
import Svg, { Circle, G } from "react-native-svg"

import { useColors } from "@/lib/appearance"

/** Distinct series colours that read on both the light and dark backgrounds. */
export const CHART_COLORS = ["#F29E0D", "#3B82F6", "#20AC6B", "#EC4899", "#8B5CF6", "#06B6D4", "#EF4444", "#14B8A6", "#EAB308", "#6366F1"]

/** A ring chart (allocation). `children` render in the middle. */
export const Donut = memo(function Donut({
  segments,
  size = 148,
  thickness = 18,
  children,
}: {
  segments: { value: number; color: string }[]
  size?: number
  thickness?: number
  children?: ReactNode
}) {
  const p = useColors()
  const r = (size - thickness) / 2
  const circumference = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0)
  const gap = segments.length > 1 ? 2 : 0

  let offset = 0
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={p.secondary} strokeWidth={thickness} fill="none" />
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {total > 0
            ? segments.map((s, i) => {
                const len = (Math.max(0, s.value) / total) * circumference
                const dash = Math.max(0, len - gap)
                const el = (
                  <Circle
                    key={i}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={s.color}
                    strokeWidth={thickness}
                    fill="none"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                  />
                )
                offset += len
                return el
              })
            : null}
        </G>
      </Svg>
      {children}
    </View>
  )
})
