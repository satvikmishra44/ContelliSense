import { useQuery } from "@tanstack/react-query";
import { getAnalysisHistory } from "@/lib/api/analysis";

export function useAnalysisHistory() {
  return useQuery({
    queryKey: ["analysis-history"],
    queryFn: getAnalysisHistory,
    staleTime: 60 * 1000,
  });
}