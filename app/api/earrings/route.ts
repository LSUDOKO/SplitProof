import type { NextRequest } from "next/server";
import { z } from "zod";
import { earringObjects } from "@/lib/preview/earrings";
import { allow, clientKey, tooMany } from "@/lib/rateLimit";
import { YoucamError } from "@/lib/youcam/errors";
import { errorResponse } from "@/lib/youcam/respond";
import { uploadBytes, uploadImage } from "@/lib/youcam/skinAnalysis";
import { startTask } from "@/lib/youcam/tasks";

const GoldOn = z.enum(["left", "right"]);

/**
 * Gold vs silver (docs/14 H8): one earring of each metal, one per ear, in one photo.
 * Product images are the app's own CC0 hoop photos (public/preview), fetched from this origin.
 */
export async function POST(req: NextRequest) {
  if (!allow(clientKey(req, "earrings"), 6)) return tooMany();
  try {
    const form = await req.formData();
    const goldOn = GoldOn.safeParse(form.get("goldOn"));
    if (!goldOn.success) throw new YoucamError("error_invalid_params", 400);
    const asset = async (metal: "gold" | "silver") => {
      const res = await fetch(new URL(`/preview/hoop-${metal}.png`, req.nextUrl.origin));
      if (!res.ok) throw new YoucamError("asset_missing", 500);
      return uploadBytes(await res.arrayBuffer(), "image/png", `hoop_${metal}`);
    };
    const [src, gold, silver] = await Promise.all([uploadImage(form.get("image"), "earrings"), asset("gold"), asset("silver")]);
    const taskId = await startTask("2d-vto/earring", src, {
      ref_file_ids: [gold, silver],
      source_info: { name: src },
      object_infos: earringObjects(goldOn.data, { gold, silver }),
    });
    return Response.json({ taskId });
  } catch (e) {
    return errorResponse(e);
  }
}
