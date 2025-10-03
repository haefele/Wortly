"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { Doc, Id } from "@/convex/_generated/dataModel";
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

interface PracticeSessionPageProps {
  params: {
    sessionId: string;
  };
}

type MultipleChoiceInProgress = {
  completed: false;
  _id: Id<"practiceSessions">;
  name: string;
  createdAt: number;
  completedAt: number | null | undefined;
  multipleChoice: {
    wordBox: Doc<"wordBoxes">;
    totalQuestions: number;
    currentQuestionNumber: number;
    currentQuestion: {
      word: string | undefined;
      options: Array<{
        wordId: Id<"words">;
        text: string;
      }>;
      selectedWordId: Id<"words"> | null;
      correctWordId: Id<"words"> | null;
    };
  };
};

type MultipleChoiceCompleted = {
  completed: true;
  _id: Id<"practiceSessions">;
  name: string;
  createdAt: number;
  completedAt: number | null | undefined;
  multipleChoice: {
    wordBox: Doc<"wordBoxes">;
    questions: Array<{
      word: Doc<"words"> | null;
      otherWords: Array<Doc<"words"> | null>;
      selectedWordId: Id<"words"> | null | undefined;
    }>;
  };
};

type MultipleChoiceStatus = MultipleChoiceInProgress | MultipleChoiceCompleted;

type AnswerResult = {
  isCorrect: boolean;
  correctWordId: Id<"words">;
  selectedWordId: Id<"words">;
};

type UseQueryResult<T> =
  | {
      status: "pending";
      data: undefined;
      error: undefined;
      isPending: true;
      isError: false;
      isSuccess: false;
    }
  | {
      status: "success";
      data: T;
      error: undefined;
      isPending: false;
      isError: false;
      isSuccess: true;
    }
  | {
      status: "error";
      data: undefined;
      error: unknown;
      isPending: false;
      isError: true;
      isSuccess: false;
    };

