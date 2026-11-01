import { allow, clientKey, tooMany } from "@/lib/rateLimit";
import { CONCERN_SETS, type ConcernSetName } from "@/lib/youcam/concerns";
import { YoucamError } from "@/lib/youcam/errors";
import { errorResponse } from "@/lib/youcam/respond";
import { createTask, uploadImage } from "@/lib/youcam/skinAnalysis";

/** Register → upload → create an HD skin-analysis task. Returns { taskId }; the browser polls. */
export async function POST(req: Request) {
  if (!allow(clientKey(req, "scan"), 6)) return tooMany();
  try {
    const form = await req.formData();
    const actions = CONCERN_SETS[String(form.get("zone") ?? "cheeks") as ConcernSetName];
    if (!actions) throw new YoucamError("bad_zone", 400);
    const fileId = await uploadImage(form.get("image"), "scan");
    return Response.json({ taskId: await createTask(fileId, actions) });
  } catch (e) {
    return errorResponse(e);
  }
}
