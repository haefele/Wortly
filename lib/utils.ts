import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ConvexError } from "convex/values";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof ConvexError) {
    return error.data;
  }

  if (fallback) {
    return fallback;
  }

  return error instanceof Error ? error.message : "Unknown error.";
}
