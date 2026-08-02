"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useAnalysisDetail } from "@/lib/hooks/use-analysis-detail";
import { ChannelOverviewCard } from "@/components/dashboard/channel-overview-card";
import { VideoAnalyticsTable } from "@/components/dashboard/video-analytics-table";
import { EngagementChart } from "@/components/charts/engagement-chart";
import { TrendDashboard } from "@/components/dashboard/trend-dashboard";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { ExcelDownloadButton } from "@/components/dashboard/excel-download-button";

export default function AnalysisDetailPage() {
  const params = useParams<{ uuid: string }>();
  const { data, isLoading, isError, error } = useAnalysisDetail(params.uuid);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 skeleton-shimmer" />
        <Skeleton className="h-40 w-full skeleton-shimmer" />
        <Skeleton className="h-64 w-full skeleton-shimmer" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Could not load analysis</AlertTitle>
        <AlertDescription>
          {(error as Error)?.message ?? "Something went wrong while fetching this report."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-display font-semibold">
          Channel analysis report
        </h1>
        <ExcelDownloadButton uuid={data.analysis_uuid} />
      </div>

      <ChannelOverviewCard channel={data.channel} />

      <Tabs defaultValue="videos">
        <TabsList>
          <TabsTrigger value="videos">Video analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4 mt-4">
          <EngagementChart videos={data.channel.top_videos} />
          <VideoAnalyticsTable videos={data.channel.top_videos} />
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <TrendDashboard trends={data.trends} />
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {data.recommendations.map((rec, idx) => (
              <RecommendationCard key={rec.id ?? `${rec.title}-${idx}`} rec={rec} index={idx} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}