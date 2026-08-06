"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { TrendSignalResponse } from "@/lib/api/types";
import { TrendMomentumChart } from "@/components/charts/trend-momentum-chart";
import { formatScore } from "@/lib/utils";
import { Activity, Globe2 } from "lucide-react";

export function TrendDashboard({ trends }: { trends: TrendSignalResponse[] }) {
  if (trends.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-border/40 bg-card/30 p-6 text-sm text-muted-foreground">
        No abnormal market velocity detected in current temporal window.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {/* Radar / Momentum Chart Container */}
      <div className="rounded-[1.5rem] border border-border/40 bg-card/30 p-6 backdrop-blur-xl flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Vector Analysis
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Aggregate momentum profile across isolated growth vectors.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
            <Activity className="h-3 w-3" />
            Active
          </div>
        </div>
        <div className="h-64 w-full">
          <TrendMomentumChart trends={trends} />
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-3">
        <h3 className="mb-4 pl-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Isolated Growth Vectors
        </h3>
        {trends.map((trend, i) => (
          <motion.div
            key={trend.keyword}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="group relative flex flex-col gap-4 rounded-2xl border border-border/40 bg-card/30 p-4 backdrop-blur-sm transition-all hover:bg-card/60 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                {trend.keyword}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Globe2 className="h-3 w-3" /> {trend.region}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="mb-0.5 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Momentum
                </span>
                <Badge
                  variant="secondary"
                  className="rounded-md bg-primary/10 font-mono text-xs text-primary hover:bg-primary/20"
                >
                  {formatScore(trend.momentum_score)}
                </Badge>
              </div>
              <div className="hidden h-8 w-px bg-border/50 sm:block" />
              <div className="flex flex-col items-start sm:items-end">
                <span className="mb-0.5 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Velocity
                </span>
                <Badge
                  variant="outline"
                  className="rounded-md border-border/60 font-mono text-xs"
                >
                  {trend.velocity_score ?? "—"}
                </Badge>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}