import { gentlerAlternatives } from "../ingredients/classes";
import type { IngredientClass } from "../types";
import { draftMessage, type DraftKind } from "./drafts";
import type { AgentSummary } from "./summary";

/** OpenAI-compatible tool definitions (docs/08). All read from the client-sent summary. */
export const TOOL_DEFS = [
  { name: "get_trial_summary", description: "Product(s), treated side, zone, goals, days elapsed/planned, return deadline, adherence, status.", parameters: { type: "object", properties: {} } },
  {
    name: "get_measurements",
    description: "Per scan: day, Δ (treated-vs-control change from baseline, log ratio; negative = treated side improved), treated/control detected-area %, whole-face raw score.",
    parameters: { type: "object", properties: { concern: { type: "string", description: "Optional concern label, e.g. Acne" } } },
  },
  { name: "get_verdict", description: "Engine verdict, confidence, effect % and noise range per concern, sentinel status, reasons.", parameters: { type: "object", properties: {} } },
  { name: "get_context_log", description: "Sleep, stress and period notes per scan day.", parameters: { type: "object", properties: {} } },
  { name: "get_ingredient_profile", description: "Ingredients that appeared in several of the user's irritating products (patterns, not proof).", parameters: { type: "object", properties: {} } },
  {
    name: "draft_message",
    description: "Draft text for the user to copy and send. Never sends anything.",
    parameters: {
      type: "object",
      properties: { kind: { type: "string", enum: ["return_request", "brand_feedback", "share_summary"] }, tone: { type: "string", enum: ["polite", "firm"] } },
      required: ["kind"],
    },
  },
  {
    name: "suggest_next_trial",
    description: "Gentler product types to look for next, given ingredient classes to avoid.",
    parameters: { type: "object", properties: { avoidClasses: { type: "array", items: { type: "string" } } } },
  },
  {
    name: "schedule_reminder",
    description: "Offer the user a calendar reminder for a scan date (they confirm in the app).",
    parameters: { type: "object", properties: { dateISO: { type: "string" }, note: { type: "string" } }, required: ["dateISO"] },
  },
].map((f) => ({ type: "function" as const, function: f }));

export interface AgentAction {
  kind: "draft" | "reminder";
  text?: string;
  dateISO?: string;
  note?: string;
}

/** Execute one tool call against the summary. Unknown tools and bad args return an error object, never invented data. */
export function runTool(name: string, rawArgs: string, s: AgentSummary, actions: AgentAction[]): unknown {
  let args: Record<string, unknown> = {};
  try {
    args = rawArgs ? JSON.parse(rawArgs) : {};
  } catch {
    args = {};
  }
  switch (name) {
    case "get_trial_summary":
      return s.trial;
    case "get_measurements": {
      const c = typeof args.concern === "string" ? args.concern.toLowerCase() : "";
      const m = c ? s.measurements.filter((x) => x.concern.toLowerCase().includes(c)) : s.measurements;
      return m.length ? m : { error: "No measurements recorded for that concern yet." };
    }
    case "get_verdict":
      return s.verdict;
    case "get_context_log":
      return s.context.length ? s.context : { note: "No context notes logged." };
    case "get_ingredient_profile":
      return s.ingredientFlags.length ? s.ingredientFlags : { note: "No ingredient patterns yet (needs at least two irritating trials)." };
    case "draft_message": {
      const kind = (["return_request", "brand_feedback", "share_summary"].includes(String(args.kind)) ? args.kind : "return_request") as DraftKind;
      const text = draftMessage(s, kind, args.tone === "firm" ? "firm" : "polite");
      actions.push({ kind: "draft", text });
      return { text, note: "Shown to the user with a Copy button." };
    }
    case "suggest_next_trial": {
      const avoid = (Array.isArray(args.avoidClasses) ? args.avoidClasses : s.trial.ingredientClasses) as IngredientClass[];
      return { lookFor: gentlerAlternatives(avoid) };
    }
    case "schedule_reminder": {
      const dateISO = String(args.dateISO ?? "");
      if (Number.isNaN(Date.parse(dateISO))) return { error: "Invalid date." };
      actions.push({ kind: "reminder", dateISO, note: typeof args.note === "string" ? args.note : "SplitSide scan" });
      return { ok: true, note: "The user will see an 'Add to calendar' button." };
    }
    default:
      return { error: `Unknown tool ${name}` };
  }
}
