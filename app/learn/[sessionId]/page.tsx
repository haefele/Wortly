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
  CheckCircle2,
  Circle,
  GraduationCap,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow, format, intervalToDuration } from "date-fns";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getScoreGradeMeta, LearnConstants } from "../constants";
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
import { Spinner } from "@/components/ui/spinner";

type MultipleChoiceStatus = FunctionReturnType<typeof api.practiceSessions.getMultipleChoiceStatus>;

export default function PracticeSessionPage() {
  const router = useRouter();

  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId as Id<"practiceSessions">;

  const sessionStatus = useQuery(api.practiceSessions.getMultipleChoiceStatus, {
    sessionId,
  });

  if (sessionStatus.isPending) {
    return (
      <PageContainer icon={GraduationCap} isLoading>
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </PageContainer>
    );
  } else if (sessionStatus.isError) {
    return (
      <PageContainer
        title="Practice session"
        description="We couldn't load this practice session."
        icon={GraduationCap}
      >
        <Card variant="spotlight" className="max-w-2xl">
          <CardContent className="space-y-4 p-8 text-center">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(sessionStatus.error, "Practice session not found.")}
            </p>
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
      </PageContainer>
    );
  } else {
    return sessionStatus.data.completed ? (
      <CompletedView session={sessionStatus.data} />
    ) : (
      <InProgressView session={sessionStatus.data} />
    );
  }
}

