# 04 — Complete Feature List

Priority tags:
- **P0** — must ship for the hackathon demo
- **P1** — high-value, build after P0 works
- **P2** — nice to have / polish
- **ROADMAP** — describe in Devpost, don't build
- ⭐ — signature feature; feature it in the demo video

---

## A. Capture and measurement quality

| # | Feature | Priority | Details |
|---|---|---|---|
| A1 | Guided camera capture | P0 | Front camera via `getUserMedia`, portrait, ≥1080 px short side (HD requirement). Live face box from MediaPipe Face Landmarker. |
| A2 | Ghost-outline alignment | P0 | Semi-transparent outline of the user's first baseline face landmarks; auto-capture when aligned within tolerance (yaw/pitch/roll < 5°, face width 60–80% of frame, centred). |
| A3 | ⭐ Light Balance Gate | P0 | Compare mean luminance of left vs right cheek ROIs before upload; block if imbalance > threshold ("Turn to face the light"). Also blocks too-dark/overexposed frames. See `07`. |
| A4 | Pre-scan checklist | P0 | No makeup, hair off forehead, glasses off, neutral face, mouth closed. Encourage scanning at the same time each day (skin fluctuates through the day). |
| A5 | Friendly error mapping | P0 | Each YouCam capture error code → specific guidance (see `05`). |
| A6 | Midline buffer zone | P0 | Exclude a band (≈4% of face width each side of midline) from analysis to handle product spreading. |
| A7 | Raw-photo rule | P0 | Never pass analysis photos through lighting/colour/enhance APIs. |
| A8 | Capture metadata | P0 | Store timestamp, device, resolution, light balance value, face pose, local time-of-day with every scan. |
| A9 | Retake comparison | P1 | Show previous scan thumbnail while capturing. |
| A10 | Voice-guided capture | P2 | Spoken prompts ("move closer", "hold still") for accessibility. |

## B. Trial design

| # | Feature | Priority | Details |
|---|---|---|---|
| B1 | Trial setup wizard | P0 | Product name/link, goal concern(s), trial zone, start date, return-window deadline. |
| B2 | Randomised side assignment | P0 | Cryptographically random left/right with coin-flip animation; stored and shown on every screen ("Product goes on your LEFT cheek"). |
| B3 | Smart duration by goal | P0 | Hydration/oiliness/radiance: 7 days; redness: 14; acne: 15; pores/texture: 28; dark spots/age spots: 56. Agent ensures it ends before the return deadline (warns if impossible). |
| B4 | Baseline calibration | P0 | 3 scans on day 0 (re-position between each) → natural asymmetry + noise floor. |
| B5 | ⭐ Head-to-Head mode | P1 | Product A on one side, product B on the other (e.g., budget dupe vs premium original). Same engine; verdict reports which side improved more. |
| B6 | ⭐ Under-eye trials | P1 | Eye cream on one eye; uses `hd_dark_circle`, `hd_eye_bag`, `hd_tear_trough`, periocular wrinkle masks split per eye. |
| B7 | Zone choice | P1 | Cheeks (default), under-eyes, forehead halves. |
| B8 | Natural Asymmetry Report | P1 | Onboarding insight from baseline: which side shows more spots/redness, with possible everyday causes (sleeping side, car-window sun, phone side). |
| B9 | Application coaching | P1 | Short guide: separate fingers, same amount (e.g., one pea), stop 1 cm before midline; daily check-in button. |
| B10 | Crossover round | ROADMAP | Swap sides for a second round to confirm. |
| B11 | Blinded mode | ROADMAP | Two unlabelled jars (A/B) from a brand kit, so the user can't bias themselves. |

## C. Analysis and verdict engine

