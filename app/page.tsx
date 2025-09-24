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
      <main className="flex-1 px-4 md:px-6 pb-12 space-y-12">
        {/* Search Interface */}
        <section className="pt-8">
          <WordSearch />
        </section>

        {/* Recent Words Section */}
        <section>
          <RecentWords onAddToLibrary={handleAddToLibrary} />
        </section>
      </main>
    </>
  );
}
