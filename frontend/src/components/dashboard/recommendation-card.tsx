"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { RecommendationResponse } from "@/lib/api/types";
import { formatPercent } from "@/lib/utils";
import {
  Flame,
  Target,
  Clock,
  Image as ImageIcon,
  Zap,
  ChevronRight,
} from "lucide-react";

// Helper for circular progress
function CircularProgress({ value, label }: { value: number; label: string }) {
  const radius = 16;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="40" height="40" className="text-primary/30">
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="opacity-30"
        />
        <motion.circle
          cx="20"
          cy="20"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          className="text-primary"
        />
      </svg>
      <span className="text-[11px] font-mono text-muted-foreground">
        {clamped.toString().padStart(2, "0")}% {label}
      </span>
    </div>
  );
}

export function RecommendationCard({
  rec,
  index,
}: {
  rec: RecommendationResponse;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border/40 bg-card/40"
    >
      {/* Header Directive */}
      <div className="border-b border-border/30 bg-gradient-to-b from-card/40 to-transparent p-5 pb-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <Badge
            variant="outline"
            className="rounded bg-background/50 border-primary/20 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-primary"
          >
            Directive 0{index + 1}
          </Badge>
          {rec.virality_score && (
            <div className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-[11px] font-bold text-orange-500">
              <Flame className="h-3 w-3" />
              {formatPercent(rec.virality_score)} Upside
            </div>
          )}
        </div>
        <h3 className="font-display text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
          {rec.title}
        </h3>
      </div>

      {/* Content Body */}
      <div className="flex flex-1 flex-col gap-5 p-5">
        {/* Highlighted Hook */}
        {rec.hook && (
          <div className="relative rounded-xl border border-primary/10 bg-primary/[0.03] p-4">
            <Zap className="absolute -top-2 -left-2 h-4 w-4 rounded-full bg-background text-primary" />
            <p className="text-[13px] font-medium italic leading-relaxed text-foreground">
              “{rec.hook}”
            </p>
          </div>
        )}

        <p className="flex-1 text-[13px] leading-relaxed text-muted-foreground">
          {rec.summary}
        </p>

        {/* Telemetry Row */}
        <div className="flex items-center justify-around rounded-xl border-y border-border/30 bg-black/5 py-4 dark:bg-white/5">
          <CircularProgress
            value={Math.round((rec.confidence_score ?? 0) * 100)}
            label="Conf."
          />
          <CircularProgress
            value={Math.round((rec.hit_probability ?? 0) * 100)}
            label="Hit Prob."
          />
          <CircularProgress
            value={Math.round((rec.search_potential ?? 0) * 100)}
            label="Search"
          />
        </div>

        {/* Execution details */}
        <div className="mt-2 space-y-3">
          {rec.thumbnail_idea && (
            <div className="flex items-start gap-2 text-xs">
              <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="leading-relaxed text-muted-foreground">
                <strong className="font-medium text-foreground">Vision:</strong>{" "}
                {rec.thumbnail_idea}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {rec.target_audience && (
              <span className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1">
                <Target className="h-3 w-3" /> {rec.target_audience}
              </span>
            )}
            {rec.publishing_window && (
              <span className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1">
                <Clock className="h-3 w-3" /> {rec.publishing_window}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <button
        type="button"
        className="group/btn flex items-center justify-center border-t border-border/30 bg-card/30 p-4 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <span className="flex items-center gap-1">
          Export Brief
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
        </span>
      </button>
    </motion.div>
  );
}