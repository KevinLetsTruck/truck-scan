/** Where a spec line came from. Shown next to every value on the spec sheet. */
export type Source = "vin" | "typed";

export type SpecKey = "year" | "make" | "model" | "engine" | "drive" | "weightClass" | "trim";

export type SpecLine = { value: string; source: Source };

export type Specs = Partial<Record<SpecKey, SpecLine>>;

export type Cab = "sleeper" | "day" | "unsure";

export type Answer = "yes" | "no" | "unsure";

export type EquipmentKey =
  | "ownTrailer"
  | "trailerSkirts"
  | "trailerTail"
  | "cabExtenders"
  | "chassisFairings"
  | "lrrTires";

export type IdleSetup = "idles" | "diesel-apu" | "battery-apu" | "unsure";

export type Equipment = Partial<Record<EquipmentKey, Answer>> & { idle?: IdleSetup };

export type Numbers = {
  mpg: number;
  miles: number;
  diesel: number;
  cruise: number;
  idleHoursPerDay: number;
  idleDaysPerYear: number;
  /** Driver's quote. null means not typed yet. */
  batteryApuQuote: number | null;
  dieselApuQuote: number | null;
};

export type Scan = {
  id: string;
  vin: string;
  specs: Specs;
  cab: { value: Cab; source: Source };
  vinNotes: string[];
  equipment: Equipment;
  numbers: Numbers;
  updatedAt: string;
};
