"use client";

import { useState } from "react";
import Link from "next/link";
import { usePaginatedQuery } from "convex-helpers/react";
import {
  GraduationCap,
  Play,
  ArrowRight,
  Loader2,
  Sparkles,
  ChevronDown,
  SquareStack,
  Crown,
  Medal,
  Lightbulb,
  Frown,
  Trophy,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StartPracticeDialog } from "@/components/learn/start-practice-dialog";
import { IconOrb } from "@/components/ui/icon-orb";
import { Id } from "@/convex/_generated/dataModel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
    correctCount: number;
  };
};

const PAGE_SIZE = 8;

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
  const isCompleted = status.kind === "completed";
  const scorePercent = session.multipleChoice.totalQuestions
    ? Math.round(
        (session.multipleChoice.correctCount / session.multipleChoice.totalQuestions) * 100
      )
    : 0;
  const scoreMeta = getScoreGradeMeta(scorePercent);

  const progressPercent = isCompleted
    ? 100
    : Math.round(
        (session.multipleChoice.answeredCount / session.multipleChoice.totalQuestions) * 100
      );

  return (
    <Link href={`/learn/${session._id}`} className="group">
      <Card variant="clickable">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <SquareStack className="h-5 w-5 text-primary" />
              </TooltipTrigger>
              <TooltipContent side="top">Multiple choice</TooltipContent>
            </Tooltip>
            <CardTitle>{session.multipleChoice.wordBoxName}</CardTitle>
          </div>
          <Badge variant={status.badgeVariant} className={status.badgeClassName}>
            {status.label}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isCompleted ? (
              <div
                className={`rounded-lg border p-3 text-xs ${scoreMeta.backgroundClass} ${scoreMeta.borderClass}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                      <scoreMeta.icon className={`h-5 w-5 ${scoreMeta.textClass}`} />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Score
                      </span>
                      <div className={`text-lg font-semibold leading-none ${scoreMeta.textClass}`}>
                        {scorePercent}%
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${scoreMeta.textClass}`}>
                    {scoreMeta.label}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress {progressPercent}%</span>
                  <span>
                    {session.multipleChoice.answeredCount}/{session.multipleChoice.totalQuestions}{" "}
                    answered
                  </span>
                </div>
                <Progress value={progressPercent} />
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-end">
          <span className="text-muted-foreground flex items-center text-xs transition-transform duration-200 group-hover/card:translate-x-1">
            {status.ctaLabel}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

function getSessionStatusMeta(session: PracticeSessionSummary) {
  const hasStarted = session.multipleChoice.answeredCount > 0;

  if (session.completedAt) {
    return {
      kind: "completed" as const,
      label: "Completed",
      badgeVariant: "default" as const,
      badgeClassName: "bg-emerald-500 text-white",
      ctaLabel: "Review results",
    };
  } else if (hasStarted) {
    return {
      kind: "in-progress" as const,
      label: "In progress",
      badgeVariant: "outline" as const,
      badgeClassName: "border-primary text-primary",
      ctaLabel: "Continue practice",
    };
  } else {
    return {
      kind: "not-started" as const,
      label: "Not started",
      badgeVariant: "secondary" as const,
      badgeClassName: "",
      ctaLabel: "Start practice",
    };
  }
}

function getScoreGradeMeta(percent: number) {
  if (percent === 100) {
    return {
      backgroundClass: "bg-yellow-50",
      borderClass: "border-yellow-200",
      textClass: "text-yellow-700",
      label: "Flawless victory!",
      icon: Trophy,
    } as const;
  } else if (percent >= 90) {
    return {
      backgroundClass: "bg-emerald-50",
      borderClass: "border-emerald-200",
      textClass: "text-emerald-700",
      label: "Excellent recall!",
      icon: Crown,
    } as const;
  } else if (percent >= 75) {
    return {
      backgroundClass: "bg-amber-50",
      borderClass: "border-amber-200",
      textClass: "text-amber-700",
      label: "Great progress!",
      icon: Medal,
    } as const;
  } else if (percent >= 50) {
    return {
      backgroundClass: "bg-blue-50",
      borderClass: "border-blue-200/70",
      textClass: "text-blue-700",
      label: "Solid effort",
      icon: Lightbulb,
    } as const;
  } else {
    return {
      backgroundClass: "bg-rose-50",
      borderClass: "border-rose-200",
      textClass: "text-rose-700",
      label: "You can do better!",
      icon: Frown,
    } as const;
  }
}
