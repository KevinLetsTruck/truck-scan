/**
 * Copied from Let's Truck Driveline, src/lib/fuel/math.ts.
 * Same functions, same numbers, so a row here matches the Fuel calculator.
 * If Driveline's math changes, copy it again.
 */

export function fuelMath(input: {
  miles: number;
  diesel: number;
  nowMpg: number;
  nextMpg: number;
  cost: number;
}) {
  const nowMpg = Math.max(input.nowMpg, 0.1);
  const nextMpg = Math.max(input.nextMpg, 0.1);
  const miles = Math.max(input.miles, 0);
  const diesel = Math.max(input.diesel, 0);
  const cost = Math.max(input.cost, 0);
  const galNow = miles / nowMpg;
  const galNext = miles / nextMpg;
  const gallons = galNow - galNext;
  const yearSave = gallons * diesel;
  const monthly = yearSave / 12;
  const cpmNow = diesel / nowMpg;
  const cpmNext = diesel / nextMpg;
  const breakEvenMonths =
    monthly > 0 && cost > 0 ? cost / monthly : monthly <= 0 && cost > 0 ? Infinity : 0;
  return {
    galNow,
    galNext,
    gallons,
    yearSave,
    monthly,
    cpmNow,
    cpmNext,
    breakEvenMonths,
    net1: yearSave - cost,
    net3: yearSave * 3 - cost,
    net5: yearSave * 5 - cost,
  };
}

/**
 * Class 8 highway fuel vs speed. Rolling (about constant) + aero (~ speed²) +
 * accessories (more hours at lower speed). Split at 65 mph for a sleeper
 * (NACFE / 21st Century Truck). Scaled to pass through the driver's own MPG.
 */
export const SPEED_REF_MPH = 65;
export const SPEED_SPLIT = { aero: 0.5, roll: 0.42, accessory: 0.08 } as const;

export function speedShape(mph: number) {
  const v = Math.max(mph, 1);
  const r = v / SPEED_REF_MPH;
  return SPEED_SPLIT.roll + SPEED_SPLIT.aero * r * r + SPEED_SPLIT.accessory / r;
}

export function mpgAtSpeed(mpgNow: number, speedNow: number, speedNext: number) {
  const now = Math.max(mpgNow, 0.1);
  const shapeNext = speedShape(speedNext);
  if (shapeNext <= 0) return now;
  return now * (speedShape(speedNow) / shapeNext);
}

export function speedMath(input: {
  miles: number;
  diesel: number;
  mpgNow: number;
  speedNow: number;
  speedNext: number;
}) {
  const miles = Math.max(input.miles, 0);
  const speedNow = Math.max(input.speedNow, 1);
  const speedNext = Math.max(input.speedNext, 1);
  const mpgNext = mpgAtSpeed(input.mpgNow, speedNow, speedNext);
  const fuel = fuelMath({
    miles,
    diesel: input.diesel,
    nowMpg: input.mpgNow,
    nextMpg: mpgNext,
    cost: 0,
  });
  return {
    mpgNext,
    fuel,
    extraHours: miles / speedNext - miles / speedNow,
  };
}

/** Parked hotel load: gallons and dollars a year at a given burn rate. */
export function hotelYear(input: { hours: number; gph: number; diesel: number }) {
  const gal = Math.max(0, input.hours) * Math.max(0, input.gph);
  return { gal, spend: gal * Math.max(0, input.diesel) };
}

export function breakEvenMonths(yearSave: number, cost: number) {
  const monthly = yearSave / 12;
  if (cost <= 0) return 0;
  if (monthly <= 0) return Infinity;
  return cost / monthly;
}

export function breakEvenLabel(months: number | null) {
  if (months === null) return "Type a quote to see payback";
  if (!Number.isFinite(months)) return "Does not pay back";
  if (months <= 0) return "No cost. Savings start now";
  if (months < 1) return "Pays back in under a month";
  if (months >= 120) return "Pays back in 10+ years";
  if (months < 12) return `Pays back in ${months.toFixed(1)} months`;
  return `Pays back in ${(months / 12).toFixed(1)} years`;
}
