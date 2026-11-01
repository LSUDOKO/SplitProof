# 06 — Architecture

## Product form
**Mobile-first Progressive Web App.** Opens from a link in any phone browser, installable to the home screen. Chosen because judges can test instantly (no app store), the camera works in mobile browsers, one codebase serves Android/iOS/desktop, and the hackathon accepts web or mobile prototypes. Native shells (Capacitor) are roadmap.

## Stack
| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript strict |
| Styling | Tailwind CSS; shadcn/ui primitives where useful |
| Hosting | Vercel |
| Face landmarks | `@mediapipe/tasks-vision` Face Landmarker (in browser, WASM) |
| Image processing | Canvas / OffscreenCanvas in a Web Worker |
| Storage | IndexedDB via `idb` (on device) |
| Validation | Zod for every external payload |
| Charts | Recharts |
| Agent LLM | Anthropic API (Claude) with tool use, from a Route Handler |
| Tests | Vitest (unit), Playwright (one smoke flow) |
| PWA | `manifest.webmanifest` + service worker (e.g. `@serwist/next`) |

## High-level flow
```
Phone (PWA)                                   Next.js server (Vercel)                 YouCam API
───────────                                   ───────────────────────                 ──────────
Camera ─► MediaPipe landmarks
        ─► Light Balance Gate (worker)
        ─► resize ≤2560, ≥1080 short side
        ─► POST /api/scan (image + meta) ───►  route: register file  ────────────────► POST /s2s/v2.0/file
                                               route: PUT bytes to presigned URL ────► S3
                                               route: create task ───────────────────► POST /s2s/v2.0/task/skin-analysis
        ◄── { scanJobId } ─────────────────────
        ─► GET /api/scan/:id (poll) ────────►  route: poll task ─────────────────────► GET /s2s/v2.0/task/skin-analysis/{id}
                                               on success: fetch masks (mask_urls),
                                               return scores + mask PNGs (base64/blobs)
        ◄── { scores, masks } ─────────────────
Split engine (worker): midline + ROIs ─► per-side burden
IndexedDB: save scan, masks, burdens
Verdict engine (pure TS) ─► UI + agent context
Chat ─► POST /api/agent (trial summary + message) ─► Claude (tool use) ─► reply
```

## Folder structure
```
splitside/
├─ CLAUDE.md
├─ docs/                         # this pack
├─ app/
│  ├─ layout.tsx, page.tsx       # landing / onboarding
│  ├─ onboarding/                # consent, skin type scan, asymmetry report
│  ├─ trial/new/                 # setup wizard
│  ├─ trial/[id]/                # dashboard
│  ├─ trial/[id]/scan/           # guided capture
│  ├─ trial/[id]/verdict/
│  ├─ trial/[id]/chat/
│  ├─ passport/                  # history + ingredient profile
│  ├─ evidence/                  # Real-World Evidence board
│  ├─ settings/                  # delete data, units, language
│  └─ api/
│     ├─ scan/route.ts           # register + upload + create task
│     ├─ scan/[taskId]/route.ts  # poll + fetch masks
│     ├─ simulate/route.ts       # AI_Skin_simulation (Claim Check)
│     ├─ fitzpatrick/route.ts
│     ├─ credits/route.ts
│     └─ agent/route.ts          # Claude tool loop
├─ lib/
│  ├─ youcam/
│  │  ├─ client.ts               # fetch wrapper, auth, retries
│  │  ├─ skinAnalysis.ts         # register/upload/create/poll
│  │  ├─ schemas.ts              # Zod schemas
│  │  ├─ concerns.ts             # concern sets, splittable flags
│  │  └─ errors.ts               # code → friendly message
│  ├─ capture/
│  │  ├─ landmarks.ts            # MediaPipe wrapper
│  │  ├─ alignment.ts            # pose + ghost outline tolerance
│  │  └─ lightGate.ts            # Light Balance Gate
│  ├─ split/
│  │  ├─ midline.ts
│  │  ├─ rois.ts                 # cheek / under-eye / forehead polygons
│  │  └─ burden.ts               # mask burden per side
│  ├─ stats/
│  │  ├─ baseline.ts
│  │  ├─ verdict.ts              # DiD, SDC, confidence, early stop
│  │  └─ sentinel.ts
│  ├─ agent/
│  │  ├─ tools.ts
│  │  └─ prompt.ts
│  ├─ db/                        # IndexedDB repositories
│  ├─ demo/seed.ts               # labelled demo trials
│  └─ ingredients/               # INCI parsing + ingredient classes
├─ workers/split.worker.ts
├─ components/                   # SplitView, Chart, CaptureOverlay, VerdictCard…
├─ public/manifest.webmanifest, icons/
├─ tests/
│  ├─ fixtures/youcam/           # real recorded responses + masks
│  ├─ split.test.ts, lightGate.test.ts, verdict.test.ts, sentinel.test.ts
│  └─ e2e/demo.spec.ts
├─ .env.example
└─ README.md
```

