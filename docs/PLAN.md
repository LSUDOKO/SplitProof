# SplitSide — Implementation Plan

Deadline: 2 Nov 2026, 10:15 pm IST. Ordered by risk; each step ends with tests green and a one-line commit.

| # | Milestone | Scope | Done when |
|---|---|---|---|
| M0 | Setup | Next.js App Router, TS strict, Tailwind, Vitest, PWA manifest + SW, `.env.example` | `npm test`, `npm run build` pass |
| M1 | YouCam client | `lib/youcam/*` (file → PUT → task → poll → masks), Zod schemas, error map, `/api/scan`, `/api/scan/[taskId]`, `/api/credits`, recorded fixture | Parser test passes on a real recorded response |
| M2 | Core engine | Midline + face-frame ROIs, mask burden, Light Balance Gate, asymmetry, baseline/SDC, DiD verdict, confidence, sentinel, early stop/extension, Theil–Sen, ingredient profile | Unit tests in `tests/` pass |
| M3 | Storage + trials | IndexedDB (`idb`) repos, trial wizard, crypto-random side, planned days vs return deadline, delete-all | Trial can be created and wiped |
| M4 | Demo mode + UI | 3 seeded trials (Working / Stop / Head-to-Head no difference) labelled "Demo data"; landing, consent, side reveal, dashboard (noise-band chart, context chart), scan result split view, verdict | Judge sees every key screen in < 1 min without a camera |
| M5 | Capture | MediaPipe Face Landmarker (self-hosted model), pose/size gate, light gate live, auto-capture, resize ≥1080 short side | Side light blocks capture |
| M6 | Agent | `/api/agent`: Groq (OpenAI-compatible) tool loop, tools from doc 08, deterministic fallback text, activity feed, return draft, `.ics` reminder | "Is it working?" quotes `get_verdict` numbers |
| M7 | P1 | Head-to-Head, adherence + symptom check-in, context log, Skin Passport ingredient patterns, Evidence board (seeded), Natural Asymmetry Report, under-eye zone | Each has a test or manual check |
| M9 | Preview mode (docs/14) | Generic YouCam task layer; makeup VTO shade swatch with CIEDE2000 seam score; hair colour; skin tone + Fitzpatrick profile; bg-blur share card; story reel; makeup wear test | Fixtures recorded for every API; composite/colour/seam tests pass |
| M8 | Ship | README (setup, diagram, APIs, screenshots), Lighthouse a11y ≥ 90, Vercel deploy | Live URL works on a phone |

## Deviations from the docs (decided)
- **LLM provider:** Groq (`openai/gpt-oss-120b`, OpenAI-compatible tool calling) instead of Anthropic — the key available for the hackathon. Called with plain `fetch`, no SDK.
- **VTO / simulation APIs:** every path was verified against the official OpenAPI bundles on docs.perfectcorp.com and recorded as a fixture before use (docs/05). Earrings are on hold (renders too small with drawn assets); SplitHair is dropped (no per-side frizz score).
- **ROIs** are built in a face-aligned frame (signed distance from midline × position along midline), which gives exact mirror-image ROIs with equal area and handles head roll without polygon clipping.
