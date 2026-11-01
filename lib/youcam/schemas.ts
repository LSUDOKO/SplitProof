import { z } from "zod";

/** Validated loosely on purpose: unknown fields pass through so new API fields never break scans. */
export const FileRegistration = z.object({
  data: z.object({
    files: z
      .array(
        z.object({
          file_id: z.string(),
          requests: z.array(z.object({ method: z.string(), url: z.string().url(), headers: z.record(z.string(), z.string()).default({}) })).min(1),
        }),
      )
      .min(1),
  }),
});

export const TaskCreated = z.object({ data: z.object({ task_id: z.string() }) });

const OutputItem = z.looseObject({
  type: z.string(),
  region: z.string().optional(),
  score: z.number().optional(),
  ui_score: z.number().optional(),
  raw_score: z.number().optional(),
  mask_urls: z.array(z.string()).nullish(),
});

export const TaskStatus = z.object({
  data: z.looseObject({
    task_status: z.enum(["running", "success", "error"]).or(z.string()),
    results: z.looseObject({ output: z.array(OutputItem).optional() }).nullish(),
    error: z.unknown().optional(),
    error_message: z.unknown().optional(),
  }),
});

export type TaskStatusT = z.infer<typeof TaskStatus>;
export type OutputItemT = z.infer<typeof OutputItem>;

export const Credits = z.object({
  results: z.array(z.looseObject({ type: z.string().optional(), amount: z.number(), expiry: z.number().optional() })),
});

/** Any single-image task poll (recorded: skin-simulation, makeup-vto, hair-color, bg-blur). */
export const AnyTaskStatus = z.object({
  data: z.looseObject({
    task_status: z.string(),
    results: z.unknown().optional(),
    error: z.unknown().optional(),
    error_message: z.unknown().optional(),
  }),
});

export const ImageResult = z.looseObject({ url: z.string() });

/** Recorded: tests/fixtures/youcam/skin-tone. */
export const SkinToneResult = z.looseObject({
  color: z.looseObject({
    skin_color: z.string(),
    hair_color: z.string().optional(),
    hair_color_name: z.string().optional(),
    eye_color_name: z.string().optional(),
  }),
});

/** Recorded: tests/fixtures/youcam/fitzpatrick. */
export const FitzpatrickResult = z.looseObject({ fitzpatrick_scale: z.enum(["I", "II", "III", "IV", "V", "VI"]) });

/** Hair frizziness (spec: results.hair_frizziness.{mapping 0–3, term}). One combined level per call. */
export const FrizzResult = z.looseObject({
  hair_frizziness: z.looseObject({ mapping: z.number().int().min(0).max(3), term: z.string().optional() }),
});
