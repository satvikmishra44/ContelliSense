"use client";

import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertTriangle, Terminal, Sparkles } from "lucide-react";
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
      <div className="space-y-6 pb-12">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 pb-12"
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Intelligence Sync Failed</AlertTitle>
          <AlertDescription>
            {(error as Error)?.message ??
              "The agent encountered an anomaly while fetching this briefing."}
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  const refCode = data.analysis_uuid.split("-")[0].toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 pb-12"
    >
      {/* Cinematic Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/30 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Agent Briefing Ready
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Strategic Topography
            <span className="ml-2 text-xs font-mono text-muted-foreground">
              REF: {refCode}
            </span>
          </h1>
        </div>
        <ExcelDownloadButton uuid={data.analysis_uuid} />
      </div>

      {/* Top Level Telemetry */}
      <ChannelOverviewCard channel={data.channel} />

      {/* Segmented Intelligence Views */}
      <Tabs defaultValue="recommendations" className="mt-8">
        <div className="flex items-center justify-between border-b border-border/40 mb-6">
          <TabsList className="bg-transparent border-0 h-auto p-0 gap-6">
            <TabsTrigger
              value="recommendations"
              className="group data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-medium text-muted-foreground transition-all uppercase tracking-wider"
            >
              <Sparkles className="h-3.5 w-3.5 mr-2 opacity-50 group-data-[state=active]:opacity-100" />
              Directives
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-medium text-muted-foreground transition-all uppercase tracking-wider"
            >
              Market Velocity
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-medium text-muted-foreground transition-all uppercase tracking-wider"
            >
              Historical Ledger
            </TabsTrigger>
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <TabsContent value="recommendations" className="m-0 focus-visible:outline-none">
            <motion.div
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {data.recommendations.map((rec, idx) => (
                <RecommendationCard
                  key={rec.id ?? `${rec.title}-${idx}`}
                  rec={rec}
                  index={idx}
                />
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="trends" className="m-0 focus-visible:outline-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <TrendDashboard trends={data.trends} />
            </motion.div>
          </TabsContent>

          <TabsContent value="videos" className="m-0 focus-visible:outline-none space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid gap-6"
            >
              <div className="rounded-[1.5rem] border border-border/40 bg-card/20 p-6 backdrop-blur-xl">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
                  Engagement Velocity (Last 10)
                </h3>
                <EngagementChart videos={data.channel.top_videos} />
              </div>
              <VideoAnalyticsTable videos={data.channel.top_videos} />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}