# 12 — Build Plan (for Claude Code)

Build in order. After each milestone: run tests, run the app on a phone (via Vercel preview or LAN HTTPS), and check every acceptance criterion before continuing. Commit at the end of each milestone with a clear message.

## M0 — Project setup
- Next.js App Router + TypeScript strict + Tailwind + ESLint/Prettier + Vitest + Playwright.
- `.env.example` (`YOUCAM_API_KEY`, `YOUCAM_BASE_URL`, `ANTHROPIC_API_KEY`), `.gitignore` covers `.env*`.
- PWA manifest + icons + service worker.
- MIT `LICENSE`.
**Accept:** `npm run dev`, `npm test`, `npm run build` all pass; app installable on Android Chrome.

## M1 — YouCam client + fixtures
- `lib/youcam/client.ts` (auth header, JSON, timeouts, retries on 5xx/network).
- `skinAnalysis.ts`: `registerFile`, `uploadToPresigned`, `createTask`, `pollTask`, `fetchMasks`.
- Zod schemas; error mapping (`errors.ts`); concern sets (`concerns.ts`).
- Route Handlers `/api/scan` and `/api/scan/[taskId]`, `/api/credits`.
- A dev page `/dev/youcam` to upload a test selfie and dump the parsed result.
- Save the first real response + masks into `tests/fixtures/youcam/`.
**Accept:** a real selfie returns 8 HD concerns with masks; masks are persisted locally; parser test passes on fixture; key never appears in client bundle (`grep` the build output).

## M2 — Capture
- MediaPipe Face Landmarker in a hook; mirrored preview; un-mirrored capture canvas.
- Pose/size/centring gate; ghost outline after baseline; auto-capture.
- Light Balance Gate; sharpness; dark/clipped checks.
- Resize to short side ≥1080, long ≤2560, JPEG quality 0.92.
**Accept:** side lighting blocks capture; good light passes; captured image meets HD size; unit tests for light gate pass.

## M3 — Split engine
- Midline fit, symmetric cheek ROIs (mirrored intersection), buffer band, under-eye ROIs.
- Worker computes burdens for each concern mask.
- Debug overlay toggle drawing landmarks, midline and ROIs on the photo.
**Accept:** synthetic tests pass (incl. roll 10°); on a real photo the debug overlay shows sensible ROIs; applying blotting paper/moisturiser to one cheek visibly shifts that side's oiliness/moisture burden.

## M4 — Trials, storage, statistics
- IndexedDB repos for Trial, Scan.
- Trial wizard, side randomisation, planned days, deadline check.
- Baseline (3 scans), A, Δ, SDC, verdict, confidence, sentinel, early stop/extension.
- Dashboard chart with noise band; context-cancels-out chart.
**Accept:** verdict/sentinel unit tests pass; a full trial can be created, scanned, and shown; deleting data wipes everything.

## M5 — Demo mode + core UI polish
- Seed 3 demo trials (Working, Stop, Head-to-Head no-difference) from fixtures, badged "Demo data".
- Landing, consent, side reveal, scan result split view, verdict screens.
**Accept:** a judge with no camera can tap "Explore a demo trial" and see every key screen in < 1 minute.

## M6 — Agent
- `/api/agent` with Claude tool use; tools from `08`; system prompt; streaming.
- Agent activity feed (deterministic orchestrator events).
- Return draft + `.ics` reminders.
**Accept:** agent answers "Is it working?" with numbers matching `get_verdict`; refuses to invent numbers when data is missing; STOP case produces the safety message and offers a return draft.

## M7 — P1 features
Order by value: Head-to-Head → Claim Check (`AI_Skin_simulation`) → Half-Face Shade Swatch (`14` H1) → Fitzpatrick-aware sentinel → Half-Head Hair Colour Preview (`14` H2) → privacy-safe share card (`14` H4) → Natural Asymmetry Report → Skin Passport ingredient profile → Evidence board (seeded) → under-eye zone → adherence + context log → Hindi. P2 items from `14` (earrings, full look, SplitHair, reel) only after all of these.
**Accept:** each feature has at least one test or a verified manual check noted in the PR/commit.

## M8 — Ship
- Vercel production deploy; HTTPS camera works on Android + iOS Safari.
- README complete (architecture diagram, APIs used, screenshots, video link, references).
- Lighthouse PWA + accessibility pass (≥ 90 accessibility).
- Record demo video (script in `11`), upload to YouTube, submit on Devpost.

## Test plan summary
| Area | Test |
|---|---|
| Parser | Fixture-based unit tests for HD output, errors, region sub-scores |
| Light gate | Synthetic images, relative mode |
| Split engine | Synthetic masks, rotation, buffer, mirror orientation |
| Stats | Verdict states, SDC, confidence, extension, early stop |
| Sentinel | Thresholds, Fitzpatrick lowering, symptom override |
| Agent | Mocked LLM tool loop: numbers come only from tools |
| E2E | Playwright: demo mode → verdict → return draft |
| Manual | Real phone: one-cheek blotting/moisturiser shift; side-light block |

## Definition of done (hackathon)
P0 features work on a real phone with real YouCam calls; demo mode works without a camera; tests pass; repo README and Devpost description complete; video uploaded.
