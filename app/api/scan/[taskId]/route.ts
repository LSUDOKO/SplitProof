import type { NextRequest } from "next/server";
import { allow, clientKey, tooMany } from "@/lib/rateLimit";
import type { Zone } from "@/lib/types";
import { ZONE_MASK_REGION } from "@/lib/youcam/concerns";
import { parseOutput, pickMask } from "@/lib/youcam/parse";
import { errorResponse } from "@/lib/youcam/respond";
import { fetchMask, getTask } from "@/lib/youcam/skinAnalysis";
import { friendlyMessage } from "@/lib/youcam/errors";

/** One poll. On success, downloads the zone-matching masks now (YouCam deletes results after 24 h). */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/scan/[taskId]">) {
  if (!allow(clientKey(req, "poll"), 120)) return tooMany();
  try {
    const { taskId } = await ctx.params;
    const zone = (req.nextUrl.searchParams.get("zone") ?? "cheeks") as Zone;
    const task = await getTask(taskId);
    if (task.status === "running") return Response.json({ status: "running" });
    if (task.status === "error") return Response.json({ status: "error", code: task.code, message: friendlyMessage(task.code) });

    const parsed = parseOutput(task.output);
    const regions = ZONE_MASK_REGION[zone] ?? {};
    const masks = Object.fromEntries(
      await Promise.all(
        parsed.concerns.map(async (c) => {
          const url = pickMask(c.masks, regions[c.key]);
          if (!url) return [c.key, null] as const;
          const m = await fetchMask(url);
          return [c.key, `data:image/png;base64,${m.base64}`] as const;
        }),
      ),
    );
    const concerns = parsed.concerns.map(({ key, rawScore, uiScore, regions: r }) => ({ key, rawScore, uiScore, regions: r }));
    return Response.json({ status: "success", concerns, masks, overall: parsed.overall, skinAge: parsed.skinAge });
  } catch (e) {
    return errorResponse(e);
  }
}
