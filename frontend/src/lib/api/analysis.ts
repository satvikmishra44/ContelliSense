import { apiClient } from "./client";
import type {
  AnalysisCreateResponse,
  AnalysisHistoryItem,
} from "./types";

export async function runFullAnalysis(
  channelUrl: string
): Promise<AnalysisCreateResponse> {
  const { data } = await apiClient.post<AnalysisCreateResponse>(
    "/analysis/full",
    { channel_url: channelUrl }
  );
  return data;
}

export async function getAnalysisByUuid(
  uuid: string
): Promise<AnalysisCreateResponse> {
  const { data } = await apiClient.get<AnalysisCreateResponse>(
    `/analysis/${uuid}`
  );
  return data;
}

export async function getAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
  const { data } = await apiClient.get<AnalysisHistoryItem[]>(
    "/analysis/history"
  );
  return data;
}

export function getExcelDownloadUrl(uuid: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";
  return `${base}/reports/download/${uuid}`;
}