import { useMemo, useState } from "react"

import { CalcPage, NumberField, ResultCard, Row, YearBars, num } from "@/components/calculators/CalcUI"
import { Segmented } from "@/components/ui/Chips"
import { sipProjection, type SipMode } from "@/lib/calculators"
import { fmtINR } from "@/lib/format"

export default function SipCalculatorScreen() {
  const [mode, setMode] = useState<SipMode>("sip")
  const [amount, setAmount] = useState("5000")
  const [years, setYears] = useState("10")
  const [rate, setRate] = useState("12")
  const r = useMemo(() => sipProjection(mode, num(amount), num(years), num(rate)), [mode, amount, years, rate])

  return (
    <CalcPage title="SIP calculator" subtitle="Monthly SIP or a one-time lump sum" note="Assumes a constant yearly return, compounded monthly for SIPs. Real returns vary and are not guaranteed.">
      <Segmented
        options={[
          { value: "sip", label: "Monthly SIP" },
          { value: "lumpsum", label: "Lump sum" },
        ]}
        value={mode}
        onChange={setMode}
      />
      <NumberField label={mode === "sip" ? "Monthly investment" : "Investment"} suffix="₹" value={amount} onChange={setAmount} decimals={false} />
      <Row>
        <NumberField label="Years" value={years} onChange={setYears} />
        <NumberField label="Expected return" suffix="% a year" value={rate} onChange={setRate} />
      </Row>
      <ResultCard
        label="Estimated value"
        value={fmtINR(r.futureValue, 0)}
        items={[
          { label: "Invested", value: fmtINR(r.invested, 0) },
          { label: "Est. gains", value: fmtINR(r.gains, 0), tone: r.gains >= 0 ? "bullish" : "bearish" },
        ]}
      />
      {r.series.length > 1 ? <YearBars series={r.series.map((s) => ({ key: s.year, total: s.value, part: s.invested }))} legend={["Invested", "Gains"]} /> : null}
    </CalcPage>
  )
}
