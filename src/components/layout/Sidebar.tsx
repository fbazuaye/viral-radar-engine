import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Search,
  Type,
  Lightbulb,
  Users,
  Image,
  Rss,
  FileText,
  Target,
  Radar,
  Zap,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/viral-radar", label: "Viral Radar", icon: Radar },
  { to: "/trending", label: "Trending Topics", icon: TrendingUp },
  { to: "/keywords", label: "Keyword Explorer", icon: Search },
  { to: "/title-optimizer", label: "Title Optimizer", icon: Type },
  { to: "/idea-generator", label: "Idea Generator", icon: Lightbulb },
  { to: "/competitors", label: "Competitors", icon: Users },
  { to: "/thumbnails", label: "Thumbnails", icon: Image },
  { to: "/feed", label: "Creator Feed", icon: Rss },
  { to: "/scripts", label: "Script Generator", icon: FileText },
  { to: "/content-gaps", label: "Content Gaps", icon: Target },
  { to: "/pricing", label: "Pricing", icon: CreditCard },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-4 border-b border-sidebar-border">
        <Zap className="h-6 w-6 shrink-0 text-primary fill-primary" />
        {!collapsed && (
          <span className="font-display text-lg font-bold text-sidebar-foreground">
            YTRadar
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
};
