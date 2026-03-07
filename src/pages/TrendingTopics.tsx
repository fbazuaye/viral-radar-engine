import { TrendingUp, ExternalLink, Eye, ThumbsUp, Loader2 } from "lucide-react";
import { useTrends } from "@/hooks/useChannelData";

const TrendingTopics = () => {
  const { data: trends = [], isLoading } = useTrends();

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
          <TrendingUp className="h-6 w-6 text-primary" />
          Viral Topic Finder
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Trending topics across YouTube right now</p>
      </div>

      {!trends.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No trending topics yet. The AI trend scanner will populate this data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trends.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-5 hover:glow-primary transition-all group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t.category || "General"}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-display font-semibold text-card-foreground mb-3">{t.topic}</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Score: {t.trend_score}</span>
                <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {t.source}</span>
                {t.velocity && <span className="text-success font-medium">+{Number(t.velocity).toFixed(0)}% velocity</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingTopics;
