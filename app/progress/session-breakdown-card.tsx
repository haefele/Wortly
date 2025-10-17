"use client";

import { useQuery } from "convex-helpers/react";
import type { FunctionReturnType } from "convex/server";
import { Layers } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMultipleChoiceTypeMeta, type MultipleChoiceType } from "@/app/learn/constants";
import { formatPercent } from "./utils";

type SessionBreakdown = FunctionReturnType<typeof api.progressStats.getSessionBreakdown>;

type SessionBreakdownCardProps = {
  className?: string;
};

export function SessionBreakdownCard({ className }: SessionBreakdownCardProps) {
  const result = useQuery(api.progressStats.getSessionBreakdown, {});

  if (result.isPending) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-36 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (result.isError || !result.data) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5 text-primary" />
              Practice breakdown
            </CardTitle>
            <CardDescription>See where you spend the most time practicing.</CardDescription>
          </div>
          <Badge variant="secondary" className="font-medium">
            Last 30 days
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            We couldn&apos;t load your session breakdown. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const data: SessionBreakdown = result.data;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5 text-primary" />
            Practice breakdown
          </CardTitle>
          <CardDescription>Grouped by the practice modes you used in the last 30 days.</CardDescription>
        </div>
        <Badge variant="secondary" className="font-medium">
          Last 30 days
        </Badge>
      </CardHeader>
      <CardContent>
        {data.byType.length === 0 ? (
          <div className="border-border/60 rounded-md border p-6 text-center text-sm text-muted-foreground">
            Complete a few sessions to see how your practice types compare.
          </div>
        ) : (
          <Table className="min-w-[540px]">
            <TableHeader>
              <TableRow>
                <TableHead>Practice type</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Average accuracy</TableHead>
                <TableHead>Best score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byType.map(entry => {
                const label =
                  entry.practiceSessionType === "multiple_choice" && entry.multipleChoiceType
                    ? getMultipleChoiceTypeMeta(entry.multipleChoiceType as MultipleChoiceType).label
                    : entry.practiceSessionType.replace(/_/g, " ");

                return (
                  <TableRow key={`${entry.practiceSessionType}-${entry.multipleChoiceType ?? "all"}`}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell>{entry.totalSessions}</TableCell>
                    <TableCell>{formatPercent(entry.averageAccuracy, 1)}</TableCell>
                    <TableCell>{formatPercent(entry.bestScore, 1)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableCaption>Only sessions from the last 30 days are included.</TableCaption>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
