import { Radar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScanTrends } from "@/hooks/useScanTrends";
import { toast } from "sonner";

export const ScanTrendsButton = () => {
  const scan = useScanTrends();

  const handleScan = () => {
    scan.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(
          `Scan complete — ${data.trendsInserted} trends and ${data.predictionsInserted} predictions found`
        );
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Scan failed");
      },
    });
  };

  return (
    <Button onClick={handleScan} disabled={scan.isPending} variant="outline" className="gap-2">
      {scan.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Radar className="h-4 w-4" />
      )}
      {scan.isPending ? "Scanning..." : "Scan Trends"}
    </Button>
  );
};
