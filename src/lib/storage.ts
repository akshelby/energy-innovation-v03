import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://xemoqcukwjcmnzqcdrey.supabase.co";

// Cached setting – fetched once from site_content
let _imageOptimizationEnabled: boolean | null = null;

export async function loadImageOptimizationSetting(): Promise<boolean> {
  if (_imageOptimizationEnabled !== null) return _imageOptimizationEnabled;
  try {
    const { data } = await supabase
      .from("site_content")
      .select("value_en")
      .eq("content_key", "settings.image_optimization")
      .maybeSingle();
    _imageOptimizationEnabled = data?.value_en === "true";
  } catch {
    _imageOptimizationEnabled = false;
  }
  return _imageOptimizationEnabled;
}

export function isImageOptimizationEnabled(): boolean {
  return _imageOptimizationEnabled === true;
}

export function getStorageUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Returns a resized image URL using Supabase Storage render/image transform.
 * Works on any public storage URL from this project.
 * Falls back to the original URL if the src doesn't match the expected pattern.
 */
export function getResizedUrl(
  src: string,
  width: number,
  quality = 75
): string {
  if (!src || !src.includes("/storage/v1/object/public/")) return src;
  const transformed = src.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );
  const sep = transformed.includes("?") ? "&" : "?";
  return `${transformed}${sep}width=${width}&quality=${quality}`;
}

/**
 * Returns an optimized image URL when the pro feature is enabled,
 * otherwise returns the direct storage URL.
 */
export function getOptimizedImageUrl(
  src: string,
  opts: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!_imageOptimizationEnabled) return src;
  // Use Supabase render/image transform API
  const params = new URLSearchParams();
  if (opts.width) params.set("width", String(opts.width));
  if (opts.height) params.set("height", String(opts.height));
  params.set("quality", String(opts.quality || 80));
  // Convert /storage/v1/object/public/ to /storage/v1/render/image/public/
  const optimizedSrc = src.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );
  return `${optimizedSrc}?${params.toString()}`;
}

// Image keys used across the site
export const IMAGE_KEYS = {
  heroes: ["hero-1.jpg", "hero-2.jpg", "hero-3.jpg", "hero-4.jpg", "hero-5.jpg"],
  products: [
    { key: "product-fire", file: "product-fire.jpg" },
    { key: "product-roller", file: "product-roller.jpg" },
    { key: "product-oil", file: "product-oil.jpg" },
    { key: "product-hvac", file: "product-hvac.jpg" },
    { key: "product-loading", file: "product-loading.jpg" },
    { key: "product-louvers", file: "product-louvers.jpg" },
  ],
} as const;

export function getHeroImageUrl(index: number): string {
  return getStorageUrl("images", `hero/hero-${index + 1}.jpg`);
}

export function getProductImageUrl(key: string): string {
  return getStorageUrl("images", `products/${key}.jpg`);
}
