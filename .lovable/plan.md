

## Plan: Admin Site Traffic Analytics Dashboard

### Overview
Add a site traffic tracking system that records page visits (with country, page, timestamp, device info) and an admin-only analytics dashboard to visualize this data.

### Database Changes

**New table: `site_visits`**
- `id` (uuid, PK)
- `page_path` (text) — route visited
- `country` (text, nullable) — resolved via free IP geolocation API
- `city` (text, nullable)
- `device_type` (text) — mobile/desktop/tablet
- `browser` (text)
- `referrer` (text, nullable)
- `user_id` (uuid, nullable) — if logged in
- `session_id` (text) — anonymous session identifier
- `created_at` (timestamptz)

**RLS**: Public INSERT (anyone can log a visit), admin-only SELECT. No UPDATE/DELETE.

### Edge Function: `track-visit`
- Receives page_path, referrer, user_agent, session_id from the client
- Uses the request's IP with a free geolocation service (ip-api.com) to resolve country/city
- Parses user_agent for device_type and browser
- Inserts into `site_visits` using service role key
- `verify_jwt = false` so it works for anonymous visitors

### Client-Side Tracking
- Create a `usePageTracking` hook that fires on every route change (via `useLocation`)
- Generates a random `session_id` in sessionStorage for anonymous tracking
- Calls the `track-visit` edge function on each navigation

### Admin Analytics Page (`/admin/analytics`)
- Protected admin-only route (same pattern as `/admin/users`)
- **Summary cards**: Total visits (today / 7d / 30d), unique sessions, unique countries
- **Country breakdown**: Table sorted by visit count with country flags
- **Top pages**: Bar chart of most visited pages (Recharts)
- **Traffic over time**: Line chart of daily visits (Recharts)
- **Device breakdown**: Pie chart of mobile vs desktop vs tablet
- **Recent visits**: Scrollable table with time, page, country, device

### Navigation
- Add "Site Analytics" link with `BarChart3` icon to sidebar (admin-only, alongside User Management)
- Add route in App.tsx

### Files to Create/Edit
- **Migration**: new `site_visits` table + RLS policies
- **New**: `supabase/functions/track-visit/index.ts`
- **New**: `src/hooks/usePageTracking.ts`
- **New**: `src/pages/AdminAnalytics.tsx`
- **Edit**: `src/App.tsx` — add route
- **Edit**: `src/components/layout/Sidebar.tsx` — add nav item
- **Edit**: `src/components/layout/AppLayout.tsx` — mount tracking hook

