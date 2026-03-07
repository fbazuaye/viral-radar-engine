import { Search, TrendingUp, BarChart3, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useKeywords } from "@/hooks/useChannelData";

const KeywordExplorer = () => {
  const [query, setQuery] = useState("");
  const { data: keywords = [], isLoading } = useKeywords();

  const filtered = query
    ? keywords.filter((k) => k.keyword.toLowerCase().includes(query.toLowerCase()))
    : keywords;

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
          <Search className="h-6 w-6 text-primary" />
          Keyword Explorer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Discover high-demand, low-competition keywords</p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter keywords..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button className="gradient-primary text-primary-foreground">Analyze</Button>
      </div>

      {!filtered.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">{keywords.length ? "No matching keywords." : "No keywords yet. Data will populate as the system analyzes trends."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const comp = Number(r.competition_score ?? 0) * 100;
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-card-foreground">{r.keyword}</h3>
                  <span className="text-sm text-success font-medium">{r.trend_direction || "stable"}</span>
                </div>
                <div className="flex items-center gap-6 mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Volume: <span className="text-card-foreground font-medium">{(r.search_volume ?? 0).toLocaleString()}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span className="text-sm text-muted-foreground">Competition: <span className={`font-medium ${comp < 40 ? "text-success" : comp < 65 ? "text-warning" : "text-destructive"}`}>{comp.toFixed(0)}/100</span></span>
                  </div>
                </div>
                {r.related_keywords && r.related_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {r.related_keywords.map((rel, j) => (
                      <span key={j} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground flex items-center gap-1">
                        {rel} <ArrowRight className="h-3 w-3" />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KeywordExplorer;
