import { deltaE2000, hexToLab, labToRgb, rgbToHex, undertone, type Undertone } from "./color";

/** Generic foundation shade range (own names, no brands): 8 depths × 3 undertones, defined in CIELAB. */
const DEPTHS = ["Fair", "Light", "Light medium", "Medium", "Tan", "Deep tan", "Deep", "Rich"];
const L_BY_DEPTH = [80, 73, 66, 59, 52, 45, 37, 29];
const AB: Record<Undertone, { a: number; b: number }> = { cool: { a: 12, b: 12 }, neutral: { a: 10, b: 17 }, warm: { a: 9, b: 23 } };

export interface Shade {
  id: string;
  name: string;
  hex: string;
  undertone: Undertone;
}

export const SHADES: Shade[] = DEPTHS.flatMap((depth, i) =>
  (["cool", "neutral", "warm"] as Undertone[]).map((u) => {
    // Deeper shades carry a little more chroma.
    const k = 1 + i * 0.06;
    return {
      id: `${i}-${u}`,
      name: `${depth} ${u}`,
      hex: rgbToHex(labToRgb({ L: L_BY_DEPTH[i], a: AB[u].a * k, b: AB[u].b * k })),
      undertone: u,
    };
  }),
);

/** The three shades closest to the measured skin colour (from YouCam skin tone analysis). */
export function shortlistShades(skinHex: string, n = 3): (Shade & { deltaE: number })[] {
  const skin = hexToLab(skinHex);
  return SHADES.map((s) => ({ ...s, deltaE: Math.round(deltaE2000(skin, hexToLab(s.hex)) * 10) / 10 }))
    .sort((p, q) => p.deltaE - q.deltaE)
    .slice(0, n);
}

export const skinUndertone = (skinHex: string) => undertone(hexToLab(skinHex));
