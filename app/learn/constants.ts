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
  type LucideIcon,
} from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

export type PracticeSessionType = "multiple_choice";

export interface PracticeSessionTypeMeta {
  id: PracticeSessionType;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const PRACTICE_SESSION_TYPES: PracticeSessionTypeMeta[] = [
  {
    id: "multiple_choice",
    label: "Multiple choice",
    description: "Match German words and translations in both directions to build recall speed.",
    icon: SquareStack,
  },
];

export const LearnConstants = {
  MultipleChoiceIcon: SquareStack,
} as const;

export type MultipleChoiceVariant =
  | "german_word_choose_translation"
  | "translation_choose_german_word";

export interface MultipleChoiceVariantMeta {
  id: MultipleChoiceVariant;
  label: string;
  description: string;
  instruction: string;
}

export const MULTIPLE_CHOICE_VARIANTS: MultipleChoiceVariantMeta[] = [
  {
    id: "german_word_choose_translation",
    label: "German → Translation",
    description: "See the German word and pick the correct translation.",
    instruction: "Choose the correct translation from the options below.",
  },
  {
    id: "translation_choose_german_word",
    label: "Translation → German",
    description: "See the translation and pick the matching German word.",
    instruction: "Choose the correct German word from the options below.",
  },
];

export function getMultipleChoiceVariantMeta(type: MultipleChoiceVariant) {
  return (
    MULTIPLE_CHOICE_VARIANTS.find(variant => variant.id === type) ?? MULTIPLE_CHOICE_VARIANTS[0]
  );
}

type PracticeSessionSummary = FunctionReturnType<
  typeof api.practiceSessions.getPracticeSessions
>["page"][number];

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
