/**
 * Convert an image File to WebP format using the browser Canvas API.
 * Returns a new File with .webp extension and reduced size.
 * Falls back to the original file if conversion fails (e.g. unsupported format).
 */
export async function convertToWebP(
  file: File,
  quality = 0.82
): Promise<File> {
  // Skip if already WebP or not an image
  if (file.type === "image/webp" || !file.type.startsWith("image/")) {
    return file;
  }

  // Skip SVGs — they're already optimized vectors
  if (file.type === "image/svg+xml") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/webp", quality });
    bitmap.close();

    // Build new filename: replace extension with .webp
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${nameWithoutExt}.webp`, { type: "image/webp" });
  } catch {
    // If conversion fails, return the original
    console.warn("WebP conversion failed, using original file");
    return file;
  }
}
