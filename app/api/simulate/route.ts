import { z } from "zod";
import { allow, clientKey, tooMany } from "@/lib/rateLimit";
import { YoucamError } from "@/lib/youcam/errors";
import { errorResponse } from "@/lib/youcam/respond";
import { createSimulation, registerFile, uploadToPresigned } from "@/lib/youcam/skinAnalysis";

const Params = z.record(z.enum(["wrinkle", "radiance", "oiliness", "acne", "eye_bags", "dark_circle", "spots", "pores", "texture", "redness"]), z.number().min(0).max(1));

/** Claim Check: AI Skin Simulation on the baseline photo. Output is labelled "Simulation" everywhere. */
export async function POST(req: Request) {
  if (!allow(clientKey(req, "simulate"), 4)) return tooMany();
  try {
    const form = await req.formData();
    const image = form.get("image");
    const params = Params.safeParse(JSON.parse(String(form.get("params") ?? "{}")));
    if (!(image instanceof File) || image.type !== "image/jpeg" || image.size > 10 * 1024 * 1024) throw new YoucamError("bad_image_type", 400);
    if (!params.success || !Object.values(params.data).some((v) => v > 0)) throw new YoucamError("error_invalid_params", 400);
    const bytes = await image.arrayBuffer();
    const upload = await registerFile(`claim_${Date.now()}.jpg`, image.type, bytes.byteLength);
    await uploadToPresigned(upload, bytes);
    return Response.json({ taskId: await createSimulation(upload.fileId, params.data) });
  } catch (e) {
    return errorResponse(e);
  }
}
