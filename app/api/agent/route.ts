import { z } from "zod";
import { groqComplete, runAgent } from "@/lib/agent/loop";
import { AgentSummarySchema } from "@/lib/agent/summary";
import { allow, clientKey } from "@/lib/rateLimit";

const Body = z.object({
  summary: AgentSummarySchema,
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).min(1).max(30),
});

/**
 * Trial assistant. Data stays on the device: the client sends derived numbers only.
 * Without GROQ_API_KEY (or on failure) the client shows the deterministic engine text instead.
 */
export async function POST(req: Request) {
  if (!allow(clientKey(req, "agent"), 20)) return Response.json({ fallback: true, reason: "rate_limited" }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const key = process.env.GROQ_API_KEY;
  if (!key) return Response.json({ fallback: true, reason: "not_configured" });
  try {
    const out = await runAgent(groqComplete(key, process.env.GROQ_MODEL ?? "openai/gpt-oss-120b"), parsed.data.summary, parsed.data.messages);
    if (!out.text) return Response.json({ fallback: true, reason: "empty", actions: out.actions });
    return Response.json(out);
  } catch (e) {
    console.error("agent error", e instanceof Error ? e.message : e);
    return Response.json({ fallback: true, reason: "llm_error" });
  }
}
