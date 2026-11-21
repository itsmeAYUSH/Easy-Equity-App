/**
 * A light price chart on react-native-svg (no Skia/Victory: works in Expo Go
 * and adds no native weight). Points are down-sampled to the pixel width
 * before building the path, so a 5-year series draws as fast as a 1-day one.
 *
 * Scrubbing: drag sideways (or touch and hold) to read the price at any
 * point. The gesture only takes over on a horizontal move or a hold, so a
 * vertical swipe that starts on the chart still scrolls the page.
 */
import { memo, useCallback, useMemo, useRef, useState } from "react"
import { View, type LayoutChangeEvent } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg"

import { Text } from "@/components/ui/Text"
import { useColors } from "@/lib/appearance"
import { haptics } from "@/lib/haptics"

export type ChartPoint = { t: number; c: number }

function downsample(points: ChartPoint[], max: number): ChartPoint[] {
  if (points.length <= max) return points
  const step = points.length / max
  const out: ChartPoint[] = []
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)])
  out[out.length - 1] = points[points.length - 1]
  return out
}

const TIP_WIDTH = 132
const LABEL_WIDTH = 96

export const LineChart = memo(function LineChart({
  points,
  height = 200,
  formatValue = (v: number) => v.toFixed(2),
  formatTime = (t: number) => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  onScrub,
  baseline,
  showExtremes = true,
}: {
  points: ChartPoint[]
  height?: number
  formatValue?: (v: number) => string
  formatTime?: (t: number) => string
  /** Called with the point under the finger, and null when the finger lifts. */
  onScrub?: (p: ChartPoint | null) => void
  /** A dashed reference line, e.g. the previous close. Also sets the up/down colour. */
  baseline?: number | null
  /** Label the highest and lowest points. */
  showExtremes?: boolean
}) {
  const p = useColors()
  const [width, setWidth] = useState(0)
  const [active, setActive] = useState<number | null>(null)
  const lastIndex = useRef<number | null>(null)

  const data = useMemo(
    () => downsample(points.filter((d) => Number.isFinite(d.c)), Math.max(2, Math.round(width / 2) || 200)),
    [points, width],
  )

  const padTop = showExtremes ? 20 : 6
  const padBottom = showExtremes ? 20 : 6

  const geometry = useMemo(() => {
    if (data.length < 2 || width === 0) return null
    const values = data.map((d) => d.c)
    let min = Math.min(...values)
    let max = Math.max(...values)
    let minIndex = values.indexOf(min)
    let maxIndex = values.indexOf(max)
    const lo = baseline != null && Number.isFinite(baseline) ? Math.min(min, baseline) : min
    const hi = baseline != null && Number.isFinite(baseline) ? Math.max(max, baseline) : max
    const span = hi - lo || 1
    const x = (i: number) => (i / (data.length - 1)) * width
    const y = (v: number) => padTop + (1 - (v - lo) / span) * (height - padTop - padBottom)
    let line = ""
    data.forEach((d, i) => {
      line += `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.c).toFixed(1)}`
    })
    const area = `${line}L${width},${height}L0,${height}Z`
    if (min === max) {
      minIndex = -1
      maxIndex = -1
      min = max = values[0]
    }
    return { line, area, x, y, min, max, minIndex, maxIndex }
  }, [data, width, height, baseline, padTop, padBottom])

  const first = data[0]?.c
  const last = data[data.length - 1]?.c
  const reference = baseline ?? first
  const up = last != null && reference != null ? last >= reference : true
  const color = up ? p.bullish : p.bearish

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width))

  const scrubTo = useCallback(
    (locationX: number) => {
      if (data.length < 2 || width === 0) return
      const i = Math.max(0, Math.min(data.length - 1, Math.round((locationX / width) * (data.length - 1))))
      if (lastIndex.current === i) return
      lastIndex.current = i
      setActive(i)
      onScrub?.(data[i])
    },
    [data, width, onScrub],
  )
  const end = useCallback(() => {
    lastIndex.current = null
    setActive(null)
    onScrub?.(null)
  }, [onScrub])

  const gesture = useMemo(() => {
    // Sideways drag scrubs at once; touch-and-hold scrubs too (then moves in any direction).
    const drag = Gesture.Pan()
      .runOnJS(true)
      .activeOffsetX([-6, 6])
      .failOffsetY([-12, 12])
      .onStart((e) => {
        haptics.tick()
        scrubTo(e.x)
      })
      .onUpdate((e) => scrubTo(e.x))
      .onFinalize(end)
    const hold = Gesture.Pan()
      .runOnJS(true)
      .activateAfterLongPress(180)
      .onStart((e) => {
        haptics.tick()
        scrubTo(e.x)
      })
      .onUpdate((e) => scrubTo(e.x))
      .onFinalize(end)
    return Gesture.Race(hold, drag)
  }, [scrubTo, end])

  const activePoint = active != null ? data[active] : null
  const clampLeft = (x: number, w: number) => Math.max(0, Math.min(width - w, x - w / 2))

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{ height }}
        onLayout={onLayout}
        accessibilityRole="image"
        accessibilityLabel={
          data.length > 1 ? `Price chart, from ${formatValue(data[0].c)} to ${formatValue(data[data.length - 1].c)}` : "Price chart"
        }
      >
        {geometry ? (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.22} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {baseline != null && Number.isFinite(baseline) ? (
              <Line
                x1={0}
                x2={width}
                y1={geometry.y(baseline)}
                y2={geometry.y(baseline)}
                stroke={p.mutedForeground}
                strokeOpacity={0.5}
                strokeDasharray="3 5"
              />
            ) : null}
            <Path d={geometry.area} fill="url(#fill)" />
            <Path d={geometry.line} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {active != null && activePoint ? (
              <>
                <Line x1={geometry.x(active)} x2={geometry.x(active)} y1={0} y2={height} stroke={p.mutedForeground} strokeDasharray="4 4" />
                <Circle cx={geometry.x(active)} cy={geometry.y(activePoint.c)} r={5.5} fill={color} stroke={p.card} strokeWidth={2.5} />
              </>
            ) : null}
          </Svg>
        ) : null}

        {geometry && showExtremes && active == null && geometry.maxIndex >= 0 ? (
          <>
            <View pointerEvents="none" style={{ position: "absolute", top: 0, left: clampLeft(geometry.x(geometry.maxIndex), LABEL_WIDTH), width: LABEL_WIDTH }}>
              <Text numberOfLines={1} className="text-center text-[10px] font-semibold text-muted-foreground">
                {formatValue(geometry.max)}
              </Text>
            </View>
            <View pointerEvents="none" style={{ position: "absolute", bottom: 2, left: clampLeft(geometry.x(geometry.minIndex), LABEL_WIDTH), width: LABEL_WIDTH }}>
              <Text numberOfLines={1} className="text-center text-[10px] font-semibold text-muted-foreground">
                {formatValue(geometry.min)}
              </Text>
            </View>
          </>
        ) : null}

        {geometry && activePoint && active != null ? (
          <View pointerEvents="none" style={{ position: "absolute", top: 0, left: clampLeft(geometry.x(active), TIP_WIDTH), width: TIP_WIDTH }}>
            <View className="items-center rounded-lg bg-primary px-2 py-1">
              <Text numberOfLines={1} className="text-[11px] font-bold text-primary-foreground">
                {formatValue(activePoint.c)}
              </Text>
              <Text numberOfLines={1} className="text-[10px] text-primary-foreground/70">
                {formatTime(activePoint.t)}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </GestureDetector>
  )
})
