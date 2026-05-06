import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY = "settings.products_open_in_new_tab";
const CACHE_KEY = "ei_products_new_tab";

function getCached(): boolean {
  try {
    const v = localStorage.getItem(CACHE_KEY);
    if (v === "true") return true;
    if (v === "false") return false;
  } catch {}
  return true; // default: open in new tab
}

let memoryValue: boolean | null = null;

export function useOpenInNewTab(): boolean {
  const [value, setValue] = useState<boolean>(() => memoryValue ?? getCached());

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_content")
      .select("value_en")
      .eq("content_key", KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const v = data?.value_en === "false" ? false : true;
        memoryValue = v;
        try { localStorage.setItem(CACHE_KEY, String(v)); } catch {}
        setValue(v);
      });
    return () => { cancelled = true; };
  }, []);

  return value;
}

export function openProductLink(url: string, newTab: boolean, navigate?: (to: string) => void) {
  if (newTab) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else if (navigate) {
    navigate(url);
  } else {
    window.location.href = url;
  }
}