| # | Feature | Priority | Details |
|---|---|---|---|
| C1 | YouCam pipeline | P0 | File init → presigned PUT → create HD task → poll → parse output → download masks → persist. |
| C2 | ⭐ Split engine | P0 | Midline from face landmarks; per-concern mask burden on treated vs control cheek ROI. See `07`. |
| C3 | Region-aware scoring | P1 | Also store region scores the API returns (pore forehead/nose/cheek; wrinkle 6 regions; skin type T-zone/U-zone) for context screens. |
| C4 | Difference-in-differences verdict | P0 | Treated change minus control change vs personal noise threshold → Working / No real difference yet / Stop + confidence. |
| C5 | ⭐ Irritation sentinel | P0 | Redness (and acne) rising on treated side only, beyond threshold, on any scan → immediate Stop alert. |
| C6 | ⭐ Early stopping | P1 | End early when the effect is clearly beyond threshold on 2 consecutive scans; extend if borderline and the return window allows. |
| C7 | Skin-tone-aware safety | P1 | `AI_Fitzpatrick_Skin_Type_Analysis` (+ `AI_Facial_Color_Tones_Analyzer`) at onboarding; for types IV–VI with harsh actives, lower the irritation threshold (higher risk of post-inflammatory dark marks). |
| C8 | Adherence tracking | P1 | Daily "applied ✓" check-in; adherence % shown with verdict; low adherence lowers confidence. |
| C9 | Context log that cancels out | P1 | Sleep, stress, period, weather/AQI (auto). Chart shows whole-face score moving while treated-minus-control stays flat → "a bad night affected both sides, so the verdict ignored it." |
| C10 | Charts | P0 | Asymmetry index over time per concern, with noise band shaded. |

## D. Agentic AI layer

| # | Feature | Priority | Details |
|---|---|---|---|
| D1 | Explainable trial agent (chat) | P0 | Claude with tools over trial data; explains every number in plain language. |
| D2 | Autonomous trial manager | P0 | Schedules scans, sends reminders, decides when enough data exists, triggers verdict. |
| D3 | ⭐ Return-window guardian | P0 | Countdown to return deadline; on failed/irritating verdict, drafts the return request (email/text) with trial evidence summary. |
| D4 | ⭐ Claim Check | P1 | Day 0: `AI_Skin_simulation` renders the product's claimed improvement ("What the brand promises"). End: shows measured reality side by side ("What actually happened on your face"). Clearly labelled as a simulation. |
| D5 | Barrier-safe next trial | P1 | After Stop, agent flags harsh ingredient classes (retinoids, AHA/BHA, benzoyl peroxide, fragrance, essential oils) and proposes a gentler alternative to trial next. |
| D6 | Policy reader | P2 | Agent reads a pasted store return-policy text/URL and extracts window length and conditions (opened products allowed?). |
| D7 | Multilingual | P2 | English + Hindi UI and agent replies. |

## E. Skin Passport (personal knowledge)

