import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrendSignalResponse } from "@/lib/api/types";
import { TrendMomentumChart } from "@/components/charts/trend-momentum-chart";
import { formatScore } from "@/lib/utils";

export function TrendDashboard({ trends }: { trends: TrendSignalResponse[] }) {
  if (trends.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No strong trend signals were found for this niche right now.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Trend momentum</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendMomentumChart trends={trends} />
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {trends.map((trend) => (
          <Card key={trend.keyword}>
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{trend.keyword}</p>
                <p className="text-xs text-muted-foreground">{trend.region}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  Momentum {formatScore(trend.momentum_score)}
                </Badge>
                <Badge variant="outline">
                  Velocity {trend.velocity_score ?? "—"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}