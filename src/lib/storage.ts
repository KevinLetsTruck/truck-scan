import type { Scan } from "./types";

const CURRENT = "truck-scan:v1:current";
const SAVED = "truck-scan:v1:saved";

export function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `scan-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function blankScan(): Scan {
  return {
    id: newId(),
    vin: "",
    specs: {},
    cab: { value: "unsure", source: "typed" },
    vinNotes: [],
    equipment: {},
    numbers: {
      mpg: 7.4,
      miles: 110000,
      diesel: 3.85,
      cruise: 70,
      idleHoursPerDay: 8,
      idleDaysPerYear: 250,
      batteryApuQuote: null,
      dieselApuQuote: null,
    },
    updatedAt: new Date().toISOString(),
  };
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private window or storage full. The page still works for this visit.
  }
}

/** Fill any field an older saved scan is missing. */
function withDefaults(s: Partial<Scan>): Scan {
  const b = blankScan();
  return {
    ...b,
    ...s,
    numbers: { ...b.numbers, ...(s.numbers ?? {}) },
    equipment: { ...(s.equipment ?? {}) },
    specs: { ...(s.specs ?? {}) },
    cab: s.cab ?? b.cab,
    vinNotes: s.vinNotes ?? [],
  };
}

export function loadCurrent(): Scan {
  const s = read<Partial<Scan>>(CURRENT);
  return s ? withDefaults(s) : blankScan();
}

export function saveCurrent(scan: Scan) {
  write(CURRENT, scan);
}

export function loadSaved(): Scan[] {
  return (read<Partial<Scan>[]>(SAVED) ?? []).map(withDefaults);
}

export function upsertSaved(scan: Scan): Scan[] {
  const list = loadSaved().filter((s) => s.id !== scan.id);
  const next = [{ ...scan, updatedAt: new Date().toISOString() }, ...list];
  write(SAVED, next);
  return next;
}

export function removeSaved(id: string): Scan[] {
  const next = loadSaved().filter((s) => s.id !== id);
  write(SAVED, next);
  return next;
}
