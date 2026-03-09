

## Plan: Save AI Results to Search History on Dashboard

### What We're Building

Save all AI-generated results (thumbnails, ideas, scripts, title optimizations) to the existing `insights` table automatically, and display a "Recent Activity" section on the Dashboard showing the user's search history.

### Database

The `insights` table already exists with the right schema:
- `user_id`, `type` (e.g. "thumbnail_ideas", "video_ideas", "script", "title_optimizer"), `input_text` (the user's query), `output_data` (JSONB with full results), `created_at`
- RLS policies already allow INSERT and SELECT for own rows

No migration needed.

### Edge Function Changes

Save results to `insights` table at the end of each edge function, after successful AI generation:

1. **`generate-thumbnails/index.ts`** — Insert with type `"thumbnail_ideas"`, input_text = topic, output_data = concepts array (including imageUrls)
2. **`generate-ideas/index.ts`** — Insert with type `"video_ideas"`, input_text = niche, output_data = ideas array
3. **`generate-script/index.ts`** — Insert with type `"script"`, input_text = topic, output_data = script object
4. **`optimize-title/index.ts`** — Insert with type `"title_optimizer"`, input_text = title, output_data = titles array

Each function already has a `supabase` service-role client and `userId`. We'll add a single insert call using the service role client (to bypass RLS) with the user's ID.

### Frontend Changes

1. **`src/hooks/useSearchHistory.ts`** (new) — React Query hook to fetch from `insights` table, ordered by `created_at` desc, limit 20.

2. **`src/components/dashboard/SearchHistory.tsx`** (new) — A card component showing recent activity:
   - Each row shows: icon by type, input text, timestamp (relative via date-fns), and a type badge
   - Clicking a row navigates to the relevant tool page
   - Thumbnail entries show a small preview image if available

3. **`src/pages/Dashboard.tsx`** — Add the SearchHistory component below the existing charts section, spanning full width.

### Files to Create/Modify

- **`supabase/functions/generate-thumbnails/index.ts`** — Add insights insert
- **`supabase/functions/generate-ideas/index.ts`** — Add insights insert
- **`supabase/functions/generate-script/index.ts`** — Add insights insert
- **`supabase/functions/optimize-title/index.ts`** — Add insights insert
- **`src/hooks/useSearchHistory.ts`** — New hook
- **`src/components/dashboard/SearchHistory.tsx`** — New component
- **`src/pages/Dashboard.tsx`** — Add SearchHistory section

