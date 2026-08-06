"use client";

import { motion } from "framer-motion";
import type { ChannelOverviewResponse } from "@/lib/api/types";
import { formatNumber, formatPercent } from "@/lib/utils";
import { Eye, Heart, CalendarClock, ExternalLink } from "lucide-react";

export function ChannelOverviewCard({
  channel,
}: {
  channel: ChannelOverviewResponse;
}) {
  const stats = [
    {
      label: "Avg. Baseline Views",
      value: formatNumber(channel.avg_views),
      icon: Eye,
    },
    {
      label: "Engagement Coef.",
      value: formatPercent(channel.avg_engagement_rate),
      icon: Heart,
    },
    {
      label: "Upload Velocity",
      value: `${channel.upload_frequency_per_week?.toFixed(1) ?? "—"} /wk`,
      icon: CalendarClock,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Identity Node */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="md:col-span-2 relative overflow-hidden rounded-[1.5rem] border border-border/50 bg-gradient-to-br from-card to-card/50 p-6 shadow-sm backdrop-blur-xl group"
      >
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase mb-2">
          Target Coordinate
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          {channel.title || channel.handle || "Unknown Entity"}
        </h2>
        {channel.url && (
          <a
            href={channel.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View channel
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </motion.div>

      {/* Telemetry Nodes */}
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.1 + i * 0.1,
            ease: "easeOut",
          }}
          className="relative overflow-hidden rounded-[1.5rem] border border-border/40 bg-card/30 p-5 backdrop-blur-xl flex flex-col justify-center group hover:bg-card/50 transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <stat.icon className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {stat.label}
            </p>
          </div>
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
            {stat.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}