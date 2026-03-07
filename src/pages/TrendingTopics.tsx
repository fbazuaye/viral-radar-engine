import { useState, useMemo } from "react";
import { TrendingUp, ExternalLink, Eye, ThumbsUp, MessageSquare, Loader2, Search, Play, BarChart3, Clock, Users } from "lucide-react";
import { useTrends } from "@/hooks/useChannelData";
import { ScanTrendsButton } from "@/components/dashboard/ScanTrendsButton";
import { Input } from "@/components/ui/input";

const formatNumber = (n: number | null | undefined) => {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
};

const TrendingTopics = () => {
  const { data: trends = [], isLoading } = useTrends();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return trends;
    const q = search.toLowerCase();
    return trends.filter(
      (t) =>
        t.topic.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.top_channel && String(t.top_channel).toLowerCase().includes(q))
    );
  }, [trends, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Viral Topic Finder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Trending topics across YouTube right now</p>
        </div>
        <ScanTrendsButton />
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search trending topics, categories, channels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {!filtered.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {search ? "No topics match your search." : "No trending topics yet. Click Scan Trends to populate data."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-all group">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {t.category || "General"}
                </span>
                <div className="flex items-center gap-2">
                  {t.video_count != null && t.video_count > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Play className="h-3 w-3" /> {t.video_count} videos
                    </span>
                  )}
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Topic */}
              <h3 className="font-display font-semibold text-card-foreground mb-1">{t.topic}</h3>
              {t.top_channel && (
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Top channel: {String(t.top_channel)}
                </p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
                    <Eye className="h-3 w-3" /> Total Views
                  </div>
                  <p className="text-sm font-semibold text-card-foreground">{formatNumber(t.total_views)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
                    <Clock className="h-3 w-3" /> VPH
                  </div>
                  <p className="text-sm font-semibold text-card-foreground">{formatNumber(t.views_per_hour)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
                    <ThumbsUp className="h-3 w-3" /> Likes
                  </div>
                  <p className="text-sm font-semibold text-card-foreground">{formatNumber(t.like_count)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
                    <MessageSquare className="h-3 w-3" /> Comments
                  </div>
                  <p className="text-sm font-semibold text-card-foreground">{formatNumber(t.comment_count)}</p>
                </div>
              </div>

              {/* Bottom Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> Score: {t.trend_score}
                </span>
                <span className="flex items-center gap-1">
                  Engagement: {Number(t.engagement_rate || 0).toFixed(1)}%
                </span>
                {t.velocity != null && Number(t.velocity) > 0 && (
                  <span className="text-primary font-medium">+{Number(t.velocity).toFixed(0)}% vel</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingTopics;
