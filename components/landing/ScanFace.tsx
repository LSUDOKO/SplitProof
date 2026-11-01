import { useId } from "react";
import { Tag } from "./kit";

const stadium = (i: number) => {
  const r = 200 - i;
  return `M200 ${i}A${r} ${r} 0 0 1 ${400 - i} 200V348A${r} ${r} 0 0 1 ${i} 348V200A${r} ${r} 0 0 1 200 ${i}Z`;
};

/** The scanner shape, in a 400 x 548 box: a filled capsule inside a ring of fine ticks. */
export const CAPSULE = stadium(18);
export const TICKS = stadium(9);
export const TICK_DASH = "1.5 4.5";

export const BOX = "0 0 400 548";
export const MIRROR = "matrix(-1 0 0 1 400 0)";
const LAYER = "absolute inset-0 h-full w-full";

export const FACE =
  "M97 238C98 202 112 170 140 151C160 138 184 135 197 128L200 124L203 128C216 135 240 138 260 151C288 170 302 202 303 238L300 256C298 286 292 318 278 346C266 372 248 404 228 420C218 428 208 431 200 431C192 431 182 428 172 420C152 404 134 372 122 346C108 318 102 286 100 256Z";
export const NECK = "M154 396C156 432 154 452 130 470C102 490 60 500 20 512V548H380V512C340 500 298 490 270 470C246 452 244 432 246 396C232 416 216 431 200 431C184 431 168 416 154 396Z";
export const EAR = "M100 246C91 234 82 242 84 262C86 284 93 304 106 308C103 290 101 268 100 246Z";
const HAIR =
  "M200 72C134 72 90 118 90 196C90 212 93 226 97 238C98 202 112 170 140 151C160 138 184 135 197 128L200 124L203 128C216 135 240 138 260 151C288 170 302 202 303 238C307 226 310 212 310 196C310 118 266 72 200 72Z";

// Line art, left half only where noted: the right half mirrors it.
const WIRE_LONG = [0.34, 0.66, 0.92].map((f) => `M200 124C${200 - f * 128} 160 ${200 - f * 118} 350 200 431`);
const WIRE_LAT = [[170, 110], [206, 100], [244, 100], [280, 102], [318, 108], [356, 128], [392, 158]].map(([y, x]) => `M${x} ${y}Q200 ${y + 22} ${400 - x} ${y}`);
const OUTLINE = ["M200 431C192 431 182 428 172 420C152 404 134 372 122 346C108 318 102 286 100 256L97 238", "M97 238C98 202 112 170 140 151C160 138 184 135 197 128L200 124"];
export const FEATURES = [
  "M124 231C138 217 160 214 181 223", // brow
  "M128 251L133 255C145 265 165 265 177 254", // closed lid
  "M168 376C178 370 186 365 193 366C197 367 199 369 200 370", // upper lip
  "M168 376C180 381 190 382 200 381", // parting
  "M168 376C176 389 188 395 200 395", // lower lip
];
export const NOSE_SIDE = "M182 330C175 336 177 346 188 344";
export const NOSE_TIP = "M188 344C193 349 207 349 212 344";
const CHEEK = [
  "M112 288C130 278 158 280 182 296",
  "M114 308C132 300 156 303 175 317",
  "M120 328C136 322 154 325 167 337",
  "M130 348C142 343 150 346 157 354",
  "M128 281C122 302 125 330 138 353",
  "M146 280C141 302 142 328 149 349",
  "M164 284C159 304 158 326 159 351",
  "M180 295C175 309 170 322 166 338",
];
const ARCS = ["M126 188C152 160 248 160 274 188", "M140 198C162 178 238 178 260 198", "M168 410C182 420 218 420 232 410"];
const NODES = [[200, 172], [146, 316], [254, 316], [200, 412]];

const Shade = ({ cx, cy, rx, ry, dark, opacity, blur }: { cx: number; cy: number; rx: number; ry: number; dark?: boolean; opacity: number; blur: string }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={dark ? "var(--color-forest-deep)" : "white"} fillOpacity={opacity} filter={blur} />
);

