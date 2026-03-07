import { Eye, Users, TrendingUp, ThumbsUp, Play, Clock, Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ViralRadarCard } from "@/components/dashboard/ViralRadarCard";
import { EngagementChart } from "@/components/dashboard/EngagementChart";
import { ConnectChannel } from "@/components/dashboard/ConnectChannel";
import { useChannel, useVideos } from "@/hooks/useChannelData";

const formatCount = (n: number | null | undefined): string => {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const Dashboard = () => {
  const { data: channel, isLoading: chLoading } = useChannel();
  const { data: videos = [], isLoading: vidLoading } = useVideos(channel?.id);

  const isLoading = chLoading || vidLoading;

  const totalViews = channel?.view_count ?? 0;
  const subscribers = channel?.subscriber_count ?? 0;
  const videoCount = channel?.video_count ?? 0;
  const totalLikes = videos.reduce((sum, v) => sum + (v.like_count ?? 0), 0);
  const avgEngagement = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : "0";
  const totalWatchViews = videos.reduce((sum, v) => sum + (v.view_count ?? 0), 0);

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
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your channel intelligence at a glance</p>
      </div>

      {!channel && <ConnectChannel />}

      {channel && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard title="Total Views" value={formatCount(totalViews)} change={`${videoCount} videos tracked`} changeType="neutral" icon={Eye} />
            <StatCard title="Subscribers" value={formatCount(subscribers)} change="from YouTube" changeType="up" icon={Users} />
            <StatCard title="Videos" value={videoCount.toString()} change={`${videos.length} synced`} changeType="neutral" icon={Play} />
            <StatCard title="Engagement" value={`${avgEngagement}%`} change="likes / views" changeType="neutral" icon={ThumbsUp} />
            <StatCard title="Total Likes" value={formatCount(totalLikes)} change="across all videos" changeType="up" icon={TrendingUp} />
            <StatCard title="Video Views" value={formatCount(totalWatchViews)} change="synced videos" changeType="up" icon={Clock} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <EngagementChart videos={videos} />
            </div>
            <div className="lg:col-span-2">
              <ViralRadarCard />
            </div>
          </div>

          <ConnectChannel />
        </>
      )}
    </div>
  );
};

export default Dashboard;
