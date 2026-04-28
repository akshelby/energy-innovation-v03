# Performance Optimization — Speed01

Audit confirms exactly what needs to change. No source code references the unused logos or hero `.jpg` duplicates, so deletion is safe.

## What gets fixed

### 1. Delete unused logo files (~4.5 MB saved)
None of these are imported anywhere in `src/`:
- `src/assets/logo-clean.png` — 1.2 MB
- `src/assets/logo-trimmed.png` — 1.3 MB
- `src/assets/logo-new.png` — 723 KB
- `src/assets/logo-final.png` — 509 KB
- `src/assets/logo.png` — 509 KB
- `src/assets/logo.jpeg` — 269 KB

Total: **~4.5 MB removed from the repo**. The live site uses the Supabase-hosted logo via `BrandingContext`, so the UI is unaffected.

### 2. Delete duplicate hero `.jpg` files (~1.35 MB saved)
`HeroSection.tsx` only imports the `.webp` variants. The `.jpg` originals are dead weight:
- `hero-1.jpg` 264K · `hero-2.jpg` 217K · `hero-3.jpg` 338K · `hero-4.jpg` 206K · `hero-5.jpg` 330K

Vite doesn't currently bundle them (no import), but they bloat the repo and any blanket-copy deploy. Removed for hygiene.

### 3. Vite chunk splitting — parallel JS loading
Update `vite.config.ts` `manualChunks` to split major vendors so the browser can load them in parallel instead of one giant bundle:
- `react-vendor`: react, react-dom, react-router-dom
- `ui-vendor`: @radix-ui/*, cmdk, vaul, sonner
- `supabase-vendor`: @supabase/supabase-js
- `query-vendor`: @tanstack/react-query
- `motion-vendor`: framer-motion
- `icons`: lucide-react (already split)

### 4. QueryClient caching defaults
`src/App.tsx` currently uses `new QueryClient()` with no defaults — every mount re-fetches Supabase. Add:
```ts
defaultOptions: {
  queries: {
    staleTime: 5 * 60 * 1000,   // 5 min
    gcTime: 30 * 60 * 1000,     // 30 min
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  },
}
```

### 5. Per-section Suspense boundaries
`src/pages/Index.tsx` wraps all below-the-fold sections in one shared `<Suspense>`, so they all wait on the slowest chunk. Split into one `<Suspense fallback={null}>` per lazy section so each renders the moment its own chunk arrives.

### 6. Memory + branding files
- Update `mem://features/branding-management` note to record that legacy local logo assets were removed (Supabase logo only).
- Quick grep re-confirmed before delete: zero references to `logo-clean`, `logo-trimmed`, `logo-new`, `logo-final`, `logo.png`, `logo.jpeg`, or `hero-*.jpg` anywhere in `src/` or `public/`.

## Files changed

- **Delete**: 6 logo files + 5 hero `.jpg` files in `src/assets/`
- **Edit**: `vite.config.ts` — expanded `manualChunks`
- **Edit**: `src/App.tsx` — QueryClient defaults
- **Edit**: `src/pages/Index.tsx` — per-section Suspense
- **Edit**: `mem://features/branding-management`

## Out of scope (intentionally)

- `.htaccess` cache headers — already configured per memory `mem://deployment/hostinger-config`
- Hostinger Cache Manager purge + PageSpeed test — manual user steps after deploy
- GitHub branch merge — handled by user on GitHub

## Expected impact

- **Repo / deploy size**: ~5.85 MB lighter
- **Initial JS**: smaller main chunk, parallel vendor downloads
- **Repeat navigations**: no Supabase refetch within 5 min, sections paint independently
