"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalysisHistory } from "@/lib/hooks/use-analysis-history";
import { formatDate } from "@/lib/utils";
import { ArrowRight, FolderOpen } from "lucide-react";

export function HistoryList() {
  const { data, isLoading, isError } = useAnalysisHistory();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full skeleton-shimmer" />
        ))}
      </div>
    );
  }

  if (isError || !data || data.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-16 text-muted-foreground">
        <FolderOpen className="h-10 w-10 mb-4 text-muted-foreground/50" />
        <h3 className="font-display text-base text-foreground">No analyses yet</h3>
        <p className="mt-1 text-sm max-w-sm">
          Run your first channel analysis from the dashboard to see it appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <Link key={item.analysis_uuid} href={`/analysis/${item.analysis_uuid}`}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">
                  {item.channel_title || item.channel_handle || "Untitled channel"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(item.created_at)}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}