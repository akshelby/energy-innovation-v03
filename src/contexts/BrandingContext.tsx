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

// Pre-compute the public URL with cache-busting timestamp
const { data: logoData } = supabase.storage.from("images").getPublicUrl(LOGO_STORAGE_PATH);
const INITIAL_LOGO_URL = logoData?.publicUrl ? `${logoData.publicUrl}?v=${Date.now()}` : "";

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
