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
  Clock,
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
  const isCompleted = Boolean(session.completedAt);
  const totalQuestions = session.multipleChoice.totalQuestions;
  const answeredCount = session.multipleChoice.answeredCount;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const createdAt = formatTimestamp(session.createdAt);
  const completedAt = session.completedAt ? formatTimestamp(session.completedAt) : null;
  const collectionName = session.multipleChoice.wordBoxName || "Collection unavailable";
  const statusText = isCompleted
    ? completedAt
      ? `Completed ${completedAt}`
      : "Completed"
    : `Started ${createdAt}`;
  const sessionTitle = session.multipleChoice.wordBoxName;

  return (
    <Link href={`/learn/${session._id}`} className="group">
      <Card variant="clickable" className="h-full">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <BookOpenCheck /> Multiple choice
            </Badge>
            <StatusBadge isCompleted={isCompleted} />
          </div>
          <CardTitle className="text-xl">{sessionTitle}</CardTitle>
          <p className="text-sm font-medium text-muted-foreground">{collectionName}</p>
          <CardDescription>{statusText}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {answeredCount}/{totalQuestions} answered
              </span>
            </div>
            <Progress value={isCompleted ? 100 : progress} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{createdAt}</span>
            {completedAt && (
              <>
                <span className="text-border">•</span>
                <span>{completedAt}</span>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-between text-xs text-muted-foreground">
          <span>{isCompleted ? "Review results" : "Continue practice"}</span>
          <span className="flex items-center gap-1 transition-transform duration-200 group-hover:translate-x-1">
            Open <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

function StatusBadge({ isCompleted }: { isCompleted: boolean }) {
  if (isCompleted) {
    return (
      <Badge variant="default" className="bg-emerald-500/90 text-white shadow-none">
        Completed
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-primary/40 text-primary">
      In progress
    </Badge>
  );
}

function formatTimestamp(value: number) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return formatter.format(new Date(value));
}
