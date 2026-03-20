import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrandingContextType {
  logoUrl: string;
  brandName: string;
  logoSize: number;
}

const LOGO_STORAGE_PATH = "branding/logo";
const BRAND_NAME_KEY = "brand.name";

// Pre-compute the public URL so it's available immediately — no async needed
const { data: logoData } = supabase.storage.from("images").getPublicUrl(LOGO_STORAGE_PATH);
const INITIAL_LOGO_URL = logoData?.publicUrl || "";

const BrandingContext = createContext<BrandingContextType>({
  logoUrl: INITIAL_LOGO_URL,
  brandName: "Energy Innovation",
  logoSize: 56,
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [logoUrl] = useState(INITIAL_LOGO_URL);
  const [brandName, setBrandName] = useState("Energy Innovation");
  const [logoSize, setLogoSize] = useState(56);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("content_key, value_en")
      .in("content_key", [BRAND_NAME_KEY, "logo.size"])
      .then(({ data }) => {
        if (data) {
          for (const row of data) {
            if (row.content_key === BRAND_NAME_KEY && row.value_en) setBrandName(row.value_en);
            if (row.content_key === "logo.size" && row.value_en) setLogoSize(parseInt(row.value_en) || 56);
          }
        }
      });
  }, []);

  return (
    <BrandingContext.Provider value={{ logoUrl, brandName, logoSize }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
