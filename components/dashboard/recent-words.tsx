"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WordCard } from "./word-card";
import type { Doc } from "@/convex/_generated/dataModel";

interface RecentWordsProps {
  onAddToLibrary?: (word: Doc<"words">) => void;
}

export function RecentWords({ onAddToLibrary }: RecentWordsProps) {
  const recentWords = useQuery(api.functions.words.getRecentWords);

  if (recentWords === undefined) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Recent Words</h2>
        <div className="text-center text-muted-foreground py-8">
          Loading recent words...
        </div>
      </div>
    );
  }

  if (recentWords.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Recent Words</h2>
        <div className="text-center text-muted-foreground py-8">
          <p>No words available yet</p>
          <p className="text-sm mt-1">Search for German words to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Recent Words</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recentWords.map((word: Doc<"words">) => (
          <WordCard
            key={word._id}
            word={word}
            onAddToLibrary={onAddToLibrary}
          />
        ))}
      </div>
    </div>
  );
}