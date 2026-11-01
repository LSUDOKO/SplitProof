# 02 — Getting the API Key and Free 1,000 Units

Yes, an API key is required. Every YouCam REST call is authenticated with a Bearer token:
```
Authorization: Bearer YOUR_API_KEY
```
(note the single space after `Bearer`). The free hackathon units are what each successful call consumes.

## Steps
1. **Register for the hackathon on Devpost.** Perfect Corp emails an exclusive **redeem code** (check spam/promotions).
2. **Sign up for a YouCam API account** and verify your email.
   - **India region:** the hackathon page has a separate "For India region, please click HERE" link with its own console, playground and docs. Use the India link if you are in India, and redeem the code in the **same region's** console you will build against.
   - Global console: https://yce.perfectcorp.com/api-console/en/
3. **Redeem the code:** console → **Account → Redeem Code** → paste code. 1,000 units are added immediately.
4. **Create an API key:** console → API Keys → generate. Copy it.
5. **Test in the API Playground** (https://yce.perfectcorp.com/api-console/en/api-playground/ai-skin-analysis/) with your own selfie to confirm the key works and see real output before coding.
6. Put the key in `.env.local`:
   ```
   YOUCAM_API_KEY=your_key_here
   YOUCAM_BASE_URL=https://yce-api-01.makeupar.com
   ANTHROPIC_API_KEY=your_anthropic_key_here
   ```
   If you use the India region console, confirm the matching base URL in that region's docs and update `YOUCAM_BASE_URL`.
7. Never commit `.env.local`. Commit `.env.example` with placeholder values.

## Budget planning (1,000 units)
HD skin analysis cost per successful task (v2.0/v2.1 pricing):
| HD concerns in one request | Units |
|---|---|
| 1–4 | 12 |
| 5–8 | 16 |
| 9–12 | 20 |
| 13–16 | 22 |

SD is cheaper (9 / 12 / 14 / 16). Failed tasks cost nothing.

**Recommendation:** request the 8 concerns SplitSide actually splits (see `05`) → 16 units per scan → about **60 scans** from 1,000 units. During development, use recorded fixtures instead of live calls. Check balance with `GET /s2s/v1.0/client/credit` and per-feature prices with `GET /s2s/v2.0/credit/feature-cost`.

**Extra units:** share your demo video publicly for the Share & Earn bonus (see hackathon page link).

## If something goes wrong
- No redeem code email → check spam, then contact **contact_event@PerfectCorp.com**.
- `401` → wrong key, wrong region, or missing `Bearer ` prefix.
- `400 InvalidParameters` → usually a misspelled concern or SD/HD mixed; it is **not** an auth problem.
