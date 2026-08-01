"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { VideoResponse } from "@/lib/api/types";

export function EngagementChart({ videos }: { videos: VideoResponse[] }) {
  const data = videos
    .slice(0, 10)
    .reverse()
    .map((v) => ({
      name: v.title.slice(0, 18) + (v.title.length > 18 ? "…" : ""),
      views: v.views ?? 0,
      engagement: v.engagement_rate ? Math.round(v.engagement_rate * 100) : 0,
    }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 40, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            angle={-35}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}