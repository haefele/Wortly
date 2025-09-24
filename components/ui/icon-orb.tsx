import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<{ className?: string }>;

const iconOrbVariants = cva("inline-flex items-center justify-center rounded-full", {
  variants: {
    tone: {
      primary: "bg-primary/10 text-primary shadow-inner shadow-primary/20",
      blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
      yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
      neutral: "bg-muted/60 text-muted-foreground",
    },
    size: {
      sm: "h-10 w-10",
      md: "h-14 w-14",
      lg: "h-16 w-16",
    },
  },
  defaultVariants: {
    tone: "primary",
    size: "md",
  },
});

const iconSizeVariants: Record<NonNullable<IconOrbProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export interface IconOrbProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iconOrbVariants> {
  icon?: IconComponent;
  iconClassName?: string;
}

export function IconOrb({
  className,
  tone,
  size = "md",
  icon,
  iconClassName,
  children,
  ...props
}: IconOrbProps) {
  const Icon = icon;
  const content = Icon ? (
    <Icon className={cn(iconSizeVariants[size ?? "md"], iconClassName)} aria-hidden="true" />
  ) : (
    children
  );

  return (
    <span className={cn(iconOrbVariants({ tone, size, className }))} {...props}>
      {content}
    </span>
  );
}
