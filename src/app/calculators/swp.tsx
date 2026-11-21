import { useMemo, useState } from "react"
import { View } from "react-native"

import { CalcPage, NumberField, ResultCard, Row, num } from "@/components/calculators/CalcUI"
import { Card } from "@/components/ui/Notice"
import { Text } from "@/components/ui/Text"
import { swp } from "@/lib/calculators"
import { fmtINR } from "@/lib/format"

const duration = (months: number) => {
  const y = Math.floor(months / 12)
  const m = months % 12
  return [y ? `${y} ${y === 1 ? "year" : "years"}` : "", m ? `${m} ${m === 1 ? "month" : "months"}` : ""].filter(Boolean).join(" ")
}

export default function SwpCalculatorScreen() {
  const [corpus, setCorpus] = useState("2500000")
  const [withdrawal, setWithdrawal] = useState("20000")
  const [rate, setRate] = useState("8")
  const [years, setYears] = useState("15")
  const r = useMemo(
    () => swp({ corpus: num(corpus), monthlyWithdrawal: num(withdrawal), annualReturnPct: num(rate), years: num(years) }),
    [corpus, withdrawal, rate, years],
  )
  const lasts = r.runsOutInMonth == null

  return (
    <CalcPage
      title="SWP calculator"
      subtitle="Monthly withdrawals from an investment"
      note="Each month the balance earns its monthly return first, then the withdrawal is taken out. Assumes a constant return; tax on withdrawals isn't included."
    >
      <NumberField label="Investment" suffix="₹" value={corpus} onChange={setCorpus} decimals={false} />
      <NumberField label="Monthly withdrawal" suffix="₹" value={withdrawal} onChange={setWithdrawal} decimals={false} />
      <Row>
        <NumberField label="Expected return" suffix="% a year" value={rate} onChange={setRate} />
        <NumberField label="Years" value={years} onChange={setYears} />
      </Row>
      <ResultCard
        label={lasts ? "Balance left at the end" : "Money runs out after"}
        value={lasts ? fmtINR(r.finalBalance, 0) : duration(r.runsOutInMonth ?? 0)}
        tone={lasts ? undefined : "bearish"}
        items={[
          { label: "Total withdrawn", value: fmtINR(r.totalWithdrawn, 0) },
          { label: "Period", value: duration(r.months) || "—" },
        ]}
        footnote={lasts ? "Your withdrawals last the whole period at this return." : "Withdrawals stop when the balance reaches zero."}
      />
      {r.yearly.length ? (
        <Card className="py-1">
          <View className="flex-row border-b border-border py-2.5">
            <Text className="w-14 text-[11px] font-semibold uppercase text-muted-foreground">Year</Text>
            <Text className="flex-1 text-right text-[11px] font-semibold uppercase text-muted-foreground">Withdrawn</Text>
            <Text className="flex-1 text-right text-[11px] font-semibold uppercase text-muted-foreground">Balance</Text>
          </View>
          {r.yearly.map((y, i) => (
            <View key={y.year} className={`flex-row py-2.5 ${i < r.yearly.length - 1 ? "border-b border-border/70" : ""}`}>
              <Text className="w-14 text-sm text-muted-foreground">{y.year}</Text>
              <Text className="flex-1 text-right text-sm text-foreground">{fmtINR(y.withdrawn, 0)}</Text>
              <Text className={`flex-1 text-right text-sm font-semibold ${y.balance > 0 ? "text-foreground" : "text-bearish"}`}>{fmtINR(y.balance, 0)}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </CalcPage>
  )
}
