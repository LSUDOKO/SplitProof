import type { NextRequest } from "next/server";
import { isBarcode, parseObf } from "@/lib/integrations/openBeautyFacts";
import { allow, clientKey, tooMany } from "@/lib/rateLimit";

/** Proxy so we can identify ourselves to Open Beauty Facts (their usage policy) and validate the response. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/product/[barcode]">) {
  if (!allow(clientKey(req, "product"), 20)) return tooMany();
  const { barcode } = await ctx.params;
  if (!isBarcode(barcode)) return Response.json({ found: false, reason: "bad_barcode" }, { status: 400 });
  try {
    const res = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,ingredients_text,image_front_small_url`, {
      headers: { "User-Agent": "SplitSide/1.0 (https://github.com/LSUDOKO/SplitProof)" },
      signal: AbortSignal.timeout(10_000),
    });
    return Response.json(parseObf(await res.json()));
  } catch {
    return Response.json({ found: false, reason: "unavailable" });
  }
}
