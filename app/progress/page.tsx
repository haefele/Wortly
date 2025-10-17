"use client";

import type { ReactNode } from "react";

import { PageContainer } from "@/components/page-container";
import { TrendingUp } from "lucide-react";
import { StreakCard } from "./streak-card";
import { OverallStatsCard } from "./overall-stats-card";
import { AverageScoreCard } from "./average-score-card";
import { PerformanceStreakCard } from "./performance-streak-card";
import { CollectionStatsCard } from "./collection-stats-card";
import { PerformanceChartCard } from "./performance-chart-card";
import { WeeklyActivityCard } from "./weekly-activity-card";
import { SessionBreakdownCard } from "./session-breakdown-card";
import { LearningVelocityCard } from "./learning-velocity-card";
import { ArticleMasteryCard } from "./article-mastery-card";
import { MostPracticedCollectionsCard } from "./most-practiced-collections-card";
import { RecentActivityCard } from "./recent-activity-card";

export default function ProgressPage() {
  return (
    <PageContainer
      title="Progress"
      description="Track your learning achievements"
      icon={TrendingUp}
    >
      <div className="space-y-10">
        <Section
          title="Highlights"
          description="Your at-a-glance wins from the last month and all-time."
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <StreakCard className="lg:col-span-4" />
            <AverageScoreCard className="lg:col-span-4" />
            <OverallStatsCard className="lg:col-span-4" />
          </div>
        </Section>

        <Section
          title="Performance trends"
          description="Understand how consistency and accuracy have evolved recently."
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <PerformanceChartCard className="lg:col-span-8" />
            <PerformanceStreakCard className="lg:col-span-4" />
          </div>
        </Section>

        <Section
          title="Practice activity"
          description="See when you practiced and where you spend your learning time."
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <WeeklyActivityCard className="lg:col-span-7" />
            <SessionBreakdownCard className="lg:col-span-5" />
          </div>
        </Section>

        <Section
          title="Collection growth"
          description="Track how your vocabulary is growing and which collections lead the charge."
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <CollectionStatsCard className="lg:col-span-5" />
            <LearningVelocityCard className="lg:col-span-7" />
          </div>
          <div className="grid gap-4 lg:grid-cols-12 lg:pt-2">
            <ArticleMasteryCard className="lg:col-span-6" />
            <MostPracticedCollectionsCard className="lg:col-span-6" />
          </div>
        </Section>

        <Section
          title="Latest activity"
          description="Everything you’ve done recently across Wortly."
        >
          <RecentActivityCard />
        </Section>
      </div>
    </PageContainer>
  );
}

type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
