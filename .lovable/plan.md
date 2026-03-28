

## Plan: Add Video Description Generator

### Overview
Add a new "Description" page to the sidebar and app routes. Users paste a video title and optionally paste a generated script, then click "Create Video Description" to get an SEO-optimized YouTube video description they can copy.

### What Gets Built

1. **New edge function: `supabase/functions/generate-description/index.ts`**
   - Accepts `title` (required) and `script` (optional)
   - Uses Lovable AI (gemini-3-flash-preview) with a system prompt that generates SEO-optimized YouTube descriptions with keywords, timestamps, hashtags, and call-to-action
   - Deducts 3 tokens (new action: `description_generation`)
   - Auth + token gating following the same pattern as `generate-script`
   - Saves to `insights_history` with type `description`

2. **New page: `src/pages/DescriptionGenerator.tsx`**
   - Input fields: Video Title (text input), Script (large textarea, optional — "for best results")
   - "Create Video Description" button
   - Result area displaying the generated description with a **Copy to Clipboard** button
   - History sidebar showing past generations (same pattern as ScriptGenerator)

3. **Routing & navigation updates**
   - Add to sidebar nav items with `FileText` or `AlignLeft` icon, label "Description"
   - Add lazy import + route `/description` in App.tsx

4. **Token cost config**
   - Add `description_generation: { cost: 3, label: "Description Generation" }` to `tokenCosts.ts`

5. **Edge function config**
   - Add `[functions.generate-description]` with `verify_jwt = false` to `supabase/config.toml`

### Files Changed
- **New**: `supabase/functions/generate-description/index.ts`
- **New**: `src/pages/DescriptionGenerator.tsx`
- **Edit**: `src/App.tsx` — add route
- **Edit**: `src/components/layout/Sidebar.tsx` — add nav item
- **Edit**: `src/lib/tokenCosts.ts` — add cost entry
- **Edit**: `supabase/config.toml` — add function config

