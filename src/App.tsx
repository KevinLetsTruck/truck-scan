import { useEffect, useMemo, useState } from "react";
import { ChecklistSection } from "./components/ChecklistSection";
import { NumbersSection } from "./components/NumbersSection";
import { ResultsSection } from "./components/ResultsSection";
import { SavedSection, scanTitle } from "./components/SavedSection";
import { TruckSection } from "./components/TruckSection";
import { recommend } from "./lib/recommend";
import { blankScan, loadCurrent, loadSaved, removeSaved, saveCurrent, upsertSaved } from "./lib/storage";
import type { Scan } from "./lib/types";

export function App() {
  const [scan, setScan] = useState<Scan>(() => loadCurrent());
  const [saved, setSaved] = useState<Scan[]>(() => loadSaved());
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  // Remount the truck section when a different scan opens, so its VIN box resets.
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => saveCurrent(scan), [scan]);

  const rows = useMemo(
    () => recommend({ equipment: scan.equipment, cab: scan.cab.value, numbers: scan.numbers }),
    [scan.equipment, scan.cab.value, scan.numbers],
  );

  function open(next: Scan) {
    setScan(next);
    setSessionKey((k) => k + 1);
    setSavedMsg(null);
    window.scrollTo({ top: 0 });
  }

  const isSaved = saved.some((s) => s.id === scan.id);

  return (
    <div className="page">
      <header>
        <h1>Truck Scan</h1>
        <p className="lede">
          Look up the truck by VIN. Tap what is on it. See what each fuel change is worth and how fast it pays back.
        </p>
      </header>

      <SavedSection
        saved={saved}
        currentId={scan.id}
        onOpen={open}
        onDelete={(id) => {
          setSaved(removeSaved(id));
          if (id === scan.id) open(blankScan());
        }}
      />

      <TruckSection key={sessionKey} scan={scan} onChange={setScan} />
      <ChecklistSection scan={scan} onChange={setScan} />
      <NumbersSection scan={scan} onChange={setScan} />
      <ResultsSection scan={scan} rows={rows} />

      <div className="actions">
        <button
          type="button"
          className="primary"
          onClick={() => {
            setSaved(upsertSaved(scan));
            setSavedMsg(`Saved ${scanTitle(scan)} on this phone.`);
          }}
        >
          {isSaved ? "Update saved truck" : "Save this truck"}
        </button>
        <button type="button" onClick={() => open(blankScan())}>
          Start a new truck
        </button>
      </div>
      {savedMsg ? (
        <p className="hint" role="status">
          {savedMsg}
        </p>
      ) : null}

      <footer>
        <p>Your numbers stay in this browser. VIN lookup goes to NHTSA.</p>
        <p>Planning numbers. Not a quote and not advice.</p>
      </footer>
    </div>
  );
}
