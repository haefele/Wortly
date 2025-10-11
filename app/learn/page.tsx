"use client";

import { useState } from "react";
import Link from "next/link";
import { usePaginatedQuery } from "convex-helpers/react";
import { GraduationCap, Play, ArrowRight, Sparkles, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { api } from "@/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StartPracticeDialog } from "./start-practice-dialog";
import { IconOrb } from "@/components/ui/icon-orb";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LearnConstants, getSessionStatusMeta, getScoreGradeMeta } from "./constants";
import { InfiniteScrollSentinel } from "@/components/infinite-scroll-sentinel";
import { SearchingIndicator } from "@/components/searching-indicator";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type PracticeSessionSummary = FunctionReturnType<
  typeof api.practiceSessions.getPracticeSessions
>["page"][number];

const PAGE_SIZE = 24;

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
          <PracticeEmptyState onStart={() => setStartDialogOpen(true)} />
        )}

        {hasSessions && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {practiceSessions.results.map(session => (
                <SessionCard key={session._id} session={session} />
              ))}
            </div>

            {canLoadMore && (
              <InfiniteScrollSentinel onLoadMore={() => practiceSessions.loadMore(PAGE_SIZE)} />
            )}

            {practiceSessions.isLoading && (
              <SearchingIndicator size="sm" className="py-2" label="Loading more sessions..." />
            )}
          </div>
        )}
      </PageContainer>

      <StartPracticeDialog open={startDialogOpen} onOpenChange={setStartDialogOpen} />
    </>
  );
}

function PracticeEmptyState({ onStart }: { onStart: () => void }) {
  return (
    <Card variant="spotlight">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <IconOrb size="lg" icon={Sparkles} />
          </EmptyMedia>
          <EmptyTitle>Ready for your first practice session?</EmptyTitle>
          <EmptyDescription>
            Create a collection of words and challenge yourself with multiple-choice quizzes. Track
            progress, revisit past attempts, and turn vocabulary into lasting knowledge.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
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
        </EmptyContent>
      </Empty>
    </Card>
  );
}

function SessionCard({
  session,
}: {
  session: PracticeSessionSummary
}) {
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

  const displayDate = session.completedAt ?? session.createdAt;
  const relativeDate = formatDistanceToNow(displayDate, { addSuffix: true });
  const exactDate = format(displayDate, "Pp");

  return (
    <Link href={`/learn/${session._id}`} className="group self-start">
      <Card variant="clickable">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <LearnConstants.MultipleChoiceIcon className="h-5 w-5 text-primary" />
              </TooltipTrigger>
              <TooltipContent side="top">Multiple choice</TooltipContent>
            </Tooltip>
            <CardTitle>{session.multipleChoice.wordBoxName}</CardTitle>
          </div>
          <Badge variant={status.badgeVariant} className={status.badgeClassName}>
            <status.icon className="h-3 w-3" />
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
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {session.multipleChoice.correctCount}/{session.multipleChoice.totalQuestions}{" "}
                      correct
                    </span>
                    <span className={`text-xs font-semibold ${scoreMeta.textClass}`}>
                      {scoreMeta.label}
                    </span>
                  </div>
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
        <CardFooter className="flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{relativeDate}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">{exactDate}</TooltipContent>
          </Tooltip>
          <span className="text-muted-foreground flex items-center text-xs transition-transform duration-200 group-hover/card:translate-x-1">
            {status.ctaLabel}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
