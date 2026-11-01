import type { Trial, Verdict } from "../types";

export interface Savings {
  /** Refunds on products returned after a trial. */
  returned: number;
  /** Head-to-head wins: the premium product you didn't need to buy. */
  cheaperChoice: number;
  total: number;
  /** Not yet acted on: stop / worse / no-difference products still inside a decision. */
  atStake: number;
}

/** Money-saved tracker for the Skin Passport. Prices are what the user typed; nothing is estimated. */
export function moneySaved(items: { trial: Trial; verdict: Verdict }[]): Savings {
  let returned = 0;
  let cheaperChoice = 0;
  let atStake = 0;
  for (const { trial: t, verdict } of items) {
    const a = t.products.A.price ?? 0;
    const b = t.products.B?.price ?? 0;
    if (t.mode === "head_to_head") {
      // No real difference: the cheaper one does the job, so the gap is saved.
      if (verdict === "no_difference") cheaperChoice += Math.abs(a - b);
      // A beat B or B beat A only counts when the winner is also the cheaper one.
      else if (verdict === "working" && a < b) cheaperChoice += b - a;
      else if (verdict === "worse" && b < a) cheaperChoice += a - b;
      continue;
    }
    if (t.decision === "returned") returned += a;
    else if (!t.decision && (verdict === "stop" || verdict === "worse" || verdict === "no_difference")) atStake += a;
  }
  return { returned, cheaperChoice, total: returned + cheaperChoice, atStake };
}
