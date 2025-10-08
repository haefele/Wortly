import { SquareStack, type LucideIcon } from "lucide-react";

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
    description: "Test your vocabulary by choosing the correct translation from multiple options.",
    icon: SquareStack,
  },
];

export const LearnConstants = {
  MultipleChoiceIcon: SquareStack,
} as const;
