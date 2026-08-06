"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type { VideoResponse } from "@/lib/api/types";
import { formatNumber } from "@/lib/utils";

type CustomTooltipProps = {
  active?: boolean;
  payload?: any[];
  label?: string;
};

// Custom premium tooltip
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/40 bg-card/90 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
        <div className="font-medium text-foreground line-clamp-1">{label}</div>
        <div className="mt-1 text-muted-foreground">
          {formatNumber(payload[0].value)} views
        </div>
      </div>
    );
  }
  return null;
};

export function EngagementChart({ videos }: { videos: VideoResponse[] }) {
  const data = videos
    .slice(0, 10)
    .reverse()
    .map((v) => ({
      name: v.title,
      views: v.views ?? 0,
      engagement: v.engagement_rate
        ? Math.round(v.engagement_rate * 100)
        : 0,
    }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
        >
          <XAxis
            dataKey="name"
            hide
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: "hsl(var(--muted-foreground)/0.6)",
              fontFamily: "monospace",
            }}
            tickFormatter={(val: number) => `${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted)/0.3)" }}
            content={<CustomTooltip />}
          />
          <Bar dataKey="views" radius={[6, 6, 6, 6]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill="hsl(var(--primary))"
                fillOpacity={
                  0.15 + (index / Math.max(1, data.length - 1)) * 0.85
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}