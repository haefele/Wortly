"use client";

import { PageContainer } from "@/components/page-container";
import { WordSearch } from "@/components/dashboard/word-search";
import { Home } from "lucide-react";

export default function DashboardPage() {
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
    </PageContainer>
  );
}
