import { z } from "zod";
import { allow, clientKey, tooMany } from "@/lib/rateLimit";
import { YoucamError } from "@/lib/youcam/errors";
import { errorResponse } from "@/lib/youcam/respond";
import { FrizzResult } from "@/lib/youcam/schemas";
import { uploadImage } from "@/lib/youcam/skinAnalysis";
import { runToCompletion } from "@/lib/youcam/tasks";

const Side = z.enum(["left", "right"]);

/**
 * SplitHair check-in (beta). The frizz analyzer takes front + a view turned each way and returns ONE level.
 * To get a level per side we run it twice: front + treated side + its mirror image, then the same for the
 * control side. The same view twice is rejected (error_face_angle_invalid), hence the mirror. Coarse by design; the UI says so.
 */
export async function POST(req: Request) {
  if (!allow(clientKey(req, "hair"), 4)) return tooMany();
  try {
    const form = await req.formData();
    const treated = Side.safeParse(form.get("treatedSide"));
    if (!treated.success) throw new YoucamError("error_invalid_params", 400);
    const keys = ["front", "left", "right", "leftMirror", "rightMirror"];
    const [front, left, right, leftMirror, rightMirror] = await Promise.all(keys.map((k) => uploadImage(form.get(k), `hair_${k}`)));
    const view = { left: [left, leftMirror], right: [right, rightMirror] };
    const control = treated.data === "left" ? "right" : "left";
    const frizz = (ids: string[]) => runToCompletion("hair-frizziness-detection", null, { src_file_ids: [front, ...ids] }, 60_000);
    const level = async (side: "left" | "right") => {
      const [v, m] = view[side];
      // Which slot wants which turn isn't documented; a rejected task costs no units, so try the other order.
      const raw = await frizz([v, m]).catch((e) => {
        if (e instanceof YoucamError && e.code === "error_face_angle_invalid") return frizz([m, v]);
        throw e;
      });
      const r = FrizzResult.safeParse(raw);
      if (!r.success) throw new YoucamError("unexpected_response", 502);
      return { level: r.data.hair_frizziness.mapping, term: r.data.hair_frizziness.term };
    };
    const [t, c] = await Promise.all([level(treated.data), level(control)]);
    return Response.json({ treated: t, control: c });
  } catch (e) {
    return errorResponse(e);
  }
}
