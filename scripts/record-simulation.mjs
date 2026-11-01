// Records one real AI Skin Simulation run into tests/fixtures/youcam/simulation/ (spends ~4 units).
// Usage: node --env-file=.env scripts/record-simulation.mjs <photo.jpg>
import { readFile, writeFile, mkdir } from "node:fs/promises";

const [, , photo] = process.argv;
const base = process.env.YOUCAM_BASE_URL ?? "https://yce-api-01.makeupar.com";
const auth = { Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`, "Content-Type": "application/json" };
const out = "tests/fixtures/youcam/simulation";
await mkdir(out, { recursive: true });
const call = async (path, init) => {
  const res = await fetch(base + path, { ...init, headers: auth });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status} ${JSON.stringify(json)}`);
  return json;
};
const bytes = await readFile(photo);
const reg = await call("/s2s/v2.0/file", { method: "POST", body: JSON.stringify({ files: [{ content_type: "image/jpeg", file_name: "sim.jpg", file_size: bytes.length }] }) });
const f = reg.data.files[0];
await fetch(f.requests[0].url, { method: "PUT", headers: f.requests[0].headers, body: bytes });
const task = await call("/s2s/v2.0/task/skin-simulation", { method: "POST", body: JSON.stringify({ src_file_id: f.file_id, redness: 0.6 }) });
console.log("task", JSON.stringify(task));
let result;
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  result = await call(`/s2s/v2.0/task/skin-simulation/${task.data.task_id}`, { method: "GET" });
  console.log("poll", i, result.data?.task_status);
  if (result.data?.task_status !== "running") break;
}
await writeFile(`${out}/task-result.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result).slice(0, 800));
