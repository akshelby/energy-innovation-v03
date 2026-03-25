const SUPABASE_URL = "https://xemoqcukwjcmnzqcdrey.supabase.co";

export function getStorageUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Returns an optimized image URL. Currently passes through as-is since
 * Supabase image transforms require a Pro plan. Width/height hints are
 * used only by the calling component for layout (width/height attributes).
 */
export function getOptimizedImageUrl(
  src: string,
  _opts: { width?: number; height?: number; quality?: number } = {}
): string {
  return src;
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
