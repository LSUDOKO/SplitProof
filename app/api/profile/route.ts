import { allow, clientKey, tooMany } from "@/lib/rateLimit";
import { errorResponse } from "@/lib/youcam/respond";
import { FitzpatrickResult, SkinToneResult } from "@/lib/youcam/schemas";
import { uploadImage } from "@/lib/youcam/skinAnalysis";
import { runToCompletion } from "@/lib/youcam/tasks";
import { YoucamError } from "@/lib/youcam/errors";

const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 } as const;

/**
 * Skin profile from one photo: skin tone (shade and hair-colour shortlists) and Fitzpatrick type
 * (irritation-sentinel threshold). Both tasks share one upload and run in parallel.
 */
export async function POST(req: Request) {
  if (!allow(clientKey(req, "profile"), 4)) return tooMany();
  try {
    const fileId = await uploadImage((await req.formData()).get("image"), "profile");
    const [tone, fitz] = await Promise.all([
      runToCompletion("skin-tone-analysis", fileId, { face_angle_strictness_level: "medium" }),
      runToCompletion("fitzpatrick-scale-analyzer", fileId, { version: "1.0", index: 0 }),
    ]);
    const t = SkinToneResult.safeParse(tone);
    const f = FitzpatrickResult.safeParse(fitz);
    if (!t.success || !f.success) throw new YoucamError("unexpected_response", 502);
    const c = t.data.color;
    return Response.json({
      skinColor: c.skin_color,
      hairColor: c.hair_color,
      hairColorName: c.hair_color_name,
      eyeColorName: c.eye_color_name,
      fitzpatrick: ROMAN[f.data.fitzpatrick_scale],
    });
  } catch (e) {
    return errorResponse(e);
  }
}
