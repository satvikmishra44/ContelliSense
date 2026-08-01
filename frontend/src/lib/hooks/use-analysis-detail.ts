import { useQuery } from "@tanstack/react-query";
import { getAnalysisByUuid } from "@/lib/api/analysis";

export function useAnalysisDetail(uuid: string) {
  return useQuery({
    queryKey: ["analysis", uuid],
    queryFn: () => getAnalysisByUuid(uuid),
    enabled: Boolean(uuid),
    staleTime: 5 * 60 * 1000,
  });
}