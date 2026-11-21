import { memo, useState } from "react"
import { View, type LayoutChangeEvent } from "react-native"
import Svg, { Path } from "react-native-svg"

/** A tiny trend line with no axes (Fear & Greed history, small cards). */
export const Sparkline = memo(function Sparkline({ values, height = 36, color }: { values: number[]; height?: number; color: string }) {
  const [width, setWidth] = useState(0)
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width))
  const clean = values.filter((v) => Number.isFinite(v))
  let d = ""
  if (width > 0 && clean.length > 1) {
    const min = Math.min(...clean)
    const max = Math.max(...clean)
    const span = max - min || 1
    clean.forEach((v, i) => {
      const x = (i / (clean.length - 1)) * width
      const y = 2 + (1 - (v - min) / span) * (height - 4)
      d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
    })
  }
  return (
    <View style={{ height }} onLayout={onLayout}>
      {d ? (
        <Svg width={width} height={height}>
          <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
      ) : null}
    </View>
  )
})
