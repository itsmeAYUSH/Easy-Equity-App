import { useState } from "react"

import { CalcPage, NumberField, ResultCard, num } from "@/components/calculators/CalcUI"
import { cagr } from "@/lib/calculators"
import { fmtINR, fmtPct } from "@/lib/format"

export default function CagrCalculatorScreen() {
  const [start, setStart] = useState("100000")
  const [end, setEnd] = useState("250000")
  const [years, setYears] = useState("5")
  const r = cagr(num(start), num(end), num(years))
  const tone = r ? (r.cagrPct >= 0 ? "bullish" : "bearish") : undefined

  return (
    <CalcPage
      title="CAGR calculator"
      subtitle="The steady yearly rate between two values"
      note="CAGR smooths out the ups and downs: it is the constant yearly rate that would turn the starting value into the ending value. It doesn't show how bumpy the ride was."
    >
      <NumberField label="Starting value" suffix="₹" value={start} onChange={setStart} />
      <NumberField label="Ending value" suffix="₹" value={end} onChange={setEnd} />
      <NumberField label="Years" value={years} onChange={setYears} />
      <ResultCard
        label="CAGR (a year)"
        value={r ? fmtPct(r.cagrPct, false) : "—"}
        tone={tone}
        items={[
          { label: "Absolute return", value: r ? fmtPct(r.absolutePct) : "—", tone },
          { label: "Gain", value: r ? fmtINR(num(end) - num(start), 0) : "—", tone },
        ]}
        footnote={r ? null : "Enter a starting value above 0 and a period above 0 years."}
      />
    </CalcPage>
  )
}
