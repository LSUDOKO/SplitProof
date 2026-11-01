import { SYSTEM_PROMPT } from "./prompt";
import type { AgentSummary } from "./summary";
import { TOOL_DEFS, runTool, type AgentAction } from "./tools";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

/** One chat-completions call (OpenAI-compatible). Injected so tests can mock the LLM. */
export type Complete = (messages: ChatMessage[], tools: typeof TOOL_DEFS) => Promise<ChatMessage>;

const MAX_STEPS = 5;

export async function runAgent(complete: Complete, summary: AgentSummary, history: { role: "user" | "assistant"; content: string }[]) {
  const messages: ChatMessage[] = [{ role: "system", content: SYSTEM_PROMPT }, ...history.slice(-12)];
  const actions: AgentAction[] = [];
  const toolsUsed: string[] = [];
  for (let step = 0; step < MAX_STEPS; step++) {
    const reply = await complete(messages, TOOL_DEFS);
    if (!reply.tool_calls?.length) return { text: reply.content?.trim() || "", actions, toolsUsed };
    messages.push({ role: "assistant", content: reply.content ?? null, tool_calls: reply.tool_calls });
    for (const call of reply.tool_calls) {
      toolsUsed.push(call.function.name);
      const result = runTool(call.function.name, call.function.arguments, summary, actions);
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  return { text: "", actions, toolsUsed };
}

/** Groq's OpenAI-compatible endpoint, plain fetch. */
export function groqComplete(apiKey: string, model: string): Complete {
  return async (messages, tools) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, tools, tool_choice: "auto", temperature: 0.2, max_completion_tokens: 700 }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = (await res.json()) as { choices: { message: ChatMessage }[] };
    const m = data.choices[0].message;
    return { role: "assistant", content: m.content ?? null, tool_calls: m.tool_calls };
  };
}
