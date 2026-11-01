<div align="center">

# SplitSide

### Your face is the control group.

**Measure what works. Preview before you buy. Always half-and-half, always honest.**

An at-home split-face skincare trial app, built on the YouCam API.
Skin AI track, [YouCam API Skin AI & eCommerce VTO Hackathon](https://youcam-api-skin-ai-ecommerce.devpost.com/).

![Next.js 16](https://img.shields.io/badge/Next.js-16-1f2b23) ![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-285fa9) ![YouCam APIs: 9](https://img.shields.io/badge/YouCam%20APIs-9-4b674a) ![Tests: 99 passing](https://img.shields.io/badge/tests-99%20passing-356a33) ![Installable PWA](https://img.shields.io/badge/PWA-installable-4b674a) ![License: MIT](https://img.shields.io/badge/license-MIT-66766a)

<img src="docs/gifs/landing.gif" alt="Scrolling the SplitSide landing page: a face in the scanner oval gets its mesh drawn, then splits into a blue treated half and an amber control half" width="280" />

**Demo video:** _link added at submission_ · **Live app:** _link added after deploy_

</div>

---

## The problem

People buy skincare without knowing whether it works. Before-and-after selfies can't tell them: a bad night or a cloudy window changes a skin score more than most products do.

Dermatology solved this long ago with the **split-face trial**, where one side of the face is the control. SplitSide brings that method home:

1. A coin flip picks a cheek. The product goes there only.
2. Every couple of days, one guided selfie. **YouCam AI Skin Analysis** measures both halves of that same photo.
3. Light, sleep, stress and weather hit both sides equally, so they cancel out. What's left is the product.

The answer is **Working, No real difference, or Stop**, delivered before the store's return window closes.

## See it

| Onboarding | A trial, start to verdict | Irritation stop |
|---|---|---|
| ![Welcome flow with intro slides, name and theme choice](docs/gifs/onboarding.gif) | ![Home, dashboard and verdict for a demo trial](docs/gifs/trial.gif) | ![A stop verdict with safety advice](docs/gifs/stop.gif) |

| Money saved | Light and dark themes |
|---|---|
| ![Skin Passport with the money-saved tracker](docs/gifs/passport.gif) | ![Switching between light and dark themes](docs/gifs/theme.gif) |

All recordings use the app's clearly labelled demo data. No real faces.

| Home | Scanner | Verdict | Preview | Assistant | Dark |
|---|---|---|---|---|---|
| ![Home](docs/screenshots/home.png) | ![Scanner](docs/screenshots/scanner.png) | ![Verdict](docs/screenshots/verdict.png) | ![Preview](docs/screenshots/preview.png) | ![Assistant](docs/screenshots/assistant.png) | ![Dark](docs/screenshots/home-dark.png) |

**Try it without a camera:** open the app and tap *Explore a demo trial*.

## Features

### Measure: real trials on your face

- **Guided scanner.** Live MediaPipe face landmarks check centring, head pose, distance, and eyes and mouth, against a ghost outline of your first scan. Auto-captures after 0.6 s of passing every check.
- **Light Balance Gate.** Compares median brightness of the two cheeks before upload and blocks side light, darkness, glare and blur.
- **Voice guidance.** Optional spoken prompts during capture, for accessibility.
- **Split engine.** Fits the facial midline and builds two mirror-image cheek areas of equal size, with a buffer band for product spreading. Then measures how much of each area every YouCam concern mask covers.
- **Statistics, not vibes.** Three baseline scans give your personal noise range. A difference-in-differences verdict adds confidence, early stopping, and a 7-day extension if the return window allows.
- **Irritation sentinel.** Redness or breakouts rising on the treated side only, or reported burning or stinging, trigger an immediate Stop with safety advice. The threshold is lower for Fitzpatrick IV–VI with strong actives.
- **Measured skin type.** YouCam reads your Fitzpatrick type from a photo. You can always change it.
- **Head-to-head.** Budget dupe on one cheek, premium original on the other.
- **Makeup wear test.** "Does this foundation break me out?" Seven days on one half, against the bare half.
- **SplitHair (beta).** An anti-frizz product on one side of your parting, rated per side. Confidence stays low by design: frizz has only 4 levels.
- **Context that cancels out.** Log sleep, stress and your cycle, and optionally pull humidity and air quality. A chart shows these moving your whole-face score while the treated-vs-control line ignores them.

### Preview: before you buy

Half simulated product, half the real you, in one photo. Always labelled *Preview: simulated*, never counted as a measurement.

- **Foundation shade swatch.** Your skin tone, measured by YouCam, shortlists 3 of 24 generic shades. Then see one shade next to bare skin, or two side by side. A seam score (CIEDE2000) says "Blends well", "Slightly light" or "Too dark", so you buy one shade instead of two.
- **Half-head hair colour.** A new colour on one side of your head, with suggestions that explain why they suit your undertone.
- **Gold or silver?** One metal on each ear in the same photo.
- **Claim Check.** The box's promise simulated on your own baseline photo, next to what your scans measured.

### Decide: what to do next

- **Keep or return.** A return countdown, and a ready-to-send return request with your trial evidence.
- **Money saved.** Refunds plus the premium products you didn't need, using the prices you typed.
- **Skin Passport.** Ingredient patterns across your trials, and a pre-purchase check on any ingredient list.
- **Trial assistant.** An LLM agent with tools over your numbers. It explains the verdict, drafts messages, and replies in your language. It never sees photos and can't invent or override a measurement.
- **Barcode fill.** Scan a product to fill in its name and ingredients.
- **Dermatologist report.** A one-page printable summary of the trial.
- **Calendar export.** Every scan day, as one calendar file.
- **Privacy-safe sharing.** A result card and a 7-second reel from real photos, with eyes always pixelated and your room blurred on a copy.
- **Evidence board.** How pooled anonymous results would look per product and skin type. It shows example data, clearly labelled, today.

### Feel: a finished product

- Sage design system with **light and dark themes**, applied before first paint so there's no flash
- **GSAP motion**: a scrubbed scroll story on the landing page, verdict reveals, coin flip, page entrances. All of it respects reduced-motion settings, and it stays off the live scanner so face tracking keeps its frame budget
- **Installable PWA** with an offline shell
- **No accounts.** Everything lives on your phone. That's deliberate: nothing to sign in to, no profile to hand over

## APIs and integrations

### YouCam (9 APIs)

Every API has a real recorded response in [`tests/fixtures/youcam/`](tests/fixtures/youcam), checked by tests. The one exception is frizz, where only an error response is recorded so far (see [Known limits](#known-limits)).

| API | Endpoint (`/s2s/v2.0/task/…`) | Why SplitSide uses it |
|---|---|---|
| **AI Skin Analysis (HD)** | `skin-analysis` | The measuring instrument. One mask per concern, split at the midline, rather than only reading whole-face scores |
| **AI Skin Simulation** | `skin-simulation` | Claim Check |
| **Makeup VTO** | `makeup-vto` | Half-face foundation swatch |
| **Hair Color VTO** | `hair-color` | Half-head colour preview |
| **Earrings VTO** | `2d-vto/earring` | Gold on one ear, silver on the other |
| **Skin Tone Analysis** | `skin-tone-analysis` | Shade and hair-colour shortlists, undertone |
| **Fitzpatrick Skin Type** | `fitzpatrick-scale-analyzer` | Tunes the irritation threshold |
| **Hair Frizziness Detection** | `hair-frizziness-detection` | SplitHair (beta) |
| **Photo Background Blur** | `bg-blur` | Share card, on a copy only |

The file upload (`POST /s2s/v2.0/file` plus presigned PUT) and credit endpoints support all of these.

**Deliberately not used on analysis photos:** lighting, colour correction, enhancement, face reshape or any beauty filter. Those would fake the measurement. Aging simulation and face swap are excluded too.

A finding worth sharing: **HD masks are display overlays, not plain alpha maps.** Undetected pixels are a grey `#3D3D3D` dimming layer, and detections are coloured with alpha on a per-concern scale. See [`lib/split/burden.ts`](lib/split/burden.ts) and [`docs/05-youcam-api-reference.md`](docs/05-youcam-api-reference.md).

### Third-party

| Service | Used for | Key needed |
|---|---|---|
| [Groq](https://groq.com) | Trial assistant (OpenAI-compatible tool calling) | Yes, optional: without it, answers come from the deterministic engine |
| [Open Beauty Facts](https://world.openbeautyfacts.org) | Barcode to product name and ingredients | No |
| [Open-Meteo](https://open-meteo.com) | Humidity, UV and air quality per scan, opt-in, location rounded to about 10 km | No |
| [MediaPipe](https://ai.google.dev/edge/mediapipe) | Face landmarks in the browser, self-hosted | No |

## Architecture

```mermaid
flowchart LR
  subgraph Phone["Phone (PWA): photos and results stay here"]
    CAM[Camera + MediaPipe] --> GATE[Pose gate + Light Balance Gate]
    GATE --> JPG[Un-enhanced HD frame]
    MASKS[Concern masks] --> SPLIT[Split engine]
    SPLIT --> STATS[Verdict engine + sentinel]
    STATS --> IDB[(IndexedDB)]
    STATS --> UI[Screens]
    STATS --> SUM[Derived numbers only]
    PREV[Preview photo] --> COMP[Midline composite + seam score]
  end
  subgraph Server["Next.js route handlers: hold the keys, store nothing"]
    SCAN["/api/scan"]
    TASK["/api/preview, /api/profile, /api/earrings, /api/hair"]
    AGENT["/api/agent"]
    PROD["/api/product"]
  end
  JPG --> SCAN --> YC[(YouCam API)]
  YC --> SCAN --> MASKS
  PREV --> TASK --> YC
  TASK --> COMP
  SUM --> AGENT --> LLM[(Groq)]
  UI --> PROD --> OBF[(Open Beauty Facts)]
```

### The maths in one paragraph

For each concern, burden is the strength-weighted share of a cheek area that the mask covers. The asymmetry index is `A = ln((burden_treated + ε) / (burden_control + ε))`. Three baseline scans give `A0` and `sd` (floored at 0.05), so the smallest detectable change is `SDC = 1.96·√2·sd`. After baseline, `Δ = A − A0`. **Working** means the mean of the last two Δ is ≤ −SDC with both ≤ −0.75·SDC. **Worse** is the mirror case. **No difference** applies at the planned end with |mean Δ| < SDC. **Stop** applies whenever the sentinel fires. Full details are in [`docs/07-algorithms.md`](docs/07-algorithms.md).

### Project layout

```
app/                 screens + route handlers
components/          SplitPreview, ScannerFrame, charts, CheckIn, motion, landing/…
lib/split/           midline fit, face-frame ROIs, mask decoding and burden
lib/capture/         pose gate, Light Balance Gate, MediaPipe, voice guidance
lib/stats/           asymmetry, baseline/SDC, verdict, sentinel
lib/preview/         CIELAB + CIEDE2000, split composite, seam score, shade and hair shortlists
lib/trial/           planning, explanations, orchestrator, money saved
lib/agent/           system prompt, tools, tool loop, safety guard, drafts
lib/hair/            SplitHair model and ordinal verdict
lib/integrations/    Open Beauty Facts, Open-Meteo
lib/youcam/          client, generic task layer, schemas, parser, errors
tests/               unit tests + recorded fixtures
docs/                product spec, algorithms, API reference, plan
```

## Setup

Requires Node 22+.

```bash
git clone https://github.com/LSUDOKO/SplitProof.git
cd SplitProof
npm install --legacy-peer-deps
cp .env.example .env         # then fill in the keys
npm run dev                  # http://localhost:3000
```

| Variable | Required | Purpose |
|---|---|---|
| `YOUCAM_API_KEY` | For real scans and previews | YouCam console → API Keys. Server only |
| `YOUCAM_BASE_URL` | No | Defaults to `https://yce-api-01.makeupar.com` |
| `GROQ_API_KEY` | No | Trial assistant; falls back to engine text without it |
| `GROQ_MODEL` | No | Defaults to `openai/gpt-oss-120b` |

The demo works with no keys. The camera needs HTTPS on phones: use a Vercel deployment, or `npx next dev --experimental-https` on your LAN.

```bash
npm test                     # unit tests: no network, no units spent
npm run lint
npm run build
node scripts/record-gifs.mjs # re-record README GIFs (needs the dev server on :3100)
```

In development, `/dev/youcam` runs one photo through the full pipeline and shows the measured areas.

## Privacy and safety

- Photos go to YouCam only for analysis or a preview you asked for. YouCam deletes results within 24 hours. Everything else stays on the device.
- The assistant receives derived numbers and text, never images.
- API keys live only in server environment variables (verified absent from the built client bundle).
- Location is opt-in, rounded to about 10 km, and never stored.
- SplitSide is a cosmetic decision tool, not a medical device. Every Stop includes the advice to stop the product, rinse, use a plain moisturiser, and see a doctor if it is painful, spreading, blistering or not settling. The assistant's replies are checked in code to always include it.

## Known limits

- **Not yet proven on a real phone.** Camera capture has been exercised on a fake camera feed and one stock portrait, not a real scan session on a phone.
- **Thresholds** are the documented starting values and need calibration with more real scans.
- **SplitHair is beta.** The frizz API returns one level for three views, so SplitHair scores each side from a front view plus that side twice. A successful response hasn't been recorded with real side photos yet.
- **The evidence board** shows example data. Pooling opt-in results needs a server store.
- **Barcode camera scanning** needs the browser's `BarcodeDetector` (Android Chrome). Typing the number works everywhere, and Open Beauty Facts doesn't know every product.
- **Earring images** are one museum hoop in two colours, not a retail catalogue.

## Roadmap

Crossover rounds, blinded A/B kits, a brand portal with Split Kits, pooled evidence, skin-tone equity reports, a store plugin, and a Hindi interface.

## Credits

Hoop photo: The Metropolitan Museum of Art, CC0. Product illustrations are original and unbranded. Skin measurements by YouCam AI (Perfect Corp).

## License

[MIT](LICENSE)
