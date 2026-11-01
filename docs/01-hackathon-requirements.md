# 01 — Hackathon Requirements

## Event
- **Name:** YouCam API Skin AI & eCommerce VTO Hackathon
- **Host:** Perfect Corp (NYSE: PERF), on Devpost — https://youcam-api-skin-ai-ecommerce.devpost.com/
- **Deadline:** **2 Nov 2026, 10:15 pm IST (GMT+5:30)** — 11:45 am ET. Winners announced on or around 24 Nov 2026.
- **Format:** Online, public. ~1,592 participants registered.
- **Prize pool:** $6,000 cash
  - 1st: $2,500 + feature blog + product/developer marketing meeting
  - 2nd: $1,000 + feature blog + meeting
  - 3rd: $500 + feature blog + meeting
  - Women in Tech Special Award: $1,000
  - Rising Star Award (students only): $1,000
- **Judge listed:** Wendy Yen
- **Eligibility:** above legal age of majority in country of residence; some countries/territories excluded (see official rules).
- **Bonus:** share your project online for bonus API units (500 units per qualifying shared demo video, up to two per participant, per Perfect Corp's press release).

## The brief (what to build)
Integrate **at least one YouCam API** into a **functional web or mobile prototype** that delivers **clear consumer or retail value**. Organisers want:
- Fresh, unexpected solutions to real-world pain points in beauty, fashion or eCommerce — **not surface-level wrappers**.
- An experience **intuitive enough that a first-time user instantly grasps its value**.
- "Real impact beyond a simple API call."
- Optional but encouraged: **scalable products with Agentic AI workflows**.

### Tracks (pick one)
- **Skin AI** — "People don't wonder about their skin in the abstract; they wonder right before a purchase, right after a bad breakout, or right when they're standing in front of a mirror deciding whether a product is working. Build something that meets that moment… help users understand their skin and know exactly what to do next." *(SplitSide sits exactly in the "deciding whether a product is working" moment.)*
- **eCommerce VTO** — bring virtual try-on (beauty + fashion) together into one seamless shopping experience.

**SplitSide's track: Skin AI** (with eCommerce outcomes: keep/return decision, proof-based shopping).

## What to submit
1. **Code repository URL** — must contain all source code, assets and instructions needed to run it. Either **public with a licence** (use MIT) or **private and shared with contact_event@PerfectCorp.com**.
2. **Text description** explaining features, functionality and **clear consumer or retail value**.
3. **Screenshots** of the project.
4. **Demo video, 1–3 minutes** (judges need not watch beyond 3:00):
   - shows the experience **end-to-end**
   - **explains which YouCam API(s) are used**
   - includes footage of the project **running on the device it was built for** (film on a real phone)
   - uploaded and **public on YouTube** (preferred), Vimeo or Youku; link in the submission form
   - **no third-party trademarks, copyrighted music** or other material without permission (use royalty-free/no music; blur store logos; use generic product names or your own products)
5. If you win: take part in an **exit interview** and agree to be included in a **blog article**.

## Judging criteria (design every decision against these)
| Criterion | Judges ask | How SplitSide answers |
|---|---|---|
| **Technological Implementation** | How thoroughly and skillfully is a YouCam API integrated? Clear consumer/retail value? Genuine, working, non-trivial code? | Full upload → task → poll → ZIP/mask pipeline; per-concern mask splitting at the facial midline; difference-in-differences statistics; light gate; agent tool loop; tests with real fixtures. |
| **Design** | A complete, coherent product experience, not just a proof of concept? | Onboarding → trial setup → guided capture → daily check-ins → verdict → return/next trial. PWA, polished UI, clear copy. |
| **Potential Impact** | Credible, specific case for a real problem for a real audience — and does the demo actually address it? | Consumers misjudge their skin and waste money; unsupervised active-ingredient use causes irritant dermatitis (2026 Indian hospital study). Demo shows a live measured left/right difference and an irritation stop. |
| **Quality of Idea** | Creative, non-obvious use of a YouCam API? Genuine understanding of the problem space? | Borrows the split-face clinical trial design; uses masks (not just scores) as a measuring instrument; explains confounders. |

## Round-one context (avoid repeating these)
The first YouCam hackathon (6 Jul–17 Aug 2026) had 1,280 registrants and 238 submissions. Visible winners/entries included **Aloud** (accessible beauty AI for blind shoppers), **ShadeSpan** (garment visibility across skin tones), **CASTING** (catalogue skin-tone coverage), **KeepMe** (trustworthy VTO / drift detection), **ConfidFit** (Shopify try-on), plus trackers like **Skin Journey** and **BaddieGuide** ("is my routine working" over time) and **GlowCycle** (cycle/climate-adaptive guidance). SplitSide differs: it measures **within one photo** (treated vs control side), not before vs after.

Gallery: https://youcam-api.devpost.com/project-gallery
