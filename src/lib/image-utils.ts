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
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (output) => (output ? resolve(output) : reject(new Error("WebP conversion failed"))),
        "image/webp",
        quality
      );
    });

    // Build new filename: replace extension with .webp
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${nameWithoutExt}.webp`, { type: "image/webp" });
  } catch {
    // If conversion fails, return the original
    console.warn("WebP conversion failed, using original file");
    return file;
  }
}
