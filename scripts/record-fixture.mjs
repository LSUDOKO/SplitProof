// Records one real HD skin-analysis run into tests/fixtures/youcam/ (spends ~16 units).
// Usage: node --env-file=.env scripts/record-fixture.mjs <photo.jpg> [fixtureName]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename } from "node:path";

const [, , photo, name = "cheeks-hd"] = process.argv;
if (!photo) throw new Error("Usage: record-fixture.mjs <photo.jpg> [name]");
const base = process.env.YOUCAM_BASE_URL ?? "https://yce-api-01.makeupar.com";
const auth = { Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`, "Content-Type": "application/json" };
const out = `tests/fixtures/youcam/${name}`;
await mkdir(`${out}/masks`, { recursive: true });

const bytes = await readFile(photo);
const call = async (path, init) => {
  const res = await fetch(base + path, { ...init, headers: auth });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status} ${JSON.stringify(json)}`);
  return json;
};

const reg = await call("/s2s/v2.0/file", {
  method: "POST",
  body: JSON.stringify({ files: [{ content_type: "image/jpeg", file_name: basename(photo), file_size: bytes.length }] }),
});
const file = reg.data.files[0];
const put = await fetch(file.requests[0].url, { method: "PUT", headers: file.requests[0].headers, body: bytes });
console.log("upload", put.status);

const actions = ["hd_redness", "hd_acne", "hd_oiliness", "hd_age_spot", "hd_texture", "hd_pore", "hd_radiance", "hd_moisture"];
const task = await call("/s2s/v2.0/task/skin-analysis", {
  method: "POST",
  body: JSON.stringify({ src_file_id: file.file_id, dst_actions: actions, miniserver_args: { enable_mask_overlay: false }, format: "json" }),
});
await writeFile(`${out}/create-task.json`, JSON.stringify(task, null, 2));

let result;
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  result = await call(`/s2s/v2.0/task/skin-analysis/${task.data.task_id}`, { method: "GET" });
  console.log("poll", i, result.data.task_status);
  if (result.data.task_status !== "running") break;
}
await writeFile(`${out}/task-result.json`, JSON.stringify(result, null, 2));

for (const item of result.data.results?.output ?? []) {
  for (const url of item.mask_urls ?? []) {
    const res = await fetch(url);
    const file = url.split("?")[0].split("/").pop();
    await writeFile(`${out}/masks/${file}`, Buffer.from(await res.arrayBuffer()));
    console.log("mask", file, res.headers.get("content-type"));
  }
}