## Data model (TypeScript)
```ts
type Side = 'left' | 'right';            // the USER's left/right (mirror-corrected!)
type Zone = 'cheeks' | 'under_eyes' | 'forehead';
type Verdict = 'working' | 'no_difference' | 'stop' | 'worse' | 'insufficient_data';

interface Trial {
  id: string;
  mode: 'single' | 'head_to_head';
  products: { A: Product; B?: Product };   // single: A on treated side; H2H: A vs B
  treatedSide: Side;                        // single mode: side receiving A
  zone: Zone;
  goals: ConcernKey[];                      // e.g. ['hd_acne','hd_redness']
  startDate: string;                        // ISO
  plannedDays: number;
  returnDeadline?: string;                  // ISO
  fitzpatrick?: 1|2|3|4|5|6;
  status: 'baseline' | 'active' | 'finished' | 'stopped';
  isDemo: boolean;
}

interface Product {
  name: string; url?: string; price?: number; currency?: string;
  ingredientsInci?: string[]; ingredientClasses?: IngredientClass[];
  returnPolicyText?: string;
}

interface Scan {
  id: string; trialId: string; takenAt: string; dayIndex: number;
  isBaseline: boolean;
  image: Blob;                              // original, never enhanced
  meta: { width: number; height: number; device: string; lightImbalance: number;
          yaw: number; pitch: number; roll: number; localHour: number };
  youcamTaskId: string;
  concerns: Record<ConcernKey, ConcernResult>;
  landmarks: number[][];                    // 478 x [x,y] in image px
  burdens: Record<ConcernKey, { left: number; right: number }>;
  context?: { sleepHours?: number; stress?: 1|2|3|4|5; period?: boolean; aqi?: number; humidity?: number };
  adherenceSinceLast?: number;              // 0..1
}

interface ConcernResult {
  rawScore: number; uiScore: number;
  regions?: Record<string, { rawScore: number; uiScore: number }>;
  mask: Blob;                               // persisted (YouCam deletes after 24 h)
}
```

## Server routes (contracts)
- `POST /api/scan` — body: multipart (image JPEG, `concernSet`), returns `{ taskId }`. Validates size/dims; never logs image bytes.
- `GET /api/scan/:taskId` — returns `{ status: 'running' }` or `{ status: 'success', concerns, masks: { [key]: base64Png } }` or `{ status: 'error', code, message }`.
- `POST /api/simulate` — Claim Check.
- `GET /api/credits` — remaining units (dev panel).
- `POST /api/agent` — body: `{ trialSummary, messages }`; streams Claude's reply; tools execute against the summary sent by the client (data stays on device; only the derived numbers are sent).

## Non-functional
- Rate-limit `/api/*` per IP (simple token bucket) to protect units.
- Timeouts: YouCam poll 90 s; agent 30 s.
- All YouCam responses validated with Zod; unknown shapes logged (without images) and surfaced as a friendly error.
- Performance target: capture → verdict update < 20 s on a mid-range Android.
