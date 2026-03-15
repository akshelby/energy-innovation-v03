import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify admin password
  const password = req.headers.get("x-admin-password");
  const adminPassword = Deno.env.get("ADMIN_PASSWORD");
  if (!password || password !== adminPassword) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();
  const method = req.method;

  try {
    // LEADS
    if (path === "leads") {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json(data);
      }
      if (method === "DELETE") {
        const { id } = await req.json();
        const { error } = await supabase.from("leads").delete().eq("id", id);
        if (error) throw error;
        return json({ success: true });
      }
    }

    // SITE CONTENT
    if (path === "content") {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("site_content")
          .select("*")
          .order("content_key");
        if (error) throw error;
        return json(data);
      }
      if (method === "POST") {
        const body = await req.json();
        const { content_key, value_en, value_ar } = body;
        const { data, error } = await supabase
          .from("site_content")
          .upsert(
            { content_key, value_en, value_ar, updated_at: new Date().toISOString() },
            { onConflict: "content_key" }
          )
          .select()
          .single();
        if (error) throw error;
        return json(data);
      }
      if (method === "DELETE") {
        const { id } = await req.json();
        const { error } = await supabase.from("site_content").delete().eq("id", id);
        if (error) throw error;
        return json({ success: true });
      }
    }

    // SEED content from defaults
    if (path === "seed" && method === "POST") {
      const { entries } = await req.json();
      if (!Array.isArray(entries)) return json({ error: "entries must be array" }, 400);
      
      for (const entry of entries) {
        await supabase.from("site_content").upsert(
          {
            content_key: entry.content_key,
            value_en: entry.value_en,
            value_ar: entry.value_ar,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "content_key" }
        );
      }
      return json({ success: true, count: entries.length });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
});
