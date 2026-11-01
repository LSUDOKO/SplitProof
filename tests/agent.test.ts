import { describe, expect, it } from "vitest";
import { runAgent, type ChatMessage, type Complete } from "@/lib/agent/loop";
import { buildSummary } from "@/lib/agent/summary";
import { evaluateTrial } from "@/lib/stats/verdict";
import { baseline, makeScan, makeTrial } from "./helpers/trial";

const trial = makeTrial({ returnDeadline: "2026-11-25T00:00:00.000Z" });
const scans = [...baseline("hd_acne"), makeScan(7, { hd_acne: 0.1 - 0.3 }), makeScan(9, { hd_acne: 0.1 - 0.35 })];
const summary = buildSummary(trial, scans, evaluateTrial(trial, scans));

/** Scripted LLM: first asks for the verdict, then answers using only the tool result it received. */
const scripted: Complete = async (messages: ChatMessage[]) => {
  const toolMsg = messages.find((m) => m.role === "tool");
  if (!toolMsg) return { role: "assistant", content: null, tool_calls: [{ id: "1", type: "function", function: { name: "get_verdict", arguments: "{}" } }] };
  const v = JSON.parse(toolMsg.content!);
  return { role: "assistant", content: `Verdict ${v.verdict}, ${v.concerns[0].effectPct}% effect.` };
};

describe("agent loop", () => {
  it("answers with numbers taken from get_verdict", async () => {
    const out = await runAgent(scripted, summary, [{ role: "user", content: "Is it working?" }]);
    expect(out.toolsUsed).toEqual(["get_verdict"]);
    expect(out.text).toBe(`Verdict working, ${summary.verdict.concerns[0].effectPct}% effect.`);
  });

  it("returns a draft action for return requests and never invents missing data", async () => {
    const calls: Complete = async (messages) => {
      if (messages.some((m) => m.role === "tool")) return { role: "assistant", content: "Draft ready." };
      return {
        role: "assistant",
        content: null,
        tool_calls: [
          { id: "a", type: "function", function: { name: "draft_message", arguments: '{"kind":"return_request"}' } },
          { id: "b", type: "function", function: { name: "get_measurements", arguments: '{"concern":"Pores"}' } },
        ],
      };
    };
    let seenTools: ChatMessage[] = [];
    const spy: Complete = async (m, t) => ((seenTools = m), calls(m, t));
    const out = await runAgent(spy, summary, [{ role: "user", content: "Draft my return" }]);
    expect(out.actions[0].kind).toBe("draft");
    expect(out.actions[0].text).toContain("Return request — Serum");
    expect(seenTools.find((m) => m.tool_call_id === "b")!.content).toContain("No measurements");
  });
});
