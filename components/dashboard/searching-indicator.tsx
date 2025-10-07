import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

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

const spinnerVariants = cva("text-primary", {
  variants: {
    size: {
      sm: "size-3",
      md: "size-4",
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
        <Spinner className={spinnerVariants({ size })} />
        <span>{label}</span>
      </div>
    </div>
  );
}
