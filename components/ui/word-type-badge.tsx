"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WordTypeBadgeProps {
  wordType: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function WordTypeBadge({ wordType, size = "md", className }: WordTypeBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        // Size classes
        {
          "px-2 py-1 text-xs": size === "sm",
          "px-3 py-1 text-sm": size === "md",
          "px-4 py-2 text-base": size === "lg",
        },
        // Base styles
        "bg-muted/50 border-muted-foreground/20 text-muted-foreground font-medium",
        className
      )}
    >
      {wordType}
    </Badge>
  );
}
