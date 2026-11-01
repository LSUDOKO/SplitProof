import "server-only";
import type { ConcernKey } from "../types";
import { youcamJson } from "./client";
import { YoucamError, extractErrorCode } from "./errors";
import { FileRegistration, SimulationStatus, TaskCreated, TaskStatus, type OutputItemT } from "./schemas";

export interface Upload {
  fileId: string;
  url: string;
  headers: Record<string, string>;
}

/** Step 2: register the file. Does NOT upload it (docs/05). */
export async function registerFile(fileName: string, contentType: string, size: number): Promise<Upload> {
  const body = JSON.stringify({ files: [{ content_type: contentType, file_name: fileName, file_size: size }] });
  const res = await youcamJson("/s2s/v2.0/file", FileRegistration, { method: "POST", body });
  const f = res.data.files[0];
  return { fileId: f.file_id, url: f.requests[0].url, headers: f.requests[0].headers };
}

/** Step 3: PUT the bytes to the presigned URL with exactly the returned headers. */
export async function uploadToPresigned(upload: Upload, bytes: ArrayBuffer): Promise<void> {
  const res = await fetch(upload.url, { method: "PUT", headers: upload.headers, body: bytes, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new YoucamError("upload_failed", 502, `Presigned upload ${res.status}`);
}

/** Step 4: create the HD task with one mask per concern. */
export async function createTask(fileId: string, actions: ConcernKey[]): Promise<string> {
  if (actions.some((a) => !a.startsWith("hd_"))) throw new YoucamError("mixed_tiers", 400, "Only HD concerns are allowed");
  const body = JSON.stringify({ src_file_id: fileId, dst_actions: actions, miniserver_args: { enable_mask_overlay: false }, format: "json" });
  const res = await youcamJson("/s2s/v2.0/task/skin-analysis", TaskCreated, { method: "POST", body });
  return res.data.task_id;
}

export type TaskResult =
  | { status: "running" }
  | { status: "error"; code: string }
  | { status: "success"; output: OutputItemT[] };

/** Step 5: one poll. The browser drives the polling loop so serverless functions stay short. */
export async function getTask(taskId: string): Promise<TaskResult> {
  const res = await youcamJson(`/s2s/v2.0/task/skin-analysis/${encodeURIComponent(taskId)}`, TaskStatus);
  const { task_status, results } = res.data;
  if (task_status === "success") return { status: "success", output: results?.output ?? [] };
  if (task_status === "error") return { status: "error", code: extractErrorCode(res.data) };
  return { status: "running" };
}

export async function fetchMask(url: string): Promise<{ contentType: string; base64: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new YoucamError("mask_download_failed", 502);
  const buf = Buffer.from(await res.arrayBuffer());
  // Served as binary/octet-stream; the file is always PNG for HD masks.
  return { contentType: "image/png", base64: buf.toString("base64") };
}

/** AI Skin Simulation (Claim Check only — never fed to the verdict). */
export async function createSimulation(fileId: string, params: Record<string, number>): Promise<string> {
  const res = await youcamJson("/s2s/v2.0/task/skin-simulation", TaskCreated, { method: "POST", body: JSON.stringify({ src_file_id: fileId, ...params }) });
  return res.data.task_id;
}

export async function getSimulation(taskId: string): Promise<{ status: "running" } | { status: "error"; code: string } | { status: "success"; url: string }> {
  const res = await youcamJson(`/s2s/v2.0/task/skin-simulation/${encodeURIComponent(taskId)}`, SimulationStatus);
  const { task_status, results } = res.data;
  if (task_status === "success" && results?.url) return { status: "success", url: results.url };
  if (task_status === "error" || task_status === "success") return { status: "error", code: extractErrorCode(res.data) };
  return { status: "running" };
}
