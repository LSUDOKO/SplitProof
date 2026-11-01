import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/clipboard";
import { isBarcode, parseObf } from "@/lib/integrations/openBeautyFacts";
import { parseLocalContext, roundCoord } from "@/lib/integrations/localContext";
import { moneySaved } from "@/lib/trial/savings";
import { makeTrial } from "./helpers/trial";

const fx = (n: string) => JSON.parse(readFileSync(`tests/fixtures/external/${n}.json`, "utf8"));

describe("Open Beauty Facts", () => {
  it("parses a recorded product with ingredients", () => {
    const p = parseObf(fx("obf-product"));
    expect(p.found).toBe(true);
    expect(p.ingredients?.length).toBeGreaterThan(5);
  });
  it("treats an unknown barcode as not found", () => expect(parseObf(fx("obf-missing")).found).toBe(false));
  it("validates barcodes", () => {
    expect(isBarcode("3600523390461")).toBe(true);
    expect(isBarcode("abc")).toBe(false);
    expect(isBarcode("123")).toBe(false);
  });
});

describe("Open-Meteo context", () => {
  it("parses recorded humidity, temperature and air quality", () => {
    const c = parseLocalContext(fx("open-meteo-forecast"), fx("open-meteo-air"))!;
    expect(c.humidity).toBeGreaterThan(0);
    expect(c.aqi).toBeGreaterThan(0);
  });
  it("still works when air quality is unavailable, and fails closed on bad data", () => {
    expect(parseLocalContext(fx("open-meteo-forecast"), {})!.aqi).toBeUndefined();
    expect(parseLocalContext({}, {})).toBeNull();
  });
  it("rounds coordinates before they leave the device", () => expect(roundCoord(28.61392)).toBe(28.6));
});

describe("money saved", () => {
  const single = (price: number, decision?: "kept" | "returned") => makeTrial({ products: { A: { name: "x", price } }, decision });
  it("counts returned products and leaves undecided ones at stake", () => {
    const s = moneySaved([
      { trial: single(899, "returned"), verdict: "stop" },
      { trial: single(500), verdict: "no_difference" },
      { trial: single(700, "kept"), verdict: "working" },
    ]);
    expect(s).toMatchObject({ returned: 899, atStake: 500, total: 899 });
  });
  it("counts the price gap when the cheaper product did as well or better", () => {
    const h2h = (a: number, b: number) => makeTrial({ mode: "head_to_head", products: { A: { name: "a", price: a }, B: { name: "b", price: b } } });
    expect(moneySaved([{ trial: h2h(350, 3200), verdict: "no_difference" }]).cheaperChoice).toBe(2850);
    expect(moneySaved([{ trial: h2h(350, 3200), verdict: "working" }]).cheaperChoice).toBe(2850);
    expect(moneySaved([{ trial: h2h(3200, 350), verdict: "working" }]).cheaperChoice).toBe(0);
  });
});

describe("calendar export", () => {
  it("writes one VEVENT per scan", () => {
    const ics = buildIcs([{ dateISO: "2026-11-03T08:00:00Z", title: "Scan" }, { dateISO: "2026-11-05T08:00:00Z", title: "Scan" }], new Date("2026-11-01T00:00:00Z"));
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain("DTSTART:20261103T080000Z");
  });
});
