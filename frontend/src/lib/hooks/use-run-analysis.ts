import { useMutation } from "@tanstack/react-query";
import { runFullAnalysis } from "@/lib/api/analysis";
import { toast } from "sonner";

export function useRunAnalysis() {
  return useMutation({
    mutationFn: (channelUrl: string) => runFullAnalysis(channelUrl),
    onError: (error: Error) => {
      toast.error("Analysis failed", {
        description: error.message,
      });
    },
    onSuccess: () => {
      toast.success("Analysis complete", {
        description: "Your channel report is ready.",
      });
    },
  });
}