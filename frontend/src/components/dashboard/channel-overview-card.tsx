import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChannelOverviewResponse } from "@/lib/api/types";
import { formatNumber, formatPercent } from "@/lib/utils";
import { Eye, Heart, CalendarClock } from "lucide-react";

export function ChannelOverviewCard({
  channel,
}: {
  channel: ChannelOverviewResponse;
}) {
  const stats = [
    { label: "Avg. views", value: formatNumber(channel.avg_views), icon: Eye },
    {
      label: "Avg. engagement",
      value: formatPercent(channel.avg_engagement_rate),
      icon: Heart,
    },
    {
      label: "Uploads / week",
      value: channel.upload_frequency_per_week?.toFixed(1) ?? "—",
      icon: CalendarClock,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">
          {channel.title || channel.handle || "Channel overview"}
        </CardTitle>
        <a
          href={channel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          {channel.url}
        </a>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-secondary/30 p-4"
          >
            <stat.icon className="h-4 w-4 text-muted-foreground" />
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}