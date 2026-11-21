import { useMemo, useState } from "react"
import { View } from "react-native"

import { CalcPage, NumberField, ResultCard, Row, num } from "@/components/calculators/CalcUI"
import { Segmented } from "@/components/ui/Chips"
import { InputField } from "@/components/ui/InputField"
import { Card, KeyValue } from "@/components/ui/Notice"
import { Text } from "@/components/ui/Text"
import { capitalGains, TAX_RULES } from "@/lib/calculators"
import { fmtINR } from "@/lib/format"
import { todayInIndia } from "@/lib/market-status"

type Asset = "equity" | "debt"

/** YYYY-MM-DD as the user types digits: 20250110 → 2025-01-10. */
function maskDate(v: string): string {
  const d = v.replace(/[^0-9]/g, "").slice(0, 8)
  if (d.length <= 4) return d
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`
}

export default function CapitalGainsScreen() {
  const [asset, setAsset] = useState<Asset>("equity")
  const [buyPrice, setBuyPrice] = useState("1200")
  const [sellPrice, setSellPrice] = useState("1500")
  const [qty, setQty] = useState("100")
  const [buyDate, setBuyDate] = useState("2025-01-15")
  const [sellDate, setSellDate] = useState(todayInIndia())
  const [otherLtcg, setOtherLtcg] = useState("0")
  const [slab, setSlab] = useState("30")

  const r = useMemo(
    () =>
      capitalGains({
        asset,
        buyPrice: num(buyPrice),
        sellPrice: num(sellPrice),
        quantity: num(qty),
        buyDate,
        sellDate,
        otherLtcgThisYear: num(otherLtcg),
        slabRatePct: num(slab),
      }),
    [asset, buyPrice, sellPrice, qty, buyDate, sellDate, otherLtcg, slab],
  )

  return (
    <CalcPage
      title="Capital gains tax"
      subtitle={TAX_RULES.asOf}
      note={`Listed shares and equity funds: held more than ${TAX_RULES.equityLongTermAfterMonths} months is long-term (${TAX_RULES.equityLtcgRate * 100}% above ₹1.25 lakh a year), otherwise short-term (${TAX_RULES.equityStcgRate * 100}%), plus 4% cess. Debt funds bought from 1 April 2023 are taxed at your slab. Surcharge and set-off of losses aren't included. An estimate, not tax advice.`}
    >
      <Segmented<Asset>
        options={[
          { value: "equity", label: "Shares / equity funds" },
          { value: "debt", label: "Debt funds" },
        ]}
        value={asset}
        onChange={setAsset}
      />
      <Row>
        <NumberField label="Buy price" suffix="₹" value={buyPrice} onChange={setBuyPrice} />
        <NumberField label="Sell price" suffix="₹" value={sellPrice} onChange={setSellPrice} />
      </Row>
      <NumberField label="Quantity (shares or units)" value={qty} onChange={setQty} />
      <Row>
        <View className="flex-1">
          <InputField label="Bought on" value={buyDate} onChangeText={(v) => setBuyDate(maskDate(v))} keyboardType="number-pad" placeholder="YYYY-MM-DD" />
        </View>
        <View className="flex-1">
          <InputField label="Sold on" value={sellDate} onChangeText={(v) => setSellDate(maskDate(v))} keyboardType="number-pad" placeholder="YYYY-MM-DD" />
        </View>
      </Row>
      {asset === "equity" ? (
        <NumberField label="Other long-term gains this year" suffix="₹" value={otherLtcg} onChange={setOtherLtcg} />
      ) : (
        <NumberField label="Your income-tax slab" suffix="%" value={slab} onChange={setSlab} />
      )}

      {r ? (
        <>
          <ResultCard
            label="Estimated tax"
            value={fmtINR(r.totalTax, 0)}
            items={[
              { label: r.gain >= 0 ? "Gain" : "Loss", value: fmtINR(r.gain, 0), tone: r.gain >= 0 ? "bullish" : "bearish" },
              { label: "Held", value: `${r.holdingDays} days` },
            ]}
            footnote={r.label}
          />
          <Card className="py-1">
            <KeyValue label="Capital gain" value={fmtINR(r.gain)} />
            {r.exemptionUsed > 0 ? <KeyValue label="Exemption used" hint="₹1.25 lakh a year on long-term equity gains" value={`−${fmtINR(r.exemptionUsed)}`} /> : null}
            <KeyValue label="Taxable gain" value={fmtINR(r.taxableGain)} />
            <KeyValue label={`Tax at ${(r.rate * 100).toFixed(1).replace(/\.0$/, "")}%`} value={fmtINR(r.tax)} />
            <KeyValue label="Cess (4%)" value={fmtINR(r.cess)} />
            <KeyValue label="Total tax" value={fmtINR(r.totalTax)} valueClassName="text-accent" divider={false} />
          </Card>
          {r.gain < 0 ? <Text className="text-xs leading-[18px] text-muted-foreground">A loss has no tax; it can be set off against other gains under the tax rules.</Text> : null}
        </>
      ) : (
        <ResultCard label="Estimated tax" value="—" footnote="Check the dates (YYYY-MM-DD, sold on or after bought) and the quantity." />
      )}
    </CalcPage>
  )
}
