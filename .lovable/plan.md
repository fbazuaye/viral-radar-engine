

## Problem Analysis

Two issues are causing the Viral Radar page to always appear empty:

1. **Database check constraint blocking inserts**: The edge function logs show `predictions_status_check` constraint violations — the AI returns statuses like `"upcoming"` which the constraint rejects. This means predictions never get saved.

2. **All data wiped on each scan**: Lines 138-139 of `scan-trends/index.ts` delete ALL existing trends and predictions before inserting new ones. If the insert fails (due to the constraint), the page ends up empty.

3. **No history**: Even when inserts succeed, old predictions are destroyed, so users can never see past scan results.

---

## Plan

### 1. Fix the predictions check constraint
- Run a migration to drop the `predictions_status_check` constraint (or replace it with one that accepts the values the AI actually returns: `active`, `upcoming`, `emerging`, etc.).

### 2. Stop deleting old data — archive instead
- Add a `scanned_at` timestamp column to both `trends` and `predictions` tables (defaulting to `now()`).
- Instead of deleting all rows before inserting, the edge function will simply insert new rows with a fresh `scanned_at` timestamp.
- The frontend queries will fetch only the **latest batch** by default (most recent `scanned_at` value).

### 3. Add a "Past Scans" history section to the Viral Radar page
- Below the current predictions list, add a collapsible "Scan History" section.
- Group past predictions by `scanned_at` date, showing a timeline of previous scans.
- Users can click a past scan to view its predictions, similar to how tool history works on other pages.

### 4. Update the edge function
- Remove the two `DELETE` statements.
- Generate a shared batch timestamp and attach it to all inserted rows.
- Constrain the `status` value in the prompt or normalize it before insert to avoid constraint issues.

### Files to modify
- **Migration**: Drop `predictions_status_check`, add `scanned_at` column to `trends` and `predictions`
- **`supabase/functions/scan-trends/index.ts`**: Remove delete statements, add `scanned_at` field, normalize status values
- **`src/hooks/useChannelData.ts`**: Update `usePredictions` and `useTrends` to fetch latest batch; add a `usePredictionHistory` hook
- **`src/pages/ViralRadar.tsx`**: Add scan history section with date grouping and expand/collapse

