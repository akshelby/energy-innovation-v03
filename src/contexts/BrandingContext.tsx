import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrandingContextType {
  logoUrl: string;
  brandName: string;
  logoSize: number; // height in px
  logoReady: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  logoUrl: "",
  brandName: "Energy Innovation",
  logoSize: 56,
  logoReady: false,
});

const LOGO_STORAGE_PATH = "branding/logo";
const BRAND_NAME_KEY = "brand.name";

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrl] = useState("");
  const [brandName, setBrandName] = useState("Energy Innovation");
  const [logoSize, setLogoSize] = useState(56);
  const [logoReady, setLogoReady] = useState(false);

  useEffect(() => {
    // Try to load logo from Supabase storage
    const { data } = supabase.storage.from("images").getPublicUrl(LOGO_STORAGE_PATH);
    if (data?.publicUrl) {
      fetch(data.publicUrl, { method: "HEAD" })
        .then((res) => {
          if (res.ok) setLogoUrl(data.publicUrl + "?t=" + Date.now());
        })
        .catch(() => {})
        .finally(() => setLogoReady(true));
    } else {
      setLogoReady(true);
    }

    // Load brand name and logo size from site_content
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
    <BrandingContext.Provider value={{ logoUrl, brandName, logoSize, logoReady }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
