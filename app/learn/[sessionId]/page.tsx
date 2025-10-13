"use client";

import { useCallback, useState } from "react";
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
import { getScoreGradeMeta, getMultipleChoiceVariantMeta, LearnConstants } from "../constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getErrorMessage } from "@/lib/utils";
import { FunctionReturnType } from "convex/server";
import { Spinner } from "@/components/ui/spinner";
import { Kbd } from "@/components/ui/kbd";
import { IconOrb } from "@/components/ui/icon-orb";
import { Progress } from "@/components/ui/progress";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

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

  const variantMeta = getMultipleChoiceVariantMeta(session.multipleChoice.type);

  const answerMultipleChoice = useMutation(api.practiceSessions.answerMultipleChoice);
  const nextQuestion = useMutation(api.practiceSessions.nextQuestionMultipleChoice);

  const [answeringIndex, setAnsweringIndex] = useState<number | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const totalQuestions = session.multipleChoice.totalQuestions;
  const currentNumber = session.multipleChoice.currentQuestionNumber;
  const isLastQuestion = currentNumber >= totalQuestions;
  const progressValue =
    totalQuestions > 0 ? Math.round(((currentNumber - 1) / totalQuestions) * 100) : 0;
  const answered = session.multipleChoice.currentQuestion.selectedAnswerIndex !== undefined;

  const questionStatuses = session.multipleChoice.questionStatuses;
  const answeredCount = questionStatuses.filter(s => s !== "unanswered").length;
  const correctCount = questionStatuses.filter(s => s === "correct").length;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  const handleSelectOption = useCallback(
    async (answerIndex: number) => {
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
    },
    [session, answeringIndex, answerMultipleChoice]
  );

  const handleNextQuestion = useCallback(async () => {
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
  }, [session, nextQuestion]);

  useKeyboardShortcuts(e => {
    // Number keys for selecting answers (1-9)
    const numKey = parseInt(e.key);
    if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
      const index = numKey - 1;
      if (
        index >= 0 &&
        index < session.multipleChoice.currentQuestion.options.length &&
        !answered &&
        answeringIndex === null
      ) {
        e.preventDefault();
        handleSelectOption(index);
      }
    }

    // Enter key for next question
    if (e.key === "Enter" && answered && !advancing) {
      e.preventDefault();
      handleNextQuestion();
    }
  });

  return (
    <PageContainer
      title={session.multipleChoice.wordBoxName}
      description={variantMeta.label}
      icon={LearnConstants.MultipleChoiceIcon}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Progress Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-x-3 text-sm">
              <span className="font-medium text-foreground">
                Question {currentNumber} of {totalQuestions}
              </span>
              {answeredCount > 0 && (
                <span className="text-muted-foreground">
                  {correctCount} correct · {accuracy}%
                </span>
              )}
            </div>
            <Progress value={progressValue} />
          </CardHeader>
        </Card>

        {/* Question Card */}
        <Card>
          <CardHeader className="space-y-2.5">
            <CardTitle className="text-2xl sm:text-3xl font-bold">
              {session.multipleChoice.currentQuestion.question ?? "Practice prompt"}
            </CardTitle>
            <CardDescription>{variantMeta.instruction}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Answer Options */}
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
              {session.multipleChoice.currentQuestion.options.map((option, index) => (
                <AnswerButton
                  key={index}
                  session={session}
                  option={option}
                  index={index}
                  answeringIndex={answeringIndex}
                  onClick={() => handleSelectOption(index)}
                />
              ))}
            </div>

            {/* Feedback Section */}
            <AnswerFeedback session={session} />
          </CardContent>
          <CardFooter className="justify-end">
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
                  <Kbd>↵</Kbd>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
}

