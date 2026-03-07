import { useState, useMemo } from "react";
import { TrendingUp, ExternalLink, Eye, ThumbsUp, MessageSquare, Loader2, Search, Play, BarChart3, Clock, Users, X, Youtube } from "lucide-react";
import { useTrends } from "@/hooks/useChannelData";
import { useYouTubeSearch } from "@/hooks/useYouTubeSearch";
import { ScanTrendsButton } from "@/components/dashboard/ScanTrendsButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formatNumber = (n: number | null | undefined) => {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
};

const TrendingTopics = () => {
  const { data: trends = [], isLoading } = useTrends();
  const [search, setSearch] = useState("");
  const { data: searchResults, search: searchYouTube, isPending: isSearching, clear } = useYouTubeSearch();

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) searchYouTube(search.trim());
  };

  const clearSearch = () => {
    setSearch("");
    clear();
  };

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
          <p className="text-sm text-muted-foreground mt-1">Search any YouTube topic or browse auto-scanned trends</p>
        </div>
        <ScanTrendsButton />
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search any YouTube topic (e.g. 'Roger That origin')…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-8"
          />
          {search && (
            <button type="button" onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={!search.trim() || isSearching} className="gap-2">
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
          Search YouTube
        </Button>
      </form>

      {/* YouTube Search Results */}
      {searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <Youtube className="h-5 w-5 text-destructive" />
              YouTube Results for "{searchResults.query}"
            </h2>
            <span className="text-xs text-muted-foreground">{searchResults.total_results} videos found</span>
          </div>

          {/* Aggregate Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total Views", value: formatNumber(searchResults.aggregate.total_views), icon: Eye },
              { label: "Avg VPH", value: formatNumber(searchResults.aggregate.avg_vph), icon: Clock },
              { label: "Avg Engagement", value: searchResults.aggregate.avg_engagement.toFixed(1) + "%", icon: BarChart3 },
              { label: "Total Likes", value: formatNumber(searchResults.aggregate.total_likes), icon: ThumbsUp },
              { label: "Total Comments", value: formatNumber(searchResults.aggregate.total_comments), icon: MessageSquare },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                  <s.icon className="h-3 w-3" /> {s.label}
                </div>
                <p className="text-lg font-bold text-card-foreground">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Video Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {searchResults.results.map((v) => (
              <a
                key={v.video_id}
                href={`https://www.youtube.com/watch?v=${v.video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-all group"
              >
                {v.thumbnail_url && (
                  <div className="relative aspect-video bg-muted">
                    <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Play className="h-10 w-10 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-card-foreground line-clamp-2 mb-1">{v.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                    <Users className="h-3 w-3" /> {v.channel_name}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-1.5">
                      <p className="text-[10px] text-muted-foreground">Views</p>
                      <p className="text-xs font-semibold text-card-foreground">{formatNumber(v.view_count)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-1.5">
                      <p className="text-[10px] text-muted-foreground">VPH</p>
                      <p className="text-xs font-semibold text-card-foreground">{formatNumber(v.views_per_hour)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-1.5">
                      <p className="text-[10px] text-muted-foreground">Engage</p>
                      <p className="text-xs font-semibold text-card-foreground">{v.engagement_rate.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border">
                    <span>{formatNumber(v.like_count)} likes</span>
                    <span>{formatNumber(v.comment_count)} comments</span>
                    <span>{formatNumber(v.age_hours)}h ago</span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Divider */}
          {trends.length > 0 && (
            <div className="flex items-center gap-3 pt-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground font-medium">Auto-Scanned Trends</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}
        </div>
      )}

      {/* Existing Trends */}
      {!searchResults && !filtered.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {search ? "No topics match your search. Press 'Search YouTube' to query live data." : "No trending topics yet. Click Scan Trends to populate data."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-all group">
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
              <h3 className="font-display font-semibold text-card-foreground mb-1">{t.topic}</h3>
              {t.top_channel && (
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Top channel: {String(t.top_channel)}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5"><Eye className="h-3 w-3" /> Total Views</div>
                  <p className="text-sm font-semibold text-card-foreground">{formatNumber(t.total_views)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5"><Clock className="h-3 w-3" /> VPH</div>
                  <p className="text-sm font-semibold text-card-foreground">{formatNumber(t.views_per_hour)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5"><ThumbsUp className="h-3 w-3" /> Likes</div>
                  <p className="text-sm font-semibold text-card-foreground">{formatNumber(t.like_count)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5"><MessageSquare className="h-3 w-3" /> Comments</div>
                  <p className="text-sm font-semibold text-card-foreground">{formatNumber(t.comment_count)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
                <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Score: {t.trend_score}</span>
                <span>Engagement: {Number(t.engagement_rate || 0).toFixed(1)}%</span>
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
