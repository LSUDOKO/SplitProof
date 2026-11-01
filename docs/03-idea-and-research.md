# 03 — The Idea and the Research Behind It

## Problem
1. **Shoppers can't tell if a skincare product works.** They decide by eye, and the eye is unreliable: in a study of 1,065 women, self-perceived results agreed with AI grading only when skin signs were already pronounced (Flament et al., 2021). Consumer self-assessment of skin type is often cited at only ~40% accuracy.
2. **Before/after selfies are mostly noise.** Skin measurements swing within a single day: pore area and roughness peak right after waking, redness peaks in the evening after face-washing (Miyamoto et al., 2021). Lighting, device and camera distance change scores further. Perfect Corp's own developer guide warns that a score difference between scans in different light tells you about the rooms rather than the skin. A tracker comparing Tuesday morning to Friday evening is measuring the clock, not the product.
3. **Irritation is real and common.** A 2026 hospital-based study in India linked social-media-driven, unsupervised use of active ingredients (retinoids, exfoliating acids) to irritant dermatitis; about a third of patients had used actives this way (Nanthini N et al., 2026). Layering multiple actives causes irritation and non-adherence (Pryor et al., 2024).
4. **Money and returns.** People buy, use for a while, can't tell, and the return window closes.

## Insight: the split-face trial
Dermatology already solved the measurement problem. In a **split-face (within-subject) trial**, one side of the face gets the product and the other side is the control. Each person is their own control, which removes person-to-person differences and anything that affects the whole face (light, sleep, stress, hormones, weather, diet, time of day).

Evidence that the method is standard and works at home:
- Home radiofrequency device: randomised, controlled split-face trial, 33 women, 12 weeks (Shu et al., 2022).
- Home LED device: prospective split-face trial, 24 subjects, 8 weeks (Ng et al., 2020).
- Acne dermocosmetic: randomised intra-individual split-face study, 16 subjects, **significant between-side differences by day 15**, measured partly with a **mobile connected imaging system** (Queille-Roussel et al., 2026). → a 15-day trial is a realistic product timeline.
- Avon: double-blind randomised split-face efficacy study of cosmetic formulations in Fitzpatrick IV–VI skin (NCT05160103).
- Aesthetic practice paper: a no-control design made products look erratic; the split-face comparison showed they performed similarly.
- Self-captured phone photos are clinically usable when capture is guided: alignment indicators keep repeated selfies consistent (Hashimoto et al., 2024); an Allergan mobile capture app reached substantial-to-almost-perfect agreement with in-person ratings (Caiazza et al., 2026); smartphone selfies add value to cosmetic trials when normalised (Smeaton et al., 2020).

**Gap:** every one of these trials was run by a lab or clinic. No consumer product gives shoppers the split-face method.

## Solution: SplitSide
A phone-first web app where the user:
1. picks a product and goal; the app randomly assigns which cheek gets it;
2. takes 3 baseline scans (measures natural asymmetry and scan-to-scan noise);
3. scans every few days with guided capture;
4. YouCam AI Skin Analysis returns per-concern **masks**; SplitSide splits each mask at the facial midline and measures **treated side vs control side**;
5. a statistics engine returns **Working / No real difference yet / Stop**, with confidence;
6. an AI agent runs the trial: reminders, early stopping, irritation alerts, plain-language explanations, and drafting the return request before the store's return window closes.

### Why masks, not scores
The API returns whole-face scores, not left/right scores. But it also returns a **detection mask PNG per concern** (alpha channel = where the concern is). Splitting the masks at the midline turns the API into a two-sided measuring instrument. This is the core technical novelty and the "non-trivial implementation" judges ask for.

## Ideas considered and rejected
| Idea | Why rejected |
|---|---|
| Generic "track my skin over time" | Already done in round one (Skin Journey, BaddieGuide); suffers from the noise problem above. |
| NeuroDerm (stress/sleep-aware skin shopping) | Stress can't be measured by YouCam; demo would hardcode it ("Wizard of Oz"); serums can't be visually "tried on"; core logic is an if/else on scores (wrapper risk); resembles round-one GlowCycle. **Its good parts were merged into SplitSide**: explainable agent chat, barrier-safe product swaps, and a context log (which split-face shows cancels out). |
| SymbioFit (fabric vs skin microbiome) | Skin analysis is face-only (can't see back acne); clothes VTO can't show fabric composition; thin evidence. |
| OxyPredict (foundation oxidation prediction) | YouCam can't measure skin pH or predict oxidation; prediction would be fabricated. |
| VTO fidelity / skin-tone bias checker | Active research area, but round-one winners KeepMe and ShadeSpan already cover it. |
| Fit-aware try-on | Real research gap (FIT dataset, FitVTON) but needs model training, not buildable on the API. |
| Ingredient-label explainer | Documented consumer confusion, but barely uses YouCam → wrapper. |
| Bracket Breaker (VTO all colour variants in cart) | Valid (virtual fitting rooms cut "order several sizes" behaviour ≥25%) but weaker novelty. Kept as a backup idea only. |

## Honest limitations (state these in the submission)
- Not a medical device; it measures appearance on photos.
- One-sided sun exposure (car window), sleeping side and phone side create natural asymmetry → handled by baseline calibration and difference-in-differences, but explained to the user.
- Side lighting can fake a difference → Light Balance Gate blocks those photos.
- Product can migrate across the midline → midline buffer band + application coaching.
- Small changes may stay below the detection threshold → the app says "No real difference yet" instead of guessing.

## Novelty check performed
- Round-one Devpost gallery reviewed (first page of 238 entries). No split-face entry found.
- Literature searched via Consensus (peer-reviewed) and alphaXiv (arXiv). Split-face designs exist only in lab/clinic trials. Elicit was unavailable (plan without API access).
- Current-round submissions are not public; uniqueness can't be guaranteed, only that no prior consumer split-face app was found.
