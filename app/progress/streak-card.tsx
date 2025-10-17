"use client";

import Link from "next/link";
import { Flame, CalendarCheck, CalendarClock } from "lucide-react";
import { useQuery } from "convex-helpers/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StreakCardProps = {
  className?: string;
};

export function StreakCard({ className }: StreakCardProps) {
  const result = useQuery(api.users.getUserStreak, {});

  if (result.isPending) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader className="gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-20" />
          <Skeleton className="h-9 w-40" />
        </CardContent>
      </Card>
    );
  }

  if (result.isError || !result.data) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-primary" />
            Learning streak
          </CardTitle>
          <CardDescription>Track your daily practice momentum.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            We couldn&apos;t load your streak right now. Try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { streakDays, needsPracticeToday } = result.data;
  const isActive = streakDays > 0;

  let subtitle: string;
  let Icon = Flame;
  let iconClassName = "text-primary";

  if (!isActive) {
    subtitle = "Complete a session today to start your streak.";
    Icon = CalendarClock;
    iconClassName = "text-muted-foreground";
  } else if (needsPracticeToday === true) {
    subtitle = "Practice today to keep your streak alive.";
    Icon = CalendarClock;
    iconClassName = "text-amber-500";
  } else if (needsPracticeToday === false) {
    subtitle = "You've already practiced today. Keep the momentum!";
    Icon = CalendarCheck;
    iconClassName = "text-emerald-500";
  } else {
    subtitle = "Keep practicing regularly to maintain your streak.";
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-primary" />
          Current streak
        </CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-end gap-4">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10">
            <Icon className={cn("h-8 w-8", iconClassName)} />
          </div>
          <div>
            <p className="text-4xl font-semibold leading-tight">
              {streakDays}
              <span className="text-muted-foreground ml-2 text-base font-normal">
                day{streakDays === 1 ? "" : "s"}
              </span>
            </p>
            <p className="text-muted-foreground text-sm">
              {isActive ? "Your longest active streak so far." : "Let's get your streak going."}
            </p>
          </div>
        </div>

        {needsPracticeToday === true && (
          <Button className="self-start" asChild>
            <Link href="/learn">Practice now</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
