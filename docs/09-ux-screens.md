# 09 — UX: Screens, Flows and Copy

## Visual direction
- Clean, clinical-but-warm. Light background, one accent colour.
- **Treated side** and **control side** always use the same two colours everywhere (choose a colour-blind-safe pair, e.g. blue `#2563EB` for treated and amber `#D97706` for control) and always carry text labels too ("Treated", "Control").
- Signature visual: a face photo split down the middle with a vertical divider; the treated half tinted subtly in the treated colour.
- Mobile-first, one-hand reachable primary buttons, large tap targets (≥ 44 px).
- Load the `frontend-design` skill guidance for typography and polish.

## Primary flow
```
Landing → Consent → Onboarding scan (×3 baseline-style) → Natural Asymmetry Report
→ New trial wizard → Side reveal (coin flip) → Baseline ×3 → Trial dashboard
→ (every 2–3 days) Guided scan → Scan result → Dashboard ...
→ Verdict → Keep / Return draft / Next trial
```
Demo mode entry on Landing: "Explore a demo trial (no camera needed)".

## Screens

### 1. Landing
- Headline: **"Is your skincare actually working? Let your face be the control group."**
- Sub: "Use a product on one side of your face only. SplitSide measures both sides in the same photo, so lighting, sleep and weather cancel out."
- Buttons: **Start a trial** · **Explore a demo trial**
- 3-step illustration: One side → Same photo → Real answer.

### 2. Consent
Plain-language bullets: photos are analysed by YouCam AI (Perfect Corp) and deleted from their servers within 24 h; photos and results stay on your phone; you can delete everything anytime; not a medical tool. Checkbox + Continue.

### 3. Onboarding scan + skin profile
Guided capture (see 6). Shows skin type (from `hd_skin_type`), Fitzpatrick type, and the **Natural Asymmetry Report**: "Your right cheek shows about 18% more spots than your left. Common reasons: sun through a car window, sleeping side, phone side."

### 4. New trial wizard (4 steps)
1. **What are you testing?** Single product / Head-to-Head (A vs B). Product name, optional link, price, ingredients (paste or scan).
2. **What should it improve?** Chips: Acne, Redness, Oiliness, Pores, Texture, Dark spots, Hydration, Glow, Under-eye (dark circles/bags).
3. **Return window:** "When can you last return it?" date picker (or "I won't return it").
4. **Claim Check (optional):** "What does the brand promise?" → generates simulation.
Summary: "15-day trial · ends 16 Nov · return deadline 20 Nov ✓"

### 5. Side reveal
Coin-flip animation → "**Apply it to your LEFT cheek only.**" Illustration of the face with the left cheek highlighted. Application tips: clean fingers per side, pea-sized amount, stop 1 cm before the middle of your face.

### 6. Guided capture (most important screen)
- Live mirrored preview, ghost face outline, real-time checklist chips turning green: *Face centred · Straight on · Close enough · Even light · Still*.
- Light bar showing left vs right brightness ("Light balance").
- Auto-capture when all green for 0.6 s; shutter haptic.
- Blocking messages from `07` and `05` error mapping.
- Footer: "Tip: scan at about the same time each day — skin changes from morning to evening."
- Baseline mode: "Scan 1 of 3 — move your head away and back between scans."

### 7. Analysing
Progress steps: Uploading → Analysing with YouCam AI → Measuring both sides. Show the photo with a scanning line across the midline.

### 8. Scan result
- **Split view**: slider to reveal concern masks on both halves; concern selector chips.
- Per-concern bar pair: Treated vs Control burden today, plus change since baseline.
- One-line agent summary: "Day 6: acne area on your treated cheek is trending down vs control (not significant yet)."
- Check-in: "Applied as planned since last scan?" Yes / Missed some days. "Any burning, stinging, itching or swelling?" No / Yes (→ STOP advice).
- Optional context: sleep hours, stress 1–5, period.

### 9. Trial dashboard
- Header: product, day X of Y, treated side badge, return countdown chip ("Return by 20 Nov · 11 days").
- Main chart: Δ over time with the grey noise band (±SDC) and a dotted Theil–Sen trend; legend "Below the band = working, above = worse".
- "Context cancels out" mini chart (whole-face score vs Δ).
- Next scan card with date/time; Agent activity feed; Chat button.

### 10. Verdict
Big card with one of:
- ✅ **Working** — "Acne-detected area on your treated cheek is about 23% lower than on your control side. Confidence: High."
- ➖ **No real difference** — "After 15 days, both sides changed the same way. This product didn't measurably beat doing nothing."
- 🛑 **Stop** — irritation message (see `08`).
- ⚠️ **Worse** — "The treated side got worse than the control."
Below: before/after split images, Claim Check comparison, adherence %, measurement quality.
Actions: **Keep it** · **Draft return request** · **Try something gentler** · **Share result card** · **Add to Evidence board (anonymous)**.

### 11. Head-to-Head verdict
"**Product B (₹350) did as well as Product A (₹3,200)** — difference within your noise range." or "A beat B by ~18%."

### 12. Chat
Agent conversation with suggested questions: "Is it working?", "Why do you compare sides?", "What if I missed days?", "Draft my return".

### 13. Skin Passport
Trial history list; ingredient patterns ("Fragrance: in 2 of 3 irritating products"); pre-purchase checker (paste ingredients).

### 14. Evidence board
Product cards: "37 home split-face trials · 62% Working for redness · split by skin type". Demo data badge when seeded.

### 15. Settings
Language (English/Hindi), reminders, units remaining (dev), export data, **Delete everything** (confirm), About & disclaimers.

## Microcopy rules
- Say "treated side" / "control side", plus the actual cheek ("your left cheek").
- Never "diagnosis", "treatment", "cure", "guaranteed".
- Express effects as "about X% less detected area than expected", not raw indices.
- Always offer a next step on every result.

## Demo mode
Seeded trials (badged **Demo data**):
1. Acne serum, single, 15 days → WORKING (high confidence).
2. Exfoliating toner, single → STOP on day 6 (redness sentinel), return draft ready.
3. Head-to-Head moisturisers (budget vs premium) → no real difference.
Seeds use real recorded mask fixtures with synthetic day-by-day Δ values.
