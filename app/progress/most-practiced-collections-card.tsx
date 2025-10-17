"use client";

import { useQuery } from "convex-helpers/react";
import { BarChart3, FolderSearch, Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatNumber, formatPercent, formatRelativeTime } from "./utils";

type MostPracticedCollectionsCardProps = {
  className?: string;
};

export function MostPracticedCollectionsCard({ className }: MostPracticedCollectionsCardProps) {
  const result = useQuery(api.progressStats.getMostPracticedCollections, {});
  const data = result.data;
  const maxSessions = data?.wordBoxes.reduce((max, box) => Math.max(max, box.sessionCount), 0) ?? 0;

  if (result.isPending) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-60" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-md" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (result.isError || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Most practiced collections
          </CardTitle>
          <CardDescription>See which collections you focus on most.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            We couldn&apos;t load your collection activity. Please refresh the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Most practiced collections
        </CardTitle>
        <CardDescription>Top focus areas from the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.wordBoxes.length === 0 ? (
          <div className="border-border/60 rounded-md border p-6 text-center text-sm text-muted-foreground">
            Practice your collections to see what you focus on most.
          </div>
        ) : (
          <ul className="space-y-3">
            {data.wordBoxes.map(box => {
              const progress = maxSessions > 0 ? (box.sessionCount / maxSessions) * 100 : 0;
              return (
                <li key={box.boxId} className="border-border/60 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">{box.boxName}</h4>
                      <p className="text-muted-foreground text-xs">
                        {formatNumber(box.sessionCount)} session{box.sessionCount === 1 ? "" : "s"} ·{" "}
                        {formatNumber(box.totalQuestions)} questions ·{" "}
                        {formatPercent(box.averageAccuracy, 1)} accuracy
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {box.lastPracticedAt ? formatRelativeTime(box.lastPracticedAt) : "No activity"}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <Progress value={progress} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-border/60 flex items-center gap-2 rounded-md border p-3 text-sm">
          {data.unpracticedWordBoxes > 0 ? (
            <>
              <FolderSearch className="h-4 w-4 text-primary" />
              You have {data.unpracticedWordBoxes} collection
              {data.unpracticedWordBoxes === 1 ? "" : "s"} that haven&apos;t been practiced yet.
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-primary" />
              Every collection has been practiced in the last 30 days. Nice balance!
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
