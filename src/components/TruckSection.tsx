import { useRef, useState } from "react";
import { decodeVin, normalizeVin, vinProblem } from "../lib/vin";
import type { Cab, Scan, SpecKey, Source } from "../lib/types";
import { Segmented } from "./Controls";

const LINES: { key: SpecKey; label: string }[] = [
  { key: "year", label: "Year" },
  { key: "make", label: "Make" },
  { key: "model", label: "Model" },
  { key: "engine", label: "Engine" },
  { key: "drive", label: "Drive" },
  { key: "weightClass", label: "Weight class" },
];

const SOURCE_LABEL: Record<Source, string> = { vin: "From VIN", typed: "Typed" };

export function TruckSection(props: { scan: Scan; onChange: (s: Scan) => void }) {
  const { scan, onChange } = props;
  const [vinText, setVinText] = useState(scan.vin);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(Object.keys(scan.specs).length > 0);
  const abort = useRef<AbortController | null>(null);

  async function onDecode() {
    const vin = normalizeVin(vinText);
    setVinText(vin);
    const problem = vinProblem(vin);
    if (problem) {
      setError(problem);
      return;
    }
    abort.current?.abort();
    abort.current = new AbortController();
    setBusy(true);
    setError(null);
    const out = await decodeVin(vin, abort.current.signal);
    setBusy(false);
    if (!out.ok) {
      setError(out.error);
      return;
    }
    onChange({
      ...scan,
      vin,
      specs: out.specs,
      cab: { value: out.cab, source: out.cab === "unsure" ? "typed" : "vin" },
      vinNotes: out.notes,
    });
    setShowSheet(true);
  }

  function setLine(key: SpecKey, value: string) {
    const specs = { ...scan.specs };
    if (value.trim() === "") delete specs[key];
    else specs[key] = { value, source: "typed" };
    onChange({ ...scan, specs });
  }

  const title = [scan.specs.year?.value, scan.specs.make?.value, scan.specs.model?.value]
    .filter(Boolean)
    .join(" ");

  return (
    <section aria-labelledby="truck-h">
      <h2 id="truck-h">
        <span className="step">1</span> The truck
      </h2>
      <form
        className="vin-row"
        onSubmit={(e) => {
          e.preventDefault();
          void onDecode();
        }}
      >
        <div className="field grow">
          <label htmlFor="vin">VIN</label>
          <input
            id="vin"
            className="vin-input"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={24}
            placeholder="17 characters"
            value={vinText}
            onChange={(e) => setVinText(e.target.value)}
          />
        </div>
        <button type="submit" className="primary" disabled={busy}>
          {busy ? "Looking up" : "Look up"}
        </button>
      </form>
      <p className="hint">On the door jamb sticker, the dash by the windshield, or the title.</p>
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      {!showSheet ? (
        <button type="button" className="link" onClick={() => setShowSheet(true)}>
          No VIN handy? Type the truck instead.
        </button>
      ) : null}

      {showSheet ? (
        <div className="card spec-sheet">
          <div className="spec-title">{title || "Your truck"}</div>
          {scan.vin ? <div className="hint mono">{scan.vin}</div> : null}
          {scan.vinNotes.map((n) => (
            <p key={n} className="note">
              {n}
            </p>
          ))}
          {LINES.map((l) => {
            const line = scan.specs[l.key];
            return (
              <div className="spec-line" key={l.key}>
                <label htmlFor={`spec-${l.key}`}>{l.label}</label>
                <input
                  id={`spec-${l.key}`}
                  value={line?.value ?? ""}
                  placeholder="Not given"
                  onChange={(e) => setLine(l.key, e.target.value)}
                />
                <span className={`source ${line?.source ?? "none"}`}>
                  {line ? SOURCE_LABEL[line.source] : ""}
                </span>
              </div>
            );
          })}
          {scan.specs.trim ? <div className="hint">NHTSA trim: {scan.specs.trim.value}</div> : null}
          <Segmented<Cab>
            label="Cab"
            hint={scan.cab.source === "vin" ? "From VIN. Tap to fix." : "The VIN often does not say. Tap one."}
            value={scan.cab.value}
            options={[
              { value: "sleeper", label: "Sleeper" },
              { value: "day", label: "Day cab" },
              { value: "unsure", label: "Not sure" },
            ]}
            onChange={(v) => onChange({ ...scan, cab: { value: v, source: "typed" } })}
          />
        </div>
      ) : null}
    </section>
  );
}
