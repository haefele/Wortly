"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex-helpers/react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getErrorMessage } from "@/lib/utils";
import { FunctionReturnType } from "convex/server";

type MultipleChoiceStatus = FunctionReturnType<typeof api.practiceSessions.getMultipleChoiceStatus>;

export default function PracticeSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId as Id<"practiceSessions">;

  const sessionStatus = useQuery(api.practiceSessions.getMultipleChoiceStatus, {
    sessionId,
  });
  const answerMultipleChoice = useMutation(api.practiceSessions.answerMultipleChoice);
  const nextQuestion = useMutation(api.practiceSessions.nextQuestionMultipleChoice);

  const [answeringIndex, setAnsweringIndex] = useState<number | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const currentQuestionNumber =
    sessionStatus.isSuccess && sessionStatus.data.completed === false
      ? sessionStatus.data.multipleChoice.currentQuestionNumber
      : null;

  const currentQuestionState =
    sessionStatus.isSuccess && sessionStatus.data.completed === false
      ? sessionStatus.data.multipleChoice.currentQuestion
      : null;

  useEffect(() => {
    setAnsweringIndex(null);
  }, [currentQuestionNumber]);

  const isLoading = sessionStatus.isPending;

  if (isLoading) {
    return (
      <PageContainer icon={BookOpenCheck} isLoading>
        <LoadingState />
      </PageContainer>
    );
  }

  if (sessionStatus.isError) {
    return (
      <PageContainer
        title="Practice session"
        description="We couldn’t load this practice session."
        icon={BookOpenCheck}
        headerActions={
          <Button variant="outline" asChild>
            <Link href="/learn">
              <ArrowLeft /> Back to practice
            </Link>
          </Button>
        }
      >
        <ErrorState
          message={getErrorMessage(
            sessionStatus.isError ? sessionStatus.error : undefined,
            "Practice session not found."
          )}
        />
      </PageContainer>
    );
  }

  const session = sessionStatus.data;

  const handleSelectOption = async (answerIndex: number) => {
    if (
      session.completed ||
      currentQuestionState?.selectedAnswerIndex !== undefined ||
      answeringIndex !== null
    ) {
      return;
    }

    setAnsweringIndex(answerIndex);
    try {
      const result = await answerMultipleChoice({ sessionId, selectedAnswerIndex: answerIndex });
      if (!result.isCorrect) {
        toast.warning("Not quite right. Review the correct answer before continuing.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to submit answer."));
    } finally {
      setAnsweringIndex(null);
    }
  };

  const handleNextQuestion = async () => {
    if (session.completed || currentQuestionState?.selectedAnswerIndex === undefined) {
      return;
    }

    setAdvancing(true);
    try {
      const result = await nextQuestion({ sessionId });
      if (result.completed) {
        toast.success("Session completed! View your results below.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to load the next question."));
    } finally {
      setAdvancing(false);
    }
  };

  const headerActions = (
    <Button variant="outline" asChild>
      <Link href="/learn">
        <ArrowLeft /> Back to practice
      </Link>
    </Button>
  );

  const sessionTitle = session.multipleChoice.wordBoxName;

  return (
    <PageContainer
      title={sessionTitle}
      description={`Multiple choice • ${session.multipleChoice.wordBoxName}`}
      icon={BookOpenCheck}
      headerActions={headerActions}
    >
      <div className="space-y-6">
        <SessionMeta session={session} />

        {session.completed ? (
          <CompletedView session={session} />
        ) : (
          <InProgressView
            session={session}
            answeringIndex={answeringIndex}
            advancing={advancing}
            onSelectOption={handleSelectOption}
            onNextQuestion={handleNextQuestion}
          />
        )}
      </div>
    </PageContainer>
  );
}

