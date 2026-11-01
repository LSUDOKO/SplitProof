# 07 — Algorithms

All functions here are **pure TypeScript** (no network, no DOM except ImageData) so they can be unit-tested with fixtures. Thresholds are starting values — calibrate them with real scans and record the final values in `lib/config.ts`.

---

## 0. Orientation: whose left is "left"?
- Captured frames from `getUserMedia` drawn to a canvas are **not mirrored** (only the CSS preview usually is). In an un-mirrored photo, the **user's left cheek appears on the image's right side**.
- Define everything in the **user's** frame: `userSide = imageX > midlineX(y) ? 'left' : 'right'`.
- Keep the preview mirrored (natural for selfies), but never mirror the captured analysis image.
- Unit test this with a fixture where you mark the user's left cheek.

---

## 1. Light Balance Gate (before upload)
Goal: block photos where light falls unevenly on the two halves (side lighting fakes a treated/control difference).

```
inputs: frame ImageData, landmarks (MediaPipe 478 pts, image px)
ROI_L, ROI_R = symmetric cheek ROIs (see §3)
Y(p) = 0.2126 R + 0.7152 G + 0.0722 B              // per pixel, 0..255
yL = median(Y over ROI_L);  yR = median(Y over ROI_R)
imbalance I = |yL - yR| / ((yL + yR) / 2)
clipped = fraction of ROI pixels with any channel ≥ 250
dark    = min(yL, yR)
sharp   = variance of Laplacian over face bounding box (grayscale)

PASS if:
  baseline scan:      I ≤ 0.12
  later scans:        |I - I_baseline_mean| ≤ 0.06       // relative: tolerates natural pigment asymmetry
  dark ≥ 70, clipped ≤ 0.02, sharp ≥ SHARP_MIN (calibrate, ~60 on 1080p)
messages:
  I too high  → "Light is coming from one side. Turn so the light is in front of you."
  dark        → "Too dark — face a window or lamp."
  clipped     → "Too bright — step back from the light."
  sharp       → "Hold still."
```
Store `I` with every scan (it's shown in a "measurement quality" detail and used in tests).

---

## 2. Alignment / pose gate (ghost outline)
From MediaPipe facial transformation matrix (enable `outputFacialTransformationMatrixes`), derive yaw, pitch, roll.
```
PASS if |yaw| ≤ 5°, |pitch| ≤ 7°, |roll| ≤ 5°,
        faceWidth/imageWidth ∈ [0.60, 0.80],
        face centre within 8% of image centre,
        eyes open (blendshape eyeBlink < 0.4), mouth closed (jawOpen < 0.15)
After baseline: also mean landmark distance to baseline landmarks (after similarity transform) ≤ 4% of face width.
Auto-capture after 600 ms continuously passing.
```

---

## 3. Midline and symmetric ROIs

### Midline
Fit a line `x = a·y + b` (least squares) through midline landmarks (MediaPipe indices commonly used: 10 forehead, 9, 8, 168 nose bridge, 6, 197, 195, 5, 4, 1 nose tip, 2, 164, 0 upper lip, 17, 18, 200, 199, 175, 152 chin). Verify indices by drawing them in a debug overlay.
Signed distance: `d(p) = (p.x - (a·p.y + b)) / sqrt(1 + a²)`.

### Cheek ROI (default zone)
Build one cheek polygon from landmarks, then mirror it across the midline to get the other side, and use the **intersection** so both ROIs are exact mirror images with equal area:
```
rawL = polygon(user-left cheek):  below lower eyelid (+3% face h), above mouth-corner line,
       lateral of nasal ala (+2% face w), medial of face contour (-4% face w)
rawR = same for user-right cheek
ROI_L = rawL ∩ reflect(rawR, midline)
ROI_R = reflect(ROI_L, midline)
Exclude buffer: |d(p)| < 0.04 · faceWidth  (product spreading across the midline)
```
Useful anchor landmarks (verify visually): face contour 234 / 454, eye outer corners 33 / 263, eye inner corners 133 / 362, lower eyelid ~145 / 374, nose alae ~98 / 327, mouth corners 61 / 291.

### Under-eye ROI
Band below each lower eyelid, 0–12% of face height, from inner to outer eye corner; mirrored-intersection as above.

### Forehead halves ROI
Above eyebrows to 85% of forehead height (hairline is unreliable), split by midline with the buffer.

---

## 4. Mask burden per side
Masks: alpha channel marks detected concern areas (stronger alpha = stronger detection).
```
loadMask(png) → ImageData; if size ≠ analysed image size → scale to image size (bilinear)
for side in {L, R}:
   S = Σ alpha(p) for p in ROI_side           // 0..255 each
   burden[side] = S / (255 · |ROI_side|)      // 0..1, fraction of ROI "covered" by the concern
```
- If a mask has no alpha channel (JPEG), use luminance or the provider's documented convention; detect at load time and record it in a fixture test.
- Use the region-specific mask when it matches the ROI (e.g. `hd_pore` **cheek** mask for the cheek zone; `hd_wrinkle` **crowfeet/periocular** for eye trials).
- `splittable` check per concern: if the mask's alpha variance over the face is ~0, the concern isn't split (show whole-face score only).

---

## 5. Asymmetry index
For each concern c and scan t (T = treated side, C = control side):
```
ε = 0.002
A_t(c) = ln( (burden_T + ε) / (burden_C + ε) )
```
- A > 0 → treated side shows more of the concern (worse); A < 0 → treated side shows less (better).
- Log-ratio is symmetric and robust when burdens are small.
- For **Head-to-Head**, T = product A side, C = product B side.

---

## 6. Baseline
Three baseline scans (user re-positions between them, same session):
```
A0(c)  = mean(A_b1, A_b2, A_b3)
sd(c)  = max( stdev(A_b1..b3), SD_FLOOR(c) )       // SD_FLOOR default 0.05; 3 samples underestimate noise
SDC(c) = 1.96 · √2 · sd(c)  ≈ 2.77 · sd(c)        // smallest detectable change between two measurements
```
Update `sd(c)` with a pooled estimate as more data arrives (e.g. include pairs of same-day repeat scans if the user takes them).

### Natural Asymmetry Report
For concerns with |A0(c)| ≥ 0.25: "Your {left/right} cheek shows ~{round((e^|A0|-1)·100)}% more {concern}." Offer possible everyday causes (sleeping side, car-window sun, phone side) as possibilities, not conclusions.

---

## 7. Effect and verdict (difference-in-differences)
```
Δ_t(c) = A_t(c) - A0(c)          // change in treated-vs-control relative to baseline
                                 // already "controls" for anything affecting both sides
post = post-baseline scans, ordered by time
n    = |post|
recent = last 2 values of Δ (or all if n < 2)
m    = mean(recent)
```
Rules per goal concern (evaluate goal concerns; show others as secondary):
```
if sentinel triggered                       → STOP          (see §8)
if n < 2 or days < MIN_DAYS(goal)           → INSUFFICIENT_DATA
if m ≤ -SDC and all(recent) ≤ -0.75·SDC     → WORKING
if m ≥ +SDC and all(recent) ≥ +0.75·SDC     → WORSE
if days ≥ plannedDays and |m| < SDC         → NO_DIFFERENCE
else                                        → keep going ("Too early to tell")
```
Overall trial verdict = worst of (STOP, WORSE) if any goal concern hits it; else WORKING if any goal concern is WORKING; else NO_DIFFERENCE / keep going.

### Confidence
```
se = sd · √2 / √(len(recent))
z  = |m| / se
confidence = z ≥ 3 ? 'High' : z ≥ 2 ? 'Medium' : 'Low'
```
Also report effect size in plain words: `pct = (1 - e^{Δ}) · 100` → "about {pct}% less acne-detected area on the treated cheek than expected."

### Trend line
Theil–Sen slope of Δ over days (robust to one bad scan), shown on the chart; not used for the verdict.

### MIN_DAYS and planned days by goal
| Goal | MIN_DAYS | Planned |
|---|---|---|
| hd_moisture, hd_oiliness, hd_radiance | 3 | 7 |
| hd_redness | 5 | 14 |
| hd_acne | 7 | 15 |
| hd_pore, hd_texture | 14 | 28 |
| hd_age_spot | 28 | 56 |
| under-eye concerns | 7 | 21 |

---

## 8. Irritation sentinel
Runs on **every** scan, for `hd_redness` and `hd_acne` (and `hd_texture` as secondary):
```
k = (fitzpatrick ≥ 4 and product has harsh-active class) ? 0.7 : 1.0
WATCH if Δ_t(redness) ≥ 0.7 · k · SDC(redness)
STOP  if Δ_t(redness) ≥ k · SDC(redness)
      or two consecutive WATCH
      or Δ_t(acne) ≥ k · SDC(acne) on two consecutive scans
      or user reports burning / stinging / swelling / itching (symptom check-in)  → immediate STOP advice
```
Harsh-active classes: retinoids (retinol, retinal, retinyl, adapalene, tretinoin), AHA (glycolic, lactic, mandelic), BHA (salicylic), benzoyl peroxide, high-strength vitamin C (L-ascorbic acid), fragrance/parfum, essential oils, alcohol denat.

STOP message must include: stop using the product, rinse with water and use a plain moisturiser, and see a doctor if it is painful, spreading, blistering or not settling in a few days.

---

## 9. Early stopping and extension
```
EARLY_WORKING if days ≥ MIN_DAYS and last two Δ ≤ -1.5·SDC
EARLY_WORSE   if days ≥ MIN_DAYS and last two Δ ≥ +1.5·SDC
EXTEND once by 7 days if at planned end 0.6·SDC ≤ |m| < SDC
              and returnDeadline - today ≥ 7 days (else verdict with Low confidence + note)
```

---

## 10. "Context cancels out" chart
Plot two lines over time: (a) whole-face `raw_score` for the goal concern (moves with sleep, weather, period, time of day) and (b) Δ_t (treated minus control). Overlay context markers (bad sleep, high AQI). The visual story: (a) jumps around, (b) stays flat unless the product works.

---

## 11. Ingredient pattern profile (Skin Passport)
```
for each finished trial: label = WORKING | NO_DIFFERENCE | STOP/WORSE
for each ingredient i (normalised INCI) and class:
   seenStop[i], seenWorking[i], seenTotal[i]
flag i when seenStop[i] ≥ 2 and seenStop[i]/seenTotal[i] ≥ 0.66
```
Wording: "Fragrance appeared in 2 of your 3 products that irritated your skin." Never claim causation.

---

## 12. Unit tests (must exist)
- `lightGate.test.ts`: synthetic face images with left/right brightness 1.0/1.0 (pass), 1.0/0.8 (fail), relative mode vs baseline.
- `split.test.ts`: synthetic mask with alpha 200 on image-right cheek ROI, 0 on image-left → user's **left** burden high; buffer band excluded; rotated face (roll 10°) still splits correctly.
- `verdict.test.ts`: baseline sd 0.05 → SDC ≈ 0.139; Δ sequences for WORKING, WORSE, NO_DIFFERENCE, INSUFFICIENT_DATA, extension.
- `sentinel.test.ts`: WATCH vs STOP, Fitzpatrick + harsh active lowering threshold, symptom override.
- Parser test against recorded YouCam fixtures.
