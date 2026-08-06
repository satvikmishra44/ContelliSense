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

function CircularProgress({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const radius = 16;
  const circumference = radius * 2 * Math.PI;
  const offset =
    circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-10 w-10">
        <svg
          viewBox="0 0 40 40"
          className="h-10 w-10 -rotate-90"
        >
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-muted/20"
          />

          <motion.circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{
              strokeDashoffset: circumference,
            }}
            animate={{
              strokeDashoffset: offset,
            }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
              delay: 0.4,
            }}
            className="text-primary"
            strokeLinecap="round"
          />
        </svg>

        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
          {value}
        </span>
      </div>

      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
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
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group h-full"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border/40 bg-card/70 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10">
        {/* Header */}

        <div className="border-b border-border/30 bg-gradient-to-b from-card/50 to-transparent p-5 pb-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <Badge
              variant="outline"
              className="rounded uppercase border-primary/20 bg-background/50 px-2 py-0.5 font-mono text-[10px] tracking-widest text-primary"
            >
              Directive {String(index + 1).padStart(2, "0")}
            </Badge>

            {rec.virality_score != null && (
              <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-[11px] font-bold text-orange-500">
                <Flame className="h-3 w-3" />
                {formatPercent(rec.virality_score)} Upside
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold leading-tight transition-colors group-hover:text-primary">
            {rec.title}
          </h3>
        </div>

        {/* Body */}

        <div className="flex flex-1 flex-col gap-5 p-5">
          {rec.hook && (
            <div className="relative rounded-xl border border-primary/10 bg-primary/5 p-4">
              <Zap className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-background text-primary" />

              <p className="text-sm italic leading-relaxed">
                "{rec.hook}"
              </p>
            </div>
          )}

          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
            {rec.summary}
          </p>

          <div className="flex justify-around rounded-xl border-y border-border/30 bg-muted/20 py-4">
            <CircularProgress
              value={Math.round(
                (rec.confidence_score ?? 0) * 100
              )}
              label="Confidence"
            />

            <CircularProgress
              value={Math.round(
                (rec.hit_probability ?? 0) * 100
              )}
              label="Hit"
            />

            <CircularProgress
              value={Math.round(
                (rec.search_potential ?? 0) * 100
              )}
              label="Search"
            />
          </div>

          <div className="space-y-3">
            {rec.thumbnail_idea && (
              <div className="flex items-start gap-2 text-xs">
                <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                <span className="leading-relaxed text-muted-foreground">
                  <strong className="font-medium text-foreground">
                    Vision:
                  </strong>{" "}
                  {rec.thumbnail_idea}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              {rec.target_audience && (
                <span className="flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1">
                  <Target className="h-3 w-3" />
                  {rec.target_audience}
                </span>
              )}

              {rec.publishing_window && (
                <span className="flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1">
                  <Clock className="h-3 w-3" />
                  {rec.publishing_window}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}

        <button
          type="button"
          className="group/button flex items-center justify-center border-t border-border/30 bg-card/30 p-4 transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
            Export Brief
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/button:translate-x-1" />
          </span>
        </button>
      </div>
    </motion.div>
  );
}