"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import type { TrendSignalResponse } from "@/lib/api/types";

export function TrendMomentumChart({ trends }: { trends: TrendSignalResponse[] }) {
  const data = trends.map((t) => ({
    keyword: t.keyword.length > 14 ? t.keyword.slice(0, 14) + "…" : t.keyword,
    momentum: t.momentum_score ?? 0,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="keyword"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <PolarRadiusAxis tick={{ fontSize: 10 }} />
          <Radar
            dataKey="momentum"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.25}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}