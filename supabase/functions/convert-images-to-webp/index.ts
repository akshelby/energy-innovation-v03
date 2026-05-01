// Lightweight maintenance helper for existing product images.
// The browser performs WebP conversion/upload; this function only lists and
// updates database URLs via REST to avoid Edge Function CPU limits.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD")!;
const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/images/`;

type TableName = "products" | "product_items" | "product_page_images";
type Target = { table: TableName; id: string; url: string; oldKey?: string; newKey?: string };

const tables: TableName[] = ["products", "product_items", "product_page_images"];
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const isConvertible = (url: string) => {
  const clean = url.split("?")[0].toLowerCase();
  return url.startsWith(PUBLIC_PREFIX) && /\.(jpe?g|png)$/.test(clean);
};

const toStorageKey = (url: string) => decodeURIComponent(url.slice(PUBLIC_PREFIX.length).split("?")[0]);
const swapExt = (key: string) => key.replace(/\.(jpe?g|png)$/i, ".webp");

async function rest(path: string, init?: RequestInit) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) throw new Error(await response.text());
  return response;
}

async function listTargets() {
  const results = await Promise.all(tables.map(async (table) => {
    const response = await rest(`${table}?select=id,image_url&image_url=not.is.null&limit=1000`);
    const rows = await response.json();
    return (rows as { id: string; image_url: string }[])
      .filter((row) => isConvertible(row.image_url))
      .map((row) => {
        const oldKey = toStorageKey(row.image_url);
        return { table, id: row.id, url: row.image_url, oldKey, newKey: swapExt(oldKey) } satisfies Target;
      });
  }));
  return results.flat();
}

async function updateOne(target: Target, newUrl: string) {
  if (!tables.includes(target.table) || !target.id || !isConvertible(target.url)) throw new Error("invalid target");
  if (!newUrl.startsWith(PUBLIC_PREFIX) || !newUrl.split("?")[0].toLowerCase().endsWith(".webp")) {
    throw new Error("invalid webp url");
  }

  await rest(`${target.table}?id=eq.${encodeURIComponent(target.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ image_url: newUrl }),
  });

  return { table: target.table, id: target.id, oldKey: toStorageKey(target.url), newKey: toStorageKey(newUrl) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.password !== ADMIN_PASSWORD) return json({ error: "unauthorized" }, 401);

    if (body.mode === "list" || body.dryRun) {
      const targets = await listTargets();
      return json({ count: targets.length, targets });
    }

    if (body.mode === "convert") {
      if (!body.target || !body.newUrl) return json({ error: "missing target or newUrl" }, 400);
      return json({ ok: true, result: await updateOne(body.target, String(body.newUrl)) });
    }

    return json({ error: "unknown mode" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});