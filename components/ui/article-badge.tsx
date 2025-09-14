"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ArticleBadgeProps {
  article?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ArticleBadge({ article, size = "md", className }: ArticleBadgeProps) {
  if (!article) return null;

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        // Article colors
        {
          "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200": article === "der",
          "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200": article === "die",
          "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200": article === "das",
          "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200": !["der", "die", "das"].includes(article || ""),
        },
        // Size classes
        {
          "px-2 py-1 text-xs": size === "sm",
          "px-3 py-1 text-sm": size === "md",
          "px-4 py-2 text-base": size === "lg",
        },
        // Base styles
        "font-semibold border shadow-sm",
        className
      )}
    >
      {article}
    </Badge>
  );
}
