"use client";

import { PageHeader } from "@/components/page-header";
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
    <>
      <PageHeader title="Dashboard" description="Search and explore German words" icon={Home} />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Search Interface */}
        <WordSearch />

        {/* Recent Words Section */}
        <RecentWords onAddToLibrary={handleAddToLibrary} />
      </main>
    </>
  );
}
