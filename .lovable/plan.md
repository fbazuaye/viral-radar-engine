

## Hybrid Token-Based Pricing Plan

### Concept
Each subscription tier includes a monthly token allowance. Every AI-powered action (trend scan, title optimization, script generation, idea generation, keyword search) costs tokens. Users can purchase extra token packs when they run out. The `profiles.subscription_tier` field already exists and will continue to drive tier identity.

### Database Changes

**New table: `token_balances`**
- `id` (uuid, PK), `user_id` (uuid, unique, not null), `balance` (integer, default 0), `updated_at` (timestamptz)
- RLS: users can SELECT/UPDATE own row only

**New table: `token_transactions`**
- `id` (uuid, PK), `user_id` (uuid), `amount` (integer — positive for credits, negative for usage), `action_type` (text — e.g. "scan_trends", "title_optimize", "purchase", "monthly_grant"), `description` (text), `created_at` (timestamptz)
- RLS: users can SELECT own rows; INSERT via service role only

**DB function: `deduct_tokens(user_id, amount, action_type, description)`**
- Security definer function that checks balance >= amount, deducts, inserts transaction log, returns success/failure. Prevents race conditions with `FOR UPDATE`.

**DB function: `grant_monthly_tokens()`**
- Called by pg_cron monthly. Grants tokens based on `profiles.subscription_tier`: Free=50, Starter=500, Pro=2000, Agency=10000.

### Token Costs Per Action
Defined in a shared constants file:
- Trend Scan: 5 tokens
- YouTube Search: 2 tokens  
- Title Optimization: 3 tokens
- Idea Generation: 5 tokens
- Script Generation: 10 tokens

### Edge Function Changes
Each edge function (`scan-trends`, `youtube-search`, `optimize-title`, `generate-ideas`, `generate-script`) will call `deduct_tokens` via the service role client before executing. Returns 402 if insufficient balance.

### Frontend Changes

1. **Pricing page** — Redesign to show tiers with token allowances + a token pack purchase section (100 tokens/$5, 500/$20, 2000/$69)
2. **Token balance display** — Add a token counter in the Header showing current balance
3. **Token gate UI** — Before expensive actions, show token cost. On 402 response, show "Insufficient tokens" toast with link to pricing
4. **Usage history** — New page or section showing `token_transactions` log

### Stripe Integration
Enable Stripe for purchasing extra token packs and tier subscriptions. Token pack purchases trigger a webhook that calls `grant_tokens`.

### File Changes Summary
- **New**: `src/lib/tokenCosts.ts` (constants)
- **New**: `src/hooks/useTokenBalance.ts` (query hook)
- **New**: `src/components/layout/TokenCounter.tsx` (header widget)
- **Edit**: `src/pages/Pricing.tsx` (redesign with tiers + token packs)
- **Edit**: `src/components/layout/Header.tsx` (add TokenCounter)
- **Edit**: All edge functions (add token deduction check)
- **Migration**: Create tables, functions, cron job

