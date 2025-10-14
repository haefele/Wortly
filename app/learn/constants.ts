import {
  CheckCircle2,
  Circle,
  CircleDashed,
  Crown,
  Frown,
  Lightbulb,
  Medal,
  SquareStack,
  Trophy,
} from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

type PracticeSessionSummary = FunctionReturnType<
  typeof api.practiceSessions.getPracticeSessions
>["page"][number];
export type PracticeSessionType = PracticeSessionSummary["type"];
export type MultipleChoiceType = PracticeSessionSummary["multipleChoice"]["type"];

export const LearnConstants = {
  MultipleChoiceIcon: SquareStack,
} as const;

export function getPracticeOptions() {
  const meta1 = getMultipleChoiceTypeMeta("german_word_choose_translation");
  const meta2 = getMultipleChoiceTypeMeta("translation_choose_german_word");
  const meta3 = getMultipleChoiceTypeMeta("german_substantive_choose_article");

  return [
    {
      sessionType: "multiple_choice" as PracticeSessionType,
      variant: "german_word_choose_translation" as MultipleChoiceType,
      label: meta1.label,
      description: meta1.description,
      icon: LearnConstants.MultipleChoiceIcon,
    },
    {
      sessionType: "multiple_choice" as PracticeSessionType,
      variant: "translation_choose_german_word" as MultipleChoiceType,
      label: meta2.label,
      description: meta2.description,
      icon: LearnConstants.MultipleChoiceIcon,
    },
    {
      sessionType: "multiple_choice" as PracticeSessionType,
      variant: "german_substantive_choose_article" as MultipleChoiceType,
      label: meta3.label,
      description: meta3.description,
      icon: LearnConstants.MultipleChoiceIcon,
    },
  ] as const;
}

export function getMultipleChoiceTypeMeta(type: MultipleChoiceType) {
  if (type === "german_word_choose_translation") {
    return {
      id: "german_word_choose_translation",
      label: "Multiple choice (German → Translation)",
      description: "See the German word and pick the correct translation.",
      instruction: "Choose the correct translation from the options below.",
    } as const;
  } else if (type === "translation_choose_german_word") {
    return {
      id: "translation_choose_german_word",
      label: "Multiple choice (Translation → German)",
      description: "See the translation and pick the matching German word.",
      instruction: "Choose the correct German word from the options below.",
    } as const;
  } else {
    return {
      id: "german_substantive_choose_article",
      label: "Multiple choice (Noun → Article)",
      description: "See the noun and choose the correct article (der, die, das).",
      instruction: "Pick the correct article.",
    } as const;
  }
}

export function getSessionStatusMeta(session: PracticeSessionSummary) {
  const hasStarted = session.multipleChoice.answeredCount > 0;

  if (session.completedAt) {
    return {
      kind: "completed" as const,
      label: "Completed",
      badgeVariant: "default" as const,
      badgeClassName: "bg-emerald-500 text-white",
      ctaLabel: "Review",
      icon: CheckCircle2,
    };
  } else if (hasStarted) {
    return {
      kind: "in-progress" as const,
      label: "In progress",
      badgeVariant: "outline" as const,
      badgeClassName: "border-primary text-primary",
      ctaLabel: "Continue",
      icon: CircleDashed,
    };
  } else {
    return {
      kind: "not-started" as const,
      label: "Not started",
      badgeVariant: "secondary" as const,
      badgeClassName: "",
      ctaLabel: "Start",
      icon: Circle,
    };
  }
}

export function getScoreGradeMeta(percent: number) {
  if (percent === 100) {
    return {
      backgroundClass: "bg-sky-50",
      borderClass: "border-sky-300",
      textClass: "text-sky-700",
      gradientOverlay: "bg-gradient-to-br from-sky-200 via-transparent to-sky-100",
      iconGradient: "bg-gradient-to-br from-sky-400 to-sky-600",
      scoreGradient: "bg-gradient-to-br from-sky-500 to-sky-600",
      label: "Perfect recall!",
      icon: Trophy,
    } as const;
  } else if (percent >= 90) {
    return {
      backgroundClass: "bg-emerald-50",
      borderClass: "border-emerald-300",
      textClass: "text-emerald-700",
      gradientOverlay: "bg-gradient-to-br from-emerald-200 via-transparent to-emerald-100",
      iconGradient: "bg-gradient-to-br from-emerald-400 to-emerald-600",
      scoreGradient: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      label: "Excellent!",
      icon: Crown,
    } as const;
  } else if (percent >= 75) {
    return {
      backgroundClass: "bg-green-50",
      borderClass: "border-green-200",
      textClass: "text-green-700",
      gradientOverlay: "bg-gradient-to-br from-green-200 via-transparent to-green-100",
      iconGradient: "bg-gradient-to-br from-green-400 to-green-600",
      scoreGradient: "bg-gradient-to-br from-green-500 to-green-600",
      label: "Good job!",
      icon: Medal,
    } as const;
  } else if (percent >= 50) {
    return {
      backgroundClass: "bg-amber-50",
      borderClass: "border-amber-100",
      textClass: "text-amber-700",
      gradientOverlay: "bg-gradient-to-br from-amber-200 via-transparent to-amber-100",
      iconGradient: "bg-gradient-to-br from-amber-400 to-amber-600",
      scoreGradient: "bg-gradient-to-br from-amber-500 to-amber-600",
      label: "Keep going!",
      icon: Lightbulb,
    } as const;
  } else {
    return {
      backgroundClass: "bg-rose-50",
      borderClass: "border-rose-100",
      textClass: "text-rose-700",
      gradientOverlay: "bg-gradient-to-br from-rose-200 via-transparent to-rose-100",
      iconGradient: "bg-gradient-to-br from-rose-400 to-rose-600",
      scoreGradient: "bg-gradient-to-br from-rose-500 to-rose-600",
      label: "Time to review!",
      icon: Frown,
    } as const;
  }
}
