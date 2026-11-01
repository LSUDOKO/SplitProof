"use client";
import type { FaceLandmarker, FaceLandmarkerResult } from "@mediapipe/tasks-vision";

let landmarker: Promise<FaceLandmarker> | null = null;

/** Face Landmarker with self-hosted model + WASM (public/mediapipe) so capture works offline and without CDNs. */
export function getLandmarker(): Promise<FaceLandmarker> {
  landmarker ??= (async () => {
    const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks("/mediapipe");
    const opts = (delegate: "GPU" | "CPU") => ({
      baseOptions: { modelAssetPath: "/mediapipe/face_landmarker.task", delegate },
      runningMode: "VIDEO" as const,
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    });
    try {
      return await FaceLandmarker.createFromOptions(fileset, opts("GPU"));
    } catch {
      return FaceLandmarker.createFromOptions(fileset, opts("CPU"));
    }
  })();
  landmarker.catch(() => (landmarker = null));
  return landmarker;
}

export function blendshape(r: FaceLandmarkerResult, name: string): number {
  return r.faceBlendshapes?.[0]?.categories.find((c) => c.categoryName === name)?.score ?? 0;
}

/** Normalised landmarks → image pixels. */
export function toPixels(r: FaceLandmarkerResult, width: number, height: number): [number, number][] | null {
  const lm = r.faceLandmarks?.[0];
  return lm ? lm.map((p) => [p.x * width, p.y * height]) : null;
}
