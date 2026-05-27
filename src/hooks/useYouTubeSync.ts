import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";

export const useYouTubeSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelInput: string) => {
      const { data, error } = await supabase.functions.invoke("youtube-sync", {
        body: { channelInput },
      });
      if (error) {
        const msg = await extractEdgeFunctionError(error);
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};
