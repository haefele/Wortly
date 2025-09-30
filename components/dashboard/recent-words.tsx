"use client";

import { useQuery } from "convex-helpers/react";
import { api } from "@/convex/_generated/api";
import { WordCard } from "./word-card";
import { Plus } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

interface RecentWordsProps {
  onAddToLibrary?: (word: Doc<"words">) => void;
}

export function RecentWords({ onAddToLibrary }: RecentWordsProps) {
  const recentWordsResult = useQuery(api.words.getRecentWords);

  if (recentWordsResult.isPending) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold">Recent Words</h2>
          <div className="h-px bg-gradient-to-r from-border to-transparent flex-1"></div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-muted/20 rounded-2xl h-48 border border-border/30"
            />
          ))}
        </div>
      </div>
    );
  }

  if (recentWordsResult.isSuccess && recentWordsResult.data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold">Recent Words</h2>
          <div className="h-px bg-gradient-to-r from-border to-transparent flex-1"></div>
        </div>
        <div className="bg-gradient-to-br from-muted/20 to-muted/5 rounded-2xl border border-border/30 p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-muted/40 rounded-full mx-auto flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold">No words available yet</p>
              <p className="text-muted-foreground">
                Search for German words above to start building your vocabulary
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (recentWordsResult.isSuccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold">Recent Words</h2>
            <div className="h-px bg-gradient-to-r from-border to-transparent flex-1"></div>
          </div>
          <span className="text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
            {recentWordsResult.data.length} word{recentWordsResult.data.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recentWordsResult.data.map((word: Doc<"words">) => (
            <WordCard key={word._id} word={word} onAddToLibrary={onAddToLibrary} />
          ))}
        </div>
      </div>
    );
  }
}
