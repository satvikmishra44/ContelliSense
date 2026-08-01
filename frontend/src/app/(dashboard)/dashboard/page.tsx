"use client";

import { useRouter } from "next/navigation";
import { ChannelInputForm } from "@/components/dashboard/channel-input-form";
import { AnalysisProgress } from "@/components/dashboard/analysis-progress";
import { useRunAnalysis } from "@/lib/hooks/use-run-analysis";

export default function DashboardPage() {
  const router = useRouter();
  const { mutate, isPending } = useRunAnalysis();

  const handleSubmit = (channelUrl: string) => {
    mutate(channelUrl, {
      onSuccess: (data) => {
        router.push(`/analysis/${data.analysis_uuid}`);
      },
    });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-display font-semibold">New analysis</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Paste any YouTube channel URL. We'll study its content, cross-check trends,
        and generate ranked video ideas.
      </p>

      <div className="mt-6">
        <ChannelInputForm onSubmit={handleSubmit} isPending={isPending} />
      </div>

      <AnalysisProgress active={isPending} />
    </div>
  );
}