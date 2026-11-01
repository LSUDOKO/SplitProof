# 05 — YouCam API Reference (for SplitSide)

Source of truth: https://docs.perfectcorp.com/reference/ai_skin_analysis (fetched 1 Nov 2026). If anything here disagrees with the live docs, the live docs win — update this file.

## Basics
- **Base URL:** `https://yce-api-01.makeupar.com` (check the India-region docs if you registered there)
- **Auth:** `Authorization: Bearer <YOUCAM_API_KEY>` on every request
- **Style:** REST + JSON; AI tasks are **asynchronous**
- **Retention:** processed results are kept **24 hours** after completion — download and persist what you need
- **Billing:** units are consumed **only when a task succeeds**; failed tasks are free; running tasks consume nothing

---

## AI Skin Analysis — full flow

### Step 1 — Resize on the client
- HD: short side **≥ 1080 px**, long side ≤ 2560 px (larger is auto-resized by the server — resize yourself so masks stay aligned with your landmark coordinates)
- SD: short side ≥ 480 px
- Formats: jpg / jpeg / png, **< 10 MB**. Portrait orientation recommended.

### Step 2 — Register the file
```http
POST /s2s/v2.0/file
Authorization: Bearer <key>
Content-Type: application/json

{
  "files": [
    { "content_type": "image/jpeg", "file_name": "scan_2026-11-01.jpg", "file_size": 547541 }
  ]
}
```
Response:
```json
{
  "status": 200,
  "data": {
    "files": [{
      "content_type": "image/jpeg",
      "file_name": "scan_2026-11-01.jpg",
      "file_id": "SaGaqpDg...",
      "requests": [{
        "method": "PUT",
        "url": "https://yce-us.s3-accelerate.amazonaws.com/...signature...",
        "headers": { "Content-Length": "547541", "Content-Type": "image/jpeg" }
      }]
    }]
  }
}
```
> Calling the File API does **not** upload the file. You must PUT the bytes to `requests[0].url`. Skipping this causes 500 `unknown_internal_error` or 404 later.

(Some integrations use `POST /s2s/v2.0/file/skin-analysis` for registration — the round-one winner Aloud did. Prefer the documented `POST /s2s/v2.0/file`; if it fails, try the feature-specific path.)

### Step 3 — Upload bytes
```http
PUT <requests[0].url>
Content-Type: image/jpeg
Content-Length: 547541

<binary>
```
Use exactly the headers returned. Do this from the **server** (Route Handler) so the key-bearing flow stays server-side; the PUT itself needs no key.

### Step 4 — Create the task
```http
POST /s2s/v2.0/task/skin-analysis
Authorization: Bearer <key>
Content-Type: application/json

{
  "src_file_id": "SaGaqpDg...",
  "dst_actions": ["hd_redness","hd_acne","hd_oiliness","hd_age_spot","hd_texture","hd_pore","hd_radiance","hd_moisture"],
  "miniserver_args": { "enable_mask_overlay": false },
  "format": "json"
}
```
- Alternative to `src_file_id`: `"src_file_url": "<publicly accessible image URL>"` (not recommended for private selfies).
- `format`: `"json"` returns results with `mask_urls`; `"zip"` returns a ZIP with `skinanalysisResult/score_info.json` + mask PNGs. **SplitSide uses `json`** and downloads each mask URL.
- `enable_mask_overlay: false` (default) = **one mask per concern** (required for the split engine). `true` = a single blended image (only for display).
- Other HD pore display args exist: `enable_dark_background_hd_pore`, `color_dark_background_hd_pore` (e.g. `"3D3D3D"`), `opacity_dark_background_hd_pore` (e.g. `0.4`). Leave off for measurement.
- A v2.1 endpoint also exists: `POST /s2s/v2.1/task/skin-analysis` and `GET /s2s/v2.1/task/skin-analysis/{task_id}` (docs mention webhook-based completion). v2.0 is fine for SplitSide; switch only if v2.0 is deprecated.