| # | Feature | Priority | Details |
|---|---|---|---|
| E1 | Trial history | P1 | Timeline of all trials and verdicts. |
| E2 | ⭐ Ingredient profile | P1 | INCI list per product (typed/pasted or OCR'd); across trials compute which ingredients appear in Working vs Stop products ("Fragrance appeared in 2 of your 3 irritating products"). Phrase as patterns, not certainty. |
| E3 | Pre-purchase warning | P2 | Paste a new product's ingredients → flags ingredients linked to your past irritation. |
| E4 | Label scanner | P2 | Photo of ingredient list → OCR (client-side Tesseract.js or LLM vision). |
| E5 | Routine conflict checker | P2 | Warns about stacking multiple strong actives. |

## F. Commerce

| # | Feature | Priority | Details |
|---|---|---|---|
| F1 | Product import | P1 | Paste product URL → agent extracts name, price, ingredients if present; or manual entry. |
| F2 | Keep / Return decision card | P0 | Verdict screen ends with a clear action: Keep, Return (draft ready), or Try next. |
| F3 | Proof-based ranking | P2 | Products ranked by pooled split-face results for similar skin (uses Evidence board). |
| F4 | Complete-the-routine | P2 | After a Working verdict, `AI_Facial_Color_Tones_Analyzer` + `AI_Makeup_Virtual_Try_On` preview matching foundation/concealer shades. |
| F5 | Sample-first buying | ROADMAP | Recommend trial sizes for Head-to-Head tests. |

## G. Community and trust

| # | Feature | Priority | Details |
|---|---|---|---|
| G1 | ⭐ Real-World Evidence board | P1 | Opt-in, anonymised verdicts pooled per product, broken down by skin type and Fitzpatrick type ("37 home split-face trials: 62% saw less redness"). Demo uses seeded data labelled "Demo data". |
| G2 | Shareable result card | P1 | Split-view image with eyes blurred, verdict and chart; enhancement APIs allowed here only. |
| G3 | Proof Reviews | ROADMAP | Reviewers attach verified split-face results. |
| G4 | Anti-cheat | ROADMAP | Live capture only, timestamps, consistency checks before data enters the board. |

## H. B2B

| # | Feature | Priority | Details |
|---|---|---|---|
| H1 | Brand portal | ROADMAP | Sponsored trials, Left/Right sample kits ("Split Kits"), efficacy dashboards. |
| H2 | Skin-tone equity reports | ROADMAP | Performance by Fitzpatrick type, where clinical evidence is often thin. |
| H3 | Claim evidence export | ROADMAP | Structured data supporting cosmetic claim substantiation. |
| H4 | Clinic mode | ROADMAP | Dermatologist assigns and monitors trials; PDF report. |
| H5 | Store plugin | ROADMAP | "Try it split-face" button on Shopify product pages. |

## I. Platform, privacy and safety

| # | Feature | Priority | Details |
|---|---|---|---|
| I1 | PWA | P0 | Installable, mobile-first, works on Android/iOS browsers. |
| I2 | Consent screen | P0 | Explains photo use, YouCam processing, on-device storage. |
| I3 | On-device storage | P0 | Photos, masks, scores in IndexedDB; nothing stored server-side by default. |
| I4 | Delete everything | P0 | One tap wipes IndexedDB and cached files. |
| I5 | Disclaimers + doctor prompts | P0 | See `10`. |
| I6 | Demo mode | P0 | Seeded trials (clearly labelled) so judges can explore without scanning their face. |
| I7 | Units panel | P1 | Remaining units + cost per scan (`Get_Feature_Cost` / credit endpoints). |
| I8 | Reminders | P1 | Web push / calendar `.ics` export for scan days. |
| I9 | Data export | P2 | Download trial as JSON/PDF. |
| I10 | Accessibility | P1 | Screen-reader labels, colour-blind-safe treated/control colours, large tap targets. |

## J. Future extensions
- **SplitScalp** (ROADMAP): half-scalp hair serum trials with `AI_Hair_Density_Detection`.
- Body zones (arms/legs) for body lotions — needs a body-skin model.
- Native app shells (Capacitor) for better camera control and reliable iOS reminders.

## L. Beyond skin — hair, makeup, fashion, creator APIs (full spec in `14-beyond-skin.md`)

| # | Feature | Priority | Details |
|---|---|---|---|
| L1 | ⭐ Half-Face Shade Swatch | P1 | `AI_Makeup_Virtual_Try_On` foundation on one half, bare skin (or shade B) on the other, split at the midline; seam colour-difference estimate. Preview mode, labelled simulated. |
| L2 | ⭐ Half-Head Hair Colour Preview | P1 | `AI_Hair_Color_Virtual_Try_On` new colour on one half, current hair on the other; shade shortlist from `AI_Facial_Color_Tones_Analyzer`. |
| L3 | Privacy-safe share card | P1 | `AI_Photo_Background_Blur` / Removal on a share copy only, eyes blurred. |
| L4 | Gold-vs-silver earrings | P2 | `AI_Earrings_Virtual_Try_On`, one metal per ear in the same photo, undertone guidance. |
| L5 | Shade-to-outfit full look | P2 | Makeup VTO + `AI_Clothes_Virtual_Try_On` together (eCommerce VTO brief: beauty + fashion as one). |
| L6 | SplitHair frizz trial | P2 | Product on one side of the hair; `AI_Hair_Frizziness_Detection` left vs right view (verify per-view output first). |
| L7 | Trial Story Reel | P2 | Short share video built from real day-0/day-N split photos; no generative video on faces. |
| L8 | Half-beard style preview | ROADMAP | `AI_Beard_Style_Generator`; no beard density analysis exists for a Measure trial. |

## K. Deliberately excluded (and why — mention in Devpost)
- **AI Aging Simulation** — scary and unmeasured; contradicts the honest-evidence promise.
- **Face Lift / Face Reshape / beauty filters** — flatter instead of measure.
- **Clothes/jewellery try-on for its own sake** — adding APIs without a reason looks like padding. (They are used only in the split-preview features in section L, where they serve a real buying decision.)
- **Face swap, teeth whitening, smile, body reshape** — beautifying or no consumer value for this product.

## Demo hero features (in this order)
1. Head-to-Head dupe test (or single-product trial)
2. Light Balance Gate
3. Split engine + split-view result
4. Irritation sentinel
5. Claim Check
6. Return-window guardian
7. Skin Passport
