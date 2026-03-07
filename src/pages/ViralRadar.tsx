import { Radar, Flame, TrendingUp, Search, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePredictions } from "@/hooks/useChannelData";
import { useState, useMemo } from "react";

const ViralRadar = () => {
  const { data: predictions = [], isLoading } = usePredictions();
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter) return predictions;
    const q = filter.toLowerCase();
    return predictions.filter(
      (p) => p.topic.toLowerCase().includes(q) || p.suggested_idea?.toLowerCase().includes(q)
    );
  }, [predictions, filter]);

  const competitionLabel = (score: number | null): "Low" | "Medium" | "High" => {
    if (!score || score < 0.35) return "Low";
    if (score < 0.65) return "Medium";
    return "High";
  };

  const hotCount = predictions.filter((p) => Number(p.trend_probability) >= 85).length;
  const lowCompCount = predictions.filter((p) => (p.competition_score ?? 0) < 0.35).length;
  const fast24h = predictions.filter((p) => p.time_window === "24h" || p.time_window === "24-72h").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Radar className="h-6 w-6 text-primary" />
          Viral Prediction Engine
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI-predicted topics likely to trend within the next 24-72 hours</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Flame className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <div className="text-xl font-display font-bold text-card-foreground">{hotCount}</div>
            <div className="text-xs text-muted-foreground">Hot predictions (85%+)</div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div>
            <div className="text-xl font-display font-bold text-card-foreground">{lowCompCount}</div>
            <div className="text-xs text-muted-foreground">Low competition topics</div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-xl font-display font-bold text-card-foreground">{fast24h}</div>
            <div className="text-xs text-muted-foreground">Trending soon</div>
          </div>
        </div>
      </div>

      {!predictions.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No predictions yet. The AI engine will populate this data.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter predictions..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
              />
            </div>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((p) => {
              const prob = Number(p.trend_probability);
              const comp = competitionLabel(p.competition_score);
              return (
                <div key={p.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className={cn("h-4 w-4", prob >= 85 ? "text-destructive" : prob >= 70 ? "text-warning" : "text-muted-foreground")} />
                        <span className="font-medium text-card-foreground">{p.topic}</span>
                        {p.status && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{p.status}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Competition: <span className={cn(
                          "font-medium",
                          comp === "Low" && "text-success",
                          comp === "Medium" && "text-warning",
                          comp === "High" && "text-destructive",
                        )}>{comp}</span></span>
                        {p.time_window && <span>Timeframe: {p.time_window}</span>}
                      </div>
                      {p.suggested_idea && (
                        <div className="flex items-start gap-1.5 mt-2">
                          <TrendingUp className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">{p.suggested_idea}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "text-lg font-display font-bold",
                        prob >= 85 ? "text-destructive" : prob >= 70 ? "text-warning" : "text-muted-foreground"
                      )}>
                        {prob}%
                      </div>
                      <div className="text-xs text-muted-foreground">trend score</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViralRadar;
