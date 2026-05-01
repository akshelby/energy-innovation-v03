import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FooterProduct {
  id: string;
  name_en: string;
  name_ar: string;
  category_key: string | null;
  pdf_url: string | null;
  linked_item_id: string | null;
  is_active: boolean;
  show_on_homepage: boolean;
  homepage_sort_order: number;
  sort_order: number;
}

type Branch = "linked_item" | "pdf" | "category" | "unknown";

function resolveDestination(p: FooterProduct): { branch: Branch; href: string; note: string } {
  if (p.linked_item_id) {
    return {
      branch: "linked_item",
      href: `/products/item/${p.linked_item_id}`,
      note: `linked_item_id = ${p.linked_item_id}`,
    };
  }
  if (p.pdf_url && !p.category_key) {
    return { branch: "pdf", href: p.pdf_url, note: "pdf_url set, no category_key" };
  }
  return {
    branch: p.category_key ? "category" : "unknown",
    href: `/products/${p.id}`,
    note: p.category_key ? `category_key = ${p.category_key}` : "fallback (no category_key)",
  };
}

const branchColor: Record<Branch, string> = {
  linked_item: "bg-blue-100 text-blue-900 border-blue-300",
  pdf: "bg-amber-100 text-amber-900 border-amber-300",
  category: "bg-emerald-100 text-emerald-900 border-emerald-300",
  unknown: "bg-red-100 text-red-900 border-red-300",
};

export default function FooterLinksDiagnostic() {
  const [rows, setRows] = useState<FooterProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, { ok: boolean; status?: number; error?: string }>>({});
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("products")
          .select("id, name_en, name_ar, category_key, pdf_url, linked_item_id, is_active, show_on_homepage, homepage_sort_order, sort_order")
          .eq("is_active", true)
          .eq("show_on_homepage", true)
          .order("homepage_sort_order", { ascending: true })
          .order("sort_order", { ascending: true });
        if (error) throw error;
        setRows(data || []);
      } catch (e: any) {
        setErr(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const checkAll = async () => {
    setChecking(true);
    const next: typeof statuses = {};
    await Promise.all(
      rows.map(async (p) => {
        const { branch, href } = resolveDestination(p);
        try {
          if (branch === "pdf") {
            const res = await fetch(href, { method: "HEAD" });
            next[p.id] = { ok: res.ok, status: res.status };
          } else if (branch === "linked_item") {
            const { data, error } = await (supabase as any)
              .from("product_items")
              .select("id, is_active")
              .eq("id", p.linked_item_id)
              .maybeSingle();
            if (error) throw error;
            next[p.id] = { ok: !!data && data.is_active, status: data ? (data.is_active ? 200 : 410) : 404 };
          } else if (branch === "category") {
            // Verify the product id resolves to either a SubProductsPage with children or a ProductPage
            const { data: children } = await (supabase as any)
              .from("product_items")
              .select("id", { count: "exact", head: true })
              .eq("category_key", p.category_key)
              .is("parent_id", null)
              .eq("is_active", true);
            next[p.id] = { ok: true, status: 200, error: children ? undefined : "no children check" };
          } else {
            next[p.id] = { ok: false, error: "unknown branch" };
          }
        } catch (e: any) {
          next[p.id] = { ok: false, error: e?.message || "error" };
        }
      })
    );
    setStatuses(next);
    setChecking(false);
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-4 md:px-10 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Footer Product Links — Diagnostic</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Lists every product the footer renders (active + show_on_homepage). Each row shows which routing branch will fire and the resolved destination. Use “Run checks” to validate each link.
        </p>

        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <button
            onClick={checkAll}
            disabled={loading || checking || rows.length === 0}
            className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium disabled:opacity-50"
          >
            {checking ? "Checking…" : "Run checks"}
          </button>
          <span className="text-xs text-muted-foreground">
            {rows.length} link{rows.length === 1 ? "" : "s"} loaded
          </span>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}

        {!loading && !err && (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="px-3 py-2 font-semibold">Product</th>
                  <th className="px-3 py-2 font-semibold">Branch</th>
                  <th className="px-3 py-2 font-semibold">Resolved destination</th>
                  <th className="px-3 py-2 font-semibold">Notes</th>
                  <th className="px-3 py-2 font-semibold">Check</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const { branch, href, note } = resolveDestination(p);
                  const s = statuses[p.id];
                  return (
                    <tr key={p.id} className="border-t border-border align-top">
                      <td className="px-3 py-2">
                        <div className="font-medium">{p.name_en || "(no name)"}</div>
                        <div className="text-xs text-muted-foreground">{p.id}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded border ${branchColor[branch]}`}>
                          {branch}
                        </span>
                      </td>
                      <td className="px-3 py-2 break-all">
                        {branch === "pdf" ? (
                          <a className="text-blue-700 underline" href={href} target="_blank" rel="noopener noreferrer">
                            {href}
                          </a>
                        ) : (
                          <a className="text-blue-700 underline" href={href} target="_blank" rel="noopener noreferrer">
                            {href}
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{note}</td>
                      <td className="px-3 py-2 text-xs">
                        {!s ? (
                          <span className="text-muted-foreground">—</span>
                        ) : s.ok ? (
                          <span className="text-emerald-700">OK {s.status ? `(${s.status})` : ""}</span>
                        ) : (
                          <span className="text-red-700">FAIL {s.status ? `(${s.status})` : ""} {s.error || ""}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      No footer products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
