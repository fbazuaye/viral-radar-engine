import { Radar, Flame, TrendingUp, Search, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Prediction {
  topic: string;
  probability: number;
  competition: "Low" | "Medium" | "High";
  idea: string;
  category: string;
  timeframe: string;
}

const predictions: Prediction[] = [
  { topic: "AI Video Editing Tools 2026", probability: 92, competition: "Low", idea: "Top 5 AI Video Editors That Will Replace Premiere Pro", category: "Tech", timeframe: "24h" },
  { topic: "Short-Form Monetization Strategies", probability: 87, competition: "Medium", idea: "How Creators Are Making $10K/Month From Shorts", category: "Business", timeframe: "48h" },
  { topic: "Virtual Production for YouTubers", probability: 78, competition: "Low", idea: "I Built a Hollywood Set in My Bedroom for $200", category: "Production", timeframe: "72h" },
  { topic: "Creator Economy Recession", probability: 73, competition: "High", idea: "Why 50% of Full-Time Creators Are Going Back to 9-5s", category: "Industry", timeframe: "48h" },
  { topic: "YouTube Algorithm Update March 2026", probability: 95, competition: "Medium", idea: "YouTube Just Changed Everything — New Algorithm Breakdown", category: "Platform", timeframe: "24h" },
  { topic: "MrBeast Production Secrets", probability: 69, competition: "High", idea: "I Reverse-Engineered MrBeast's Production Pipeline", category: "Analysis", timeframe: "72h" },
];

const ViralRadar = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
        <Radar className="h-6 w-6 text-primary" />
        Viral Prediction Engine
      </h1>
      <p className="text-sm text-muted-foreground mt-1">AI-predicted topics likely to trend within the next 24-72 hours</p>
    </div>

    {/* Summary cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
          <Flame className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <div className="text-xl font-display font-bold text-card-foreground">3</div>
          <div className="text-xs text-muted-foreground">Hot predictions (85%+)</div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-accent" />
        </div>
        <div>
          <div className="text-xl font-display font-bold text-card-foreground">4</div>
          <div className="text-xs text-muted-foreground">Low competition topics</div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-xl font-display font-bold text-card-foreground">2</div>
          <div className="text-xs text-muted-foreground">Trending in 24h</div>
        </div>
      </div>
    </div>

    {/* Predictions table */}
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter predictions..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
          />
        </div>
      </div>
      <div className="divide-y divide-border">
        {predictions.map((p, i) => (
          <div key={i} className="p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className={cn("h-4 w-4", p.probability >= 85 ? "text-destructive" : p.probability >= 70 ? "text-warning" : "text-muted-foreground")} />
                  <span className="font-medium text-card-foreground">{p.topic}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{p.category}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span>Competition: <span className={cn(
                    "font-medium",
                    p.competition === "Low" && "text-success",
                    p.competition === "Medium" && "text-warning",
                    p.competition === "High" && "text-destructive",
                  )}>{p.competition}</span></span>
                  <span>Timeframe: {p.timeframe}</span>
                </div>
                <div className="flex items-start gap-1.5 mt-2">
                  <TrendingUp className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{p.idea}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={cn(
                  "text-lg font-display font-bold",
                  p.probability >= 85 ? "text-destructive" : p.probability >= 70 ? "text-warning" : "text-muted-foreground"
                )}>
                  {p.probability}%
                </div>
                <div className="text-xs text-muted-foreground">trend score</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ViralRadar;
