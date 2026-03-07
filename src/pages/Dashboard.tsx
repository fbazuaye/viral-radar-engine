import { Eye, Users, TrendingUp, ThumbsUp, Play, Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ViralRadarCard } from "@/components/dashboard/ViralRadarCard";
import { EngagementChart } from "@/components/dashboard/EngagementChart";

const Dashboard = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-1">Your channel intelligence at a glance</p>
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard title="Total Views" value="1.2M" change="+12.5% vs last month" changeType="up" icon={Eye} />
      <StatCard title="Subscribers" value="45.2K" change="+892 this week" changeType="up" icon={Users} />
      <StatCard title="Growth Rate" value="4.2%" change="+0.8% vs avg" changeType="up" icon={TrendingUp} />
      <StatCard title="Engagement" value="6.8%" change="-0.3% vs last week" changeType="down" icon={ThumbsUp} />
      <StatCard title="Videos" value="142" change="3 published this week" changeType="neutral" icon={Play} />
      <StatCard title="Watch Time" value="8.4K hrs" change="+18% vs last month" changeType="up" icon={Clock} />
    </div>

    {/* Charts + Viral Radar */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3">
        <EngagementChart />
      </div>
      <div className="lg:col-span-2">
        <ViralRadarCard />
      </div>
    </div>
  </div>
);

export default Dashboard;
