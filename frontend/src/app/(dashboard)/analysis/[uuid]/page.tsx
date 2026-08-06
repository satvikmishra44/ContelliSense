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
import { AlertTriangle, Sparkles, Activity, FileVideo } from "lucide-react";
import { useAnalysisDetail } from "@/lib/hooks/use-analysis-detail";
import { ChannelOverviewCard } from "@/components/dashboard/channel-overview-card";
import { VideoAnalyticsTable } from "@/components/dashboard/video-analytics-table";
import { EngagementChart } from "@/components/charts/engagement-chart";
import { TrendDashboard } from "@/components/dashboard/trend-dashboard";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";

export default function AnalysisDetailPage() {
  const params = useParams<{ uuid: string }>();
  const { data, isLoading, isError, error } = useAnalysisDetail(params.uuid);

  if (isLoading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-16">
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className={
              i === 1
                ? "h-10 w-64"
                : i === 2
                ? "h-40 w-full rounded-[1.5rem]"
                : "h-20 w-full rounded-[1.5rem]"
            }
          />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto mt-12"
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
      className="space-y-10 pb-16 w-full max-w-[1600px] mx-auto overflow-hidden"
    >
      {/* Cinematic Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/30 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Agent Briefing Ready
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Strategic Topography{" "}
            <span className="ml-2 text-xs font-mono text-muted-foreground">
              REF: {refCode}
            </span>
          </h1>
        </div>
      </div>

      {/* Top Level Telemetry */}
      <div className="relative z-10">
        <ChannelOverviewCard channel={data.channel} />
      </div>

      {/* Segmented Intelligence Views */}
      <Tabs defaultValue="recommendations" className="flex flex-col w-full">
        {/* Sub-Navbar */}
        <div className="w-full border-b border-border/40 mb-8 overflow-x-auto no-scrollbar">
          <TabsList className="flex flex-row w-max min-w-full justify-start bg-transparent border-0 h-auto p-0 gap-8">
            <TabsTrigger
              value="recommendations"
              className="group relative h-12 rounded-none border-b-2 border-transparent px-2 pb-3 pt-4 font-mono text-[13px] font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground whitespace-nowrap transition-all uppercase tracking-widest"
            >
              <Sparkles className="h-4 w-4 mr-2 opacity-50 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary" />
              Directives
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="group relative h-12 rounded-none border-b-2 border-transparent px-2 pb-3 pt-4 font-mono text-[13px] font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground whitespace-nowrap transition-all uppercase tracking-widest"
            >
              <Activity className="h-4 w-4 mr-2 opacity-50 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary" />
              Market Velocity
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="group relative h-12 rounded-none border-b-2 border-transparent px-2 pb-3 pt-4 font-mono text-[13px] font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground whitespace-nowrap transition-all uppercase tracking-widest"
            >
              <FileVideo className="h-4 w-4 mr-2 opacity-50 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary" />
              Historical Ledger
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab contents */}
        <AnimatePresence mode="wait">
          <TabsContent
            value="recommendations"
            className="m-0 focus-visible:outline-none w-full"
          >
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
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

          <TabsContent
            value="trends"
            className="m-0 focus-visible:outline-none w-full"
          >
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <TrendDashboard trends={data.trends} />
            </motion.div>
          </TabsContent>

          <TabsContent
            value="videos"
            className="m-0 focus-visible:outline-none w-full space-y-6"
          >
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid gap-6"
            >
              <div className="rounded-[1.5rem] border border-border/40 bg-card/20 p-6 backdrop-blur-xl">
                <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
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