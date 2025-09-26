import { cva, type VariantProps } from "class-variance-authority";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const containerVariants = cva("text-center text-muted-foreground", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const skeletonVariants = cva("rounded-full", {
  variants: {
    size: {
      sm: "h-3 w-3",
      md: "h-4 w-4",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

interface SearchingIndicatorProps extends VariantProps<typeof containerVariants> {
  label?: string;
  className?: string;
}

export function SearchingIndicator({
  label = "Searching...",
  className,
  size,
}: SearchingIndicatorProps) {
  return (
    <div className={cn(containerVariants({ size }), className)}>
      <div className="flex items-center justify-center space-x-2">
        <Skeleton className={skeletonVariants({ size })} />
        <span>{label}</span>
      </div>
    </div>
  );
}
