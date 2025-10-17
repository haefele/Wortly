"use client";

import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus, Target } from "lucide-react";
import { useQuery } from "convex-helpers/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getScoreGradeMeta } from "@/app/learn/constants";
import { formatNumber, formatPercent } from "./utils";

type AverageScore = FunctionReturnType<typeof api.progressStats.getAverageScore>;

type AverageScoreCardProps = {
  className?: string;
};

export function AverageScoreCard({ className }: AverageScoreCardProps) {
  const result = useQuery(api.progressStats.getAverageScore, {});

  if (result.isPending) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-4 w-36" />
        </CardContent>
      </Card>
    );
  }

  if (result.isError || !result.data) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Average accuracy
            </CardTitle>
            <CardDescription>Check how you&apos;re performing across sessions.</CardDescription>
          </div>
          <Badge variant="secondary" className="font-medium">
            Last 30 days
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            We couldn&apos;t load your accuracy trend. Please refresh the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  const data: AverageScore = result.data;
  const roundedAccuracy = Number.isFinite(data.averageAccuracy)
    ? Math.round(data.averageAccuracy)
    : 0;
  const scoreMeta = getScoreGradeMeta(roundedAccuracy);
  const ScoreIcon = scoreMeta.icon;

  let TrendIcon = Minus;
  let trendLabel = "Stable";
  let trendTone = "text-muted-foreground";

  if (data.trend === "up") {
    TrendIcon = ArrowUpRight;
    trendLabel = `${formatPercent(Math.abs(data.trendPercentage), 1)} better`;
    trendTone = "text-emerald-600";
  } else if (data.trend === "down") {
    TrendIcon = ArrowDownRight;
    trendLabel = `${formatPercent(Math.abs(data.trendPercentage), 1)} lower`;
    trendTone = "text-rose-600";
  }

  const subLabel =
    data.trend === "up"
      ? "compared to the previous 30 days"
      : data.trend === "down"
        ? "compared to the previous 30 days"
        : "matching the previous 30 days";

  return (
    <Card className={cn("h-full overflow-hidden", className)}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Average accuracy
          </CardTitle>
          <CardDescription>Based on your last 30 days of practice.</CardDescription>
        </div>
        <Badge variant="secondary" className="font-medium">
          Last 30 days
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            "relative rounded-xl border px-6 py-5 shadow-sm",
            scoreMeta.backgroundClass,
            scoreMeta.borderClass
          )}
        >
          <div
            className={cn(
              "absolute inset-0 opacity-80 pointer-events-none rounded-xl",
              scoreMeta.gradientOverlay
            )}
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className={cn("text-sm font-medium uppercase", scoreMeta.textClass)}>
                {scoreMeta.label}
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "bg-clip-text text-4xl font-semibold leading-none text-transparent",
                    scoreMeta.scoreGradient
                  )}
                >
                  {formatPercent(roundedAccuracy)}
                </span>
                <span className="text-muted-foreground text-sm font-medium">
                  across {formatNumber(data.totalSessions)} session
                  {data.totalSessions === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-white",
                scoreMeta.iconGradient
              )}
            >
              <ScoreIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className={cn("flex items-center gap-1 font-medium", trendTone)}>
            <TrendIcon className="h-4 w-4" />
            {trendLabel}
          </span>
          <span className="text-muted-foreground flex items-center gap-1">
            {subLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
