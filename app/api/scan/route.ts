import { allow, clientKey, tooMany } from "@/lib/rateLimit";
import { CONCERN_SETS, type ConcernSetName } from "@/lib/youcam/concerns";
import { YoucamError } from "@/lib/youcam/errors";
import { errorResponse } from "@/lib/youcam/respond";
import { createTask, registerFile, uploadToPresigned } from "@/lib/youcam/skinAnalysis";

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png"]);

/** Register → upload → create an HD skin-analysis task. Returns { taskId }; the browser polls. */
export async function POST(req: Request) {
  if (!allow(clientKey(req, "scan"), 6)) return tooMany();
  try {
    const form = await req.formData();
    const image = form.get("image");
    const zone = String(form.get("zone") ?? "cheeks") as ConcernSetName;
    if (!(image instanceof File)) throw new YoucamError("missing_image", 400);
    if (!TYPES.has(image.type)) throw new YoucamError("bad_image_type", 400);
    if (image.size > MAX_BYTES) throw new YoucamError("error_exceed_max_image_size", 400);
    const actions = CONCERN_SETS[zone];
    if (!actions) throw new YoucamError("bad_zone", 400);

    const bytes = await image.arrayBuffer();
    const upload = await registerFile(`scan_${Date.now()}.${image.type === "image/png" ? "png" : "jpg"}`, image.type, bytes.byteLength);
    await uploadToPresigned(upload, bytes);
    const taskId = await createTask(upload.fileId, actions);
    return Response.json({ taskId });
  } catch (e) {
    return errorResponse(e);
  }
}
