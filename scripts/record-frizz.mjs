// Records hair-frizziness-detection runs (front, left, right views; ~2 units each) into tests/fixtures/youcam/<name>/.
// Usage: node --env-file=.env scripts/record-frizz.mjs <name> <front.jpg> <view2.jpg> <view3.jpg>
import { readFile, writeFile, mkdir } from "node:fs/promises";

const [, , name, ...photos] = process.argv;
const base = process.env.YOUCAM_BASE_URL ?? "https://yce-api-01.makeupar.com";
const auth = { Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`, "Content-Type": "application/json" };
const call = async (path, init) => {
  const res = await fetch(base + path, { ...init, headers: auth });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status} ${JSON.stringify(json)}`);
  return json;
};
const upload = async (path) => {
  const bytes = await readFile(path);
  const reg = await call("/s2s/v2.0/file", { method: "POST", body: JSON.stringify({ files: [{ content_type: "image/jpeg", file_name: "v.jpg", file_size: bytes.length }] }) });
  const f = reg.data.files[0];
  await fetch(f.requests[0].url, { method: "PUT", headers: f.requests[0].headers, body: bytes });
  return f.file_id;
};
const ids = await Promise.all(photos.map(upload));
const task = await call("/s2s/v2.0/task/hair-frizziness-detection", { method: "POST", body: JSON.stringify({ src_file_ids: ids }) });
let result;
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  result = await call(`/s2s/v2.0/task/hair-frizziness-detection/${task.data.task_id}`, { method: "GET" });
  if (result.data?.task_status !== "running") break;
}
await mkdir(`tests/fixtures/youcam/${name}`, { recursive: true });
await writeFile(`tests/fixtures/youcam/${name}/task-result.json`, JSON.stringify(result, null, 2));
console.log(name, JSON.stringify(result));
