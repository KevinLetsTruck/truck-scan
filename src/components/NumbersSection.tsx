import type { Numbers, Scan } from "../lib/types";
import { NumberField } from "./Controls";

export function NumbersSection(props: { scan: Scan; onChange: (s: Scan) => void }) {
  const { scan, onChange } = props;
  const n = scan.numbers;
  const set = (patch: Partial<Numbers>) => onChange({ ...scan, numbers: { ...n, ...patch } });
  const num = (v: number | null) => v ?? 0;
  const e = scan.equipment;
  const showIdle = scan.cab.value !== "day" && e.idle !== "battery-apu";

  return (
    <section aria-labelledby="num-h">
      <h2 id="num-h">
        <span className="step">3</span> Your numbers
      </h2>
      <p className="lede">Use the MPG from your fuel receipts or the ECM, not the dash.</p>
      <div className="card grid">
        <NumberField label="MPG today" value={n.mpg} step={0.1} suffix="mpg" onChange={(v) => set({ mpg: num(v) })} />
        <NumberField label="Miles a year" value={n.miles} step={1000} suffix="mi" onChange={(v) => set({ miles: num(v) })} />
        <NumberField label="Diesel price" value={n.diesel} step={0.01} prefix="$" suffix="/gal" onChange={(v) => set({ diesel: num(v) })} />
        <NumberField label="Cruise speed" value={n.cruise} step={1} suffix="mph" onChange={(v) => set({ cruise: num(v) })} />
      </div>
      {showIdle ? (
        <>
          <h3>Parked time</h3>
          <div className="card grid">
            <NumberField label="Parked hours a day" hint="Hours the sleeper needs heat or air." value={n.idleHoursPerDay} step={1} suffix="hr" onChange={(v) => set({ idleHoursPerDay: num(v) })} />
            <NumberField label="Days out a year" value={n.idleDaysPerYear} step={1} suffix="days" onChange={(v) => set({ idleDaysPerYear: num(v) })} />
            <NumberField label="Battery APU quote" hint="Installed price. Leave blank if you do not have one." value={n.batteryApuQuote} step={100} prefix="$" placeholder="No quote yet" onChange={(v) => set({ batteryApuQuote: v })} />
            {e.idle !== "diesel-apu" ? (
              <NumberField label="Diesel APU quote" value={n.dieselApuQuote} step={100} prefix="$" placeholder="No quote yet" onChange={(v) => set({ dieselApuQuote: v })} />
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
