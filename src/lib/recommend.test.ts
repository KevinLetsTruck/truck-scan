import { describe, expect, it } from "vitest";
import { fuelMath, mpgAtSpeed } from "./fuel";
import { recommend } from "./recommend";
import { blankScan } from "./storage";
import type { Equipment } from "./types";

const numbers = blankScan().numbers; // 7.4 mpg, 110,000 mi, $3.85, 70 mph

const allOn: Equipment = {
  ownTrailer: "yes",
  trailerSkirts: "yes",
  trailerTail: "yes",
  cabExtenders: "yes",
  chassisFairings: "yes",
  lrrTires: "yes",
  idle: "battery-apu",
};

const ids = (e: Equipment, cab: "sleeper" | "day" | "unsure" = "sleeper", n = numbers) =>
  recommend({ equipment: e, cab, numbers: n }).map((r) => r.id);

describe("fuel math matches Driveline", () => {
  it("skirts at the default numbers", () => {
    const f = fuelMath({ miles: 110000, diesel: 3.85, nowMpg: 7.4, nextMpg: 7.8, cost: 2500 });
    expect(f.gallons).toBeCloseTo(110000 / 7.4 - 110000 / 7.8, 6);
    expect(f.yearSave).toBeCloseTo(f.gallons * 3.85, 6);
    expect(f.breakEvenMonths).toBeCloseTo(2500 / (f.yearSave / 12), 6);
  });

  it("speed curve passes through the driver's MPG and rises when slower", () => {
    expect(mpgAtSpeed(7.4, 70, 70)).toBeCloseTo(7.4, 9);
    expect(mpgAtSpeed(7.4, 70, 65)).toBeGreaterThan(7.4);
  });
});

describe("recommend", () => {
  it("shows only the speed row when everything is on the truck", () => {
    expect(ids(allOn)).toEqual(["speed"]);
    expect(ids(allOn, "sleeper", { ...numbers, cruise: 65 })).toEqual([]);
  });

  it("hides trailer rows when the driver does not own the trailer", () => {
    const got = ids({ ...allOn, ownTrailer: "no", trailerSkirts: "no", trailerTail: "no" });
    expect(got).not.toContain("skirts");
    expect(got).not.toContain("tail");
  });

  it("tags trailer rows when ownership is not answered", () => {
    const rows = recommend({
      equipment: { ...allOn, ownTrailer: undefined, trailerSkirts: "no" },
      cab: "sleeper",
      numbers,
    });
    expect(rows.find((r) => r.id === "skirts")?.tags).toEqual(["Only if you own the trailer"]);
  });

  it("offers the aero kit instead of the gap row when fairings are missing", () => {
    expect(ids({ ...allOn, chassisFairings: "no", cabExtenders: "no" })).toContain("aero");
    expect(ids({ ...allOn, chassisFairings: "no", cabExtenders: "no" })).not.toContain("gap");
    expect(ids({ ...allOn, cabExtenders: "no" })).toContain("gap");
  });

  it("uses Kevin's tire number: 0.3 MPG, $3,500", () => {
    const row = recommend({ equipment: { ...allOn, lrrTires: "no" }, cab: "sleeper", numbers }).find(
      (r) => r.id === "tires",
    );
    expect(row?.mpgNext).toBeCloseTo(7.7, 9);
    expect(row?.cost).toBe(3500);
  });

  it("drops idle rows on a day cab", () => {
    const got = ids({ ...allOn, idle: "idles" }, "day");
    expect(got.some((id) => id.includes("apu"))).toBe(false);
  });

  it("idle rows wait on a quote and sort last", () => {
    const rows = recommend({ equipment: { ...allOn, idle: "idles", lrrTires: "no" }, cab: "sleeper", numbers });
    expect(rows.map((r) => r.id)).toEqual(["speed", "tires", "battery-apu", "diesel-apu"]);
    const battery = rows.find((r) => r.id === "battery-apu")!;
    expect(battery.breakEvenMonths).toBeNull();
    expect(battery.gallons).toBeCloseTo(8 * 250 * 0.8, 9);
  });

  it("idle rows get a payback once a quote is typed", () => {
    const rows = recommend({
      equipment: { ...allOn, idle: "idles" },
      cab: "sleeper",
      numbers: { ...numbers, batteryApuQuote: 12000 },
    });
    const battery = rows.find((r) => r.id === "battery-apu")!;
    expect(battery.breakEvenMonths).toBeCloseTo(12000 / ((1600 * 3.85) / 12), 6);
  });

  it("compares battery to diesel APU when the truck already has a diesel APU", () => {
    expect(ids({ ...allOn, idle: "diesel-apu" })).toContain("battery-over-diesel");
  });

  it("sorts by payback, cheapest first", () => {
    const rows = recommend({
      equipment: { ownTrailer: "yes", idle: "battery-apu" },
      cab: "sleeper",
      numbers,
    });
    const months = rows.map((r) => r.breakEvenMonths as number);
    expect([...months].sort((a, b) => a - b)).toEqual(months);
  });

  it("returns nothing until MPG, miles, and diesel are typed", () => {
    expect(ids({}, "sleeper", { ...numbers, mpg: 0 })).toEqual([]);
  });
});
