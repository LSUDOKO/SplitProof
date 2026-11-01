// Records one real earring VTO (gold on one ear, silver on the other) into tests/fixtures/youcam/earring/ (~2 units).
// Usage: node --env-file=.env scripts/record-earring.mjs <photo.jpg>
import { readFile, writeFile, mkdir } from "node:fs/promises";

const [, , photo] = process.argv;
const base = process.env.YOUCAM_BASE_URL ?? "https://yce-api-01.makeupar.com";
const auth = { Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`, "Content-Type": "application/json" };
const out = "tests/fixtures/youcam/earring";
await mkdir(out, { recursive: true });
const call = async (path, init) => {
  const res = await fetch(base + path, { ...init, headers: auth });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status} ${JSON.stringify(json)}`);
  return json;
};
const upload = async (path, type) => {
  const bytes = await readFile(path);
  const reg = await call("/s2s/v2.0/file", { method: "POST", body: JSON.stringify({ files: [{ content_type: type, file_name: path.split("/").pop(), file_size: bytes.length }] }) });
  const f = reg.data.files[0];
  await fetch(f.requests[0].url, { method: "PUT", headers: f.requests[0].headers, body: bytes });
  return f.file_id;
};
const [src, gold, silver] = await Promise.all([upload(photo, "image/jpeg"), upload("public/preview/hoop-gold.png", "image/png"), upload("public/preview/hoop-silver.png", "image/png")]);
const body = {
  src_file_id: src,
  ref_file_ids: [gold, silver],
  source_info: { name: src },
  object_infos: [
    { name: gold, parameter: { earring_is_right_ear: true, earring_need_remove_background: false } },
    { name: silver, parameter: { earring_is_right_ear: false, earring_need_remove_background: false } },
  ],
};
const task = await call("/s2s/v2.0/task/2d-vto/earring", { method: "POST", body: JSON.stringify(body) });
let result;
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  result = await call(`/s2s/v2.0/task/2d-vto/earring/${task.data.task_id}`, { method: "GET" });
  if (result.data?.task_status !== "running") break;
}
const url = result.data?.results?.url;
if (url) await writeFile(`${out}/result.png`, Buffer.from(await (await fetch(url)).arrayBuffer()));
const redact = (o) => JSON.parse(JSON.stringify(o), (k, v) => (typeof v === "string" && v.startsWith("https://") ? v.split("?")[0].replace(/\/ttl30\/.*\//, "/ttl30/redacted/") : v));
await writeFile(`${out}/task-result.json`, JSON.stringify(redact(result), null, 2));
console.log(JSON.stringify(redact(result)).slice(0, 600));
