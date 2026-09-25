import { describe, expect, it } from "vitest";
import fixture from "./__fixtures__/cascadia-2018.json";
import { cabFromText, checkDigitOk, mapVpic, normalizeVin, vinProblem } from "./vin";

describe("VIN checks", () => {
  it("normalizes case and strips spaces and dashes", () => {
    expect(normalizeVin(" 3akj-hhdr x jsjv5530 ")).toBe("3AKJHHDRXJSJV5530");
  });

  it("names the problem with a bad VIN", () => {
    expect(vinProblem("")).toBe("Type the VIN.");
    expect(vinProblem("3AKJHHDRX")).toMatch(/17 characters/);
    expect(vinProblem("3AKJHHDRXJSJV553O")).toMatch(/I, O, or Q/);
    expect(vinProblem("3AKJHHDRXJSJV5530")).toBeNull();
  });

  it("checks the 9th-position check digit", () => {
    expect(checkDigitOk("3AKJHHDRXJSJV5530")).toBe(true); // NHTSA: "Check Digit is correct"
    expect(checkDigitOk("1M8GDM9AXKP042788")).toBe(true); // textbook example
    expect(checkDigitOk("3AKJHHDR5JSJV5530")).toBe(false);
  });

  it("reads the cab from the trim text", () => {
    expect(cabFromText('126" sleeper cab')).toBe("sleeper");
    expect(cabFromText("Day Cab")).toBe("day");
    expect(cabFromText("MDHD: Conventional")).toBe("unsure");
  });
});

describe("mapVpic", () => {
  it("maps a real 2018 Cascadia decode", () => {
    const out = mapVpic(fixture, "3AKJHHDRXJSJV5530");
    if (!out.ok) throw new Error(out.error);
    expect(out.specs.year?.value).toBe("2018");
    expect(out.specs.make?.value).toBe("Freightliner");
    expect(out.specs.model?.value).toBe("Cascadia");
    expect(out.specs.engine?.value).toBe("Detroit Diesel DD15, 14.8 L");
    expect(out.specs.drive?.value).toBe("6x4");
    expect(out.specs.weightClass?.value).toBe("Class 8: 33,001 lb and above");
    expect(out.specs.make?.source).toBe("vin");
    expect(out.cab).toBe("sleeper");
    expect(out.notes).toEqual([]);
  });

  it("flags a bad check digit and a non-Class 8", () => {
    const out = mapVpic({ ...fixture, GVWR: "Class 6: 19,501 - 26,000 lb" }, "3AKJHHDR5JSJV5530");
    if (!out.ok) throw new Error(out.error);
    expect(out.notes.join(" ")).toMatch(/check digit/);
    expect(out.notes.join(" ")).toMatch(/not a Class 8/);
  });

  it("fails when NHTSA has no make", () => {
    const out = mapVpic({ Make: "" }, "3AKJHHDRXJSJV5530");
    expect(out.ok).toBe(false);
  });
});
