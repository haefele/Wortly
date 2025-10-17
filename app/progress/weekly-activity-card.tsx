"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { parseISO, format } from "date-fns";
import { useMemo } from "react";
import { useQuery } from "convex-helpers/react";
import { CalendarRange } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { formatPercent } from "./utils";

const chartConfig = {
  sessionCount: {
    label: "Sessions",
    color: "hsl(var(--primary))",
  },
} as const;

type WeeklyActivityCardProps = {
  className?: string;
};

export function WeeklyActivityCard({ className }: WeeklyActivityCardProps) {
  const result = useQuery(api.progressStats.getWeeklyActivity, {});
  const data = result.data;
  const chartData = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.dailyActivity.map(day => {
      const date = parseISO(day.date);
      const label = format(date, "EEE d");
      const tint =
        day.averageAccuracy >= 80
          ? "hsl(142 76% 36%)" // emerald-600
          : day.averageAccuracy >= 50
            ? "hsl(32 95% 44%)" // amber-500
            : "hsl(0 84% 60%)"; // rose-500

      return {
        ...day,
        label,
        fullDate: format(date, "MMM d, yyyy"),
        fill: tint,
      };
    });
  }, [data]);

  if (result.isPending) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-4 w-60" />
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarRange className="h-5 w-5 text-primary" />
            Weekly activity
          </CardTitle>
          <CardDescription>See when you practiced in the last month.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            We couldn&apos;t load your activity timeline. Please refresh and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarRange className="h-5 w-5 text-primary" />
          Weekly activity
        </CardTitle>
        <CardDescription>Sessions per day across the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.every(entry => entry.sessionCount === 0) ? (
          <div className="border-border/60 rounded-md border p-6 text-center text-sm text-muted-foreground">
            Practice sessions will appear here once you start training.
          </div>
        ) : (
          <ChartContainer className={cn("h-[300px]")} config={chartConfig}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" tickLine={false} />
              <YAxis
                allowDecimals={false}
                stroke="var(--muted-foreground)"
                tickLine={false}
                minTickGap={10}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)" }}
                content={
                  <ChartTooltipContent
                    formatter={value => `${Number(value) || 0} session${Number(value) === 1 ? "" : "s"}`}
                    labelFormatter={(_, payload) => {
                      if (!payload?.length) return "";
                      const [item] = payload;
                      const { fullDate, totalQuestions, averageAccuracy } = item.payload as {
                        fullDate: string;
                        totalQuestions: number;
                        averageAccuracy: number;
                      };
                      return `${fullDate} · ${totalQuestions} questions · ${formatPercent(averageAccuracy, 1)}`;
                    }}
                  />
                }
              />
              <Bar
                dataKey="sessionCount"
                radius={[6, 6, 0, 0]}
                fill="var(--color-sessionCount)"
                className="[&[fill='var(--color-sessionCount)']]:fill-primary"
              >
                {chartData.map(entry => (
                  <Cell key={entry.date} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
