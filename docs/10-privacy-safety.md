# 10 — Privacy, Safety and Compliance

## Data handling
| Data | Where | Retention |
|---|---|---|
| Face photos (original) | User's device (IndexedDB) | Until user deletes |
| Photos sent to YouCam | Perfect Corp servers for processing | Results retained 24 h by YouCam, then deleted |
| Masks, scores, burdens | User's device | Until user deletes |
| Agent requests | Our server → Anthropic API: **derived numbers and text only, never images** | Not stored by SplitSide |
| Evidence board submissions (opt-in) | Server DB: product, concern, verdict, effect %, skin type, Fitzpatrick — **no photos, no identifiers** | Until withdrawn |

- No account required for the hackathon version.
- Server routes never log image bytes or full responses containing mask URLs.
- Rate limit API routes; reject files > 10 MB or outside required dimensions.
- `YOUCAM_API_KEY` and `ANTHROPIC_API_KEY` are server env vars only.
- Perfect Corp states the YouCam API is GDPR compliant and its skin features are HIPAA aligned; this does **not** transfer automatically to SplitSide — SplitSide keeps its own consent and minimal-data design. For India, design follows the spirit of the Digital Personal Data Protection Act 2023 (clear consent, purpose limitation, easy erasure).

## Consent screen text (draft)
> SplitSide analyses your face photos with YouCam AI by Perfect Corp to measure skin features on each side of your face.
> • Your photos and results stay on this phone.
> • Each photo is sent to YouCam only to be analysed; YouCam deletes results within 24 hours.
> • You can delete everything at any time in Settings.
> • SplitSide is a cosmetic decision tool. It does not diagnose or treat any condition.
> [ ] I'm 18 or older and I agree.

## Age
Hackathon participants and users: 18+. Gate with a checkbox; don't market to minors.

## Medical safety rules
- No diagnosis language; describe appearance on photos only.
- STOP flow always includes: stop the product, rinse, plain moisturiser, see a doctor if painful/spreading/blistering/not settling.
- Symptom check-in ("burning, stinging, itching, swelling?") overrides statistics.
- Don't recommend prescription drugs; ingredient suggestions are classes to look for (e.g., "fragrance-free, ceramide moisturiser"), not medical advice.
- Patch-test reminder on trial start for strong actives: "Try a small amount on your jaw for 24 h first."
- Pregnancy note for retinoids: "Check with a doctor before using retinoids if pregnant or planning pregnancy."

## Honesty rules (also a judging advantage)
- Seeded demo data always labelled.
- Claim Check simulation always labelled "Simulation".
- Show confidence and "No real difference yet" instead of forcing a positive answer.
- Explain limitations (side lighting, natural asymmetry, product migration) in an "How accurate is this?" page.

## Video and content rules (from hackathon terms)
- No third-party trademarks visible in the demo video: use unbranded/own-labelled products, blur logos.
- No copyrighted music.
- Only film people who consented (yourself).