function InProgressView({ session }: { session: MultipleChoiceStatus }) {
  if (session.completed) {
    throw new Error("Practice session already completed.");
  }

  const answerMultipleChoice = useMutation(api.practiceSessions.answerMultipleChoice);
  const nextQuestion = useMutation(api.practiceSessions.nextQuestionMultipleChoice);

  const [answeringIndex, setAnsweringIndex] = useState<number | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const currentQuestionNumber = session.multipleChoice.currentQuestionNumber;

  useEffect(() => {
    setAnsweringIndex(null);
  }, [currentQuestionNumber]);

  const handleSelectOption = async (answerIndex: number) => {
    if (
      session.completed ||
      session.multipleChoice.currentQuestion.selectedAnswerIndex !== undefined ||
      answeringIndex !== null
    ) {
      return;
    }

    setAnsweringIndex(answerIndex);
    try {
      await answerMultipleChoice({ sessionId: session._id, selectedAnswerIndex: answerIndex });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to submit answer."));
    } finally {
      setAnsweringIndex(null);
    }
  };

  const handleNextQuestion = async () => {
    if (
      session.completed ||
      session.multipleChoice.currentQuestion.selectedAnswerIndex === undefined
    ) {
      return;
    }

    setAdvancing(true);
    try {
      await nextQuestion({ sessionId: session._id });
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to load the next question."));
    } finally {
      setAdvancing(false);
    }
  };

  const totalQuestions = session.multipleChoice.totalQuestions;
  const currentNumber = session.multipleChoice.currentQuestionNumber;
  const isLastQuestion = currentNumber >= totalQuestions;
  const progressValue =
    totalQuestions > 0 ? Math.round(((currentNumber - 1) / totalQuestions) * 100) : 0;
  const answered = session.multipleChoice.currentQuestion.selectedAnswerIndex !== undefined;
  const disabled = answered || answeringIndex !== null;

  return (
    <PageContainer
      title={session.multipleChoice.wordBoxName}
      description="Multiple choice"
      icon={LearnConstants.MultipleChoiceIcon}
    >
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Question {currentNumber} of {totalQuestions}
            </span>
            <span className="text-sm font-medium text-muted-foreground">{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-2">
          <CardHeader className="space-y-4 pb-6">
            <CardTitle className="text-3xl font-bold leading-tight">
              {session.multipleChoice.currentQuestion.question ?? "Practice prompt"}
            </CardTitle>
            <CardDescription className="text-base">
              Choose the correct translation from the options below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Answer Options */}
            <div className="grid gap-4 sm:grid-cols-2">
              {session.multipleChoice.currentQuestion.options.map((option, index) => {
                const isSelected =
                  index === session.multipleChoice.currentQuestion.selectedAnswerIndex;
                const isCorrect =
                  index === session.multipleChoice.currentQuestion.correctAnswerIndex;

                return (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="lg"
                    className={cn(
                      "h-auto min-h-[60px] justify-start whitespace-normal px-5 py-4 text-left transition-all",
                      !answered && !disabled && "hover:border-primary hover:bg-primary/5",
                      isCorrect &&
                        answered &&
                        "border-2 border-emerald-500 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
                      isSelected &&
                        !isCorrect &&
                        answered &&
                        "border-2 border-destructive bg-destructive/10 text-destructive hover:bg-destructive/10",
                      answered && !isCorrect && !isSelected && "opacity-60"
                    )}
                    disabled={disabled}
                    onClick={() => handleSelectOption(index)}
                  >
                    <span className="flex-shrink-0">
                      {answered ? (
                        isCorrect ? (
                          <CheckCircle2 className="size-5 text-emerald-600" />
                        ) : isSelected ? (
                          <XCircle className="size-5 text-destructive" />
                        ) : (
                          <Circle className="size-5 opacity-40" />
                        )
                      ) : answeringIndex === index ? (
                        <Spinner className="size-5" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground" />
                      )}
                    </span>
                    <span className="text-base font-medium">{option}</span>
                  </Button>
                );
              })}
            </div>

            {/* Feedback Section */}
            {answered ? (
              session.multipleChoice.currentQuestion.selectedAnswerIndex ===
              session.multipleChoice.currentQuestion.correctAnswerIndex ? (
                <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-50 p-5 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-6 flex-shrink-0" />
                    <div>
                      <p className="text-lg font-semibold">Correct!</p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-500">
                        Great job, keep it up.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-5">
                  <div className="flex items-center gap-3 text-destructive">
                    <XCircle className="size-6 flex-shrink-0" />
                    <div>
                      <p className="text-lg font-semibold">Not quite right</p>
                      <p className="text-sm text-muted-foreground">
                        Review the correct answer before moving on.
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Select an answer to check if you&apos;re correct
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end pt-6">
            <Button size="lg" onClick={handleNextQuestion} disabled={!answered || advancing}>
              {advancing ? (
                <>
                  <Spinner className="size-4" />
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
      </div>
    </PageContainer>
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
  const scoreMeta = getScoreGradeMeta(accuracy);

  const handleRestart = async () => {
    if (!session.multipleChoice.wordBoxId) return;

    try {
      setIsRestarting(true);
      const newSessionId = await startMultipleChoice({
        wordBoxId: session.multipleChoice.wordBoxId,
      });
      router.push(`/learn/${newSessionId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to start a new practice session."));
    } finally {
      setIsRestarting(false);
    }
  };

  return (
    <PageContainer
      title={session.multipleChoice.wordBoxName}
      description="Multiple choice"
      icon={LearnConstants.MultipleChoiceIcon}
      headerActions={
        <Button onClick={handleRestart} disabled={isRestarting}>
          {isRestarting ? (
            <>
              <Spinner className="size-4" /> Starting…
            </>
          ) : (
            <>
              <RefreshCcw /> Practice again
            </>
          )}
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
        {/* Hero Success Card */}
        <Card
          className={cn(
            "relative overflow-hidden border-2",
            scoreMeta.borderClass,
            scoreMeta.backgroundClass
          )}
        >
          {/* Decorative gradient overlay */}
          <div className={cn("absolute inset-0 opacity-50", scoreMeta.gradientOverlay)} />

          <CardHeader className="relative space-y-3 text-center py-4">
            {/* Icon with colored background */}
            <div
              className={cn(
                "mx-auto flex h-16 w-16 items-center justify-center rounded-full shadow-lg",
                scoreMeta.iconGradient
              )}
            >
              <scoreMeta.icon className="h-8 w-8 text-white" />
            </div>

            {/* Title and description */}
            <div className="space-y-1">
              <CardTitle className="text-3xl font-extrabold tracking-tight">
                {scoreMeta.label}
              </CardTitle>
              <CardDescription className="text-sm">
                You answered {totalCorrect} out of {totalQuestions} questions correctly!
              </CardDescription>
            </div>

            {/* Large score display with gradient */}
            <div className="flex items-center justify-center">
              <div
                className={cn(
                  "rounded-2xl px-6 py-3 shadow-md text-4xl font-bold text-white",
                  scoreMeta.scoreGradient
                )}
              >
                {accuracy}%
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">
            {/* Stats Grid */}
            <div className="grid gap-4 rounded-xl border bg-background/80 p-4 backdrop-blur-sm sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-1 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Collection
                </p>
                <p className="text-lg font-bold">{session.multipleChoice.wordBoxName}</p>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Questions
                </p>
                <p className="text-lg font-bold">
                  {totalCorrect} / {totalQuestions}
                </p>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Duration
                </p>
                <p className="text-lg font-bold">
                  {session.completedAt
                    ? formatSessionDuration(session.createdAt, session.completedAt)
                    : "—"}
                </p>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Completed
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-lg font-bold">
                      {session.completedAt
                        ? formatDistanceToNow(session.completedAt, { addSuffix: true })
                        : "—"}
                    </p>
                  </TooltipTrigger>
                  {session.completedAt && (
                    <TooltipContent side="bottom">
                      {format(session.completedAt, "Pp")}
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Question breakdown</CardTitle>
            <CardDescription>Review the correct answers and your selections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => {
              const correctWord = question.question;
              const isCorrect = question.selectedAnswerIndex === question.correctAnswerIndex;
              const correctAnswer =
                question.answers[question.correctAnswerIndex]?.text ?? "Unknown";
              const selectedAnswer =
                question.selectedAnswerIndex !== undefined
                  ? (question.answers[question.selectedAnswerIndex]?.text ?? null)
                  : null;

              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-xl border-2 p-5 transition-colors",
                    isCorrect
                      ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-destructive/40 bg-destructive/5 dark:bg-destructive/10"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex size-8 items-center justify-center rounded-full text-sm font-bold shadow-sm",
                            isCorrect
                              ? "bg-emerald-500 text-white"
                              : "bg-destructive text-white dark:bg-orange-600"
                          )}
                        >
                          {index + 1}
                        </span>
                        <h3 className="text-xl font-bold">{correctWord ?? "Word removed"}</h3>
                      </div>
                    </div>
                    <Badge
                      variant="destructive"
                      className={cn("text-sm", isCorrect && "bg-emerald-500 text-white")}
                    >
                      {isCorrect ? <CheckCircle2 /> : <XCircle />}
                      {isCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-4 border-border bg-card">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Your answer
                      </p>
                      <p className="font-semibold">{selectedAnswer}</p>
                    </div>
                    <div className="rounded-lg border p-4 border-border bg-card">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Correct answer
                      </p>
                      <p className="font-semibold">{correctAnswer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function formatSessionDuration(startTime: number, endTime: number) {
  const duration = intervalToDuration({
    start: new Date(startTime),
    end: new Date(endTime),
  });

  const parts: string[] = [];
  if (duration.hours && duration.hours > 0) {
    parts.push(`${duration.hours}h`);
  }
  if (duration.minutes && duration.minutes > 0) {
    parts.push(`${duration.minutes}m`);
  }
  if (duration.seconds && duration.seconds > 0) {
    parts.push(`${duration.seconds}s`);
  }

  return parts.length > 0 ? parts.join(" ") : "< 1s";
}
