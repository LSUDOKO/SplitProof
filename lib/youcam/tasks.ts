import "server-only";
import { z } from "zod";
import { youcamJson } from "./client";
import { YoucamError, extractErrorCode } from "./errors";
import { AnyTaskStatus, TaskCreated } from "./schemas";

/**
 * Every YouCam AI task beyond skin analysis follows file → task → poll (docs/05). Request bodies
 * are validated here against the documented parameters, so the routes can stay generic.
 */
const unit = z.number().min(0).max(1);
const pct = z.number().int().min(0).max(100);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const HAIR_PRESETS = [
  "Jet Black", "Chocolate Brown", "Honey Blonde", "Platinum Blonde", "Ash Gray", "Rose Gold", "Burgundy", "Copper Red", "Lavender", "Teal Blue",
] as const;

export const TASK_PARAMS = {
  "skin-simulation": z
    .partialRecord(z.enum(["wrinkle", "radiance", "oiliness", "acne", "eye_bags", "dark_circle", "spots", "pores", "texture", "redness"]), unit)
    .refine((p) => Object.values(p).some((v) => (v ?? 0) > 0), "At least one intensity above 0"),
  "makeup-vto": z.object({
    version: z.literal("1.0").default("1.0"),
    effects: z
      .array(z.object({ category: z.literal("foundation"), palettes: z.array(z.object({ color: hex, colorIntensity: pct, glowIntensity: pct, coverageIntensity: pct })).length(1) }))
      .length(1),
  }),
  "hair-color": z.object({ preset: z.enum(HAIR_PRESETS) }),
  "bg-blur": z.object({ intensity: pct }),
  "skin-tone-analysis": z.object({ face_angle_strictness_level: z.enum(["strict", "high", "medium", "low", "flexible"]).optional() }),
  "fitzpatrick-scale-analyzer": z.object({ version: z.literal("1.0"), index: z.number().int().min(0) }),
} as const;

export type TaskKind = keyof typeof TASK_PARAMS;
export const isTaskKind = (k: string): k is TaskKind => k in TASK_PARAMS;

export async function startTask(kind: TaskKind, fileId: string, params: unknown): Promise<string> {
  const parsed = TASK_PARAMS[kind].safeParse(params);
  if (!parsed.success) throw new YoucamError("error_invalid_params", 400, parsed.error.issues[0]?.message);
  const res = await youcamJson(`/s2s/v2.0/task/${kind}`, TaskCreated, { method: "POST", body: JSON.stringify({ src_file_id: fileId, ...(parsed.data as object) }) });
  return res.data.task_id;
}

export type Polled = { status: "running" } | { status: "error"; code: string } | { status: "success"; results: unknown };

export async function pollTask(kind: TaskKind, taskId: string): Promise<Polled> {
  const res = await youcamJson(`/s2s/v2.0/task/${kind}/${encodeURIComponent(taskId)}`, AnyTaskStatus);
  const { task_status, results } = res.data;
  if (task_status === "success" && results) return { status: "success", results };
  if (task_status === "running") return { status: "running" };
  return { status: "error", code: extractErrorCode(res.data) };
}

/** Server-side wait for short analysis tasks (skin tone, Fitzpatrick finish in ~2–4 s). */
export async function runToCompletion(kind: TaskKind, fileId: string, params: unknown, timeoutMs = 45_000): Promise<unknown> {
  const id = await startTask(kind, fileId, params);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    const p = await pollTask(kind, id);
    if (p.status === "success") return p.results;
    if (p.status === "error") throw new YoucamError(p.code, 422);
  }
  throw new YoucamError("timeout", 504);
}
