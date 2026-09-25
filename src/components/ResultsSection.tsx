import { useState } from "react";
import { breakEvenLabel } from "../lib/fuel";
import { cents, money, mpg, whole } from "../lib/format";
import { numbersReady, type Row } from "../lib/recommend";
import type { Scan } from "../lib/types";

function Detail({ row, diesel }: { row: Row; diesel: number }) {
  const lines: [string, string][] = [];
  if (row.mpgNow !== undefined && row.mpgNext !== undefined) {
    lines.push(["MPG", `${mpg(row.mpgNow)} → ${mpg(row.mpgNext)}`]);
  }
  if (row.cpmNow !== undefined && row.cpmNext !== undefined) {
    lines.push(["Fuel per mile", `${cents(row.cpmNow)} → ${cents(row.cpmNext)}`]);
  }
  lines.push(["Gallons saved a year", whole(row.gallons)]);
  lines.push(["Saved a month", money(row.yearSave / 12)]);
  lines.push([`Saved a year at $${Math.max(0, diesel - 1).toFixed(2)} diesel`, money(row.yearSaveLow)]);
  lines.push([`Saved a year at $${(diesel + 1).toFixed(2)} diesel`, money(row.yearSaveHigh)]);
  if (row.cost !== null) {
    lines.push(["Planning cost", row.cost > 0 ? money(row.cost) : "None"]);
    if (row.cost > 0) {
      lines.push(["Net after 1 year", money(row.yearSave - row.cost)]);
      lines.push(["Net after 3 years", money(row.yearSave * 3 - row.cost)]);
      lines.push(["Net after 5 years", money(row.yearSave * 5 - row.cost)]);
    }
  }
  if (row.extraHours !== undefined) {
    lines.push(["Extra hours at the wheel a year", whole(row.extraHours)]);
  }
  return (
    <div className="detail">
      <dl>
        {lines.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="hint">{row.note}</p>
    </div>
  );
}

export function ResultsSection(props: { scan: Scan; rows: Row[] }) {
  const { scan, rows } = props;
  const [open, setOpen] = useState<string | null>(null);
  const ready = numbersReady(scan.numbers);

  return (
    <section aria-labelledby="res-h">
      <h2 id="res-h">
        <span className="step">4</span> What each change is worth
      </h2>
      {!ready ? (
        <p className="lede">Type your MPG, miles, and diesel price to see the numbers.</p>
      ) : rows.length === 0 ? (
        <p className="lede">Nothing left on this list. Every item is on the truck and cruise is 65 or under.</p>
      ) : (
        <>
          <p className="lede">Fastest payback first. Tap a row for the full numbers.</p>
          <ol className="results">
            {rows.map((r) => {
              const isOpen = open === r.id;
              return (
                <li key={r.id} className={`result ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="result-head"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : r.id)}
                  >
                    <span className="result-name">
                      {r.name}
                      {r.tags.map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </span>
                    <span className="result-save">{money(r.yearSave)}<small> a year</small></span>
                    <span className="result-sub">
                      {r.mpgNext !== undefined && r.mpgNow !== undefined
                        ? `${mpg(r.mpgNow)} → ${mpg(r.mpgNext)} mpg · `
                        : `${whole(r.gallons)} gal a year · `}
                      {breakEvenLabel(r.breakEvenMonths)}
                    </span>
                  </button>
                  {isOpen ? <Detail row={r} diesel={scan.numbers.diesel} /> : null}
                </li>
              );
            })}
          </ol>
          <p className="hint">
            Each row is on its own. Gains from two changes do not simply add. Planning numbers from the Let's Truck fuel table.
            Your quote will differ.
          </p>
        </>
      )}
    </section>
  );
}
