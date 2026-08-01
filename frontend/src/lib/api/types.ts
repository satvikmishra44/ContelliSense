export interface VideoResponse {
  video_id: string;
  title: string;
  url: string;
  views: number | null;
  likes: number | null;
  engagement_rate: number | null;
  published_at: string | null;
  duration_seconds: number | null;
}

export interface ChannelOverviewResponse {
  channel_id: string;
  handle: string | null;
  username: string | null;
  title: string | null;
  url: string;
  avg_views: number | null;
  avg_engagement_rate: number | null;
  upload_frequency_per_week: number | null;
  top_videos: VideoResponse[];
}

export interface TrendSignalResponse {
  source: string;
  keyword: string;
  category: string | null;
  region: string;
  momentum_score: number | null;
  velocity_score: number | null;
  confidence_score: number | null;
}

export interface RecommendationResponse {
  id: number;
  title: string;
  summary: string;
  hook: string | null;
  thumbnail_idea: string | null;
  target_audience: string | null;
  why_it_should_work: string | null;
  supporting_evidence: string | null;
  trend_explanation: string | null;
  risk_factors: string | null;
  estimated_effort: string | null;
  expected_ctr: number | null;
  search_potential: number | null;
  virality_score: number | null;
  confidence_score: number | null;
  hit_probability: number | null;
  publishing_window: string | null;
}

export interface AnalysisCreateResponse {
  analysis_uuid: string;
  channel: ChannelOverviewResponse;
  trends: TrendSignalResponse[];
  recommendations: RecommendationResponse[];
  report_download_path: string | null;
}

export interface AnalysisHistoryItem {
  analysis_uuid: string;
  channel_title: string | null;
  channel_handle: string | null;
  created_at: string;
  summary: string | null;
}