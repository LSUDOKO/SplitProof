import { z } from "zod";
import { allow, clientKey, tooMany } from "@/lib/rateLimit";
import { YoucamError } from "@/lib/youcam/errors";
import { errorResponse } from "@/lib/youcam/respond";
import { FrizzResult } from "@/lib/youcam/schemas";
import { uploadImage } from "@/lib/youcam/skinAnalysis";
import { runToCompletion } from "@/lib/youcam/tasks";

const Side = z.enum(["left", "right"]);

/**
 * SplitHair check-in (beta). The frizz analyzer takes front + two side views and returns ONE level.
 * To get a level per side we run it twice: front + treated side ×2, and front + control side ×2.
 * Each side's score therefore leans on one side of the head. Coarse by design; the UI says so.
 */
export async function POST(req: Request) {
  if (!allow(clientKey(req, "hair"), 4)) return tooMany();
  try {
    const form = await req.formData();
    const treated = Side.safeParse(form.get("treatedSide"));
    if (!treated.success) throw new YoucamError("error_invalid_params", 400);
    const [front, left, right] = await Promise.all(["front", "left", "right"].map((k) => uploadImage(form.get(k), `hair_${k}`)));
    const view = { left, right };
    const control = treated.data === "left" ? "right" : "left";
    const level = async (side: "left" | "right") => {
      const r = FrizzResult.safeParse(await runToCompletion("hair-frizziness-detection", null, { src_file_ids: [front, view[side], view[side]] }, 60_000));
      if (!r.success) throw new YoucamError("unexpected_response", 502);
      return { level: r.data.hair_frizziness.mapping, term: r.data.hair_frizziness.term };
    };
    const [t, c] = await Promise.all([level(treated.data), level(control)]);
    return Response.json({ treated: t, control: c });
  } catch (e) {
    return errorResponse(e);
  }
}
