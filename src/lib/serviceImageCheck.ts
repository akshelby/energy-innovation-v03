// Validate that a list of services all have working images.
// Recognizes the "asset:*" scheme used by ServicesSection (bundled images).

const KNOWN_ASSET_KEYS = new Set([
  "asset:drawing",
  "asset:installation",
  "asset:maintenance",
  "asset:consulting",
]);

export interface ServiceImageIssue {
  id: string;
  name: string;
  reason: "missing" | "broken" | "unknown-asset";
}

interface ServiceLike {
  id: string;
  name_en: string;
  image_url: string | null;
}

function probeUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const timer = setTimeout(() => {
      img.onload = img.onerror = null;
      resolve(false);
    }, 6000);
    img.onload = () => { clearTimeout(timer); resolve(true); };
    img.onerror = () => { clearTimeout(timer); resolve(false); };
    img.src = url;
  });
}

export async function checkServiceImages(
  services: ServiceLike[]
): Promise<ServiceImageIssue[]> {
  const checks = services.map(async (s): Promise<ServiceImageIssue | null> => {
    const url = (s.image_url || "").trim();
    const name = s.name_en || "Untitled";
    if (!url) return { id: s.id, name, reason: "missing" };

    if (url.startsWith("asset:")) {
      return KNOWN_ASSET_KEYS.has(url)
        ? null
        : { id: s.id, name, reason: "unknown-asset" };
    }

    const ok = await probeUrl(url);
    return ok ? null : { id: s.id, name, reason: "broken" };
  });

  const results = await Promise.all(checks);
  return results.filter((r): r is ServiceImageIssue => r !== null);
}
