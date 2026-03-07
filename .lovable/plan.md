

## Plan: Connect App to Real Data

Currently all pages except the three AI tools show hardcoded mock data. The database tables (`channels`, `videos`, `keywords`, `trends`, `predictions`, `insights`, `competitors`) already exist but are empty and unused.

### What needs to happen

1. **Seed or populate data** — The tables are empty. Real data would come from either:
   - A YouTube API integration (user connects their channel, we fetch real stats)
   - Manual data entry / CSV import
   - AI-generated seed data for demo purposes

2. **Replace hardcoded arrays with database queries** in:
   - `Dashboard.tsx` → query `channels` + `videos` for stats
   - `EngagementChart.tsx` → query `videos` for time-series data
   - `TrendingTopics.tsx` → query `trends` table
   - `ViralRadar.tsx` → query `predictions` table
   - `Competitors.tsx` → query `competitors` table
   - `KeywordExplorer.tsx` → query `keywords` table

3. **Create data ingestion** — Either:
   - YouTube Data API edge function to fetch real channel/video data
   - AI-powered trend scanning edge function to populate trends/predictions
   - Manual forms for users to add their channel data

### Recommendation

The most impactful approach would be to:
1. Let users connect their YouTube channel (via API key or channel URL)
2. Build an edge function that fetches real YouTube data and stores it
3. Update all pages to query the database instead of using mock arrays

### Alternative (faster)

If you'd prefer a working demo first, I can populate the tables with realistic AI-generated seed data and wire up all pages to read from the database — so the app feels functional immediately.

