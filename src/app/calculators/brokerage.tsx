import { useMemo, useState } from "react"

import { CalcPage, NumberField, ResultCard, Row, num } from "@/components/calculators/CalcUI"
import { Segmented } from "@/components/ui/Chips"
import { Card, KeyValue } from "@/components/ui/Notice"
import { brokerage, CHARGE_RULES } from "@/lib/calculators"
import { fmtINR } from "@/lib/format"

type Segment = "delivery" | "intraday"
type Exchange = "NSE" | "BSE"

export default function BrokerageScreen() {
  const [segment, setSegment] = useState<Segment>("delivery")
  const [exchange, setExchange] = useState<Exchange>("NSE")
  const [buy, setBuy] = useState("1000")
  const [sell, setSell] = useState("1050")
  const [qty, setQty] = useState("100")
  const [flat, setFlat] = useState("20")
  const [pct, setPct] = useState("0.03")
  const [dp, setDp] = useState("15.93")

  const r = useMemo(
    () =>
      brokerage({
        segment,
        exchange,
        buyPrice: num(buy),
        sellPrice: num(sell),
        quantity: num(qty),
        brokerageFlat: flat.trim() === "" ? undefined : num(flat),
        brokeragePct: pct.trim() === "" ? undefined : num(pct),
        dpCharge: num(dp),
      }),
    [segment, exchange, buy, sell, qty, flat, pct, dp],
  )

  return (
    <CalcPage
      title="Brokerage & charges"
      subtitle={`Statutory rates as of ${CHARGE_RULES.asOf}`}
      note="STT, exchange, SEBI, stamp duty and GST at current statutory rates. Brokerage and DP charges vary by broker: enter yours (leave a brokerage box empty to ignore it; if both are set, the lower applies per order)."
    >
      <Segmented<Segment>
        options={[
          { value: "delivery", label: "Delivery" },
          { value: "intraday", label: "Intraday" },
        ]}
        value={segment}
        onChange={setSegment}
      />
      <Segmented<Exchange>
        options={[
          { value: "NSE", label: "NSE" },
          { value: "BSE", label: "BSE" },
        ]}
        value={exchange}
        onChange={setExchange}
      />
      <Row>
        <NumberField label="Buy price" suffix="₹" value={buy} onChange={setBuy} />
        <NumberField label="Sell price" suffix="₹" value={sell} onChange={setSell} />
      </Row>
      <NumberField label="Quantity" value={qty} onChange={setQty} decimals={false} />
      <Row>
        <NumberField label="Brokerage per order" suffix="₹" value={flat} onChange={setFlat} />
        <NumberField label="or" suffix="% of value" value={pct} onChange={setPct} />
      </Row>
      {segment === "delivery" ? <NumberField label="DP charge per sell" suffix="₹ incl. GST" value={dp} onChange={setDp} /> : null}

      {r ? (
        <>
          <ResultCard
            label="Net profit after charges"
            value={fmtINR(r.netPnl)}
            tone={r.netPnl >= 0 ? "bullish" : "bearish"}
            items={[
              { label: "Total charges", value: fmtINR(r.totalCharges) },
              { label: "Breakeven", value: `+${fmtINR(r.breakevenPerShare)}/sh` },
            ]}
          />
          <Card className="py-1">
            <KeyValue label="Turnover" value={fmtINR(r.turnover)} />
            <KeyValue label="Brokerage" value={fmtINR(r.brokerage)} />
            <KeyValue label="STT" hint={segment === "delivery" ? "0.1% on buy and sell" : "0.025% on sell"} value={fmtINR(r.stt)} />
            <KeyValue label="Exchange transaction" value={fmtINR(r.exchangeTxn)} />
            <KeyValue label="SEBI fee" value={fmtINR(r.sebi)} />
            <KeyValue label="Stamp duty" hint="On the buy side" value={fmtINR(r.stamp)} />
            <KeyValue label="GST (18%)" hint="On brokerage, exchange and SEBI charges" value={fmtINR(r.gst)} />
            {segment === "delivery" ? <KeyValue label="DP charge" value={fmtINR(r.dp)} /> : null}
            <KeyValue label="Gross P&L" value={fmtINR(r.grossPnl)} valueClassName={r.grossPnl >= 0 ? "text-bullish" : "text-bearish"} divider={false} />
          </Card>
        </>
      ) : (
        <ResultCard label="Net profit after charges" value="—" footnote="Enter a quantity above 0." />
      )}
    </CalcPage>
  )
}