function InProgressView({
  session,
  answeringIndex,
  advancing,
  onSelectOption,
  onNextQuestion,
}: {
  session: MultipleChoiceStatus;
  answeringIndex: number | null;
  advancing: boolean;
  onSelectOption: (answerIndex: number) => void;
  onNextQuestion: () => void;
}) {
  if (session.completed) {
    throw new Error("Practice session already completed.");
  }

  const totalQuestions = session.multipleChoice.totalQuestions;
  const currentNumber = session.multipleChoice.currentQuestionNumber;
  const isLastQuestion = currentNumber >= totalQuestions;
  const progressValue =
    totalQuestions > 0 ? Math.round(((currentNumber - 1) / totalQuestions) * 100) : 0;
  const answered = session.multipleChoice.currentQuestion.selectedAnswerIndex !== undefined;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="secondary" className="px-3 py-1">
            Question {currentNumber} of {totalQuestions}
          </Badge>
          <span className="text-xs text-muted-foreground">Progress</span>
        </div>
        <Progress value={progressValue} />
        <div className="space-y-2">
          <CardTitle className="text-2xl">
            {session.multipleChoice.currentQuestion.question ?? "Practice prompt"}
          </CardTitle>
          <CardDescription>Choose the correct translation from the options below.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {session.multipleChoice.currentQuestion.options.map((option, index) => {
            const isSelected = index === session.multipleChoice.currentQuestion.selectedAnswerIndex;
            const isCorrect = index === session.multipleChoice.currentQuestion.correctAnswerIndex;
            const disabled = answered || answeringIndex !== null;

            return (
              <Button
                key={index}
                type="button"
                variant="outline"
                className={cn(
                  "justify-start whitespace-normal text-left",
                  isCorrect &&
                    answered &&
                    "border-emerald-500/70 bg-emerald-500/10 text-emerald-600",
                  isSelected &&
                    !isCorrect &&
                    answered &&
                    "border-destructive/70 bg-destructive/10 text-destructive",
                  answered && !isCorrect && !isSelected && "opacity-75"
                )}
                disabled={disabled}
                onClick={() => onSelectOption(index)}
              >
                {answered ? (
                  isCorrect ? (
                    <CheckCircle2 className="text-emerald-500" />
                  ) : isSelected ? (
                    <XCircle className="text-destructive" />
                  ) : (
                    <Circle className="text-muted-foreground" />
                  )
                ) : answeringIndex === index ? (
                  <Loader2 className="animate-spin text-muted-foreground" />
                ) : (
                  <Circle className="text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{option}</span>
              </Button>
            );
          })}
        </div>

        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-sm">
          {answered ? (
            session.multipleChoice.currentQuestion.selectedAnswerIndex ===
            session.multipleChoice.currentQuestion.correctAnswerIndex ? (
              <div className="flex items-center gap-2 font-medium text-emerald-600">
                <CheckCircle2 /> Correct! Keep it up.
              </div>
            ) : (
              <div className="flex flex-col gap-1 text-destructive">
                <div className="flex items-center gap-2 font-medium">
                  <XCircle /> Not quite right.
                </div>
                <span className="text-muted-foreground">
                  Review the correct answer before moving on.
                </span>
              </div>
            )
          ) : (
            <span className="text-muted-foreground">
              Tap an answer to check if you&apos;re correct.
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <Button onClick={onNextQuestion} disabled={!answered || advancing}>
          {advancing ? (
            <>
              <Loader2 className="animate-spin" />
              {isLastQuestion ? "Finishing..." : "Loading..."}
            </>
          ) : (
            <>
              {isLastQuestion ? "Finish session" : "Next question"}
              <ArrowRight />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function CompletedView({ session }: { session: MultipleChoiceStatus }) {
  if (!session.completed) {
    throw new Error("Practice session not completed.");
  }

  const router = useRouter();
  const startMultipleChoice = useMutation(api.practiceSessions.startMultipleChoice);
  const [isRestarting, setIsRestarting] = useState(false);
  const questions = session.multipleChoice.questions;
  const totalQuestions = questions.length;
  const totalCorrect = questions.filter(question => {
    return (
      question.selectedAnswerIndex !== undefined &&
      question.selectedAnswerIndex === question.correctAnswerIndex
    );
  }).length;
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const handleRestart = async () => {
    if (!session.multipleChoice.wordBoxId) return;

    try {
      setIsRestarting(true);
      const newSessionId = await startMultipleChoice({
        wordBoxId: session.multipleChoice.wordBoxId,
      });
      toast.success("New practice session started.");
      router.push(`/learn/${newSessionId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to start a new practice session."));
    } finally {
      setIsRestarting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Great work!</CardTitle>
              <CardDescription>
                You answered {totalCorrect} out of {totalQuestions} questions correctly.
              </CardDescription>
            </div>
            <Badge className="bg-emerald-500/90 text-white">
              <Trophy /> {accuracy}% accuracy
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <span className="block text-xs uppercase tracking-wide">Collection</span>
            <span className="text-foreground font-medium">
              {session.multipleChoice.wordBoxName}
            </span>
          </div>
          <div>
            <span className="block text-xs uppercase tracking-wide">Started</span>
            <span>{formatDateTime(session.createdAt)}</span>
          </div>
          <div>
            <span className="block text-xs uppercase tracking-wide">Completed</span>
            <span>{session.completedAt ? formatDateTime(session.completedAt) : "—"}</span>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleRestart} disabled={isRestarting}>
            {isRestarting ? (
              <>
                <Loader2 className="animate-spin" /> Starting…
              </>
            ) : (
              <>
                <ArrowRight /> Practice again
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question breakdown</CardTitle>
          <CardDescription>Review the correct answers and your selections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question, index) => {
            const correctWord = question.question;
            const isCorrect = question.selectedAnswerIndex === question.correctAnswerIndex;
            const isSelectedAnswer = question.selectedAnswerIndex === index;
            const correctAnswer = question.answers[question.correctAnswerIndex]?.text ?? "Unknown";
            const selectedAnswer =
              question.selectedAnswerIndex !== undefined
                ? (question.answers[question.selectedAnswerIndex]?.text ?? null)
                : null;

            return (
              <div
                key={index}
                className={cn(
                  "rounded-lg border p-4",
                  isCorrect
                    ? "border-emerald-500/60 bg-emerald-500/5"
                    : "border-destructive/40 bg-destructive/5"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Question {index + 1}
                    </p>
                    <h3 className="text-lg font-semibold">{correctWord ?? "Word removed"}</h3>
                  </div>
                  <Badge variant={isCorrect ? "secondary" : "destructive"}>
                    {isCorrect ? <CheckCircle2 /> : <XCircle />}
                    {isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>
                    <span className="block text-xs uppercase tracking-wide">Your answer</span>
                    <span className={cn(!isCorrect && isSelectedAnswer ? "text-destructive" : "")}>
                      {selectedAnswer}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wide">Correct answer</span>
                    <span className="text-foreground font-medium">{correctAnswer}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function SessionMeta({ session }: { session: MultipleChoiceStatus }) {
  const createdAt = formatDateTime(session.createdAt);
  const completedAt = session.completedAt ? formatDateTime(session.completedAt) : null;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary" className="self-start">
            {session.multipleChoice.wordBoxName}
          </Badge>
          <CardDescription>
            {session.completed
              ? completedAt
                ? `Completed ${completedAt}`
                : "Completed"
              : `Started ${createdAt}`}
          </CardDescription>
        </div>
        <Badge
          variant={session.completed ? "secondary" : "outline"}
          className={cn(
            "self-start sm:self-auto",
            session.completed
              ? "bg-emerald-500/90 text-white border-emerald-500"
              : "border-primary/50 text-primary"
          )}
        >
          {session.completed ? "Completed" : "In progress"}
        </Badge>
      </CardHeader>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  const router = useRouter();

  return (
    <Card variant="spotlight" className="max-w-2xl">
      <CardContent className="space-y-4 p-8 text-center">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.refresh()}>
            <RefreshCcw /> Retry
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/learn">
              <ArrowLeft /> Back to practice overview
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}
