# 14 — Beyond Skin: Hair, Makeup and Creator APIs

## Design principle: "Split everything"
SplitSide's identity is the **half-and-half comparison**. Every extra YouCam API is used only where it fits that identity, in one of two clearly separated modes:

| Mode | What it is | Data | Label in UI |
|---|---|---|---|
| **Measure** | A real trial: treated half vs control half, measured over time | Real analysis outputs + statistics from `07` | "Measured" |
| **Preview** | Before buying: new product on one half, your real self on the other half, in one image | Generated try-on images | "Preview — simulated" |

Rules:
- Previews never feed the verdict engine and are always labelled as simulations.
- Measurements never use generative or beautifying APIs on the analysed photo.
- Don't add an API just to increase the API count; each feature below solves a real buying decision.

Before building any of these, look up the exact REST path and request/response shape for each feature at https://docs.perfectcorp.com (pattern is the same as skin analysis: file → task → poll). Record what you find in `05-youcam-api-reference.md`. Use `Get_Feature_Cost` to check unit prices first.

---

## H1 — ⭐ Half-Face Shade Swatch (Makeup VTO) — P1
**Problem:** Wrong foundation/concealer shade is one of the most common beauty purchase mistakes. Makeup artists check a shade by swatching it on the jawline next to bare skin. Online shoppers can't.

**What it does:** User picks a foundation shade (or two shades to compare). SplitSide renders the shade with `AI_Makeup_Virtual_Try_On`, then composites: **left half = with foundation, right half = bare skin** (or **left = shade A, right = shade B**), divided at the facial midline from the landmarks. The seam along the jaw and cheek shows instantly whether the shade blends or looks like a mask.

**APIs:** `AI_Makeup_Virtual_Try_On` (foundation/concealer), `AI_Facial_Color_Tones_Analyzer` (skin tone + undertone context to shortlist shades).

**Extras:**
- "Seam score": client-side colour difference (ΔE in CIELAB) between the try-on half and the bare half in mirrored jaw/cheek ROIs → "Blends well / Slightly light / Too dark". Label as an estimate on a simulated image.
- Daylight / indoor view toggle is **not** available from real data — don't fake it.

**Commerce:** Shade A vs B swatch before checkout; pick the one with the smaller seam; buy one shade instead of two.

**Optional real-world follow-up (Measure mode):** after buying, the user can run a real split-face *wear test* (foundation on one half) and the app compares redness/oiliness/acne vs the bare half after a week — useful for "does this foundation break me out?"

---

## H2 — ⭐ Half-Head Hair Colour Preview (Hair VTO) — P1
**Problem:** People hesitate before dyeing hair because they can't see the colour against their own skin tone and current colour. Stylists do a strand test; shoppers buying box dye can't.

**What it does:** `AI_Hair_Color_Virtual_Try_On` renders the new colour; SplitSide composites **left half = new colour, right half = current hair** (or two candidate colours side by side), split at the facial midline extended upward.

**APIs:** `AI_Hair_Color_Virtual_Try_On`, `AI_Facial_Color_Tones_Analyzer` (current hair colour + skin tone → shortlist flattering shades with plain-language reasons).

**Commerce:** link to the matching dye product; "Compare 2 shades" mode.

---

## H3 — SplitHair: hair-product trials (Measure mode) — P2
**Problem:** Same as skin — people can't tell if a hair serum, anti-frizz conditioner or growth serum works, because humidity, washing day and styling change hair more than products do.

**What it does:** User applies the product to **one side of the head only** (left vs right of the parting). The trial engine from `07` is reused with hair measurements.

**APIs:**
- `AI_Hair_Frizziness_Detection` — analyses frizz from **front, left and right view photos**. Check in the docs whether results are returned **per view**. If yes, the left-view vs right-view frizz score is a natural treated-vs-control pair. If it returns only one combined score, this feature is not feasible; drop it.
- `AI_Hair_Density_Detection` — 4 density levels from scalp visibility. Too coarse to detect change in weeks; use only as context at onboarding, or for long (3–6 month) growth trials, and say so.
- `AI_Hair_Type_Detection` — onboarding context (texture, thickness, curl pattern) for product suggestions.

**Capture:** guided left-side and right-side profile shots with the same distance and light; a Light Balance Gate equivalent compares background-normalised brightness between the two side shots.

