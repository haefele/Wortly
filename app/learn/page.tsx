"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePaginatedQuery, useQuery } from "convex-helpers/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  GraduationCap,
  Play,
  ArrowRight,
  Loader2,
  BookOpenCheck,
  Sparkles,
  ListChecks,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Id } from "@/convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/utils";

type PracticeSessionSummary = {
  _id: Id<"practiceSessions">;
  _creationTime: number;
  name: string;
  mode: "multiple_choice";
  createdAt: number;
  completedAt?: number | null;
  multipleChoice: {
    totalQuestions: number;
    answeredCount: number;
    currentQuestionIndex?: number | null;
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
          <Button size="lg" variant="gradient" onClick={() => setStartDialogOpen(true)}>
            <Play />
            Start practice session
          </Button>
        }
      >
        {isInitialLoading && <PracticeSessionsSkeleton />}

        {!isInitialLoading && !hasSessions && (
          <EmptyState onStart={() => setStartDialogOpen(true)} />
        )}

        {hasSessions && (
          <div className="space-y-6">
            <SectionHeader
              title="Recent sessions"
              count={practiceSessions.results.length}
              isLoading={
                practiceSessions.isLoading && practiceSessions.status !== "LoadingFirstPage"
              }
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {practiceSessions.results.map(session => (
                <SessionCard key={session._id} session={session} />
              ))}
            </div>

            {canLoadMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
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

function SectionHeader({
  title,
  count,
  isLoading,
}: {
  title: string;
  count: number;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h2 className="text-3xl font-bold">{title}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>
      <span className="flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
        {isLoading && <Loader2 className="animate-spin" />} {count} session{count === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function PracticeSessionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-36" />
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="p-0">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <CardDescription>
                <Skeleton className="mt-2 h-4 w-1/2" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
            <CardFooter className="justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <Card variant="spotlight" className="max-w-3xl">
      <CardContent className="flex flex-col items-center gap-6 p-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
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
          <CardTitle className="text-xl">{session.name}</CardTitle>
          <CardDescription>
            {isCompleted ? `Completed ${completedAt}` : `Started ${createdAt}`}
          </CardDescription>
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

interface StartPracticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StartPracticeDialog({ open, onOpenChange }: StartPracticeDialogProps) {
  const router = useRouter();
  const wordBoxesResult = useQuery(api.wordBoxes.getMyWordBoxes, {});
  const startMultipleChoice = useMutation(api.practiceSessions.startMultipleChoice);

  const [selectedWordBoxId, setSelectedWordBoxId] = useState<Id<"wordBoxes"> | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const firstWordBoxId = wordBoxesResult.isSuccess ? wordBoxesResult.data[0]?._id : undefined;

  useEffect(() => {
    if (firstWordBoxId && !selectedWordBoxId) {
      setSelectedWordBoxId(firstWordBoxId);
    }
  }, [firstWordBoxId, selectedWordBoxId]);

  const wordBoxLabel =
    wordBoxesResult.isSuccess && selectedWordBoxId
      ? (wordBoxesResult.data.find(box => box._id === selectedWordBoxId)?.name ??
        "Select collection")
      : "Select collection";

  const handleStartMultipleChoice = async () => {
    if (!selectedWordBoxId) {
      toast.error("Select a collection to practice.");
      return;
    }

    try {
      setIsStarting(true);
      const sessionId = await startMultipleChoice({ wordBoxId: selectedWordBoxId });
      toast.success("Practice session started.");
      onOpenChange(false);
      router.push(`/learn/${sessionId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to start practice session."));
    } finally {
      setIsStarting(false);
    }
  };

  const noCollections = wordBoxesResult.isSuccess && wordBoxesResult.data.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        if (!value) {
          setIsStarting(false);
        }
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a practice session</DialogTitle>
          <DialogDescription>
            Choose a collection and practice mode to begin reinforcing your vocabulary.
          </DialogDescription>
        </DialogHeader>

        {wordBoxesResult.isPending && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        )}

        {noCollections && (
          <Card variant="spotlight" className="bg-muted/40">
            <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
              <p>You need at least one collection with words before starting practice.</p>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  router.push("/library");
                }}
              >
                <ArrowRight /> Manage collections
              </Button>
            </CardContent>
          </Card>
        )}

        {wordBoxesResult.isSuccess && wordBoxesResult.data.length > 0 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Collection</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between" size="field">
                    {wordBoxLabel}
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                  <DropdownMenuLabel>Choose collection</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={selectedWordBoxId ?? ""}
                    onValueChange={value =>
                      setSelectedWordBoxId(value ? (value as Id<"wordBoxes">) : null)
                    }
                  >
                    {wordBoxesResult.data.map(box => (
                      <DropdownMenuRadioItem key={box._id} value={box._id}>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{box.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {box.wordCount} word{box.wordCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Card className="border-dashed border-primary/40">
              <CardHeader className="space-y-3">
                <Badge variant="secondary" className="self-start">
                  <ListChecks /> Recommended
                </Badge>
                <CardTitle>Multiple choice quiz</CardTitle>
                <CardDescription>
                  Answer quick-fire prompts by picking the correct translation. Ideal for rapid
                  recall and spaced repetition.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={handleStartMultipleChoice} disabled={isStarting}>
                  {isStarting ? (
                    <>
                      <Loader2 className="animate-spin" /> Starting…
                    </>
                  ) : (
                    <>
                      <Play /> Start multiple choice
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isStarting}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
