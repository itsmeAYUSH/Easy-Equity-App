/**
 * A light price chart on react-native-svg (no Skia/Victory: works in Expo Go
 * and adds no native weight). Points are down-sampled to the pixel width
 * before building the path, so a 5-year series draws as fast as a 1-day one.
 *
 * Touch-and-drag shows the price at that point (a scrubber).
 */
import { memo, useMemo, useState } from "react"
import { View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native"
import { Text } from "@/components/ui/Text"
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg"

import { useColors } from "@/lib/appearance"

type Point = { t: number; c: number }

function downsample(points: Point[], max: number): Point[] {
  if (points.length <= max) return points
  const step = points.length / max
  const out: Point[] = []
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)])
  out[out.length - 1] = points[points.length - 1]
  return out
}

export const LineChart = memo(function LineChart({
  points,
  height = 200,
  formatValue = (v: number) => v.toFixed(2),
  formatTime = (t: number) => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  onScrub,
}: {
  points: Point[]
  height?: number
  formatValue?: (v: number) => string
  formatTime?: (t: number) => string
  onScrub?: (p: Point | null) => void
}) {
  const p = useColors()
  const [width, setWidth] = useState(0)
  const [active, setActive] = useState<number | null>(null)

  const data = useMemo(() => downsample(points.filter((d) => Number.isFinite(d.c)), Math.max(2, Math.round(width / 2) || 200)), [points, width])

  const geometry = useMemo(() => {
    if (data.length < 2 || width === 0) return null
    const pad = 6
    const values = data.map((d) => d.c)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    const x = (i: number) => (i / (data.length - 1)) * width
    const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2)
    let line = ""
    data.forEach((d, i) => {
      line += `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.c).toFixed(1)}`
    })
    const area = `${line}L${width},${height}L0,${height}Z`
    return { line, area, x, y }
  }, [data, width, height])

  const up = data.length > 1 ? data[data.length - 1].c >= data[0].c : true
  const color = up ? p.bullish : p.bearish

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width))
  const scrub = (e: GestureResponderEvent) => {
    if (!geometry || data.length < 2) return
    const i = Math.max(0, Math.min(data.length - 1, Math.round((e.nativeEvent.locationX / width) * (data.length - 1))))
    setActive(i)
    onScrub?.(data[i])
  }
  const end = () => {
    setActive(null)
    onScrub?.(null)
  }

  const activePoint = active != null ? data[active] : null

  return (
    <View>
      <View
        style={{ height }}
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={scrub}
        onResponderMove={scrub}
        onResponderRelease={end}
        onResponderTerminate={end}
        accessibilityRole="image"
        accessibilityLabel={data.length > 1 ? `Price chart, from ${formatValue(data[0].c)} to ${formatValue(data[data.length - 1].c)}` : "Price chart"}
      >
        {geometry ? (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.22} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d={geometry.area} fill="url(#fill)" />
            <Path d={geometry.line} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
            {active != null && activePoint ? (
              <>
                <Line x1={geometry.x(active)} x2={geometry.x(active)} y1={0} y2={height} stroke={p.mutedForeground} strokeDasharray="4 4" />
                <Circle cx={geometry.x(active)} cy={geometry.y(activePoint.c)} r={5} fill={color} stroke={p.card} strokeWidth={2} />
              </>
            ) : null}
          </Svg>
        ) : null}
      </View>
      {activePoint ? (
        <Text className="mt-1 text-center text-xs text-muted-foreground">
          {formatTime(activePoint.t)} · {formatValue(activePoint.c)}
        </Text>
      ) : null}
    </View>
  )
})
