import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  icon: LucideIcon;
  className?: string;
}

export const StatCard = ({ title, value, change, changeType, icon: Icon, className }: StatCardProps) => (
  <div className={cn("rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:glow-primary/20", className)}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground">{title}</span>
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </div>
    <div className="text-2xl font-display font-bold text-card-foreground">{value}</div>
    <span className={cn(
      "text-xs font-medium mt-1 inline-block",
      changeType === "up" && "text-success",
      changeType === "down" && "text-destructive",
      changeType === "neutral" && "text-muted-foreground",
    )}>
      {change}
    </span>
  </div>
);
