"use client";

import { useState } from "react";
import Link from "next/link";
import { usePaginatedQuery } from "convex-helpers/react";
import {
  GraduationCap,
  Play,
  ArrowRight,
  Loader2,
  BookOpenCheck,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageContainer } from "@/components/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StartPracticeDialog } from "@/components/learn/start-practice-dialog";
import { IconOrb } from "@/components/ui/icon-orb";
import { Id } from "@/convex/_generated/dataModel";

type PracticeSessionSummary = {
  _id: Id<"practiceSessions">;
  _creationTime: number;
  mode: "multiple_choice";
  createdAt: number;
  completedAt?: number | null;
  multipleChoice: {
    totalQuestions: number;
    answeredCount: number;
    currentQuestionIndex?: number | null;
    wordBoxName: string;
  };
};

const PAGE_SIZE = 6;

export default function LearnPage() {
  const [startDialogOpen, setStartDialogOpen] = useState(false);

  const practiceSessions = usePaginatedQuery(
    api.practiceSessions.getPracticeSessions,
    {},
    {
      initialNumItems: PAGE_SIZE,
    }
  );

  const isInitialLoading = practiceSessions.status === "LoadingFirstPage";
  const hasSessions = practiceSessions.results.length > 0;
  const canLoadMore = practiceSessions.status === "CanLoadMore";

  return (
    <>
      <PageContainer
        title="Practice"
        description="Review your progress and sharpen your vocabulary recall"
        icon={GraduationCap}
        headerActions={
          <Button onClick={() => setStartDialogOpen(true)}>
            <Play />
            Start practice session
          </Button>
        }
      >
        {!isInitialLoading && !hasSessions && (
          <EmptyState onStart={() => setStartDialogOpen(true)} />
        )}

        {hasSessions && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {practiceSessions.results.map(session => (
                <SessionCard key={session._id} session={session} />
              ))}
            </div>

            {canLoadMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => practiceSessions.loadMore(PAGE_SIZE)}
                  disabled={practiceSessions.isLoading}
                >
                  {practiceSessions.isLoading ? (
                    <>
                      <Loader2 className="animate-spin" /> Loading more
                    </>
                  ) : (
                    <>
                      <ChevronDown /> Load more sessions
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </PageContainer>

      <StartPracticeDialog open={startDialogOpen} onOpenChange={setStartDialogOpen} />
    </>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <Card variant="spotlight">
      <CardContent className="flex flex-col items-center gap-6 p-12 text-center">
        <IconOrb size="lg" icon={Sparkles} />
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold">Ready for your first practice session?</h3>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Create a collection of words and challenge yourself with multiple-choice quizzes. Track
            progress, revisit past attempts, and turn vocabulary into lasting knowledge.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Button size="lg" variant="gradient" onClick={onStart}>
            <Play /> Start practice session
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link href="/library">
              Browse collections
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionCard({ session }: { session: PracticeSessionSummary }) {
  const status = getSessionStatusMeta(session);
  const metrics = getSessionMetrics(session);
  const sessionTitle = session.multipleChoice.wordBoxName || "Practice session";
  const progressPercent = status.kind === "completed" ? 100 : metrics.progressPercent;

  return (
    <Link href={`/learn/${session._id}`} className="group">
      <Card variant="clickable" className="h-full">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <BookOpenCheck /> Multiple choice
            </Badge>
            <StatusBadge status={status} />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl">{sessionTitle}</CardTitle>
            <CardDescription>{status.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Progress <span className="text-border">•</span> {progressPercent}%
              </span>
              <span>
                {metrics.answered}/{metrics.total} answered
              </span>
            </div>
            <Progress value={progressPercent} />
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-end text-sm text-muted-foreground">
          <span className="flex items-center gap-1 font-medium text-foreground">
            {status.ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

type SessionStatusMeta = {
  kind: "completed" | "in-progress";
  label: string;
  badgeVariant: "default" | "outline";
  badgeClassName: string;
  ctaLabel: string;
  description: string;
};

type SessionMetrics = {
  total: number;
  answered: number;
  progressPercent: number;
};

function getSessionStatusMeta(session: PracticeSessionSummary): SessionStatusMeta {
  const metrics = getSessionMetrics(session);

  if (session.completedAt) {
    return {
      kind: "completed" as const,
      label: "Completed",
      badgeVariant: "default",
      badgeClassName: "bg-emerald-500/90 text-white shadow-none",
      ctaLabel: "Review results",
      description: formatStatusDescription("Completed", session.completedAt),
    };
  }

  const hasStarted = metrics.answered > 0;

  return {
    kind: "in-progress" as const,
    label: hasStarted ? "In progress" : "Not started",
    badgeVariant: "outline",
    badgeClassName: "border-primary/40 text-primary",
    ctaLabel: hasStarted ? "Continue practice" : "Start practice",
    description: formatStatusDescription(hasStarted ? "Started" : "Created", session.createdAt),
  };
}

function getSessionMetrics(session: PracticeSessionSummary): SessionMetrics {
  const total = session.multipleChoice.totalQuestions;
  const answered = session.multipleChoice.answeredCount;
  const progressPercent = total > 0 ? Math.round((answered / total) * 100) : 0;

  return {
    total,
    answered,
    progressPercent,
  };
}

function StatusBadge({ status }: { status: SessionStatusMeta }) {
  return (
    <Badge variant={status.badgeVariant} className={status.badgeClassName}>
      {status.label}
    </Badge>
  );
}

function formatStatusDescription(prefix: string, timestamp: number) {
  const absolute = formatTimestamp(timestamp);
  const relative = formatRelativeTimeFromNow(timestamp);

  return `${prefix} ${absolute} • ${relative}`;
}

function formatRelativeTimeFromNow(value: number) {
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const divisions = [
    { amount: 60, unit: "second" as const },
    { amount: 60, unit: "minute" as const },
    { amount: 24, unit: "hour" as const },
    { amount: 7, unit: "day" as const },
    { amount: 4.34524, unit: "week" as const },
    { amount: 12, unit: "month" as const },
    { amount: Infinity, unit: "year" as const },
  ];

  let duration = (value - Date.now()) / 1000;

  if (Math.abs(duration) < 1) {
    return "Just now";
  }

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }

    duration /= division.amount;
  }

  return formatter.format(Math.round(duration), "year");
}

function formatTimestamp(value: number) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return formatter.format(new Date(value));
}
