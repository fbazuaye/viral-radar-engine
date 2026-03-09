import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Image, Lightbulb, FileText, Type, Loader2, History } from "lucide-react";

const typeConfig: Record<string, { label: string; icon: typeof Image; route: string; color: string }> = {
  thumbnail: { label: "Thumbnails", icon: Image, route: "/thumbnails", color: "bg-pink-500/10 text-pink-500" },
  idea: { label: "Ideas", icon: Lightbulb, route: "/idea-generator", color: "bg-amber-500/10 text-amber-500" },
  script: { label: "Script", icon: FileText, route: "/script-generator", color: "bg-blue-500/10 text-blue-500" },
  title: { label: "Title", icon: Type, route: "/title-optimizer", color: "bg-emerald-500/10 text-emerald-500" },
};

export const SearchHistory = () => {
  const { data: history = [], isLoading } = useSearchHistory();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-3 pt-0">
        {history.map((item) => {
          const config = typeConfig[item.type] || typeConfig.idea;
          const Icon = config.icon;
          const thumbnailPreview =
            item.type === "thumbnail_ideas"
              ? (item.output_data as any)?.[0]?.imageUrl
              : null;

          return (
            <button
              key={item.id}
              onClick={() => navigate(config.route)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
            >
              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  alt=""
                  className="h-9 w-16 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.input_text || "Untitled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                {config.label}
              </Badge>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
};