function AnswerButton({
  session,
  option,
  index,
  answeringIndex,
  onClick,
}: {
  session: MultipleChoiceStatus;
  option: string;
  index: number;
  answeringIndex: number | null;
  onClick: () => void;
}) {
  if (session.completed) {
    throw new Error("Practice session already completed.");
  }

  // Derive state from props
  const isSelected = index === session.multipleChoice.currentQuestion.selectedAnswerIndex;
  const isCorrect = index === session.multipleChoice.currentQuestion.correctAnswerIndex;
  const answered = session.multipleChoice.currentQuestion.selectedAnswerIndex !== undefined;
  const disabled = answeringIndex !== null;
  const isAnswering = answeringIndex === index;

  // Determine button styling based on state
  const getButtonClassName = () => {
    const baseStyles =
      "h-auto min-h-[56px] sm:min-h-[60px] justify-start px-4 py-3 sm:px-5 sm:py-4 text-left";

    // After answering: correct answer
    if (answered && isCorrect) {
      return `${baseStyles} border-2 border-emerald-500 bg-emerald-500/10 pointer-events-none`;
    }

    // After answering: user's wrong answer
    if (answered && isSelected && !isCorrect) {
      return `${baseStyles} border-2 border-destructive bg-destructive/10 pointer-events-none`;
    }

    // After answering: other options (faded)
    if (answered) {
      return `${baseStyles} opacity-40 pointer-events-none`;
    }

    // Before answering: interactive state
    return `${baseStyles} hover:border-primary`;
  };

  // Determine which icon to show
  const renderIcon = () => {
    if (answered && isCorrect) {
      return <CheckCircle2 className="size-5 text-emerald-600" />;
    } else if (answered && isSelected) {
      return <XCircle className="size-5 text-destructive" />;
    } else if (!answered && isAnswering) {
      return <Spinner className="size-5" />;
    } else if (!answered) {
      return <Circle className="size-5 text-muted-foreground" />;
    } else {
      return <Circle className="size-5 opacity-40" />;
    }
  };

  return (
    <Button
      variant="outline"
      size="lg"
      className={cn(getButtonClassName(), "relative")}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="flex-shrink-0">{renderIcon()}</span>
      <span className="flex-1 text-base font-medium pr-8">{option}</span>
      {!answered && index < 9 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Kbd>{index + 1}</Kbd>
        </div>
      )}
    </Button>
  );
}

function AnswerFeedback({ session }: { session: MultipleChoiceStatus }) {
  if (session.completed) {
    throw new Error("Practice session already completed.");
  }

  const answered = session.multipleChoice.currentQuestion.selectedAnswerIndex !== undefined;
  const isCorrect =
    session.multipleChoice.currentQuestion.selectedAnswerIndex ===
    session.multipleChoice.currentQuestion.correctAnswerIndex;

  // Don't show anything until answered
  if (!answered) {
    return null;
  }

  if (isCorrect) {
    return (
      <div className="rounded-xl bg-card border p-6 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-5">
          <IconOrb
            icon={CheckCircle2}
            size="lg"
            className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-500"
          />
          <div>
            <p className="text-xl font-bold text-foreground">Correct!</p>
            <p className="text-sm text-muted-foreground">Great job, keep it up.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border p-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-5">
        <IconOrb icon={XCircle} size="lg" className="bg-destructive/15 text-destructive" />
        <div>
          <p className="text-xl font-bold text-foreground">Not quite right</p>
          <p className="text-sm text-muted-foreground">
            Review the correct answer before moving on.
          </p>
        </div>
      </div>
    </div>
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
  const variantMeta = getMultipleChoiceVariantMeta(session.multipleChoice.type);

  const handleRestart = async () => {
    if (!session.multipleChoice.wordBoxId) return;

    try {
      setIsRestarting(true);
      const newSessionId = await startMultipleChoice({
        wordBoxId: session.multipleChoice.wordBoxId,
        questionCount: totalQuestions,
        type: session.multipleChoice.type,
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
      description={variantMeta.label}
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
              const promptText = question.question;
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
                        <h3 className="text-xl font-bold">{promptText ?? "Prompt removed"}</h3>
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