const Lines = ({ d, kind }: { d: string[]; kind: string }) => (
  <>
    {d.map((p) => (
      <path key={p} d={p} data-draw={kind} pathLength={1} />
    ))}
  </>
);

const Both = ({ d, kind }: { d: string[]; kind: string }) => (
  <>
    <Lines d={d} kind={kind} />
    <g transform={MIRROR}>
      <Lines d={d} kind={kind} />
    </g>
  </>
);

/**
 * A drawn face in the scanner oval (never a real person), finished state in the markup so it reads
 * with no animation at all. Motion lives in the parent, which finds the parts through data attributes.
 * Layers are separate SVGs so scrubbing the lines never re-rasterises the blurred shading underneath.
 */
export function ScanFace({ className = "" }: { className?: string }) {
  const id = useId();
  const ref = (name: string) => `${id}-${name}`;
  const url = (name: string) => `url(#${ref(name)})`;
  return (
    <div className={`relative aspect-[400/548] ${className}`} role="img" aria-label="A drawn face in an oval scanner, split by a dashed line down the middle. The left half is tinted blue and labelled treated, the right half amber and labelled control.">
      <svg viewBox={BOX} className={LAYER} aria-hidden="true">
        <defs>
          <linearGradient id={ref("capsule-fill")} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--color-forest)" />
            <stop offset="1" stopColor="var(--color-forest-deep)" />
          </linearGradient>
          <radialGradient id={ref("skin-fill")} gradientUnits="userSpaceOnUse" cx="200" cy="250" r="200">
            <stop offset="0" stopColor="white" stopOpacity="0.46" />
            <stop offset="0.62" stopColor="white" stopOpacity="0.32" />
            <stop offset="1" stopColor="white" stopOpacity="0.14" />
          </radialGradient>
          <linearGradient id={ref("neck-fill")} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="white" stopOpacity="0.12" />
            <stop offset="0.55" stopColor="white" stopOpacity="0.24" />
            <stop offset="1" stopColor="white" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={ref("hair-fill")} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--color-night)" stopOpacity="0.72" />
            <stop offset="1" stopColor="var(--color-night)" stopOpacity="0.52" />
          </linearGradient>
          <linearGradient id={ref("scan-fill")} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="1" stopColor="white" stopOpacity="0.28" />
          </linearGradient>
          <filter id={ref("blur-s")} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id={ref("blur-m")} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id={ref("blur-l")} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <clipPath id={ref("capsule")}>
            <path d={CAPSULE} />
          </clipPath>
          <clipPath id={ref("face")}>
            <path d={FACE} />
          </clipPath>
          <clipPath id={ref("neck")}>
            <path d={NECK} />
          </clipPath>
          <clipPath id={ref("skin")}>
            <path d={FACE} />
            <path d={NECK} />
            <path d={EAR} />
            <path d={EAR} transform={MIRROR} />
          </clipPath>
          <mask id={ref("ring")} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="548">
            <path data-ring d={TICKS} fill="none" stroke="white" strokeWidth="14" pathLength={1} />
          </mask>
        </defs>
        <path d={TICKS} fill="none" stroke="var(--color-forest)" strokeOpacity="0.4" strokeWidth="7" strokeDasharray={TICK_DASH} />
        <g clipPath={url("capsule")}>
          <rect width="400" height="548" fill={url("capsule-fill")} />
          <path d={HAIR} fill={url("hair-fill")} />
          <path d={NECK} fill={url("neck-fill")} />
          <g clipPath={url("neck")}>
            <path d="M144 390C170 448 230 448 256 390V450C220 486 180 486 144 450Z" fill="var(--color-night)" fillOpacity="0.36" filter={url("blur-m")} />
          </g>
          <path d={EAR} fill="white" fillOpacity="0.26" />
          <path d={EAR} fill="white" fillOpacity="0.26" transform={MIRROR} />
          <path d={FACE} fill={url("skin-fill")} />
          <g clipPath={url("face")}>
            <Shade cx={152} cy={252} rx={36} ry={20} dark opacity={0.34} blur={url("blur-m")} />
            <Shade cx={248} cy={252} rx={36} ry={20} dark opacity={0.34} blur={url("blur-m")} />
            <Shade cx={200} cy={190} rx={62} ry={30} opacity={0.18} blur={url("blur-l")} />
            <Shade cx={140} cy={312} rx={30} ry={24} opacity={0.12} blur={url("blur-m")} />
            <Shade cx={260} cy={312} rx={30} ry={24} opacity={0.12} blur={url("blur-m")} />
            <Shade cx={200} cy={292} rx={8} ry={44} opacity={0.26} blur={url("blur-s")} />
            <Shade cx={181} cy={296} rx={6} ry={36} dark opacity={0.16} blur={url("blur-s")} />
            <Shade cx={219} cy={296} rx={6} ry={36} dark opacity={0.16} blur={url("blur-s")} />
            <Shade cx={200} cy={405} rx={26} ry={5} dark opacity={0.24} blur={url("blur-s")} />
            <path d={FACE} fill="none" stroke="var(--color-forest-deep)" strokeOpacity="0.62" strokeWidth="24" filter={url("blur-m")} />
          </g>
        </g>
      </svg>

      {/* Treated and control tints. The band left untinted down the middle is the midline buffer the split engine ignores. */}
      <svg viewBox={BOX} className={`${LAYER} will-change-transform`} aria-hidden="true">
        <g clipPath={url("capsule")}>
          <g clipPath={url("skin")} className="opacity-60 [[data-theme=dark]_&]:opacity-50">
            <rect data-tint x="18" width="176" height="548" fill="var(--color-treated)" />
            <rect data-tint x="206" width="176" height="548" fill="var(--color-control)" />
          </g>
          <g clipPath={url("face")} opacity="0.24">
            <ellipse data-cheek cx="146" cy="316" rx="48" ry="50" fill="var(--color-treated)" />
            <ellipse data-cheek cx="254" cy="316" rx="48" ry="50" fill="var(--color-control)" />
          </g>
        </g>
      </svg>

      <svg viewBox={BOX} className={`${LAYER} will-change-transform`} aria-hidden="true">
        <g fill="none" stroke="white" strokeLinejoin="round">
          <g clipPath={url("face")} strokeWidth="0.8" strokeOpacity="0.3">
            <Both d={WIRE_LONG} kind="wire" />
            <Lines d={WIRE_LAT} kind="wire" />
          </g>
          <g strokeWidth="1.3" strokeOpacity="0.75">
            <Both d={OUTLINE} kind="outline" />
          </g>
          <g strokeWidth="1.7" strokeOpacity="0.95">
            <Both d={FEATURES} kind="feature" />
          </g>
          <g strokeWidth="1.4" strokeOpacity="0.8">
            <Both d={[NOSE_SIDE]} kind="feature" />
            <Lines d={[NOSE_TIP]} kind="feature" />
          </g>
          <g strokeWidth="1.1" strokeOpacity="0.9">
            <Both d={CHEEK} kind="cheek" />
            <Lines d={ARCS} kind="cheek" />
          </g>
          <path data-midline d="M200 38V510" strokeWidth="1.4" strokeDasharray="5 6" />
        </g>
        {NODES.map(([cx, cy]) => (
          <g key={`${cx}-${cy}`} data-node fill="white">
            <circle cx={cx} cy={cy} r="8" fillOpacity="0.24" />
            <circle cx={cx} cy={cy} r="3.2" />
          </g>
        ))}
        <g clipPath={url("capsule")}>
          <g data-scanline opacity="0">
            <rect x="18" y="-70" width="364" height="70" fill={url("scan-fill")} />
            <rect x="18" y="-1.5" width="364" height="1.5" fill="white" />
          </g>
        </g>
        <path d={TICKS} fill="none" stroke="var(--color-forest)" strokeWidth="7" strokeDasharray={TICK_DASH} mask={url("ring")} />
      </svg>

      <span data-side className="absolute left-[3%] top-[72%]">
        <Tag tone="treated" dot="treated" small>Treated</Tag>
      </span>
      <span data-side className="absolute right-[3%] top-[72%]">
        <Tag tone="control" dot="control" small>Control</Tag>
      </span>
    </div>
  );
}
