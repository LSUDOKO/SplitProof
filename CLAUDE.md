# CLAUDE.md — Instructions for Claude Code

You are building **SplitSide**, an at-home split-face skincare trial PWA, for the YouCam API Skin AI & eCommerce VTO Hackathon. Read every file in `docs/` before writing code. This file is the short rulebook; the docs hold the detail.

## Read order
1. `docs/01-hackathon-requirements.md` — what judges score and what must be submitted
2. `docs/03-idea-and-research.md` — why the product exists (keep this reasoning in the UI copy)
3. `docs/04-features.md` — what to build (respect the priority tags P0 / P1 / P2 / ROADMAP)
4. `docs/05-youcam-api-reference.md` — the ONLY source of truth for YouCam endpoints. Do not invent endpoints or parameter names.
5. `docs/06-architecture.md`, `docs/07-algorithms.md`, `docs/08-agent-design.md`, `docs/09-ux-screens.md`
6. `docs/10-privacy-safety.md`
7. `docs/12-build-plan.md` — build milestone by milestone, and verify each acceptance criterion before moving on

## Non-negotiable rules

### YouCam API
- The API key lives ONLY in server environment variables (`YOUCAM_API_KEY`). Never ship it to the browser, never commit it. Add `.env*` to `.gitignore`; provide `.env.example`.
- Skin analysis is **asynchronous**: create task → get `task_id` → poll `GET /s2s/v2.0/task/skin-analysis/{task_id}` until `task_status` is `success` or `error`. Never assume a synchronous result.
- Use **HD** concern names (`hd_*`) for SplitSide. **Never mix SD and HD** concerns in one request (400 InvalidParameters).
- Request **separate masks** (`enable_mask_overlay: false`) — the split engine needs one mask per concern.
- Store `raw_score` (not only `ui_score`) and download + persist masks immediately. **Results are deleted by YouCam after 24 hours.**
- Higher score = healthier skin in every category. Label UI accordingly.
- Map every documented error code (`error_below_min_image_size`, `error_exceed_max_image_size`, `error_src_face_too_small`, `error_src_face_out_of_bound`, `error_lighting_dark`) to a specific friendly message.
- **Never** run `AI_Photo_Lighting`, `AI_Color_Correction`, `AI_Photo_Enhance` or any beautifying/editing API on an image that will be analysed. Those are allowed only on the shareable result card.
- Units are charged only on successful tasks. Show remaining units in a dev panel (`GET /s2s/v1.0/client/credit`).

### Measurement integrity
- Analysis photos must be live camera captures (no gallery upload in trial mode; allow gallery only in a clearly labelled "Try a sample photo" demo mode).
- Always run the Light Balance Gate before upload (see `docs/07-algorithms.md`).
- Exclude the midline buffer band when splitting masks.
- The verdict must come from the statistics in `docs/07-algorithms.md`, never from an LLM guess. The agent explains numbers; it does not make them up.

### Honesty and safety
- SplitSide is a cosmetic decision tool, not a medical device. Never use the words "diagnose", "treat", "cure". Use "measured", "appears", "on your photos".
- Seeded demo data must be visibly labelled "Demo data" in the UI.
- Irritation alerts always include: stop using the product, and see a doctor if it is painful, spreading or not settling.

### Code quality (judges read the repo)
- TypeScript strict mode. Small, named modules. No dead code.
- Unit tests for the split engine, Light Balance Gate and verdict statistics (they are pure functions; test them with fixture masks).
- Record real API responses as fixtures in `tests/fixtures/youcam/` once the key works, and test the parser against them.
- README in the final repo must include: setup, env vars, how to run, architecture diagram, YouCam APIs used and why, screenshots, demo video link, license (MIT).

## Tech stack (decided — do not re-debate)
Next.js (App Router) + TypeScript + Tailwind CSS, deployed on Vercel as a PWA. Route Handlers proxy YouCam. Client-side image work in Canvas / OffscreenCanvas. MediaPipe Face Landmarker (browser) for midline + alignment. IndexedDB (via `idb`) for on-device storage. LLM agent via Groq (OpenAI-compatible tool calling, `openai/gpt-oss-120b`), called from a Route Handler with plain `fetch`. Recharts for charts. Zod for validating every external response.

## When unsure
Prefer the simpler implementation that keeps the demo truthful. If an API detail is not in `docs/05-youcam-api-reference.md`, check https://docs.perfectcorp.com and record what you found in that file.
