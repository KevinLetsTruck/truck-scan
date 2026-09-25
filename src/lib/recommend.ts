import { breakEvenMonths, fuelMath, hotelYear, speedMath } from "./fuel";
import { IDLE_GPH, MPG_ROWS, TARGET_CRUISE, type MpgIntervention } from "./interventions";
import type { Answer, Cab, Equipment, Numbers } from "./types";

export type Row = {
  id: string;
  name: string;
  note: string;
  tags: string[];
  kind: "mpg" | "speed" | "idle";
  mpgNow?: number;
  mpgNext?: number;
  cpmNow?: number;
  cpmNext?: number;
  extraHours?: number;
  gallons: number;
  yearSave: number;
  yearSaveLow: number;
  yearSaveHigh: number;
  /** null when the driver has not typed a quote. */
  cost: number | null;
  breakEvenMonths: number | null;
};

const NOT_CHECKED = "Not checked yet";
const TRAILER_ONLY = "Only if you own the trailer";

function missing(a: Answer | undefined) {
  return a !== "yes";
}

function unsureTag(a: Answer | undefined) {
  return a === "no" ? [] : [NOT_CHECKED];
}

function mpgRow(p: MpgIntervention, n: Numbers, tags: string[]): Row {
  const nextMpg = n.mpg + p.mpgGain;
  const at = (diesel: number) =>
    fuelMath({ miles: n.miles, diesel, nowMpg: n.mpg, nextMpg, cost: p.cost });
  const base = at(n.diesel);
  return {
    id: p.id,
    name: p.name,
    note: p.note,
    tags,
    kind: "mpg",
    mpgNow: n.mpg,
    mpgNext: nextMpg,
    cpmNow: base.cpmNow,
    cpmNext: base.cpmNext,
    gallons: base.gallons,
    yearSave: base.yearSave,
    yearSaveLow: at(Math.max(0, n.diesel - 1)).yearSave,
    yearSaveHigh: at(n.diesel + 1).yearSave,
    cost: p.cost,
    breakEvenMonths: base.breakEvenMonths,
  };
}

function idleRow(
  id: string,
  name: string,
  fromGph: number,
  toGph: number,
  cost: number | null,
  n: Numbers,
  tags: string[],
): Row {
  const hours = n.idleHoursPerDay * n.idleDaysPerYear;
  const save = (diesel: number) =>
    hotelYear({ hours, gph: fromGph, diesel }).spend - hotelYear({ hours, gph: toGph, diesel }).spend;
  const yearSave = save(n.diesel);
  return {
    id,
    name,
    note: `Idling burns about ${IDLE_GPH.engine} gal/hr. A diesel APU about ${IDLE_GPH.dieselApu}. A battery APU burns none. Planning rates.`,
    tags,
    kind: "idle",
    gallons: hours * (fromGph - toGph),
    yearSave,
    yearSaveLow: save(Math.max(0, n.diesel - 1)),
    yearSaveHigh: save(n.diesel + 1),
    cost,
    breakEvenMonths: cost === null ? null : breakEvenMonths(yearSave, cost),
  };
}

export function numbersReady(n: Numbers) {
  return n.mpg > 0 && n.miles > 0 && n.diesel > 0;
}

/**
 * Every change that is not already on the truck, with what it is worth.
 * Sorted by payback: no-cost first, rows waiting on a quote last.
 */
export function recommend(input: { equipment: Equipment; cab: Cab; numbers: Numbers }): Row[] {
  const { equipment: e, cab, numbers: n } = input;
  if (!numbersReady(n)) return [];
  const rows: Row[] = [];

  // Trailer. Hidden when the driver does not own the trailer.
  if (e.ownTrailer !== "no") {
    const own = e.ownTrailer === "yes" ? [] : [TRAILER_ONLY];
    if (missing(e.trailerSkirts)) {
      rows.push(mpgRow(MPG_ROWS.skirts, n, [...own, ...unsureTag(e.trailerSkirts)]));
    }
    if (missing(e.trailerTail)) {
      rows.push(mpgRow(MPG_ROWS.tail, n, [...own, ...unsureTag(e.trailerTail)]));
    }
  }

  // Tractor aero. The kit includes extenders, so the gap row only shows when fairings are on.
  if (missing(e.chassisFairings)) {
    rows.push(mpgRow(MPG_ROWS.aero, n, unsureTag(e.chassisFairings)));
  } else if (missing(e.cabExtenders)) {
    rows.push(mpgRow(MPG_ROWS.gap, n, unsureTag(e.cabExtenders)));
  }

  if (missing(e.lrrTires)) rows.push(mpgRow(MPG_ROWS.tires, n, unsureTag(e.lrrTires)));

  if (n.cruise > TARGET_CRUISE) {
    const at = (diesel: number) =>
      speedMath({ miles: n.miles, diesel, mpgNow: n.mpg, speedNow: n.cruise, speedNext: TARGET_CRUISE });
    const s = at(n.diesel);
    rows.push({
      id: "speed",
      name: `Cruise at ${TARGET_CRUISE} instead of ${n.cruise}`,
      note: "Aero drag rises with speed squared. The curve is scaled to your MPG. Same miles take more hours.",
      tags: [],
      kind: "speed",
      mpgNow: n.mpg,
      mpgNext: s.mpgNext,
      cpmNow: s.fuel.cpmNow,
      cpmNext: s.fuel.cpmNext,
      extraHours: s.extraHours,
      gallons: s.fuel.gallons,
      yearSave: s.fuel.yearSave,
      yearSaveLow: at(Math.max(0, n.diesel - 1)).fuel.yearSave,
      yearSaveHigh: at(n.diesel + 1).fuel.yearSave,
      cost: 0,
      breakEvenMonths: 0,
    });
  }

  // Idle. Day cabs have no sleeper to heat or cool.
  if (cab !== "day" && e.idle !== "battery-apu") {
    const tags = e.idle === "idles" || e.idle === "diesel-apu" ? [] : [NOT_CHECKED];
    if (e.idle === "diesel-apu") {
      rows.push(
        idleRow("battery-over-diesel", "Battery APU instead of the diesel APU",
          IDLE_GPH.dieselApu, IDLE_GPH.batteryApu, n.batteryApuQuote, n, tags),
      );
    } else {
      rows.push(
        idleRow("battery-apu", "Battery APU instead of idling",
          IDLE_GPH.engine, IDLE_GPH.batteryApu, n.batteryApuQuote, n, tags),
        idleRow("diesel-apu", "Diesel APU instead of idling",
          IDLE_GPH.engine, IDLE_GPH.dieselApu, n.dieselApuQuote, n, tags),
      );
    }
  }

  const rank = (r: Row) => (r.breakEvenMonths === null ? Number.MAX_VALUE : r.breakEvenMonths);
  return rows
    .filter((r) => r.yearSave > 0)
    .sort((a, b) => rank(a) - rank(b) || b.yearSave - a.yearSave);
}
