const SUPABASE_URL = "https://xemoqcukwjcmnzqcdrey.supabase.co";

export function getStorageUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Returns a Supabase image-transform URL that serves resized WebP on the fly.
 * Falls back to the raw public URL for non-Supabase origins.
 */
export function getOptimizedImageUrl(
  src: string,
  opts: { width?: number; height?: number; quality?: number } = {}
): string {
  // Only transform URLs from our own Supabase storage
  if (!src.includes(SUPABASE_URL)) return src;

  const { width, height, quality = 75 } = opts;
  // Swap /object/public/ → /render/image/public/ for the transform API
  let url = src.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");

  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  params.set("quality", String(quality));
  params.set("format", "webp");

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${params.toString()}`;
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
