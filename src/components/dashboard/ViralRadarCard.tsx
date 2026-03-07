import { Radar, TrendingUp, Flame, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePredictions } from "@/hooks/useChannelData";

export const ViralRadarCard = () => {
  const { data: predictions = [], isLoading } = usePredictions();

  const competitionLabel = (score: number | null): "Low" | "Medium" | "High" => {
    if (!score || score < 0.35) return "Low";
    if (score < 0.65) return "Medium";
    return "High";
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!predictions.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Radar className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-card-foreground">Viral Radar</h3>
            <p className="text-xs text-muted-foreground">No predictions yet</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Predictions will appear once the AI trend scanner runs.</p>
      </div>
    );
  }

  return (
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
        {predictions.slice(0, 4).map((p) => {
          const prob = Number(p.trend_probability);
          const comp = competitionLabel(p.competition_score);
          return (
            <div key={p.id} className="rounded-lg border border-border/50 bg-muted/30 p-3 hover:bg-muted/60 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Flame className={cn("h-4 w-4", prob >= 85 ? "text-destructive" : "text-warning")} />
                  <span className="text-sm font-medium text-card-foreground">{p.topic}</span>
                </div>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  prob >= 85 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                )}>
                  {prob}%
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                <span>Competition: <span className={cn(
                  "font-medium",
                  comp === "Low" && "text-success",
                  comp === "Medium" && "text-warning",
                  comp === "High" && "text-destructive",
                )}>{comp}</span></span>
                {p.time_window && <span>Window: {p.time_window}</span>}
              </div>
              {p.suggested_idea && (
                <div className="flex items-start gap-1.5 mt-2">
                  <TrendingUp className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{p.suggested_idea}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
