"use client";

import { useQuery } from "convex-helpers/react";
import type { FunctionReturnType } from "convex/server";
import { Flame, Trophy, Zap } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "./utils";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription } from "@/components/ui/item";

type PerformanceStreaks = FunctionReturnType<typeof api.progressStats.getPerformanceStreaks>;

type PerformanceStreakCardProps = {
  className?: string;
};

export function PerformanceStreakCard({ className }: PerformanceStreakCardProps) {
  const result = useQuery(api.progressStats.getPerformanceStreaks, {});

  if (result.isPending) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-md" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (result.isError || !result.data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Performance streaks
          </CardTitle>
          <CardDescription>Monitor how consistently you hit your targets.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            We couldn&apos;t load your high-performance streaks. Please refresh the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  const data: PerformanceStreaks = result.data;

  const items = [
    {
      label: "Current streak",
      value: data.currentHighPerformanceStreak,
      icon: Flame,
      hint: "Consecutive sessions above 80% accuracy.",
    },
    {
      label: "Best streak",
      value: data.bestHighPerformanceStreak,
      icon: Trophy,
      hint: "Highest streak in the last 30 days.",
    },
    {
      label: "Perfect sessions",
      value: data.perfectScoreSessions,
      icon: Zap,
      hint: "Sessions with 100% accuracy.",
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Performance streaks
        </CardTitle>
        <CardDescription>Celebrate your high-scoring runs.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {items.map(item => {
            const Icon = item.icon;
            return (
              <Item key={item.label} variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <Icon className="text-primary" />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription>{item.label}</ItemDescription>
                  <ItemTitle className="text-xl">{formatNumber(item.value)}</ItemTitle>
                </ItemContent>
              </Item>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