**Honesty:** hair trials are coarser than skin trials; show "Low confidence" unless differences are large and repeated.

---

## H4 — Privacy-safe Share Card (Creator APIs) — P1
**Problem:** People want to share results but not their bedroom, bathroom or full face.

**What it does:** On the **share card only**, `AI_Photo_Background_Blur` (or `AI_Photo_Background_Removal` + plain brand background) hides the surroundings; eyes are blurred client-side; verdict and chart are overlaid.

**Rule:** these APIs run on a **copy** made for sharing — never on analysis photos.

---

## H5 — Trial Story Reel (Creator APIs) — P2
**What it does:** A 6–8 second shareable video of the trial: day-0 split photo → day-15 split photo → verdict text. Built client-side from real photos (simple cross-fade), optionally polished with `AI_Video_Enhancer`. Do **not** use image-to-video generation on the face, because it would invent changes that never happened.

**Why:** shareability → bonus API units (Share & Earn), word of mouth, Proof Reviews.

---

## H6 — Under-eye + eye-area extensions — P1 (already in `04`)
`hd_dark_circle`, `hd_eye_bag`, `hd_tear_trough`, periocular wrinkles split per eye. Optional Preview: `AI_Skin_simulation` for the eye cream's claim (Claim Check).

---

## H7 — Men's grooming split trials — ROADMAP
Beard-growth oil on one side of the jaw. YouCam has a beard **style/dye try-on** (`AI_Beard_Style_Generator`) but no beard **density analysis**, so a Measure trial isn't possible with the API today. Could offer a Preview only ("half-beard style preview"). Roadmap.

---

## H8 — Fashion tie-in (eCommerce VTO track) — P2
Only where it connects to the split decision:
- **Shade-to-outfit check:** after H1 picks a foundation shade, `AI_Clothes_Virtual_Try_On` previews the user in a saved outfit with the new makeup, so the full look is judged together (the eCommerce VTO brief asks for beauty + fashion as one experience).
- **Jewellery metal vs skin tone:** `AI_Earrings_Virtual_Try_On` / `AI_Necklace_Virtual_Try_On`, split preview **gold on one side, silver on the other** (earrings are naturally per side!), guided by undertone from `AI_Facial_Color_Tones_Analyzer`.

The earrings idea is the most natural fashion fit: one ear gold, one ear silver, same photo.

---

## Deliberately still excluded
| API | Reason |
|---|---|
| `AI_Aging_Simulation` | Frightening and unmeasured; conflicts with honest-evidence brand |
| `AI_Face_Lift`, `AI_Face_Reshape`, `AI_Smile`, body reshape/abs/bust | Beautifying filters; contradict "truth over flattery" |
| `AI_Face_Swap`, video face swap | No consumer value here; misuse risk |
| `AI_Teeth_Whitening` | Simulation only; can't measure real whitening (possible future Claim Check for whitening strips) |
| Image/video generation on faces | Would invent results |

## Priority summary
| Feature | Mode | Priority | YouCam APIs |
|---|---|---|---|
| H1 Half-Face Shade Swatch | Preview (+ optional Measure wear test) | **P1** | Makeup VTO, Facial Color Tones |
| H2 Half-Head Hair Colour Preview | Preview | **P1** | Hair Color VTO, Facial Color Tones |
| H4 Privacy-safe Share Card | — | **P1** | Background Blur / Removal |
| H8 Gold-vs-Silver earrings split | Preview | P2 | Earrings VTO, Facial Color Tones |
| H8 Shade-to-outfit check | Preview | P2 | Clothes VTO + Makeup VTO |
| H3 SplitHair frizz trial | Measure | P2 (verify per-view output) | Hair Frizziness, Hair Type, Hair Density |
| H5 Trial Story Reel | — | P2 | Video Enhancer (optional) |
| H7 Beard split | Preview only | ROADMAP | Beard Style Generator |

## App structure after these additions
Bottom navigation:
1. **Trials** (Measure) — skin trials, under-eye trials, SplitHair
2. **Preview** — Shade Swatch, Hair Colour, Earrings, Full Look
3. **Passport** — history, ingredient profile, skin/hair profile
4. **Evidence** — community results

Pitch line: *"Measure what works. Preview before you buy. Always half-and-half, always honest."*
