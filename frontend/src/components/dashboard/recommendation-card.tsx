"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecommendationResponse } from "@/lib/api/types";
import { formatPercent } from "@/lib/utils";
import { Flame, Target, Clock } from "lucide-react";

export function RecommendationCard({
  rec,
  index,
}: {
  rec: RecommendationResponse;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-base font-medium leading-snug">
              {rec.title}
            </h3>
            <Badge className="shrink-0 gap-1">
              <Flame className="h-3 w-3" />
              {formatPercent(rec.virality_score)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          {rec.hook && (
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
              "{rec.hook}"
            </p>
          )}

          <p className="text-sm text-foreground">{rec.summary}</p>

          {rec.thumbnail_idea && (
            <div className="rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Thumbnail idea: </span>
              {rec.thumbnail_idea}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border p-2">
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="text-sm font-semibold tabular-nums">
                {formatPercent(rec.confidence_score)}
              </p>
            </div>
            <div className="rounded-md border p-2">
              <p className="text-xs text-muted-foreground">Hit prob.</p>
              <p className="text-sm font-semibold tabular-nums">
                {formatPercent(rec.hit_probability)}
              </p>
            </div>
            <div className="rounded-md border p-2">
              <p className="text-xs text-muted-foreground">Search</p>
              <p className="text-sm font-semibold tabular-nums">
                {formatPercent(rec.search_potential)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-auto pt-2 border-t">
            {rec.target_audience && (
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" /> {rec.target_audience}
              </span>
            )}
            {rec.publishing_window && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {rec.publishing_window}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}