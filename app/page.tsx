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
      <section className="space-y-6">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Discover German Words</h2>
          <p className="text-muted-foreground">
            Search your vocabulary database and add words instantly.
          </p>
        </div>
        <WordSearch className="mx-auto max-w-2xl" size="lg" />
      </section>

      {/* Recent Words Section */}
      <RecentWords onAddToLibrary={handleAddToLibrary} />
    </PageContainer>
  );
}
