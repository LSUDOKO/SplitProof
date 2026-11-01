import { allow, clientKey, tooMany } from "@/lib/rateLimit";
import { YoucamError } from "@/lib/youcam/errors";
import { errorResponse } from "@/lib/youcam/respond";
import { uploadImage } from "@/lib/youcam/skinAnalysis";
import { isTaskKind, startTask } from "@/lib/youcam/tasks";

/** Preview mode + Claim Check: one generated image per call (VTO, simulation, background blur). Never on the measurement path. */
const IMAGE_KINDS = new Set(["skin-simulation", "makeup-vto", "hair-color", "bg-blur"]);

export async function POST(req: Request) {
  if (!allow(clientKey(req, "preview"), 10)) return tooMany();
  try {
    const form = await req.formData();
    const kind = String(form.get("kind") ?? "");
    if (!isTaskKind(kind) || !IMAGE_KINDS.has(kind)) throw new YoucamError("error_invalid_params", 400);
    const params = JSON.parse(String(form.get("params") ?? "{}"));
    const fileId = await uploadImage(form.get("image"), kind.replace(/\W/g, "_"));
    return Response.json({ taskId: await startTask(kind, fileId, params) });
  } catch (e) {
    return errorResponse(e instanceof SyntaxError ? new YoucamError("error_invalid_params", 400) : e);
  }
}
