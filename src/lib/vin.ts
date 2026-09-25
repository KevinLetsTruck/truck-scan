import type { Cab, Specs } from "./types";

const LETTER_VALUE: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function normalizeVin(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** A reason the VIN cannot be right, or null. */
export function vinProblem(vin: string): string | null {
  if (vin.length === 0) return "Type the VIN.";
  if (vin.length !== 17) return `A VIN is 17 characters. This one has ${vin.length}.`;
  if (/[IOQ]/.test(vin)) return "A VIN never has I, O, or Q. Check for 1 and 0.";
  return null;
}

/** Position 9 check digit (North America). */
export function checkDigitOk(vin: string) {
  if (vin.length !== 17) return false;
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = vin[i];
    const value = /[0-9]/.test(ch) ? Number(ch) : LETTER_VALUE[ch];
    if (value === undefined) return false;
    sum += value * WEIGHTS[i];
  }
  const rem = sum % 11;
  return vin[8] === (rem === 10 ? "X" : String(rem));
}

type VpicRow = Record<string, string | null | undefined>;

function clean(v: string | null | undefined) {
  return (v ?? "").trim();
}

function titleCase(s: string) {
  if (s.length <= 3) return s;
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

export function cabFromText(text: string): Cab {
  const t = text.toLowerCase();
  if (t.includes("sleeper")) return "sleeper";
  if (t.includes("day cab") || t.includes("daycab")) return "day";
  return "unsure";
}

export type VinDecode =
  | { ok: true; specs: Specs; cab: Cab; notes: string[] }
  | { ok: false; error: string };

/** Map one NHTSA vPIC DecodeVinValues row to spec lines. */
export function mapVpic(row: VpicRow, vin: string): VinDecode {
  const make = clean(row.Make);
  if (!make) {
    return {
      ok: false,
      error: "No match for this VIN. Check it against the door sticker, or type the truck below.",
    };
  }
  const specs: Specs = {};
  const put = (key: keyof Specs, value: string) => {
    if (value) specs[key] = { value, source: "vin" };
  };
  put("year", clean(row.ModelYear));
  put("make", titleCase(make));
  put("model", clean(row.Model));

  const engineParts = [clean(row.EngineModel)];
  const liters = clean(row.DisplacementL);
  if (liters) engineParts.push(`${Number(liters).toFixed(1)} L`);
  const hp = clean(row.EngineHP);
  if (hp) engineParts.push(`${hp} hp`);
  put("engine", engineParts[0] ? engineParts.filter(Boolean).join(", ") : "");

  put("drive", clean(row.DriveType));
  const gvwr = clean(row.GVWR);
  put("weightClass", gvwr.split("(")[0].trim());
  const trim = [clean(row.Trim), clean(row.Series)].filter(Boolean).join(" ");
  put("trim", trim);

  const cab = cabFromText(`${trim} ${clean(row.BodyCabType)}`);

  const notes: string[] = [];
  if (!checkDigitOk(vin)) {
    notes.push("The check digit does not match. Check the VIN against the door sticker.");
  }
  if (gvwr && !gvwr.startsWith("Class 8")) {
    notes.push("This VIN is not a Class 8. The planning numbers are for Class 8 highway tractors.");
  }
  if (!specs.engine) notes.push("The VIN did not give the engine. Type it below.");
  return { ok: true, specs, cab, notes };
}

export async function decodeVin(vin: string, signal?: AbortSignal): Promise<VinDecode> {
  let res: Response;
  try {
    res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
      { signal },
    );
  } catch {
    return { ok: false, error: "Could not reach the NHTSA VIN service. Check your signal and try again." };
  }
  if (!res.ok) return { ok: false, error: `The NHTSA VIN service returned ${res.status}. Try again.` };
  const body = (await res.json()) as { Results?: VpicRow[] };
  const row = body.Results?.[0];
  if (!row) return { ok: false, error: "The NHTSA VIN service sent back nothing. Try again." };
  return mapVpic(row, vin);
}
