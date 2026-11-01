import type { NextRequest } from "next/server";
import { allow, clientKey, tooMany } from "@/lib/rateLimit";
import { YoucamError, friendlyMessage } from "@/lib/youcam/errors";
import { errorResponse } from "@/lib/youcam/respond";
import { ImageResult } from "@/lib/youcam/schemas";
import { fetchMask } from "@/lib/youcam/skinAnalysis";
import { isTaskKind, pollTask } from "@/lib/youcam/tasks";

/** One poll of an image task; on success the image is downloaded now (YouCam keeps it ~2 h). */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/preview/[taskId]">) {
  if (!allow(clientKey(req, "poll"), 120)) return tooMany();
  try {
    const { taskId } = await ctx.params;
    const kind = req.nextUrl.searchParams.get("kind") ?? "";
    if (!isTaskKind(kind)) throw new YoucamError("error_invalid_params", 400);
    const p = await pollTask(kind, taskId);
    if (p.status === "running") return Response.json({ status: "running" });
    if (p.status === "error") return Response.json({ status: "error", code: p.code, message: friendlyMessage(p.code) });
    const result = ImageResult.safeParse(p.results);
    if (!result.success) throw new YoucamError("unexpected_response", 502);
    const img = await fetchMask(result.data.url);
    return Response.json({ status: "success", image: `data:image/png;base64,${img.base64}` });
  } catch (e) {
    return errorResponse(e);
  }
}
