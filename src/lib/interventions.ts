/**
 * Planning numbers. Not quotes. Aero rows copied from Let's Truck Driveline,
 * src/lib/fuel/presets.ts. Tire row set by Kevin on 2026-09-15.
 */
export type MpgIntervention = {
  id: "skirts" | "tail" | "gap" | "aero" | "tires";
  name: string;
  mpgGain: number;
  cost: number;
  note: string;
};

export const MPG_ROWS: Record<MpgIntervention["id"], MpgIntervention> = {
  skirts: {
    id: "skirts",
    name: "Trailer side skirts",
    mpgGain: 0.4,
    cost: 2500,
    note: "Typical trailer skirts. Your quote will differ.",
  },
  tail: {
    id: "tail",
    name: "Trailer tail",
    mpgGain: 0.3,
    cost: 1800,
    note: "Boat-tail or rear fairing. Works best with skirts.",
  },
  gap: {
    id: "gap",
    name: "Cab extenders / gap fairing",
    mpgGain: 0.2,
    cost: 1200,
    note: "Closes the tractor-trailer gap. Planning number.",
  },
  aero: {
    id: "aero",
    name: "Tractor aero kit",
    mpgGain: 0.6,
    cost: 4500,
    note: "Extenders, bumper, chassis fairings as a set.",
  },
  tires: {
    id: "tires",
    name: "Low rolling resistance tires",
    mpgGain: 0.3,
    cost: 3500,
    note: "Full set of 18, SmartWay-verified, over lug tread. Your quote will differ.",
  },
};

/** Target cruise for the speed row. Same default as the Fuel calculator. */
export const TARGET_CRUISE = 65;

/** Parked burn rates, gallons per hour. Same defaults as the Fuel calculator. */
export const IDLE_GPH = { engine: 0.8, dieselApu: 0.2, batteryApu: 0 } as const;
