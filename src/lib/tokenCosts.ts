export const TOKEN_COSTS = {
  scan_trends: { cost: 5, label: "Trend Scan" },
  youtube_search: { cost: 2, label: "YouTube Search" },
  title_optimize: { cost: 3, label: "Title Optimization" },
  idea_generation: { cost: 5, label: "Idea Generation" },
  script_generation: { cost: 10, label: "Script Generation" },
} as const;

export type TokenAction = keyof typeof TOKEN_COSTS;

export const TIER_TOKENS: Record<string, number> = {
  free: 50,
  starter: 500,
  pro: 2000,
  agency: 10000,
};

export const TOKEN_PACKS = [
  { tokens: 100, price: 5, label: "100 Tokens" },
  { tokens: 500, price: 20, label: "500 Tokens", popular: true },
  { tokens: 2000, price: 69, label: "2,000 Tokens" },
] as const;
