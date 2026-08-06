"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAnalysisHistory } from "@/lib/hooks/use-analysis-history";
import { formatDate } from "@/lib/utils";
import {
  Target,
  Clock,
  ChevronRight,
  TerminalSquare,
  Activity,
} from "lucide-react";

export function HistoryList() {
  const {
    data,
    isLoading,
    isError,
  } = useAnalysisHistory();

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.08,
              duration: 0.35,
            }}
            className="relative h-[76px] overflow-hidden rounded-2xl border border-border/20 bg-card/10 backdrop-blur-sm"
          >
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-muted/20 to-transparent" />
          </motion.div>
        ))}
      </div>
    );
  }

  // Empty State
  if (isError || !data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.45,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-border/40 bg-card/20 px-8 py-24 text-center backdrop-blur-xl"
      >
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/10 p-5">
          <TerminalSquare className="h-10 w-10 text-primary" />
        </div>

        <h2 className="text-2xl font-bold">
          Ledger Empty
        </h2>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          No historical telemetry found.
          Return to the terminal and launch your
          first analysis.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item, i) => (
        <motion.div
          key={item.analysis_uuid}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: i * 0.05,
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <Link
            href={`/analysis/${item.analysis_uuid}`}
            className="group block"
          >
            <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-border/40 bg-card/30 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
              {/* Hover Glow */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              {/* Left */}
              <div className="relative z-10 flex min-w-0 items-center gap-4 pr-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/50 transition-all duration-300 group-hover:scale-105 group-hover:border-primary/30">
                  <Target className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-semibold transition-colors group-hover:text-primary">
                    {item.channel_title ??
                      item.channel_handle ??
                      "Unknown Coordinate"}
                  </h3>

                  {item.channel_handle && (
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {item.channel_handle}
                    </p>
                  )}
                </div>
              </div>

              {/* Right */}
              <div className="relative z-10 flex shrink-0 items-center gap-6">
                <div className="hidden items-end sm:flex sm:flex-col">
                  <span className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    Sync Date
                  </span>

                  <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(item.created_at)}
                  </span>
                </div>

                <div className="hidden h-8 w-px bg-border sm:block" />

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}