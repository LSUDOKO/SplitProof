# 08 — Agentic AI Design

The agent is the "trial manager" users talk to. It **explains and acts**, but it **never invents measurements**: all numbers come from the statistics engine (`07`) through tools.

## Two layers
1. **Deterministic orchestrator (client, no LLM):** schedules scans, runs the verdict engine after each scan, fires the sentinel, sets reminders, decides extension/early stop. This guarantees correct behaviour even if the LLM is unavailable.
2. **LLM agent (Claude via `/api/agent`):** turns state into plain-language explanations, answers questions, drafts messages, suggests next trials. It calls tools to read state and to perform user-visible actions (which the user confirms).

## Autonomous decisions (shown in an "Agent activity" feed)
| Trigger | Decision / action |
|---|---|
| Trial created | Randomise side; compute planned days from goal; check it fits before return deadline; schedule scan days (e.g., day 0 ×3, then every 2–3 days, same hour as baseline). |
| Scan completed | Run verdict + sentinel; update chart; post a one-line summary. |
| Sentinel STOP | Push alert; mark trial stopped; prepare return draft; propose barrier-safe next trial. |
| Early working/worse | End trial early; ask user to confirm keep/return. |
| Borderline at end | Extend 7 days if deadline allows; else Low-confidence verdict. |
| Missed scan | Reminder; if > 4 days gap, warn that confidence drops. |
| Deadline in ≤ 3 days and trial unfinished | Warn: decide now with current evidence or accept keeping the product. |

## LLM tools (JSON schemas; implemented in `lib/agent/tools.ts`)
```ts
get_trial_summary()          // product(s), side, zone, goals, days elapsed/planned, deadline, adherence, status
get_measurements(concern?)   // per scan: date, A, Δ, SDC, burdens L/R, whole-face raw score, light imbalance
get_verdict()                // verdict, confidence, effect %, reasons[]
get_context_log()            // sleep/stress/period/AQI per scan date
get_ingredient_profile()     // flagged ingredients + counts
draft_message({ kind: 'return_request' | 'brand_feedback' | 'share_summary', tone?: 'polite' | 'firm' })
   → returns text for the user to copy/send (never sends by itself)
suggest_next_trial({ avoidClasses: IngredientClass[] })
   → returns gentler product *types/ingredient profiles* to look for (no fake brand claims)
schedule_reminder({ dateISO, note })   // creates an in-app reminder / .ics
```
Tools run against the trial summary the client sends with each request (data stays on device; only derived numbers and text go to the server/LLM — **no images**).

## System prompt (`lib/agent/prompt.ts`)
```
You are SplitSide's trial assistant. SplitSide runs at-home split-face skincare trials:
the product goes on one side of the face, the other side is the control, and YouCam AI
Skin Analysis measures both halves in the same photo.

Rules:
- Every number you mention must come from a tool result. Never estimate or invent measurements.
- Explain why split-face matters when relevant: things like light, sleep, stress, weather and
  time of day affect both sides equally, so they cancel out.
- The verdict comes from get_verdict. You may explain it, never override it.
- If verdict is STOP or the user reports burning, stinging, swelling or itching: tell them to
  stop using the product, rinse with water, use a plain moisturiser, and see a doctor if it is
  painful, spreading, blistering or not settling. Do not diagnose.
- Never say "diagnose", "treat", "cure". Say "measured on your photos", "appears".
- Be brief: 2–4 short sentences unless asked for detail. Use the user's language (English or Hindi).
- When the return window matters, mention days left and offer draft_message.
- Ingredient patterns are correlations from a few trials, never proof.
```

## Example exchanges
**User:** "Is the serum working?"
**Agent (after tools):** "Not yet clear. After 6 days, acne-detected area on your treated (left) cheek is about 9% lower than expected, but the noise threshold for your photos is about 13%, so it could be chance. Two more scans (Thu and Sat) should settle it — your return window closes in 11 days."

**User:** "I slept 4 hours, will that ruin the result?"
**Agent:** "No. Your whole-face redness score did rise after that night, but it rose on both cheeks equally, so the treated-minus-control difference stayed flat. That's exactly why we compare sides."

**Sentinel STOP:**
"Please stop using this product. Redness on your treated (right) cheek rose well above your normal range in two scans in a row, while your left cheek didn't change. Rinse with water and use a plain moisturiser; see a doctor if it's painful, spreading or doesn't settle in a few days. You have 9 days left to return it — want me to draft the return request?"

## Return draft template (tool output)
```
Subject: Return request — {product} (order {orderId if provided})

Hello,
I'd like to return {product}, bought on {purchaseDate}. I tested it on one side of my face for
{days} days and it {caused redness on the tested side | showed no measurable difference}
compared with the untreated side. I'm within your {N}-day return window (deadline {date}).
Please let me know how to proceed.
Thank you,
{name}
```

## Claim Check flow (P1)
1. At setup, user picks the product's claim (e.g., "reduces redness", "clears acne", "evens tone").
2. Server calls `AI_Skin_simulation` for the matching concern on the baseline photo → "What the brand's claim would look like on you" (labelled *Simulation*).
3. At verdict, show simulation vs the latest real photo of the treated side + measured effect %. Agent sentence: "The claim imagined about {X}; your treated cheek measured {Y}."

## Failure handling
- LLM unavailable → UI still shows verdict cards from the deterministic engine with template text.
- Tool errors → agent says it couldn't read the data and suggests reopening the trial; never fills gaps.
