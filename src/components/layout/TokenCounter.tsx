import { Coins } from "lucide-react";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useNavigate } from "react-router-dom";

export const TokenCounter = () => {
  const { data: balance, isLoading } = useTokenBalance();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/pricing")}
      className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
    >
      <Coins className="h-3.5 w-3.5 text-primary" />
      {isLoading ? "..." : (balance ?? 0).toLocaleString()}
    </button>
  );
};
