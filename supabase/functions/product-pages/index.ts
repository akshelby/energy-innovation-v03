import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password, x-admin-email, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const password = req.headers.get("x-admin-password");
  const adminEmail = req.headers.get("x-admin-email");
  const adminPassword = Deno.env.get("ADMIN_PASSWORD");

  let isAuthorized = false;

  if (password && password === adminPassword) {
    isAuthorized = true;
  }

  if (!isAuthorized && adminEmail) {
    const { data: emailEntry } = await supabase
      .from("admin_emails")
      .select("id")
      .eq("email", adminEmail.toLowerCase())
      .eq("is_active", true)
      .maybeSingle();

    if (emailEntry) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    if (req.method === "GET") {
      const { data: pages, error: pagesError } = await supabase
        .from("product_pages")
        .select("*")
        .order("created_at", { ascending: false });

      if (pagesError) throw pagesError;

      const productItemIds = [...new Set((pages ?? []).map((page) => page.product_item_id).filter(Boolean))];
      let productItemsById: Record<string, { name_en: string; name_ar: string; category_key: string; parent_id: string | null }> = {};

      if (productItemIds.length > 0) {
        const { data: productItems, error: productItemsError } = await supabase
          .from("product_items")
          .select("id, name_en, name_ar, category_key, parent_id")
          .in("id", productItemIds);

        if (productItemsError) throw productItemsError;

        productItemsById = Object.fromEntries(
          (productItems ?? []).map((item) => [
            item.id,
            {
              name_en: item.name_en,
              name_ar: item.name_ar,
              category_key: item.category_key,
              parent_id: item.parent_id,
            },
          ]),
        );
      }

      const data = (pages ?? []).map((page) => ({
        ...page,
        product_items: productItemsById[page.product_item_id] ?? null,
      }));

      return json(data);
    }

    if (req.method === "POST") {
      const body = await req.json();

      const { data, error } = await supabase
        .from("product_pages")
        .upsert(body, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;

      if (body.product_item_id) {
        await supabase
          .from("product_items")
          .update({ has_page: true })
          .eq("id", body.product_item_id);
      }

      return json(data);
    }

    if (req.method === "DELETE") {
      const { id } = await req.json();

      const { data: pageData, error: pageError } = await supabase
        .from("product_pages")
        .select("product_item_id")
        .eq("id", id)
        .single();

      if (pageError) throw pageError;

      const { error } = await supabase
        .from("product_pages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      if (pageData?.product_item_id) {
        await supabase
          .from("product_items")
          .update({ has_page: false })
          .eq("id", pageData.product_item_id);
      }

      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
