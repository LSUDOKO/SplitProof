import { isConfigured, youcamJson } from "@/lib/youcam/client";
import { Credits } from "@/lib/youcam/schemas";
import { errorResponse } from "@/lib/youcam/respond";
import { connection } from "next/server";

/** Remaining YouCam units (dev panel in Settings). */
export async function GET() {
  await connection();
  if (!isConfigured()) return Response.json({ configured: false, units: 0 });
  try {
    const res = await youcamJson("/s2s/v1.0/client/credit", Credits);
    const units = res.results.reduce((s, r) => s + r.amount, 0);
    return Response.json({ configured: true, units });
  } catch (e) {
    return errorResponse(e);
  }
}
