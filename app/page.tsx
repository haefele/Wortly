"use client";

import { PageContainer } from "@/components/page-container";
import { WordSearch } from "@/components/dashboard/word-search";
import { RecentWords } from "@/components/dashboard/recent-words";
import { Home } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

export default function DashboardPage() {
  const handleAddToLibrary = (word: Doc<"words">) => {
    // TODO: Implement add to library functionality
    console.log("Adding word to library:", word);
  };

  return (
    <PageContainer title="Dashboard" description="Search and explore German words" icon={Home}>
      {/* Search Interface */}
      <WordSearch />

      {/* Recent Words Section */}
      <RecentWords onAddToLibrary={handleAddToLibrary} />
    </PageContainer>
  );
}
