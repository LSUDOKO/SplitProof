import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AgentEvent, PreviewRecord, Scan, ScanMedia, Trial } from "../types";

interface SplitSideDB extends DBSchema {
  trials: { key: string; value: Trial };
  scans: { key: string; value: Scan; indexes: { byTrial: string } };
  media: { key: string; value: ScanMedia };
  events: { key: string; value: AgentEvent; indexes: { byTrial: string } };
  settings: { key: string; value: unknown };
  previews: { key: string; value: PreviewRecord };
}

let dbp: Promise<IDBPDatabase<SplitSideDB>> | null = null;

function db() {
  dbp ??= openDB<SplitSideDB>("splitside", 2, {
    upgrade(d, oldVersion) {
      if (oldVersion < 1) {
        d.createObjectStore("trials", { keyPath: "id" });
        d.createObjectStore("scans", { keyPath: "id" }).createIndex("byTrial", "trialId");
        d.createObjectStore("media", { keyPath: "scanId" });
        d.createObjectStore("events", { keyPath: "id" }).createIndex("byTrial", "trialId");
        d.createObjectStore("settings");
      }
      if (oldVersion < 2) d.createObjectStore("previews", { keyPath: "id" });
    },
  });
  return dbp;
}

export const newId = () => crypto.randomUUID();

export const trials = {
  all: async () => (await (await db()).getAll("trials")).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  get: async (id: string) => (await db()).get("trials", id),
  put: async (t: Trial) => (await db()).put("trials", t),
  remove: async (id: string) => {
    const d = await db();
    const scans = await d.getAllFromIndex("scans", "byTrial", id);
    const events = await d.getAllFromIndex("events", "byTrial", id);
    const tx = d.transaction(["trials", "scans", "media", "events"], "readwrite");
    await Promise.all([
      tx.objectStore("trials").delete(id),
      ...scans.flatMap((s) => [tx.objectStore("scans").delete(s.id), tx.objectStore("media").delete(s.id)]),
      ...events.map((e) => tx.objectStore("events").delete(e.id)),
      tx.done,
    ]);
  },
};

export const scans = {
  forTrial: async (trialId: string) =>
    (await (await db()).getAllFromIndex("scans", "byTrial", trialId)).sort((a, b) => a.takenAt.localeCompare(b.takenAt)),
  put: async (s: Scan) => (await db()).put("scans", s),
};

export const media = {
  get: async (scanId: string) => (await db()).get("media", scanId),
  put: async (m: ScanMedia) => (await db()).put("media", m),
};

export const events = {
  forTrial: async (trialId: string) =>
    (await (await db()).getAllFromIndex("events", "byTrial", trialId)).sort((a, b) => b.at.localeCompare(a.at)),
  add: async (e: Omit<AgentEvent, "id" | "at"> & { at?: string }) =>
    (await db()).put("events", { id: newId(), at: e.at ?? new Date().toISOString(), ...e }),
};

export const settings = {
  get: async <T,>(key: string) => (await (await db()).get("settings", key)) as T | undefined,
  set: async (key: string, value: unknown) => (await db()).put("settings", value, key),
};

export const previews = {
  all: async () => (await (await db()).getAll("previews")).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  put: async (p: PreviewRecord) => (await db()).put("previews", p),
  remove: async (id: string) => (await db()).delete("previews", id),
};

/** "Delete everything" (I4): wipes the database and any cached files. */
export async function deleteEverything() {
  if (dbp) (await dbp).close();
  dbp = null;
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("splitside");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
  if ("caches" in globalThis) for (const k of await caches.keys()) await caches.delete(k);
}
