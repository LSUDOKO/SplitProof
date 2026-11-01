import { z } from "zod";

/** Open Beauty Facts (open database, no key): barcode → product name + ingredients. */
export const ObfResponse = z.object({
  status: z.number(),
  product: z
    .looseObject({
      product_name: z.string().optional(),
      brands: z.string().optional(),
      ingredients_text: z.string().optional(),
      image_front_small_url: z.string().optional(),
    })
    .optional(),
});

export interface ProductLookup {
  found: boolean;
  name?: string;
  brand?: string;
  ingredients?: string;
  image?: string;
}

export function parseObf(body: unknown): ProductLookup {
  const r = ObfResponse.safeParse(body);
  if (!r.success || r.data.status !== 1 || !r.data.product) return { found: false };
  const p = r.data.product;
  return { found: true, name: p.product_name?.trim() || undefined, brand: p.brands?.split(",")[0]?.trim() || undefined, ingredients: p.ingredients_text?.trim() || undefined, image: p.image_front_small_url };
}

export const isBarcode = (code: string) => /^\d{8,14}$/.test(code);