Response:
```json
{ "status": 200, "data": { "task_id": "SaGaqpDg..._GPi6NqQ3dhlmN-6ntFwhzT" } }
```

### Step 5 — Poll
```http
GET /s2s/v2.0/task/skin-analysis/{task_id}
Authorization: Bearer <key>
```
`data.task_status`: `running` → `success` | `error`. Poll every 1.5–2 s with a 90 s timeout and exponential backoff on network errors. Execution time is not guaranteed.

Success response (json format):
```json
{
  "status": 200,
  "data": {
    "results": {
      "output": [
        { "type": "texture", "ui_score": 68, "raw_score": 57.33, "mask_urls": ["https://.../texture_output.jpg"] },
        { "type": "pore",    "ui_score": 92, "raw_score": 95.34, "mask_urls": ["https://.../pore_output.jpg"] }
      ]
    },
    "task_status": "success"
  }
}
```
The exact shape of HD region sub-scores in json format (e.g. pore forehead/nose/cheek) may differ from the ZIP `score_info.json` shown below. **Validate with Zod, log the first real response, save it as a fixture, and adapt the parser to it.**

### score_info.json shape (ZIP format, HD) — for reference
```json
{
  "hd_redness":   { "raw_score": 72.01, "ui_score": 77, "output_mask_name": "hd_redness_output.png" },
  "hd_oiliness":  { "raw_score": 60.74, "ui_score": 72, "output_mask_name": "hd_oiliness_output.png" },
  "hd_texture":   { "whole": { "raw_score": 66.39, "ui_score": 75, "output_mask_name": "hd_texture_output.png" } },
  "hd_acne":      { "whole": { "raw_score": 59.93, "ui_score": 76, "output_mask_name": "hd_acne_output.png" } },
  "hd_pore": {
    "forehead": { "raw_score": 79.60, "ui_score": 80, "output_mask_name": "hd_pore_output_forehead.png" },
    "nose":     { "raw_score": 29.14, "ui_score": 58, "output_mask_name": "hd_pore_output_nose.png" },
    "cheek":    { "raw_score": 44.11, "ui_score": 65, "output_mask_name": "hd_pore_output_cheek.png" },
    "whole":    { "raw_score": 49.24, "ui_score": 67, "output_mask_name": "hd_pore_output_all.png" }
  },
  "hd_wrinkle": { "forehead": {}, "glabellar": {}, "crowfeet": {}, "periocular": {}, "nasolabial": {}, "marionette": {}, "whole": {} },
  "all": { "score": 75.76 },
  "skin_age": 37
}
```
- `raw_score`: float 1–100. **Higher = healthier-looking skin.** Store this for comparisons.
- `ui_score`: integer 1–100, deliberately adjusted upward for user motivation. **Display only; never compute deltas from it.**
- Masks: PNG/JPG whose **alpha values** mark detected areas; blend onto the original image.

---

## Verified real response (recorded 1 Nov 2026 → `tests/fixtures/youcam/cheeks-hd/`)
- `POST /s2s/v2.0/file` works for registration (no feature-specific path needed). Bearer `YOUCAM_API_KEY` alone is enough; the console's secret key is not used.
- Task finished in ~4 s. `data.results.output[]` items:
  - one item per concern with `type: "hd_*"`, `raw_score`, `ui_score`, `mask_urls: [one URL]`;
  - region sub-scores are **separate items** with the same `type` plus `region` (`hd_pore`: forehead / nose / cheek / whole; `hd_acne`, `hd_texture`: whole);
  - meta items: `{type:"all", score}`, `{type:"skin_age", score}`, `{type:"resize_image", mask_urls:[jpg]}`.
