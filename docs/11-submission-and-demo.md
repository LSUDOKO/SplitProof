# 11 — Devpost Submission and Demo Video

## Submission checklist
- [ ] Repo public with MIT licence (or private shared with contact_event@PerfectCorp.com)
- [ ] Repo README: what it is, setup, `.env.example`, run commands, architecture diagram, YouCam APIs used + why, screenshots, video link, research references
- [ ] Live demo URL (Vercel) with **Demo mode** that works without a camera
- [ ] Text description (template below)
- [ ] 5–8 screenshots (list below)
- [ ] Demo video 1–3 min, public on YouTube, filmed on a real phone, explains YouCam APIs, no trademarks/copyrighted music
- [ ] "Built with" tags: YouCam API, AI Skin Analysis, Skin Simulation, Fitzpatrick Skin Type, Next.js, TypeScript, MediaPipe, Claude, Vercel
- [ ] Optional awards to tick if eligible: Women in Tech, Rising Star (student)
- [ ] Share the video publicly afterwards for bonus units

## Devpost description template

### Inspiration
Every skincare shopper asks the same question two weeks after buying: *is this actually working?* Before/after selfies can't answer it — skin changes from morning to evening, with light, sleep, stress and weather. Dermatologists solved this long ago with the **split-face trial**: treat one side, keep the other as the control. We built that clinical method for everyone.

### What it does
SplitSide turns your phone into a split-face trial lab:
- **Randomised side:** the app picks which cheek gets the product.
- **Guided capture with a Light Balance Gate:** blocks photos with uneven light, the one thing that can fake a left/right difference.
- **YouCam AI Skin Analysis, split in two:** we take YouCam's per-concern detection masks and split them at your facial midline, measuring the treated and control sides in the same photo.
- **A real verdict:** baseline calibration + difference-in-differences statistics give *Working / No real difference / Stop*, with confidence.
- **Irritation sentinel:** redness rising only on the treated side triggers an immediate stop alert.
- **Agentic trial manager:** schedules scans, explains results in plain language, ends trials early when evidence is clear, and drafts your return request before the store's return window closes.
- **Head-to-Head mode:** budget dupe on one side, premium original on the other.
- **Claim Check:** YouCam Skin Simulation shows what the brand promised; SplitSide shows what actually happened.
- **Skin Passport:** learns which ingredients appear in products that irritated you.

### How we built it
Next.js PWA on Vercel; MediaPipe Face Landmarker for alignment and the facial midline; a Web Worker splits YouCam masks into symmetric cheek ROIs; pure-TypeScript statistics (log-ratio asymmetry, smallest detectable change, Theil–Sen trend); Claude with tool use as the trial agent; all photos stored on-device in IndexedDB.

**YouCam APIs used:** AI Skin Analysis (HD, 8 concerns, per-concern masks) · AI Skin Simulation (Claim Check) · AI Fitzpatrick Skin Type Analysis (safety thresholds) · Facial Color Tones Analyzer · Makeup Virtual Try-On (Half-Face Shade Swatch) · Hair Color Virtual Try-On (Half-Head Colour Preview) · Photo Background Blur (privacy-safe share card). Every API serves the same idea: compare two halves honestly — **measure** what works, **preview** before you buy.

### Research behind it
Split-face designs are standard in cosmetic dermatology (home RF and LED device trials; a 2026 acne study showed between-side differences by day 15 using mobile imaging). Daily fluctuation studies show why single-face tracking is noisy. A 2026 Indian hospital study linked unsupervised use of actives to irritant dermatitis — our sentinel targets exactly that. (Full references in the repo.)

### Challenges
Aligning masks with landmarks; handling natural facial asymmetry (solved with baseline calibration); side lighting (solved with the Light Balance Gate); never letting the LLM invent numbers (deterministic stats + tool use).

### Accomplishments
A consumer app that applies a clinical trial design, uses YouCam masks as a measuring instrument rather than a picture, and gives honest answers including "no difference".

### What we learned
Measurement design matters more than model accuracy: the right comparison cancels most noise for free.

### What's next
Blinded A/B brand kits, crossover trials, a brand portal with skin-tone equity reports, dermatologist mode, and SplitScalp for hair serums.

## Screenshots to capture
1. Landing ("Let your face be the control group")
2. Side reveal (coin flip → "LEFT cheek only")
3. Guided capture with checklist + light balance bar
4. Split-view result with masks
5. Dashboard chart with noise band
6. Verdict: Working (and/or Stop with return draft)
7. Head-to-Head verdict
8. Claim Check comparison

## 3-minute demo video script
| Time | Visual | Voice-over |
|---|---|---|
| 0:00–0:15 | You holding a serum, confused in mirror | "Two weeks in, is this serum working? Your selfies can't tell you — light, sleep and the time of day change your skin more than most products." |
| 0:15–0:30 | Landing → concept animation | "Dermatologists use split-face trials: product on one side, the other side is the control. SplitSide brings that to your phone, powered by YouCam AI." |
| 0:30–0:50 | Trial wizard, coin flip "LEFT cheek" | "I'm testing an acne serum. SplitSide randomly picks my left cheek and plans a 15-day trial that ends before my return window closes." |
| 0:50–1:15 | Live capture on phone; turn sideways to a lamp → gate blocks; face light → passes | "Guided capture lines up every photo. The Light Balance Gate blocks side lighting, the one thing that could fake a difference." |
| 1:15–1:45 | Analysing → split view with masks | "YouCam AI Skin Analysis returns a detection mask for each concern. We split each mask at my facial midline and measure treated versus control in the same photo." **Live proof:** blotting paper or moisturiser on one cheek → oiliness/hydration asymmetry shifts within minutes. |
| 1:45–2:10 | Dashboard (Demo data badge) → Working verdict | "Over 15 days the treated side's acne area fell about 23% compared with the control. Bad sleep moved both sides — so it cancelled out." |
| 2:10–2:35 | Stop scenario → agent chat → return draft | "With a harsh toner, redness rose only on the treated side. The agent stopped the trial and drafted my return with 9 days to spare." |
| 2:35–2:50 | Head-to-Head + Claim Check | "Head-to-Head shows if a budget dupe matches the premium original, and Claim Check compares the brand's promise with what actually happened." |
| 2:50–3:00 | Logo + tagline | "SplitSide. Your face is the control group. Built on YouCam AI Skin Analysis, Skin Simulation and Fitzpatrick analysis." |

Filming tips: record the app on a real phone (screen recording + a hand-held shot of the phone), unbranded products, no music or royalty-free only, captions on.
