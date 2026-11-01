// Records one real YouCam task (any image task kind) into tests/fixtures/youcam/<name>/.
// Usage: node --env-file=.env scripts/record-task.mjs <photo.jpg> <kind> '<json body without src_file_id>' <name>
import { readFile, writeFile, mkdir } from "node:fs/promises";

const [, , photo, kind, bodyJson = "{}", name = kind.replace(/\//g, "-")] = process.argv;
if (!photo || !kind) throw new Error("Usage: record-task.mjs <photo.jpg> <kind> '<json>' [name]");
const base = process.env.YOUCAM_BASE_URL ?? "https://yce-api-01.makeupar.com";
const auth = { Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`, "Content-Type": "application/json" };
const out = `tests/fixtures/youcam/${name}`;
await mkdir(out, { recursive: true });
const call = async (path, init) => {
  const res = await fetch(base + path, { ...init, headers: auth });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status} ${JSON.stringify(json)}`);
  return json;
};
const bytes = await readFile(photo);
const reg = await call("/s2s/v2.0/file", { method: "POST", body: JSON.stringify({ files: [{ content_type: "image/jpeg", file_name: "x.jpg", file_size: bytes.length }] }) });
const f = reg.data.files[0];
await fetch(f.requests[0].url, { method: "PUT", headers: f.requests[0].headers, body: bytes });
const body = { src_file_id: f.file_id, ...JSON.parse(bodyJson) };
const task = await call(`/s2s/v2.0/task/${kind}`, { method: "POST", body: JSON.stringify(body) });
let result;
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  result = await call(`/s2s/v2.0/task/${kind}/${task.data.task_id}`, { method: "GET" });
  if (result.data?.task_status !== "running") break;
}
// Strip signed URLs before saving.
const redact = (o) => JSON.parse(JSON.stringify(o), (k, v) => (typeof v === "string" && v.startsWith("https://") ? v.split("?")[0].replace(/\/ttl30\/.*\//, "/ttl30/redacted/") : v));
await writeFile(`${out}/task-result.json`, JSON.stringify(redact(result), null, 2));
const url = result.data?.results?.url;
if (url) await writeFile(`${out}/result.${url.split("?")[0].split(".").pop()}`, Buffer.from(await (await fetch(url)).arrayBuffer()));
console.log(name, JSON.stringify(redact(result)).slice(0, 700));