- Mask URLs live under `/ttl30/` and are served as `binary/octet-stream`; download immediately.
- **Masks are display overlays, not plain alpha maps.** PNG RGBA at the uploaded size (1080×1440). Undetected pixels are a dimming grey `#3D3D3D` at a fixed alpha (0x33/0x5C/0x66) or fully transparent (moisture, radiance). Detected pixels are coloured, with alpha encoding strength on a per-concern scale (pores ≈ 3/255, redness 11–24/255, acne spots opaque). SplitSide therefore treats "coloured, non-grey, non-transparent" as detected and normalises alpha by the mask's 99th-percentile detected alpha (`lib/split/burden.ts`).

## AI Skin Simulation (verified 1 Nov 2026 → `tests/fixtures/youcam/simulation/`)
- `POST /s2s/v2.0/task/skin-simulation` with `src_file_id` (or `src_file_url`) and one or more intensities 0–1: `wrinkle, radiance, oiliness, acne, eye_bags, dark_circle, spots, pores, texture, redness` (at least one > 0).
- Poll `GET /s2s/v2.0/task/skin-simulation/{task_id}`; success returns `data.results.url` (one PNG, under `/ttl30/`).
- Image spec: short side ≥ 480, long side ≤ 2560, < 10 MB. Units: 1–4 concerns = 4, 5–10 = 6.
- SplitSide use: Claim Check only, labelled "Simulation"; never on the measurement path.

## Concern names

### HD (SplitSide uses HD only)
| Concern | Sub-scores | Split-face use |
|---|---|---|
| `hd_redness` | — | ✅ core + irritation sentinel |
| `hd_acne` | whole | ✅ core + sentinel |
| `hd_oiliness` | — | ✅ |
| `hd_age_spot` | — | ✅ (long trials) |
| `hd_texture` | whole | ✅ |
| `hd_pore` | forehead, nose, cheek, whole | ✅ use cheek mask |
| `hd_radiance` | — | ✅ (verify mask is spatial) |
| `hd_moisture` | — | ✅ (verify mask is spatial) |
| `hd_dark_circle` | — | under-eye trials |
| `hd_eye_bag` | — | under-eye trials |
| `hd_tear_trough` | — | under-eye trials |
| `hd_wrinkle` | forehead, glabellar, crowfeet, periocular, nasolabial, marionette, whole | crowfeet/periocular for eye trials |
| `hd_firmness` | — | low value for split |
| `hd_droopy_upper_eyelid`, `hd_droopy_lower_eyelid` | — | not used |
| `hd_skin_type` | whole, t_zone, u_zone | onboarding context (Normal/Oily/Dry/Combination/± Redness) |

**Default cheek trial request (8 concerns → 16 units):** `hd_redness, hd_acne, hd_oiliness, hd_age_spot, hd_texture, hd_pore, hd_radiance, hd_moisture`
**Under-eye trial request (5 concerns → 16 units):** `hd_dark_circle, hd_eye_bag, hd_tear_trough, hd_wrinkle, hd_redness`
**Onboarding scan (adds context):** cheek set + `hd_skin_type` (9 concerns → 20 units)

> Verify on real output that each mask has meaningful spatial variation. If a concern's mask is near-uniform (possible for radiance/moisture), mark it `splittable: false` in config and show only its whole-face score.

### SD (not used; listed so you never mix them)
`wrinkle, droopy_upper_eyelid, droopy_lower_eyelid, firmness, acne, moisture, eye_bag, dark_circle_v2, age_spot, radiance, redness, oiliness, pore, texture, tear_trough, skin_type`

