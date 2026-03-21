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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  // Public endpoint: check if an email is whitelisted (no auth needed)
  if (path === "check-email" && req.method === "POST") {
    try {
      const { email } = await req.json();
      const { data: emailEntry } = await supabase
        .from("admin_emails")
        .select("id")
        .eq("email", (email || "").toLowerCase())
        .eq("is_active", true)
        .maybeSingle();
      return json({ authorized: !!emailEntry });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // Verify admin password OR admin email
  const password = req.headers.get("x-admin-password");
  const adminEmail = req.headers.get("x-admin-email");
  const adminPassword = Deno.env.get("ADMIN_PASSWORD");

  let isAuthorized = false;

  // Check password auth
  if (password && password === adminPassword) {
    isAuthorized = true;
  }

  // Check email auth
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

    // PRODUCTS CRUD
    if (path === "products") {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("sort_order", { ascending: true });
        if (error) throw error;
        return json(data);
      }
      if (method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase
          .from("products")
          .upsert(body, { onConflict: "id" })
          .select()
          .single();
        if (error) throw error;
        return json(data);
      }
      if (method === "DELETE") {
        const { id } = await req.json();
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) throw error;
        return json({ success: true });
      }
    }

    // SERVICES CRUD
    if (path === "services") {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .order("sort_order", { ascending: true });
        if (error) throw error;
        return json(data);
      }
      if (method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase
          .from("services")
          .upsert(body, { onConflict: "id" })
          .select()
          .single();
        if (error) throw error;
        return json(data);
      }
      if (method === "DELETE") {
        const { id } = await req.json();
        const { error } = await supabase.from("services").delete().eq("id", id);
        if (error) throw error;
        return json({ success: true });
      }
    }

    // PRODUCT ITEMS (menu children) CRUD
    if (path === "product-items") {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("product_items")
          .select("*")
          .order("category_key")
          .order("sort_order", { ascending: true });
        if (error) throw error;
        return json(data);
      }
      if (method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase
          .from("product_items")
          .upsert(body, { onConflict: "id" })
          .select()
          .single();
        if (error) throw error;
        return json(data);
      }
      if (method === "DELETE") {
        const { id } = await req.json();
        const { error } = await supabase.from("product_items").delete().eq("id", id);
        if (error) throw error;
        return json({ success: true });
      }
    }

    // PRODUCT CATEGORIES CRUD
    if (path === "product-categories") {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("product_categories")
          .select("*")
          .order("sort_order", { ascending: true });
        if (error) throw error;
        return json(data);
      }
      if (method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase
          .from("product_categories")
          .upsert(body, { onConflict: "id" })
          .select()
          .single();
        if (error) throw error;
        return json(data);
      }
      if (method === "DELETE") {
        const { id } = await req.json();
        const { error } = await supabase.from("product_categories").delete().eq("id", id);
        if (error) throw error;
        return json({ success: true });
      }
    }

    // PRODUCT PAGES CRUD
    if (path === "product-pages") {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("product_pages")
          .select("*, product_items!inner(name_en, name_ar, category_key, parent_id)")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json(data);
      }
      if (method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase
          .from("product_pages")
          .upsert(body, { onConflict: "id" })
          .select()
          .single();
        if (error) throw error;
        // Update has_page on product_items
        if (body.product_item_id) {
          await supabase
            .from("product_items")
            .update({ has_page: true })
            .eq("id", body.product_item_id);
        }
        return json(data);
      }
      if (method === "DELETE") {
        const { id } = await req.json();
        // Get product_item_id before deleting
        const { data: pageData } = await supabase
          .from("product_pages")
          .select("product_item_id")
          .eq("id", id)
          .single();
        const { error } = await supabase.from("product_pages").delete().eq("id", id);
        if (error) throw error;
        // Update has_page on product_items
        if (pageData?.product_item_id) {
          await supabase
            .from("product_items")
            .update({ has_page: false })
            .eq("id", pageData.product_item_id);
        }
        return json({ success: true });
      }
    }

    // PRODUCT PAGE IMAGES CRUD
    if (path === "product-page-images") {
      if (method === "GET") {
        const pageId = url.searchParams.get("page_id");
        let query = supabase.from("product_page_images").select("*").order("sort_order");
        if (pageId) query = query.eq("product_page_id", pageId);
        const { data, error } = await query;
        if (error) throw error;
        return json(data);
      }
      if (method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase
          .from("product_page_images")
          .upsert(body, { onConflict: "id" })
          .select()
          .single();
        if (error) throw error;
        return json(data);
      }
      if (method === "DELETE") {
        const { id } = await req.json();
        const { error } = await supabase.from("product_page_images").delete().eq("id", id);
        if (error) throw error;
        return json({ success: true });
      }
    }

    // PRODUCT ENQUIRIES
    if (path === "product-enquiries") {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("product_enquiries")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json(data);
      }
      if (method === "DELETE") {
        const { id } = await req.json();
        const { error } = await supabase.from("product_enquiries").delete().eq("id", id);
        if (error) throw error;
        return json({ success: true });
      }
    }

    // STORAGE - List files in a bucket/folder
    if (path === "files") {
      if (method === "GET") {
        const bucket = url.searchParams.get("bucket") || "images";
        const folder = url.searchParams.get("folder") || "";
        const { data, error } = await supabase.storage
          .from(bucket)
          .list(folder, { limit: 100, sortBy: { column: "name", order: "asc" } });
        if (error) throw error;
        return json(data);
      }
      if (method === "DELETE") {
        const { bucket, paths } = await req.json();
        console.log("Deleting files:", JSON.stringify({ bucket, paths }));
        const { data, error } = await supabase.storage.from(bucket).remove(paths);
        if (error) {
          console.error("Storage delete error:", error.message);
          throw error;
        }
        console.log("Delete result:", JSON.stringify(data));
        return json({ success: true });
      }
    }

    // STORAGE - Upload file (base64 encoded)
    if (path === "upload" && method === "POST") {
      const { bucket, filePath, base64, contentType } = await req.json();
      
      // Decode base64 to Uint8Array
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, bytes, {
          contentType,
          upsert: true,
        });
      if (error) throw error;
      
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return json({ success: true, url: urlData.publicUrl });
    }

    // CAREERS CRUD
    if (path === "careers") {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("careers")
          .select("*")
          .order("sort_order", { ascending: true });
        if (error) throw error;
        return json(data);
      }
      if (method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase
          .from("careers")
          .upsert(body, { onConflict: "id" })
          .select()
          .single();
        if (error) throw error;
        return json(data);
      }
      if (method === "DELETE") {
        const { id } = await req.json();
        const { error } = await supabase.from("careers").delete().eq("id", id);
        if (error) throw error;
        return json({ success: true });
      }
    }

    // ADMIN EMAILS
    if (path === "admin-emails") {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("admin_emails")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) throw error;
        return json(data);
      }
      if (method === "POST") {
        const body = await req.json();
        body.email = body.email?.toLowerCase();
        const { data, error } = await supabase
          .from("admin_emails")
          .upsert(body, { onConflict: "id" })
          .select()
          .single();
        if (error) throw error;
        return json(data);
      }
      if (method === "DELETE") {
        const { id } = await req.json();
        const { error } = await supabase.from("admin_emails").delete().eq("id", id);
        if (error) throw error;
        return json({ success: true });
      }
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
});
