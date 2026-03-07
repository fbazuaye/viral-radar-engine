import { Radar, TrendingUp, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface Prediction {
  topic: string;
  probability: number;
  competition: "Low" | "Medium" | "High";
  idea: string;
}

const mockPredictions: Prediction[] = [
  { topic: "AI Video Editing Tools 2026", probability: 92, competition: "Low", idea: "Top 5 AI Video Editors That Will Replace Premiere Pro" },
  { topic: "Short-Form Monetization", probability: 87, competition: "Medium", idea: "How Creators Are Making $10K/Month From Shorts" },
  { topic: "Virtual Production for YouTubers", probability: 78, competition: "Low", idea: "I Built a Hollywood Set in My Bedroom for $200" },
  { topic: "Creator Economy Recession", probability: 73, competition: "High", idea: "Why 50% of Full-Time Creators Are Going Back to 9-5s" },
];

export const ViralRadarCard = () => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-center gap-2 mb-4">
      <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
        <Radar className="h-4 w-4 text-primary-foreground" />
      </div>
      <div>
        <h3 className="font-display font-semibold text-card-foreground">Viral Radar</h3>
        <p className="text-xs text-muted-foreground">Predicted trends — next 24-72h</p>
      </div>
    </div>
    <div className="space-y-3">
      {mockPredictions.map((p, i) => (
        <div key={i} className="rounded-lg border border-border/50 bg-muted/30 p-3 hover:bg-muted/60 transition-colors">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className={cn("h-4 w-4", p.probability >= 85 ? "text-destructive" : "text-warning")} />
              <span className="text-sm font-medium text-card-foreground">{p.topic}</span>
            </div>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              p.probability >= 85 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
            )}>
              {p.probability}%
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
            <span>Competition: <span className={cn(
              "font-medium",
              p.competition === "Low" && "text-success",
              p.competition === "Medium" && "text-warning",
              p.competition === "High" && "text-destructive",
            )}>{p.competition}</span></span>
          </div>
          <div className="flex items-start gap-1.5 mt-2">
            <TrendingUp className="h-3 w-3 text-accent mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">{p.idea}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
