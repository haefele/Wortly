"use client";

import { Boxes, BookOpen, CalendarDays, CheckCircle2, Layers, Notebook, Sparkles } from "lucide-react";
import { useQuery } from "convex-helpers/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "./utils";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription } from "@/components/ui/item";

type OverallStats = FunctionReturnType<typeof api.progressStats.getOverallStats>;

type OverallStatsCardProps = {
  className?: string;
};

export function OverallStatsCard({ className }: OverallStatsCardProps) {
  const result = useQuery(api.progressStats.getOverallStats, {});

  if (result.isPending) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
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
              <Sparkles className="h-5 w-5 text-primary" />
              Learning milestones
            </CardTitle>
            <CardDescription>Overview of everything you&apos;ve achieved so far.</CardDescription>
          </div>
          <Badge variant="secondary" className="font-medium">
            All time
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            We couldn&apos;t load your progress summary. Please refresh and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const data: OverallStats = result.data;

  const stats = [
    {
      label: "Collections",
      value: formatNumber(data.totalWordBoxes),
      icon: Boxes,
    },
    {
      label: "Words saved",
      value: formatNumber(data.totalWords),
      icon: Notebook,
    },
    {
      label: "Sentences",
      value: formatNumber(data.totalSentences),
      icon: BookOpen,
    },
    {
      label: "Practice sessions",
      value: formatNumber(data.totalPracticeSessions),
      icon: Layers,
    },
    {
      label: "Questions answered",
      value: formatNumber(data.totalQuestionsAnswered),
      icon: CheckCircle2,
    },
    {
      label: "Member since",
      value: formatDate(data.memberSince),
      icon: CalendarDays,
    },
  ];

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Learning milestones
          </CardTitle>
          <CardDescription>Your all-time stats across Wortly.</CardDescription>
        </div>
        <Badge variant="secondary" className="font-medium">
          All time
        </Badge>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <Item key={stat.label} variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <Icon className="text-primary" />
                </ItemMedia>
                <ItemContent>
                  <dt>
                    <ItemDescription>{stat.label}</ItemDescription>
                  </dt>
                  <dd>
                    <ItemTitle className="text-xl">{stat.value}</ItemTitle>
                  </dd>
                </ItemContent>
              </Item>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
