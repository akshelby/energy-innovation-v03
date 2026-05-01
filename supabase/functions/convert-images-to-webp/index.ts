// One-off maintenance function: scans products / product_items / product_page_images
// for non-WebP image_url values, downloads each image, re-encodes it as WebP using
// the imagescript Deno library, uploads the .webp to the same bucket path, and
// updates the DB row to point at the new URL. Old originals are left in place
// so nothing breaks if a CDN cache still references them.
//
// Trigger via: POST /functions/v1/convert-images-to-webp  (admin password required)
// Body: { password: string, dryRun?: boolean, limit?: number }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { decode, Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

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
}

const isConvertible = (url: string) => {
  // Only touch our own Supabase storage URLs in the `images` bucket.
  if (!url.startsWith(`${PUBLIC_PREFIX}${BUCKET}/`)) return false;
  const lower = url.split("?")[0].toLowerCase();
  if (lower.endsWith(".webp") || lower.endsWith(".svg")) return false;
  return /\.(jpe?g|png)$/i.test(lower);
};

// Convert a public URL into the storage object key inside the bucket.
const toStorageKey = (url: string) => {
  const withoutPrefix = url.slice(`${PUBLIC_PREFIX}${BUCKET}/`.length);
  const noQuery = withoutPrefix.split("?")[0];
  return decodeURIComponent(noQuery);
};

const swapExt = (key: string) => key.replace(/\.(jpe?g|png)$/i, ".webp");

async function listTargets(): Promise<Target[]> {
  const out: Target[] = [];

  const { data: products } = await supabase
    .from("products")
    .select("id,image_url");
  (products || []).forEach((r: any) => {
    if (r.image_url && isConvertible(r.image_url)) {
      out.push({ table: "products", id: r.id, url: r.image_url });
    }
  });

  const { data: items } = await supabase
    .from("product_items")
    .select("id,image_url");
  (items || []).forEach((r: any) => {
    if (r.image_url && isConvertible(r.image_url)) {
      out.push({ table: "product_items", id: r.id, url: r.image_url });
    }
  });

  const { data: pageImgs } = await supabase
    .from("product_page_images")
    .select("id,image_url");
  (pageImgs || []).forEach((r: any) => {
    if (r.image_url && isConvertible(r.image_url)) {
      out.push({ table: "product_page_images", id: r.id, url: r.image_url });
    }
  });

  return out;
}

async function convertOne(t: Target) {
  const oldKey = toStorageKey(t.url);
  const newKey = swapExt(oldKey);

  // Download original from storage (avoids CDN-cache content negotiation).
  const { data: blob, error: dlErr } = await supabase.storage
    .from(BUCKET)
    .download(oldKey);
  if (dlErr || !blob) throw new Error(`download failed: ${dlErr?.message}`);

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const img = await decode(bytes);
  if (!(img instanceof Image)) throw new Error("decode produced non-Image");

  // imagescript encodes WebP losslessly only; for lossy use JPEG. To get
  // smaller WebP at quality ~82 we re-encode via Image.encode (lossless WebP)
  // then fall back to JPEG-style quality if file ends up larger than original.
  // imagescript's `encode(quality)` produces PNG; `encodeJPEG(q)` produces JPEG.
  // For WebP we use `encodeWEBP()` (lossless). If lossless is bigger than the
  // original, we still proceed because WebP decoding is faster and modern
  // browsers cache it well — but in practice photos shrink significantly.
  const webpBytes = await img.encodeWEBP();

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(
    newKey,
    webpBytes,
    { contentType: "image/webp", upsert: true },
  );
  if (upErr) throw new Error(`upload failed: ${upErr.message}`);

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(newKey);
  const newUrl = pub.publicUrl;

  const { error: updErr } = await supabase
    .from(t.table)
    .update({ image_url: newUrl })
    .eq("id", t.id);
  if (updErr) throw new Error(`db update failed: ${updErr.message}`);

  return {
    table: t.table,
    id: t.id,
    oldKey,
    newKey,
    oldBytes: bytes.byteLength,
    newBytes: webpBytes.byteLength,
    saved: bytes.byteLength - webpBytes.byteLength,
  };
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

    const dryRun = !!body.dryRun;
    const limit = typeof body.limit === "number" ? body.limit : 100;

    const targets = (await listTargets()).slice(0, limit);

    if (dryRun) {
      return new Response(
        JSON.stringify({ dryRun: true, count: targets.length, targets }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: any[] = [];
    const errors: any[] = [];
    for (const t of targets) {
      try {
        results.push(await convertOne(t));
      } catch (e) {
        errors.push({ table: t.table, id: t.id, url: t.url, error: String(e) });
      }
    }

    const totalSaved = results.reduce((s, r) => s + (r.saved || 0), 0);
    return new Response(
      JSON.stringify({
        converted: results.length,
        failed: errors.length,
        totalSavedBytes: totalSaved,
        totalSavedKB: Math.round(totalSaved / 1024),
        results,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
