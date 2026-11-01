/** sRGB ⇄ CIELAB (D65) and CIEDE2000. Pure, used for shade matching and the seam estimate. */
export type Lab = { L: number; a: number; b: number };
export type Rgb = [number, number, number];

const toLin = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const fromLin = (v: number) => Math.round(255 * Math.min(1, Math.max(0, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
const WHITE = [0.95047, 1, 1.08883];
const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (t * 24389) / 27 / 116 + 16 / 116);
const fInv = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : ((116 * t - 16) * 27) / 24389);

export function rgbToLab([r, g, bl]: Rgb): Lab {
  const [R, G, B] = [toLin(r), toLin(g), toLin(bl)];
  const x = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / WHITE[0];
  const y = (0.2126729 * R + 0.7151522 * G + 0.072175 * B) / WHITE[1];
  const z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / WHITE[2];
  return { L: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
}

export function labToRgb({ L, a, b }: Lab): Rgb {
  const fy = (L + 16) / 116;
  const [x, y, z] = [fInv(fy + a / 500) * WHITE[0], fInv(fy) * WHITE[1], fInv(fy - b / 200) * WHITE[2]];
  return [
    fromLin(3.2404542 * x - 1.5371385 * y - 0.4985314 * z),
    fromLin(-0.969266 * x + 1.8760108 * y + 0.041556 * z),
    fromLin(0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
  ];
}

export const hexToRgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
export const rgbToHex = (rgb: Rgb) => `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
export const hexToLab = (hex: string) => rgbToLab(hexToRgb(hex));

/** CIEDE2000 colour difference (Sharma et al. 2005). ~1 = just noticeable, >5 = clearly different. */
export function deltaE2000(p: Lab, q: Lab): number {
  const rad = Math.PI / 180;
  const C1 = Math.hypot(p.a, p.b);
  const C2 = Math.hypot(q.a, q.b);
  const Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1 = (1 + G) * p.a;
  const a2 = (1 + G) * q.a;
  const c1 = Math.hypot(a1, p.b);
  const c2 = Math.hypot(a2, q.b);
  const h = (b: number, a: number) => (b === 0 && a === 0 ? 0 : ((Math.atan2(b, a) / rad) + 360) % 360);
  const h1 = h(p.b, a1);
  const h2 = h(q.b, a2);
  const dL = q.L - p.L;
  const dC = c2 - c1;
  let dh = 0;
  if (c1 * c2 !== 0) dh = Math.abs(h2 - h1) <= 180 ? h2 - h1 : h2 - h1 > 180 ? h2 - h1 - 360 : h2 - h1 + 360;
  const dH = 2 * Math.sqrt(c1 * c2) * Math.sin((dh / 2) * rad);
  const Lm = (p.L + q.L) / 2;
  const cm = (c1 + c2) / 2;
  let hm = h1 + h2;
  if (c1 * c2 !== 0) hm = Math.abs(h1 - h2) <= 180 ? (h1 + h2) / 2 : h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2;
  const T = 1 - 0.17 * Math.cos((hm - 30) * rad) + 0.24 * Math.cos(2 * hm * rad) + 0.32 * Math.cos((3 * hm + 6) * rad) - 0.2 * Math.cos((4 * hm - 63) * rad);
  const SL = 1 + (0.015 * (Lm - 50) ** 2) / Math.sqrt(20 + (Lm - 50) ** 2);
  const SC = 1 + 0.045 * cm;
  const SH = 1 + 0.015 * cm * T;
  const RT = -2 * Math.sqrt(cm ** 7 / (cm ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hm - 275) / 25) ** 2)) * rad);
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}

export type Undertone = "cool" | "neutral" | "warm";

/** Rough undertone from hue angle in the a*b* plane: yellower = warm, pinker = cool. */
export function undertone(lab: Lab): Undertone {
  const hue = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  return hue >= 62 ? "warm" : hue <= 52 ? "cool" : "neutral";
}
