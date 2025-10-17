"use client";

import { useQuery } from "convex-helpers/react";
import type { FunctionReturnType } from "convex/server";
import {
  CheckCircle2,
  FolderPlus,
  MessageCircle,
  MessageSquareText,
  PlusCircle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatPercent, formatRelativeTime } from "./utils";

type RecentActivity = FunctionReturnType<typeof api.progressStats.getRecentActivity>;

type ActivityType = RecentActivity["activities"][number]["type"];
type ActivityDetails = RecentActivity["activities"][number]["details"] & {
  word?: string;
  boxName?: string;
  collectionName?: string;
  accuracy?: number;
  questionCount?: number;
  sentence?: string;
};

const activityMeta: Record<
  ActivityType,
  { icon: typeof CheckCircle2; tone: string; description: (details: ActivityDetails) => string }
> = {
  session_completed: {
    icon: CheckCircle2,
    tone: "text-emerald-500",
    description: details =>
      `Completed practice on ${details.collectionName ?? "a collection"} · ${formatPercent(
        details.accuracy ?? 0,
        1
      )} accuracy (${details.questionCount ?? 0} questions)`,
  },
  word_added: {
    icon: PlusCircle,
    tone: "text-sky-500",
    description: details =>
      `Added "${details.word ?? "word"}" to ${details.boxName ?? "a collection"}`,
  },
  sentence_added: {
    icon: MessageSquareText,
    tone: "text-purple-500",
    description: details =>
      `Added a sentence to ${details.boxName ?? "a collection"}: "${truncate(details.sentence, 48)}"`,
  },
  collection_created: {
    icon: FolderPlus,
    tone: "text-primary",
    description: details => `Created new collection ${details.collectionName ?? ""}`,
  },
};

type RecentActivityCardProps = {
  className?: string;
};

export function RecentActivityCard({ className }: RecentActivityCardProps) {
  const result = useQuery(api.progressStats.getRecentActivity, {});

  if (result.isPending) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
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
              <MessageCircle className="h-5 w-5 text-primary" />
              Recent activity
            </CardTitle>
            <CardDescription>Your latest learning moments.</CardDescription>
          </div>
          <Badge variant="secondary" className="font-medium">
            Live feed
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            We couldn&apos;t load your recent activity. Please refresh the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  const data: RecentActivity = result.data;

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
            Recent activity
          </CardTitle>
          <CardDescription>The latest 10 things you&apos;ve done across Wortly.</CardDescription>
        </div>
        <Badge variant="secondary" className="font-medium">
          Live feed
        </Badge>
      </CardHeader>
      <CardContent>
        {data.activities.length === 0 ? (
          <div className="border-border/60 rounded-md border p-6 text-center text-sm text-muted-foreground">
            Start practicing or adding words to see your activity feed.
          </div>
        ) : (
          <ul className="space-y-3">
            {data.activities.map(activity => {
              const meta = activityMeta[activity.type];
              const Icon = meta.icon;
              const details = (activity.details ?? {}) as ActivityDetails;
              return (
                <li
                  key={`${activity.type}-${activity.timestamp}`}
                  className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10",
                      meta.tone
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">
                      {meta.description(details)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function truncate(text: string | undefined, maxLength: number) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}
