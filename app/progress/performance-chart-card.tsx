"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { useQuery } from "convex-helpers/react";
import { TrendingUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { getMultipleChoiceTypeMeta, type MultipleChoiceType } from "@/app/learn/constants";
import { cn } from "@/lib/utils";
import { formatDateShort, formatPercent } from "./utils";

const chartConfig = {
  accuracy: {
    label: "Accuracy",
    color: "#f97316", // orange-500, matching the primary color
  },
} as const;

type PerformanceChartCardProps = {
  className?: string;
};

export function PerformanceChartCard({ className }: PerformanceChartCardProps) {
  const result = useQuery(api.progressStats.getRecentPerformance, {});
  const data = result.data;
  const chartData = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.sessions.map(session => {
      const typeMeta = session.questionType
        ? getMultipleChoiceTypeMeta(session.questionType as MultipleChoiceType)
        : null;

      return {
        sessionId: session.sessionId,
        date: formatDateShort(session.createdAt),
        accuracy: Number(session.accuracy.toFixed(1)),
        sessionType: typeMeta?.label ?? session.sessionType,
      };
    });
  }, [data]);

  if (result.isPending) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (result.isError || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recent performance
          </CardTitle>
          <CardDescription>See how your accuracy evolves session by session.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            We couldn&apos;t load your recent sessions. Try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Recent performance
        </CardTitle>
        <CardDescription>Your last {chartData.length} sessions by accuracy.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {chartData.length === 0 ? (
          <div className="border-border/50 rounded-md border p-6 text-center text-sm text-muted-foreground">
            Complete some practice sessions to see your accuracy trend.
          </div>
        ) : (
          <ChartContainer className={cn("h-[300px]")} config={chartConfig}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" />
              <YAxis
                stroke="var(--muted-foreground)"
                domain={[0, 100]}
                tickFormatter={value => `${value}%`}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "4 2" }}
                content={
                  <ChartTooltipContent
                    formatter={value => `${Number(value).toFixed(1)}%`}
                    labelFormatter={() => "Accuracy"}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="var(--color-accuracy)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-accuracy)", stroke: "white", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
