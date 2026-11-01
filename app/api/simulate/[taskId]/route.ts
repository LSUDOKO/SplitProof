import type { NextRequest } from "next/server";
import { allow, clientKey, tooMany } from "@/lib/rateLimit";
import { friendlyMessage } from "@/lib/youcam/errors";
import { errorResponse } from "@/lib/youcam/respond";
import { fetchMask, getSimulation } from "@/lib/youcam/skinAnalysis";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/simulate/[taskId]">) {
  if (!allow(clientKey(req, "poll"), 120)) return tooMany();
  try {
    const { taskId } = await ctx.params;
    const r = await getSimulation(taskId);
    if (r.status === "running") return Response.json({ status: "running" });
    if (r.status === "error") return Response.json({ status: "error", code: r.code, message: friendlyMessage(r.code) });
    const img = await fetchMask(r.url);
    return Response.json({ status: "success", image: `data:image/png;base64,${img.base64}` });
  } catch (e) {
    return errorResponse(e);
  }
}
