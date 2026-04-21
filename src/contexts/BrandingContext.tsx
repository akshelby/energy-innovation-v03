import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrandingContextType {
  logoUrl: string;
  brandName: string;
  logoSize: number;
  ready: boolean;
}

const LOGO_STORAGE_PATH = "branding/logo";
const BRAND_NAME_KEY = "brand.name";
const CACHED_LOGO_URL_KEY = "ei_logo_url";
const CACHED_LOGO_VERSION_KEY = "ei_logo_version";
// Refresh cache-buster at most once per day so the browser can cache the logo
const LOGO_VERSION_TTL_MS = 24 * 60 * 60 * 1000;

function computeLogoUrl(): string {
  try {
    const cachedVersion = localStorage.getItem(CACHED_LOGO_VERSION_KEY);
    const cachedUrl = localStorage.getItem(CACHED_LOGO_URL_KEY);
    if (cachedUrl && cachedVersion && Date.now() - parseInt(cachedVersion) < LOGO_VERSION_TTL_MS) {
      return cachedUrl;
    }
  } catch {}
  const { data } = supabase.storage.from("images").getPublicUrl(LOGO_STORAGE_PATH);
  if (!data?.publicUrl) return "";
  const url = `${data.publicUrl}?v=${Date.now()}`;
  try {
    localStorage.setItem(CACHED_LOGO_URL_KEY, url);
    localStorage.setItem(CACHED_LOGO_VERSION_KEY, String(Date.now()));
  } catch {}
  return url;
}

const INITIAL_LOGO_URL = computeLogoUrl();

const BrandingContext = createContext<BrandingContextType>({
  logoUrl: INITIAL_LOGO_URL,
  brandName: "Energy Innovation",
  logoSize: 56,
  ready: false,
});

const CACHED_LOGO_SIZE_KEY = "ei_logo_size";
const CACHED_BRAND_NAME_KEY = "ei_brand_name";

function getCachedLogoSize(): number {
  try { return parseInt(localStorage.getItem(CACHED_LOGO_SIZE_KEY) || "") || 56; } catch { return 56; }
}
function getCachedBrandName(): string {
  try { return localStorage.getItem(CACHED_BRAND_NAME_KEY) || "Energy Innovation"; } catch { return "Energy Innovation"; }
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [logoUrl] = useState(INITIAL_LOGO_URL);
  const [brandName, setBrandName] = useState(getCachedBrandName);
  const [logoSize, setLogoSize] = useState(getCachedLogoSize);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("content_key, value_en")
      .in("content_key", [BRAND_NAME_KEY, "logo.size"])
      .then(({ data }) => {
        if (data) {
          for (const row of data) {
            if (row.content_key === BRAND_NAME_KEY && row.value_en) {
              setBrandName(row.value_en);
              try { localStorage.setItem(CACHED_BRAND_NAME_KEY, row.value_en); } catch {}
            }
            if (row.content_key === "logo.size" && row.value_en) {
              const size = parseInt(row.value_en) || 56;
              setLogoSize(size);
              try { localStorage.setItem(CACHED_LOGO_SIZE_KEY, String(size)); } catch {}
            }
          }
        }
        setReady(true);
      });
  }, []);

  return (
    <BrandingContext.Provider value={{ logoUrl, brandName, logoSize, ready }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
