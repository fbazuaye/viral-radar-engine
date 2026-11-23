import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { useChartColors } from "@/lib/chartColors";

interface Video {
  published_at: string | null;
  view_count: number | null;
  like_count: number | null;
}

interface EngagementChartProps {
  videos: Video[];
}

export const EngagementChart = ({ videos }: EngagementChartProps) => {
  const colors = useChartColors();

  const data = useMemo(() => {
    if (!videos.length) return [];
    // Group by day, show last 7 data points
    const byDay = new Map<string, { views: number; likes: number }>();
    videos.forEach((v) => {
      if (!v.published_at) return;
      const day = format(parseISO(v.published_at), "MMM dd");
      const existing = byDay.get(day) || { views: 0, likes: 0 };
      existing.views += v.view_count ?? 0;
      existing.likes += v.like_count ?? 0;
      byDay.set(day, existing);
    });
    return Array.from(byDay.entries())
      .map(([day, vals]) => ({ day, ...vals }))
      .slice(-7);
  }, [videos]);

  if (!data.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-display font-semibold text-card-foreground mb-4">Video Performance</h3>
        <p className="text-sm text-muted-foreground">No video data yet. Sync your channel to see charts.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display font-semibold text-card-foreground mb-4">Video Performance</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" style={{ stopColor: colors.primary }} stopOpacity={0.3} />
                <stop offset="95%" style={{ stopColor: colors.primary }} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" style={{ stopColor: colors.accent }} stopOpacity={0.3} />
                <stop offset="95%" style={{ stopColor: colors.accent }} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} opacity={0.3} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke={colors.muted} />
            <YAxis tick={{ fontSize: 12 }} stroke={colors.muted} />
            <Tooltip
              contentStyle={{
                background: colors.popover,
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                color: colors.popoverForeground,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="views" stroke={colors.primary} fill="url(#viewsGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="likes" stroke={colors.accent} fill="url(#likesGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