export default function PracticeSessionPage({ params }: PracticeSessionPageProps) {
  const sessionId = params.sessionId as Id<"practiceSessions">;

  const sessionStatus = useQuery(api.practiceSessions.getMultipleChoiceStatus, {
    sessionId,
  }) as UseQueryResult<MultipleChoiceStatus>;
  const answerMultipleChoice = useMutation(api.practiceSessions.answerMultipleChoice);
  const nextQuestion = useMutation(api.practiceSessions.nextQuestionMultipleChoice);

  const [answeringOptionId, setAnsweringOptionId] = useState<Id<"words"> | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const currentQuestionNumber =
    sessionStatus.isSuccess && sessionStatus.data.completed === false
      ? sessionStatus.data.multipleChoice.currentQuestionNumber
      : null;

  const currentQuestionState =
    sessionStatus.isSuccess && sessionStatus.data.completed === false
      ? sessionStatus.data.multipleChoice.currentQuestion
      : null;

  const answerResult: AnswerResult | null = currentQuestionState?.selectedWordId
    ? {
        selectedWordId: currentQuestionState.selectedWordId,
        correctWordId:
          currentQuestionState.correctWordId ?? currentQuestionState.selectedWordId,
        isCorrect:
          currentQuestionState.correctWordId !== null
            ? currentQuestionState.selectedWordId === currentQuestionState.correctWordId
            : true,
      }
    : null;

  useEffect(() => {
    setAnsweringOptionId(null);
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
          message={getErrorMessage(sessionStatus.isError ? sessionStatus.error : undefined, "Practice session not found.")}
        />
      </PageContainer>
    );
  }

  const session = sessionStatus.data;

  const handleSelectOption = async (wordId: Id<"words">) => {
    if (session.completed || answerResult || answeringOptionId) {
      return;
    }

    setAnsweringOptionId(wordId);
    try {
      const result = await answerMultipleChoice({ sessionId, selectedWordId: wordId });
      if (!result.isCorrect) {
        toast.warning("Not quite right. Review the correct answer before continuing.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to submit answer."));
    } finally {
      setAnsweringOptionId(null);
    }
  };

  const handleNextQuestion = async () => {
    if (session.completed || !answerResult) {
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

  return (
    <PageContainer
      title={session.name}
      description={`Multiple choice • ${session.multipleChoice.wordBox.name}`}
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
            answerResult={answerResult}
            answeringOptionId={answeringOptionId}
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
  answerResult,
  answeringOptionId,
  advancing,
  onSelectOption,
  onNextQuestion,
}: {
  session: MultipleChoiceInProgress;
  answerResult: AnswerResult | null;
  answeringOptionId: Id<"words"> | null;
  advancing: boolean;
  onSelectOption: (wordId: Id<"words">) => void;
  onNextQuestion: () => void;
}) {
  const totalQuestions = session.multipleChoice.totalQuestions;
  const currentNumber = session.multipleChoice.currentQuestionNumber;
  const isLastQuestion = currentNumber >= totalQuestions;
  const answeredCount = Math.min(totalQuestions, currentNumber - 1 + (answerResult ? 1 : 0));
  const progressValue = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

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
            {session.multipleChoice.currentQuestion.word ?? "Practice prompt"}
          </CardTitle>
          <CardDescription>
            Choose the correct translation from the options below.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {session.multipleChoice.currentQuestion.options.map(option => {
            const isSelected = answerResult?.selectedWordId === option.wordId;
            const isCorrect = answerResult?.correctWordId === option.wordId;
            const disabled = Boolean(answerResult) || Boolean(answeringOptionId);

            return (
              <Button
                key={option.wordId}
                type="button"
                variant="outline"
                className={cn(
                  "justify-start whitespace-normal text-left",
                  isCorrect && answerResult && "border-emerald-500/70 bg-emerald-500/10 text-emerald-600",
                  isSelected && !isCorrect && answerResult && "border-destructive/70 bg-destructive/10 text-destructive",
                  answerResult && !isCorrect && !isSelected && "opacity-75"
                )}
                disabled={disabled}
                onClick={() => onSelectOption(option.wordId)}
              >
                {answerResult ? (
                  isCorrect ? (
                    <CheckCircle2 className="text-emerald-500" />
                  ) : isSelected ? (
                    <XCircle className="text-destructive" />
                  ) : (
                    <Circle className="text-muted-foreground" />
                  )
                ) : answeringOptionId === option.wordId ? (
                  <Loader2 className="animate-spin text-muted-foreground" />
                ) : (
                  <Circle className="text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{option.text}</span>
              </Button>
            );
          })}
        </div>

        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-sm">
          {answerResult ? (
            answerResult.isCorrect ? (
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
        <span className="text-xs text-muted-foreground">
          {answeredCount} of {totalQuestions} questions answered
        </span>
        <Button onClick={onNextQuestion} disabled={!answerResult || advancing}>
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

function CompletedView({ session }: { session: MultipleChoiceCompleted }) {
  const router = useRouter();
  const startMultipleChoice = useMutation(api.practiceSessions.startMultipleChoice);
  const [isRestarting, setIsRestarting] = useState(false);
  const questions = session.multipleChoice.questions;
  const totalQuestions = questions.length;
  const totalCorrect = questions.filter(question => {
    const correctId = question.word?._id;
    return correctId && question.selectedWordId === correctId;
  }).length;
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const handleRestart = async () => {
    try {
      setIsRestarting(true);
      const newSessionId = await startMultipleChoice({
        wordBoxId: session.multipleChoice.wordBox._id,
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
              {session.multipleChoice.wordBox.name}
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
            const correctWord = question.word;
            const allOptions = [question.word, ...question.otherWords].filter(Boolean) as Doc<"words">[];
            const selectedWord = allOptions.find(option => option._id === question.selectedWordId) ?? null;
            const isCorrect = correctWord?._id && question.selectedWordId === correctWord._id;
            const correctAnswer = correctWord ? getPreferredTranslation(correctWord) : "Word unavailable";
            const selectedAnswer = selectedWord
              ? getPreferredTranslation(selectedWord)
              : "Not answered";

            return (
              <div
                key={`${question.word?._id ?? index}-${index}`}
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
                    <h3 className="text-lg font-semibold">
                      {correctWord?.word ?? "Word removed"}
                    </h3>
                  </div>
                  <Badge variant={isCorrect ? "secondary" : "destructive"}>
                    {isCorrect ? <CheckCircle2 /> : <XCircle />}
                    {isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>
                    <span className="block text-xs uppercase tracking-wide">Your answer</span>
                    <span className={cn(!isCorrect && selectedWord ? "text-destructive" : "")}>{selectedAnswer}</span>
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
            {session.multipleChoice.wordBox.name}
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

function getPreferredTranslation(word: Doc<"words">) {
  return word.translations.en ?? word.translations.ru ?? word.word;
}
