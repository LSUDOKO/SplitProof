# SplitSide — Documentation Pack

> **Your face is the control group.**
> SplitSide is an at-home *split-face* skincare trial app. You put a new product on one side of your face only, the other side stays untouched as the control, and the YouCam AI Skin Analysis API measures both halves in the same photo. Because both halves share the same light, sleep, stress, weather and hormones, those effects cancel out, and what is left is the product's real effect.

Built for the **YouCam API Skin AI & eCommerce VTO Hackathon** (Perfect Corp, Devpost).
Track: **Skin AI** (with eCommerce + agentic AI workflows).

---

## How to use this pack with Claude Code

1. Put this folder at the root of your new project repository.
2. Start Claude Code in that folder. It reads `CLAUDE.md` automatically.
3. Say: **"Read CLAUDE.md and all files in docs/, then build SplitSide following docs/12-build-plan.md, milestone by milestone."**
4. Before building, add your YouCam API key to `.env.local` (see `docs/02-api-key-and-credits.md`).

## File index

| File | What it contains |
|---|---|
| `CLAUDE.md` | Rules and instructions for Claude Code (read first) |
| `docs/01-hackathon-requirements.md` | Full hackathon brief, submission rules, judging criteria, prizes, deadline |
| `docs/02-api-key-and-credits.md` | How to get the free 1,000 units and the API key (India region notes) |
| `docs/03-idea-and-research.md` | The problem, the research evidence, why this idea, ideas rejected, round-one gallery check |
| `docs/04-features.md` | Complete feature list (core, signature, commerce, community, B2B, roadmap, excluded) |
| `docs/05-youcam-api-reference.md` | Exact YouCam REST endpoints, request/response shapes, concern names, errors, unit costs, MCP tools |
| `docs/06-architecture.md` | PWA architecture, tech stack, folder structure, data model, API proxy |
| `docs/07-algorithms.md` | Split engine, Light Balance Gate, baseline, verdict statistics, sentinel, early stopping (with formulas + pseudocode) |
| `docs/08-agent-design.md` | Agentic workflow: agent tools, system prompt, decision flows |
| `docs/09-ux-screens.md` | Every screen, user flows, copy, visual direction |
| `docs/10-privacy-safety.md` | Consent, data handling, medical-disclaimer rules, security |
| `docs/11-submission-and-demo.md` | Devpost description template, 3-minute demo video script, screenshot list, checklist |
| `docs/12-build-plan.md` | Milestones, tasks, acceptance criteria, test plan |
| `docs/13-references.md` | All research papers and sources with links |
| `docs/14-beyond-skin.md` | Hair, makeup, fashion and creator API features ("Measure" vs "Preview", split everything) |

## One-paragraph pitch

People spend money on skincare without knowing whether it works. Before/after selfies lie: lighting, sleep, the time of day and the weather change your skin score more than most products do. Dermatology solved this decades ago with the **split-face trial**, where one side of the face is the control. SplitSide brings that clinical method to every shopper. It randomises which cheek gets the product, uses YouCam's AI Skin Analysis masks to measure each half separately, and an AI agent runs the whole trial: scheduling scans, catching irritation early, giving a clear *Working / No difference / Stop* verdict, and drafting the return request before the store's return window closes.
