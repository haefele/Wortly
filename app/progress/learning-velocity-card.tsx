"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { parseISO, format } from "date-fns";
import { useMemo, useId } from "react";
import { useQuery } from "convex-helpers/react";
import { Rocket } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatNumber } from "./utils";

const chartConfig = {
  cumulativeWords: {
    label: "Total words",
    color: "hsl(var(--primary))",
  },
} as const;

type LearningVelocityCardProps = {
  className?: string;
};

export function LearningVelocityCard({ className }: LearningVelocityCardProps) {
  const result = useQuery(api.progressStats.getLearningVelocity, {});
  const data = result.data;
  const chartData = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.dataPoints.map(point => {
      const date = parseISO(point.date);
      return {
        ...point,
        label: format(date, "MMM d"),
        fullLabel: format(date, "'Week of' MMM d"),
      };
    });
  }, [data]);
  const totalWords =
    chartData.length > 0 ? chartData[chartData.length - 1].cumulativeWords : 0;
  const gradientId = useId().replace(/:/g, "");
  const gradientRef = `learningAreaGradient-${gradientId}`;

  if (result.isPending) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (result.isError || !data) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Rocket className="h-5 w-5 text-primary" />
              Learning velocity
            </CardTitle>
            <CardDescription>Track how fast your vocabulary is growing.</CardDescription>
          </div>
          <Badge variant="secondary" className="font-medium">
            All time
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            We couldn&apos;t load your word growth data. Please refresh and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Rocket className="h-5 w-5 text-primary" />
            Learning velocity
          </CardTitle>
          <CardDescription>How your vocabulary has expanded over time.</CardDescription>
        </div>
        <Badge variant="secondary" className="font-medium">
          All time
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-muted-foreground text-sm">
          Cumulative total:{" "}
          <span className="text-foreground font-semibold">{formatNumber(totalWords)} words</span>
        </div>

        {chartData.length === 0 ? (
          <div className="border-border/60 rounded-md border p-6 text-center text-sm text-muted-foreground">
            Add words to your collections to start tracking your growth.
          </div>
        ) : (
          <ChartContainer className="h-[240px]" config={chartConfig}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={gradientRef} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" allowDecimals={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      if (name === "cumulativeWords") {
                        return `${formatNumber(Number(value))} words total`;
                      }
                      if (name === "wordsAddedInPeriod" && item?.payload) {
                        return `${formatNumber(Number(value))} added this period`;
                      }
                      return value;
                    }}
                    labelFormatter={(_, payload) => {
                      if (!payload?.length) return "";
                      const [item] = payload;
                      const { fullLabel } = item.payload as { fullLabel: string };
                      return fullLabel;
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="cumulativeWords"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill={`url(#${gradientRef})`}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
