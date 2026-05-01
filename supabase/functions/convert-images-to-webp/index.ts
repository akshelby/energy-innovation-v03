// One-off maintenance helper for existing product images.
// Heavy image decoding/encoding is intentionally done in the browser.
// This function only lists eligible database URLs and updates one URL per call,
// keeping each invocation below Supabase Edge CPU limits.
//
// POST /functions/v1/convert-images-to-webp
// Body: { password: string, mode: "list" | "convert", target?: Target, newUrl?: string }
//   - mode "list": returns the full list of eligible targets (no decoding).
//   - mode "convert": validates and updates the DB URL after browser upload.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/`;
const BUCKET = "images";

interface Target {
  table: "products" | "product_items" | "product_page_images";
  id: string;
  url: string;
  oldKey?: string;
  newKey?: string;
}

const VALID_TABLES = new Set(["products", "product_items", "product_page_images"]);

const isConvertible = (url: string) => {
  if (!url.startsWith(`${PUBLIC_PREFIX}${BUCKET}/`)) return false;
  const lower = url.split("?")[0].toLowerCase();
  if (lower.endsWith(".webp") || lower.endsWith(".svg")) return false;
  return /\.(jpe?g|png)$/i.test(lower);
};

const toStorageKey = (url: string) => {
  const withoutPrefix = url.slice(`${PUBLIC_PREFIX}${BUCKET}/`.length);
  const noQuery = withoutPrefix.split("?")[0];
  return decodeURIComponent(noQuery);
};

const swapExt = (key: string) => key.replace(/\.(jpe?g|png)$/i, ".webp");

async function listTargets(): Promise<Target[]> {
  const out: Target[] = [];

  const { data: products } = await supabase
    .from("products").select("id,image_url");
  (products || []).forEach((r: any) => {
    if (r.image_url && isConvertible(r.image_url))
      out.push({ table: "products", id: r.id, url: r.image_url, oldKey: toStorageKey(r.image_url), newKey: swapExt(toStorageKey(r.image_url)) });
  });

  const { data: items } = await supabase
    .from("product_items").select("id,image_url");
  (items || []).forEach((r: any) => {
    if (r.image_url && isConvertible(r.image_url))
      out.push({ table: "product_items", id: r.id, url: r.image_url, oldKey: toStorageKey(r.image_url), newKey: swapExt(toStorageKey(r.image_url)) });
  });

  const { data: pageImgs } = await supabase
    .from("product_page_images").select("id,image_url");
  (pageImgs || []).forEach((r: any) => {
    if (r.image_url && isConvertible(r.image_url))
      out.push({ table: "product_page_images", id: r.id, url: r.image_url, oldKey: toStorageKey(r.image_url), newKey: swapExt(toStorageKey(r.image_url)) });
  });

  return out;
}

async function updateOne(t: Target, newUrl: string) {
  if (!VALID_TABLES.has(t.table) || !t.id || !isConvertible(t.url)) {
    throw new Error("invalid target");
  }
  if (!newUrl.startsWith(`${PUBLIC_PREFIX}${BUCKET}/`) || !newUrl.split("?")[0].toLowerCase().endsWith(".webp")) {
    throw new Error("invalid webp url");
  }

  const { error: updErr } = await supabase
    .from(t.table).update({ image_url: newUrl }).eq("id", t.id);
  if (updErr) throw new Error(`db update failed: ${updErr.message}`);

  return { table: t.table, id: t.id, oldKey: toStorageKey(t.url), newKey: toStorageKey(newUrl) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mode = body.mode || (body.dryRun ? "list" : "list");

    if (mode === "list") {
      const targets = await listTargets();
      return new Response(
        JSON.stringify({ count: targets.length, targets }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (mode === "convert") {
      const target = body.target as Target | undefined;
      const newUrl = String(body.newUrl || "");
      if (!target?.url || !target?.id || !target?.table) {
        return new Response(JSON.stringify({ error: "missing target" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await updateOne(target, newUrl);
      return new Response(
        JSON.stringify({ ok: true, result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "unknown mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
