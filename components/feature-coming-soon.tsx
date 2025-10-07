import { Sparkles } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface FeatureComingSoonProps {
  className?: string;
}

export default function FeatureComingSoon({ className }: FeatureComingSoonProps) {
  return (
    <Empty className={className ? className : "border border-dashed bg-muted/30"}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Sparkles className="size-6" />
        </EmptyMedia>
        <EmptyTitle>More features are on the way!</EmptyTitle>
        <EmptyDescription>
          We&apos;re actively building this - check back soon for new functionality.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
