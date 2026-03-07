import { Users, TrendingUp, Eye, Play, Loader2 } from "lucide-react";
import { useCompetitors } from "@/hooks/useChannelData";

const formatCount = (n: number | null | undefined): string => {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const Competitors = () => {
  const { data: competitors = [], isLoading } = useCompetitors();

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
          <Users className="h-6 w-6 text-primary" />
          Competitor Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor trending channels and top performing competitor videos</p>
      </div>

      {!competitors.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No competitors tracked yet. Add competitor channels to start monitoring.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Channel</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Subscribers</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Avg Views</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Top Video</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Top Video Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {competitors.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">{c.channel_name[0]}</div>
                        <span className="font-medium text-card-foreground text-sm">{c.channel_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {formatCount(c.subscriber_count)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {formatCount(c.avg_views)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-card-foreground">
                      <span className="flex items-center gap-1"><Play className="h-3 w-3 text-primary" /> {c.top_video_title || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatCount(c.top_video_views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Competitors;