## Errors
| Code / message | Meaning | SplitSide message |
|---|---|---|
| `error_below_min_image_size` | resolution too small | "Your camera image is too small. Move closer or use the back camera." |
| `error_exceed_max_image_size` | too large | (shouldn't happen — we resize) |
| `error_src_face_too_small` | face < 60% of image width | "Move closer so your face fills the outline." |
| `error_src_face_out_of_bound` | face out of frame | "Centre your face inside the outline." |
| `error_lighting_dark` | too dark | "Too dark. Face a window or turn on a light in front of you." |
| 400 `InvalidParameters` "cannot mix HD and SD dst_actions" | mixed tiers | developer bug |
| 400 `InvalidParameters` "Not available dst_action X" | misspelled concern | developer bug |
| 401 `InvalidAccessToken` / `InvalidApiKey` | bad key / region | check env |
| 404 / 500 `unknown_internal_error` after task create | file never PUT to presigned URL | fix upload |

## Unit costs (Skin Analysis v2.0/v2.1)
| Concerns | SD | HD |
|---|---|---|
| 1–4 | 9 | 12 |
| 5–8 | 12 | 16 |
| 9–12 | 14 | 20 |
| 13–16 | 16 | 22 |

- Balance: `GET /s2s/v1.0/client/credit`
- Feature prices: `GET /s2s/v2.0/credit/feature-cost` (paginated, `page_size` ≤ 20)

## Photo requirements (pass to capture UI)
Face width 60–80% of image width; front-facing, neutral, relaxed, mouth closed, eyes open; even bright lighting without blown highlights; no motion blur or occlusions; forehead visible (hair back); glasses off recommended; makeup removed.

---

## Other YouCam APIs SplitSide uses (P1)
Exact REST paths: look up each feature at https://docs.perfectcorp.com (same pattern: file → task → poll). MCP tool names below come from the official MCP docs.

| MCP tool | SplitSide use | Rule |
|---|---|---|
| `AI_Skin_simulation` | **Claim Check**: visualise the claimed improvement for up to 10 concerns | Label "Simulation — not a prediction" |
| `AI_Fitzpatrick_Skin_Type_Analysis` | Phototype I–VI → irritation threshold tuning | Onboarding only |
| `AI_Facial_Color_Tones_Analyzer` | Skin tone context; shade matching for F4 | — |
| `AI_Face_Attributes_and_Ratio_Analyzer` | Optional server-side face landmarks/midline cross-check | MediaPipe is primary |
| `AI_Makeup_Virtual_Try_On` | Half-Face Shade Swatch (P1), complete-the-routine | Never on analysis photos |
| `AI_Hair_Color_Virtual_Try_On` | Half-Head Hair Colour Preview (P1) | Preview only |
| `AI_Photo_Background_Blur` / `AI_Photo_Background_Removal` | Privacy-safe share card (P1) | Share copy only |
| `AI_Earrings_Virtual_Try_On` | Gold-vs-silver per ear (P2) | Preview only |
| `AI_Clothes_Virtual_Try_On` | Shade-to-outfit full look (P2) | Preview only |
| `AI_Hair_Frizziness_Detection` | SplitHair trial (P2) — front/left/right views | Verify per-view output |
| `AI_Hair_Type_Detection`, `AI_Hair_Density_Detection` | Hair profile context; long growth trials | Density is only 4 levels |
| `AI_Video_Enhancer` | Trial Story Reel polish (P2) | Never generate faces |
| `Get_Feature_Cost` | Units panel | — |

**Never on analysis photos:** `AI_Photo_Lighting`, `AI_Color_Correction`, `AI_Photo_Enhance`, `AI_Face_Lift`, `AI_Face_Reshape`, any beauty filter.

## MCP servers (useful while developing with Claude Code)
```json
{
  "mcpServers": {
    "youcam-beauty": {
      "url": "https://mcp-api-01.makeupar.com/mcp/beauty",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```
Also: `/mcp/fashion`, `/mcp/creators`. Use MCP to explore real response shapes during development; the shipped app calls REST directly from Route Handlers.

## Common mistakes (from Perfect Corp's own guide)
1. Treating the call as synchronous → UI hangs. Always poll.
2. Mixing SD and HD → 400 that looks like auth.
3. Storing only `ui_score` → noisy, non-comparable history.
4. Inverting score direction → congratulating a "high wrinkle score". Higher is healthier.
5. Flattening nested concerns → losing region sub-scores.
6. Generic error handling → users retake bad photos forever.
7. Storing result URLs instead of data → history is empty after 24 h.
