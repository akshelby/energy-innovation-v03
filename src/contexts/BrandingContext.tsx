import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/logo.png";

interface BrandingContextType {
  logoUrl: string;
  brandName: string;
}

const BrandingContext = createContext<BrandingContextType>({
  logoUrl: defaultLogo,
  brandName: "Energy Innovation",
});

const LOGO_STORAGE_PATH = "branding/logo";
const BRAND_NAME_KEY = "brand.name";

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrl] = useState(defaultLogo);
  const [brandName, setBrandName] = useState("Energy Innovation");

  useEffect(() => {
    // Try to load logo from Supabase storage
    const { data } = supabase.storage.from("images").getPublicUrl(LOGO_STORAGE_PATH);
    if (data?.publicUrl) {
      // Check if file actually exists by making a HEAD request
      fetch(data.publicUrl, { method: "HEAD" })
        .then((res) => {
          if (res.ok) setLogoUrl(data.publicUrl + "?t=" + Date.now());
        })
        .catch(() => {});
    }

    // Load brand name from site_content
    supabase
      .from("site_content")
      .select("value_en")
      .eq("content_key", BRAND_NAME_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_en) setBrandName(data.value_en);
      });
  }, []);

  return (
    <BrandingContext.Provider value={{ logoUrl, brandName }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
